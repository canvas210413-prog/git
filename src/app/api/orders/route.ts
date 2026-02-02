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

    // 현재 사용자의 협력사 정보 조회
    const session = await getServerSession(authOptions);
    const assignedPartner = (session?.user as any)?.assignedPartner || null;
    
    // 협력사 필터 조건 생성 (본사는 전체 접근)
    const partnerFilter = assignedPartner ? { orderSource: assignedPartner } : {};

    // 기존 CRM Order 조회
    const ordersRaw = await prisma.order.findMany({
      where: partnerFilter, // 협력사 필터 적용
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
      orderBy: {
        orderDate: "desc",
      },
    });

    // 숫자 필드를 명시적으로 변환
    const orders = ordersRaw.map(order => ({
      ...order,
      basePrice: order.basePrice ? Number(order.basePrice) : null,
      shippingFee: order.shippingFee ? Number(order.shippingFee) : null,
    }));

    // MallOrder 조회 (협력사 계정이면 MallOrder 제외)
    let convertedMallOrders: any[] = [];
    if (!assignedPartner) {
      // 본사 계정만 MallOrder 조회 가능
      const mallOrders = await prisma.mallorder.findMany({
        include: {
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
      });

      // MallOrder를 Order 형식으로 변환
      convertedMallOrders = mallOrders.map((mallOrder) => {
      // items JSON 파싱
      let productInfo = "-";
      try {
        const items = JSON.parse(mallOrder.items);
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
        recipientName: mallOrder.shippingName || mallOrder.recipientName,
        recipientAddr: mallOrder.shippingAddress || mallOrder.recipientAddr,
        courier: mallOrder.courier,
        trackingNumber: mallOrder.trackingNumber,
        deliveryStatus: deliveryStatusMap[mallOrder.status] || "PENDING",
        shippedAt: mallOrder.shippedAt?.toISOString() || null,
        deliveredAt: mallOrder.deliveredAt?.toISOString() || null,
        customer: {
          id: mallOrder.malluser?.id?.toString() || mallOrder.id,
          name: mallOrder.customerName || mallOrder.malluser?.name || "-",
          email: mallOrder.customerEmail || mallOrder.malluser?.email || "-",
          phone: mallOrder.customerPhone || mallOrder.malluser?.phone || null,
        },
      };
    });
    } // MallOrder 조회 if 문 닫기

    // 두 배열 합치기 (날짜순 정렬)
    let allOrders = [...orders, ...convertedMallOrders].sort((a, b) => {
      return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
    });

    // 필터 적용
    if (filter === 'pending-delivery') {
      // 배송정보 미등록 (주문상태확인용)
      allOrders = allOrders.filter((order: any) => !order.trackingNumber);
    } else if (filter === 'with-tracking') {
      // 배송정보 등록 완료 (주문데이터통합용) - 운송장번호만 있으면 OK
      allOrders = allOrders.filter((order: any) => order.trackingNumber);
    }

    return NextResponse.json(allOrders);
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
