import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// CORS 헤더
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONS 요청 처리
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// 쿠폰 검증 및 적용
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, customerId, orderAmount } = body;

    if (!code || !customerId || !orderAmount) {
      return NextResponse.json(
        { error: "필수 파라미터 누락", valid: false },
        { status: 400, headers: corsHeaders }
      );
    }

    // 쿠폰 조회
    const coupon = await prisma.coupon.findUnique({
      where: { code },
      include: {
        usages: {
          where: {
            customerId,
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        message: "존재하지 않는 쿠폰입니다.",
      }, { headers: corsHeaders });
    }

    // 유효성 검사
    const now = new Date();

    // 1. 활성 상태 확인
    if (!coupon.isActive) {
      return NextResponse.json({
        valid: false,
        message: "비활성화된 쿠폰입니다.",
      }, { headers: corsHeaders });
    }

    // 2. 유효 기간 확인
    if (now < coupon.validFrom) {
      return NextResponse.json({
        valid: false,
        message: `쿠폰 사용 가능 기간이 아닙니다. (${coupon.validFrom.toLocaleDateString()}부터 사용 가능)`,
      }, { headers: corsHeaders });
    }

    if (now > coupon.validUntil) {
      return NextResponse.json({
        valid: false,
        message: "만료된 쿠폰입니다.",
      }, { headers: corsHeaders });
    }

    // 3. 총 사용 횟수 확인
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({
        valid: false,
        message: "쿠폰 사용 한도가 초과되었습니다.",
      }, { headers: corsHeaders });
    }

    // 4. 고객별 사용 횟수 확인
    const customerUsageCount = coupon.usages.length;
    if (customerUsageCount >= coupon.usagePerCustomer) {
      return NextResponse.json({
        valid: false,
        message: "이미 사용한 쿠폰입니다.",
      }, { headers: corsHeaders });
    }

    // 5. 최소 주문 금액 확인
    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      return NextResponse.json({
        valid: false,
        message: `최소 주문 금액 ${Number(coupon.minOrderAmount).toLocaleString()}원 이상부터 사용 가능합니다.`,
      }, { headers: corsHeaders });
    }

    // 6. 고객 세그먼트 확인
    if (coupon.targetSegment) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { segment: true, grade: true },
      });

      if (customer && customer.segment !== coupon.targetSegment && customer.grade !== coupon.targetSegment) {
        return NextResponse.json({
          valid: false,
          message: "대상 고객이 아닙니다.",
        }, { headers: corsHeaders });
      }
    }

    // 7. 특정 고객 대상 확인
    if (coupon.targetCustomers) {
      try {
        const targetList = JSON.parse(coupon.targetCustomers);
        if (Array.isArray(targetList) && !targetList.includes(customerId)) {
          return NextResponse.json({
            valid: false,
            message: "대상 고객이 아닙니다.",
          }, { headers: corsHeaders });
        }
      } catch (e) {
        console.error("targetCustomers 파싱 오류:", e);
      }
    }

    // 할인 금액 계산
    let discountAmount = 0;
    if (coupon.discountType === "PERCENT") {
      discountAmount = Math.floor(orderAmount * (Number(coupon.discountValue) / 100));
      
      // 최대 할인 금액 제한
      if (coupon.maxDiscountAmount && discountAmount > Number(coupon.maxDiscountAmount)) {
        discountAmount = Number(coupon.maxDiscountAmount);
      }
    } else if (coupon.discountType === "FIXED") {
      discountAmount = Number(coupon.discountValue);
      
      // 할인 금액이 주문 금액보다 클 수 없음
      if (discountAmount > orderAmount) {
        discountAmount = orderAmount;
      }
    }

    return NextResponse.json({
      valid: true,
      message: "쿠폰이 적용되었습니다.",
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
      },
      discountAmount,
      finalAmount: orderAmount - discountAmount,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("쿠폰 검증 오류:", error);
    return NextResponse.json(
      { error: "쿠폰 검증 실패", valid: false, details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
