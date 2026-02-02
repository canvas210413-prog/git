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

// 쿠폰 사용 기록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { couponId, customerId, orderId, discountAmount } = body;

    if (!couponId || !customerId || !discountAmount) {
      return NextResponse.json(
        { error: "필수 파라미터 누락" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 쿠폰 사용 횟수 증가
      await tx.coupon.update({
        where: { id: couponId },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });

      // 사용 내역 생성
      const usage = await tx.couponUsage.create({
        data: {
          couponId,
          customerId,
          orderId: orderId || null,
          discountAmount: parseFloat(discountAmount),
        },
      });

      return usage;
    });

    return NextResponse.json(result, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("쿠폰 사용 기록 오류:", error);
    return NextResponse.json(
      { error: "쿠폰 사용 기록 실패", details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
