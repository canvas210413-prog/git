import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromCookies } from "@/lib/mall-auth";

// 주문 취소
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUserFromCookies();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(sessionUser.id);
    const { id } = await params;

    // 주문 확인
    const order = await prisma.mallOrder.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 취소 가능한 상태인지 확인
    if (!["PENDING", "PAID"].includes(order.status)) {
      return NextResponse.json(
        { error: "이미 배송이 시작되어 취소할 수 없습니다. 고객센터로 문의해주세요." },
        { status: 400 }
      );
    }

    // 주문 취소
    await prisma.mallOrder.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    // 사용된 쿠폰 복구
    if (order.couponId) {
      await prisma.mallUserCoupon.updateMany({
        where: {
          id: order.couponId,
          userId,
        },
        data: {
          isUsed: false,
          usedAt: null,
        },
      });
    }

    // 사용자 총 구매액 차감
    await prisma.mallUser.update({
      where: { id: userId },
      data: {
        totalSpent: { decrement: order.totalAmount },
      },
    });

    return NextResponse.json({ success: true, message: "주문이 취소되었습니다." });
  } catch (error) {
    console.error("Failed to cancel order:", error);
    return NextResponse.json(
      { error: "주문 취소에 실패했습니다." },
      { status: 500 }
    );
  }
}
