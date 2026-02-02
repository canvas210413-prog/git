import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// MallOrder 타입 정의
interface MallOrderType {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  status: string;
  totalAmount: any; // Decimal
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  } | null;
}

// MallUser 타입 정의
interface MallUserType {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    
    if (!phone) {
      return NextResponse.json(
        { message: "전화번호를 입력해주세요." },
        { status: 400 }
      );
    }
    
    // 전화번호 정규화 (하이픈 제거)
    const normalizedPhone = phone.replace(/-/g, "");
    
    // 전화번호 검색을 위한 패턴 (하이픈 있는 형태와 없는 형태 모두)
    const phoneWithHyphen = normalizedPhone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3");
    
    // 1. MallUser 테이블에서 전화번호로 회원 검색 (몰 회원 인증)
    const mallUser: MallUserType | null = await prisma.mallUser.findFirst({
      where: {
        OR: [
          { phone: { contains: normalizedPhone.slice(-8) } },
          { phone: { contains: phoneWithHyphen } },
          { phone: normalizedPhone },
          { phone: phoneWithHyphen },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
      },
    });
    
    if (mallUser) {
      // 몰 회원이 있는 경우 - 해당 회원의 주문 내역 조회
      // @ts-expect-error - Prisma 타입이 아직 업데이트되지 않음
      const mallOrders: MallOrderType[] = await prisma.mallOrder.findMany({
        where: {
          userId: mallUser.id,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
      
      // Customer 테이블에서 찾거나 생성
      let customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { phone: { contains: normalizedPhone.slice(-8) } },
            { email: mallUser.email }, // 이메일로도 검색
          ],
        },
      });
      
      // CRM에 고객이 없으면 생성
      if (!customer) {
        // 이메일 중복 체크를 위해 고유한 이메일 생성
        const uniqueEmail = `mall_${mallUser.id}_${Date.now()}@mall.local`;
        customer = await prisma.customer.create({
          data: {
            name: mallUser.name,
            email: mallUser.email || uniqueEmail,
            phone: mallUser.phone || phone,
            status: "ACTIVE",
          },
        });
      }
      
      // 세션 생성
      const session = await prisma.chatSession.create({
        data: {
          customerId: customer.id,
          phone: phone,
          customerName: mallUser.name || customer.name,
          status: "ACTIVE",
        },
      });
      
      return NextResponse.json({
        customer: {
          customerId: customer.id,
          customerName: mallUser.name,
          customerPhone: mallUser.phone || phone,
          mallUserId: mallUser.id,
          recentOrders: mallOrders.map((order: MallOrderType) => ({
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt.toISOString(),
          })),
        },
        sessionId: session.id,
        message: `${mallUser.name}님 환영합니다! 🎉\n\n몰 회원으로 인증되었습니다.\n무엇을 도와드릴까요?`,
      });
    }
    
    // 2. MallOrder에서 전화번호로 주문 찾기 (비회원 주문)
    // @ts-expect-error - Prisma 타입이 아직 업데이트되지 않음
    const mallOrders: MallOrderType[] = await prisma.mallOrder.findMany({
      where: {
        customerPhone: {
          contains: normalizedPhone.slice(-8), // 뒤 8자리로 검색
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // 3. CRM Order 테이블에서도 전화번호로 주문 찾기
    const crmOrders = await prisma.order.findMany({
      where: {
        OR: [
          { customerPhone: { contains: normalizedPhone.slice(-8) } },
          { customerPhone: { contains: phoneWithHyphen } },
          { customer: { phone: { contains: normalizedPhone.slice(-8) } } },
        ],
      },
      include: {
        customer: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // MallOrder와 CRM Order를 합쳐서 처리
    const allOrders = [...mallOrders, ...crmOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName || order.customer.name,
      customerEmail: order.customerEmail || order.customer.email,
      customerPhone: order.customerPhone || order.customer.phone,
      status: order.status,
      totalAmount: Number(order.totalAmount) || 0,
      createdAt: order.createdAt,
    }))];
    
    if (allOrders.length > 0) {
      // 주문이 있는 경우
      const firstOrder = allOrders[0];
      
      // Customer 테이블에서 찾거나 생성
      let customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { phone: { contains: normalizedPhone.slice(-8) } },
            { email: firstOrder.customerEmail },
          ],
        },
      });
      
      // CRM에 고객이 없으면 생성
      if (!customer) {
        // 이메일 중복 방지를 위한 고유 이메일
        const uniqueEmail = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@order.local`;
        customer = await prisma.customer.create({
          data: {
            name: firstOrder.customerName,
            email: firstOrder.customerEmail || uniqueEmail,
            phone: phone,
            status: "ACTIVE",
          },
        });
      }
      
      // 세션 생성
      const session = await prisma.chatSession.create({
        data: {
          customerId: customer.id,
          phone: phone,
          customerName: firstOrder.customerName || customer.name,
          status: "ACTIVE",
        },
      });
      
      return NextResponse.json({
        customer: {
          customerId: customer.id,
          customerName: firstOrder.customerName,
          customerPhone: phone,
          recentOrders: allOrders.map((order) => ({
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt.toISOString(),
          })),
        },
        sessionId: session.id,
        message: `${firstOrder.customerName}님 환영합니다! 🎉\n\n주문 내역을 확인했습니다.\n무엇을 도와드릴까요?`,
      });
    }
    
    // Customer 테이블에서도 찾기 (CRM 고객)
    const customer = await prisma.customer.findFirst({
      where: {
        phone: {
          contains: normalizedPhone.slice(-8),
        },
      },
    });
    
    if (customer) {
      // CRM 고객인 경우 세션 생성
      const session = await prisma.chatSession.create({
        data: {
          customerId: customer.id,
          phone: phone,
          customerName: customer.name,
          status: "ACTIVE",
        },
      });
      
      return NextResponse.json({
        customer: {
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          recentOrders: [],
        },
        sessionId: session.id,
      });
    }
    
    return NextResponse.json(
      { message: "등록된 전화번호를 찾을 수 없습니다.\n주문 시 입력한 전화번호를 확인해주세요." },
      { status: 404 }
    );
    
  } catch (error) {
    console.error("=== Phone verification error ===");
    console.error(error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { message: "인증 처리 중 오류가 발생했습니다.", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
