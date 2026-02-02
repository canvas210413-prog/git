import { NextResponse } from "next/server";
import { getSessionUserFromCookies } from "@/lib/mall-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessionUser = await getSessionUserFromCookies();

    if (!sessionUser) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = parseInt(sessionUser.id);

    // 주문 수 조회
    const orderCount = await prisma.mallOrder.count({
      where: { userId },
    });

    // 사용자 등급 조회
    const user = await prisma.mallUser.findUnique({
      where: { id: userId },
      select: { grade: true },
    });

    // 보유 쿠폰 수 조회
    const couponCount = await prisma.mallUserCoupon.count({
      where: { 
        userId,
        isUsed: false,
        coupon: {
          validUntil: { gte: new Date() },
          isActive: true,
        },
      },
    });

    return NextResponse.json({
      stats: {
        orderCount,
        couponCount,
        grade: user?.grade || "BASIC",
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
