import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromCookies } from "@/lib/mall-auth";

// 쿠폰 목록 조회
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFromCookies();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(sessionUser.id);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all"; // all, available, used

    const now = new Date();
    const where: any = {
      userId: userId,
    };

    // 쿠폰 상태 필터링
    if (status === "available") {
      where.isUsed = false;
      where.coupon = {
        validUntil: { gte: now },
        isActive: true,
      };
    } else if (status === "used") {
      where.isUsed = true;
    }

    const userCoupons = await prisma.mallUserCoupon.findMany({
      where,
      include: {
        coupon: true,
      },
      orderBy: { issuedAt: "desc" },
    });

    // 쿠폰 데이터 가공
    const coupons = userCoupons.map((uc) => ({
      id: uc.id,
      code: uc.coupon.code,
      name: uc.coupon.name,
      description: uc.coupon.description,
      discountType: uc.coupon.discountType,
      discountValue: uc.coupon.discountValue,
      minOrderAmount: uc.coupon.minOrderAmount,
      maxDiscountAmount: uc.coupon.maxDiscountAmount,
      validFrom: uc.coupon.validFrom,
      validUntil: uc.coupon.validUntil,
      usedAt: uc.usedAt,
      isExpired: uc.coupon.validUntil < now,
      isUsed: uc.isUsed,
    }));

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Failed to fetch coupons:", error);
    return NextResponse.json(
      { error: "쿠폰 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
