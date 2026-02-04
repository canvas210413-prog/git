import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyNewOrderFromPartner } from "@/lib/notification-helper";

// GET: 모든 주문 조회 (Order + MallOrder 통합)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const limit = parseInt(searchParams.get('limit') || '1000'); // 기본 1000개로 제한
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // 검색 파라미터 (2023년 조보은 같은 예전 데이터도 검색 가능하도록)
    const search = searchParams.get('search') || ''; // 고객명 검색
    const searchPhone = searchParams.get('searchPhone') || ''; // 전화번호 검색
    const startDate = searchParams.get('startDate') || ''; // 시작일
    const endDate = searchParams.get('endDate') || ''; // 종료일
    const orderSourceParam = searchParams.get('orderSource') || 'all'; // 고객주문처명

    // 현재 사용자의 협력사 정보 조회
    const session = await getServerSession(authOptions);
    const assignedPartner = (session?.user as any)?.assignedPartner || null;
    
    // 협력사 필터 조건 생성 (본사는 전체 접근)
    const partnerFilter = assignedPartner ? { orderSource: assignedPartner } : {};
    
    // 고객주문처명 필터 (협력사 계정이 아닌 경우에만 적용)
    let orderSourceFilter: any = {};
    if (!assignedPartner && orderSourceParam && orderSourceParam !== 'all') {
      orderSourceFilter = { orderSource: orderSourceParam };
    }
    
    // 검색 필터 조건 생성
    let searchFilter: any = {};
    if (search.trim()) {
      // 고객명 검색 (recipientName, ordererName 모두 검색)
      searchFilter.OR = [
        { recipientName: { contains: search.trim() } },
        { ordererName: { contains: search.trim() } },
      ];
    }
    
    // 전화번호 검색 필터
    let phoneFilter: any = {};
    if (searchPhone.trim()) {
      phoneFilter.OR = [
        { recipientPhone: { contains: searchPhone.trim() } },
        { recipientMobile: { contains: searchPhone.trim() } },
        { contactPhone: { contains: searchPhone.trim() } },
      ];
    }
    
    // 날짜 필터 조건 생성
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.orderDate = {
        gte: new Date(startDate + 'T00:00:00'),
        lte: new Date(endDate + 'T23:59:59'),
      };
    } else if (startDate) {
      dateFilter.orderDate = {
        gte: new Date(startDate + 'T00:00:00'),
      };
    } else if (endDate) {
      dateFilter.orderDate = {
        lte: new Date(endDate + 'T23:59:59'),
      };
    }

    // 필터에 따른 where 조건 추가
    let trackingFilter = {};
    if (filter === 'pending-delivery' || filter === 'delivery-ready') {
      trackingFilter = { OR: [{ trackingNumber: null }, { trackingNumber: "" }] };
    } else if (filter === 'with-tracking') {
      trackingFilter = { 
        trackingNumber: { not: null },
        NOT: { trackingNumber: "" }
      };
    }

    // 전체 개수 조회 (페이지네이션 정보용)
    const totalOrdersCount = await prisma.order.count({
      where: { ...partnerFilter, ...orderSourceFilter, ...trackingFilter, ...searchFilter, ...phoneFilter, ...dateFilter },
    });

    // 각 상태별 전체 개수 조회 (통계용 - with-tracking 필터에만 적용)
    const [pendingCount, shippedCount, deliveredCount] = await Promise.all([
      // 대기: pending-delivery 필터 (운송장 없는 주문)
      prisma.order.count({
        where: { 
          ...partnerFilter,
          OR: [{ trackingNumber: null }, { trackingNumber: "" }]
        },
      }),
      // 배송중: 운송장 있고 SHIPPED 상태
      prisma.order.count({
        where: { 
          ...partnerFilter,
          ...trackingFilter,
          status: "SHIPPED"
        },
      }),
      // 배송완료: DELIVERED 상태
      prisma.order.count({
        where: { 
          ...partnerFilter,
          ...trackingFilter,
          status: "DELIVERED"
        },
      }),
    ]);

    // 기존 CRM Order 조회 - 최적화: 필요한 필드만 select
    const ordersRaw = await prisma.order.findMany({
      where: { ...partnerFilter, ...orderSourceFilter, ...trackingFilter, ...searchFilter, ...phoneFilter, ...dateFilter }, // 모든 필터 적용
      select: {
        id: true,
        orderNumber: true,
        orderDate: true,
        totalAmount: true,
        basePrice: true,
        shippingFee: true,
        status: true,
        ordererName: true,
        contactPhone: true,
        recipientName: true,
        recipientPhone: true,
        recipientMobile: true,
        recipientZipCode: true,
        recipientAddr: true,
        productInfo: true,
        deliveryMsg: true,
        orderSource: true,
        courier: true,
        trackingNumber: true,
        giftSent: true,
        createdAt: true,
        updatedAt: true,
        customerId: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { orderDate: "desc" },  // 주문 날짜 역순 (최근 날짜 먼저)
        { createdAt: "desc" },  // 같은 날짜 내에서는 등록 순서 역순
      ],
      take: limit,
      skip: skip,
    });

    // 숫자 필드를 명시적으로 변환
    const orders = ordersRaw.map(order => ({
      ...order,
      basePrice: order.basePrice ? Number(order.basePrice) : null,
      shippingFee: order.shippingFee ? Number(order.shippingFee) : null,
    }));

    // MallOrder 조회 (협력사 계정이면 MallOrder 제외)
    let convertedMallOrders: any[] = [];
    let totalMallOrdersCount = 0;
    if (!assignedPartner) {
      // MallOrder 필터 조건
      let mallTrackingFilter = {};
      if (filter === 'pending-delivery' || filter === 'delivery-ready') {
        mallTrackingFilter = { OR: [{ trackingNumber: null }, { trackingNumber: "" }] };
      } else if (filter === 'with-tracking') {
        mallTrackingFilter = { 
          trackingNumber: { not: null },
          NOT: { trackingNumber: "" }
        };
      }

      // MallOrder 전체 개수
      totalMallOrdersCount = await prisma.mallorder.count({
        where: mallTrackingFilter,
      });

      // 본사 계정만 MallOrder 조회 가능
      const mallOrders = await prisma.mallorder.findMany({
        where: mallTrackingFilter,
        select: {
          id: true,
          orderNumber: true,
          items: true,
          status: true,
          customerName: true,
          customerPhone: true,
          customerEmail: true,
          shippingAddress: true,
          recipientAddr: true,
          recipientZip: true,
          deliveryMsg: true,
          courier: true,
          trackingNumber: true,
          totalAmount: true,
          subtotal: true,
          shippingFee: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          malluser: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: skip,
      });

      // MallOrder를 Order 형식으로 변환
      convertedMallOrders = mallOrders.map((mallOrder) => {
      // items JSON 파싱
      let productInfo = "-";
      try {
        const itemsStr = mallOrder.items ? String(mallOrder.items) : "[]";
        const items = JSON.parse(itemsStr);
        if (Array.isArray(items) && items.length > 0) {
          productInfo = items.map((item: any) => item.productName || item.name || "상품").join(", ");
        }
      } catch {
        productInfo = "-";
      }

      // MallOrder 상태를 Order 상태로 매핑
      const statusMap: Record<string, string> = {
        PENDING: "PENDING",
        PAID: "PROCESSING",
        PREPARING: "PROCESSING",
        SHIPPED: "SHIPPED",
        DELIVERED: "DELIVERED",
        CANCELLED: "CANCELLED",
      };

      // 배송 상태 매핑
      const deliveryStatusMap: Record<string, string> = {
        PENDING: "PENDING",
        PAID: "PENDING",
        PREPARING: "PENDING",
        SHIPPED: "IN_TRANSIT",
        DELIVERED: "DELIVERED",
      };

      return {
        id: `mall_${mallOrder.id}`,
        orderNumber: mallOrder.orderNumber,
        orderDate: mallOrder.createdAt.toISOString(),
        status: statusMap[mallOrder.status] || "PENDING",
        totalAmount: mallOrder.totalAmount,
        orderSource: "MALL",
        productInfo,
        recipientName: mallOrder.customerName,
        recipientAddr: mallOrder.shippingAddress || mallOrder.recipientAddr,
        courier: mallOrder.courier,
        trackingNumber: mallOrder.trackingNumber,
        deliveryStatus: deliveryStatusMap[mallOrder.status] || "PENDING",
        customer: {
          id: mallOrder.malluser?.id?.toString() || mallOrder.id,
          name: mallOrder.customerName || mallOrder.malluser?.name || "-",
          email: mallOrder.customerEmail || mallOrder.malluser?.email || "-",
          phone: mallOrder.customerPhone || mallOrder.malluser?.phone || null,
        },
      };
    });
    } // MallOrder 조회 if 문 닫기

    // 두 배열 합치기 (날짜순 정렬) - 필터링은 이미 where 조건에서 처리됨
    const allOrders = [...orders, ...convertedMallOrders].sort((a, b) => {
      return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
    });

    // 전체 개수와 데이터를 함께 반환
    return NextResponse.json({
      data: allOrders,
      total: totalOrdersCount + totalMallOrdersCount,
      limit: limit,
      page: page,
      hasMore: (totalOrdersCount + totalMallOrdersCount) > (page * limit),
      stats: {
        pending: pendingCount,
        shipped: shippedCount,
        delivered: deliveredCount,
      },
    });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST: 새 주문 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    let customerId = body.customerId;
    
    // customerId가 없으면 임시 고객 생성 또는 기본 고객 찾기
    if (!customerId) {
      // 수령인 정보로 기존 고객 찾기
      if (body.recipientName && body.recipientPhone) {
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            OR: [
              { name: body.recipientName },
              { phone: body.recipientPhone },
            ],
          },
        });
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // 새 고객 생성
          const newCustomer = await prisma.customer.create({
            data: {
              name: body.recipientName || "고객",
              phone: body.recipientPhone || "",
              email: `temp_${Date.now()}@example.com`, // 임시 이메일
              status: "ACTIVE",
            },
          });
          customerId = newCustomer.id;
        }
      } else {
        // 기본 고객 사용 또는 생성
        const defaultCustomer = await prisma.customer.findFirst({
          where: { email: "default@customer.com" },
        });
        
        if (defaultCustomer) {
          customerId = defaultCustomer.id;
        } else {
          const newDefaultCustomer = await prisma.customer.create({
            data: {
              name: "기본 고객",
              email: "default@customer.com",
              phone: "",
              status: "ACTIVE",
            },
          });
          customerId = newDefaultCustomer.id;
        }
      }
    }
    
    // totalAmount 기본값 계산 (shippingFee가 있으면 포함, 없으면 0)
    const totalAmount = body.totalAmount || (body.shippingFee ? parseInt(body.shippingFee) : 0);
    
    const order = await prisma.order.create({
      data: {
        customerId: customerId,
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        totalAmount: totalAmount,
        status: body.status || "PENDING",
        ordererName: body.ordererName || body.recipientName || "",
        contactPhone: body.contactPhone || body.recipientPhone || "",
        recipientName: body.recipientName || "",
        recipientPhone: body.recipientPhone || "",
        recipientMobile: body.recipientMobile || "",
        recipientZipCode: body.recipientZipCode || "",
        recipientAddr: body.recipientAddr || "",
        orderNumber: body.orderNumber?.trim() || null,
        productInfo: body.productInfo || "",
        deliveryMsg: body.deliveryMsg || "",
        orderSource: body.orderSource || "자사몰",
        shippingFee: body.shippingFee ? parseInt(body.shippingFee) : null,
        courier: body.courier || "",
        trackingNumber: body.trackingNumber || "",
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // orderDate를 ISO 문자열로 명시적 변환하여 반환
    const responseOrder = {
      ...order,
      orderDate: order.orderDate.toISOString(),
    };

    // 협력사가 주문을 추가한 경우 관리자에게 알림
    const session = await getServerSession(authOptions);
    const assignedPartner = (session?.user as any)?.assignedPartner;
    if (assignedPartner) {
      // 협력사 계정이 주문을 생성한 경우
      await notifyNewOrderFromPartner(
        assignedPartner,
        order.orderNumber || "주문번호 없음",
        order.productInfo || "상품정보 없음"
      ).catch(err => {
        console.error("관리자 알림 전송 실패:", err);
      });
    }

    return NextResponse.json(responseOrder, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: "Failed to create order", details: String(error) },
      { status: 500 }
    );
  }
}
