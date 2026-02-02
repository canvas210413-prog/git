import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromCookies } from "@/lib/mall-auth";

// 주문 생성
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFromCookies();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(sessionUser.id);
    const body = await request.json();
    const {
      items,
      shippingAddress,
      paymentMethod,
      couponId,
      couponDiscount,
      subtotal,
      shipping,
      total,
      orderNote,
      isDemo, // 데모 결제 플래그
    } = body;

    // 사용자 정보 가져오기
    const user = await prisma.mallUser.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 주문번호 생성 (YYYYMMDD-HHMMSS-RANDOM)
    const now = new Date();
    const datePart = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `${datePart}-${randomPart}`;

    // 주문 생성 (데모 결제인 경우 PAID 상태로 시작)
    const order = await prisma.mallOrder.create({
      data: {
        orderNumber,
        userId: user.id,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: shippingAddress?.phone || null,
        recipientName: shippingAddress?.recipient || user.name,
        recipientAddr: shippingAddress 
          ? `[${shippingAddress.zipCode}] ${shippingAddress.address} ${shippingAddress.addressDetail}`
          : "",
        recipientZip: shippingAddress?.zipCode || "",
        deliveryMsg: orderNote || "",
        status: isDemo ? "PAID" : "PENDING", // 데모 결제는 바로 결제완료
        items: JSON.stringify(items),
        subtotal,
        shippingFee: shipping || 0, // 배송비 저장
        discountAmount: couponDiscount || 0,
        totalAmount: total,
        couponId: couponId || null,
        couponCode: null,
        paidAt: isDemo ? new Date() : null, // 데모 결제는 바로 결제 시간 기록
        shippingName: shippingAddress?.recipient || user.name,
        shippingPhone: shippingAddress?.phone || null,
        shippingAddress: shippingAddress 
          ? `[${shippingAddress.zipCode}] ${shippingAddress.address} ${shippingAddress.addressDetail}`
          : "",
      },
    });

    // 쿠폰 사용 처리
    if (couponId) {
      await prisma.mallUserCoupon.updateMany({
        where: {
          id: couponId,
          userId: user.id,
        },
        data: {
          isUsed: true,
          usedAt: now,
        },
      });
    }

    // 사용자 총 구매액 업데이트
    await prisma.mallUser.update({
      where: { id: user.id },
      data: {
        totalSpent: { increment: total },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: "주문 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 주문 목록 조회
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFromCookies();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(sessionUser.id);
    const orders = await prisma.mallOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "주문 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
