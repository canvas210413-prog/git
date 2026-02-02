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

// 쿠폰 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status"); // active, expired, all
    const segment = searchParams.get("segment");

    const now = new Date();
    
    let whereClause: any = {};

    if (status === "active") {
      whereClause = {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      };
    } else if (status === "expired") {
      whereClause = {
        OR: [
          { validUntil: { lt: now } },
          { isActive: false },
        ],
      };
    }

    if (segment) {
      whereClause.targetSegment = segment;
    }

    const coupons = await prisma.coupon.findMany({
      where: whereClause,
      include: {
        usages: {
          select: {
            id: true,
            usedAt: true,
            discountAmount: true,
          },
        },
        _count: {
          select: {
            usages: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(coupons, { headers: corsHeaders });
  } catch (error) {
    console.error("쿠폰 조회 오류:", error);
    return NextResponse.json(
      { error: "쿠폰 조회 실패", details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 쿠폰 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimit,
      usagePerCustomer,
      targetSegment,
      targetCustomers,
    } = body;

    // 쿠폰 코드 자동 생성
    const code = `COUPON${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const coupon = await prisma.coupon.create({
      data: {
        code,
        name,
        description: description || "",
        discountType: discountType || "PERCENT",
        discountValue: parseFloat(discountValue),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        usagePerCustomer: usagePerCustomer ? parseInt(usagePerCustomer) : 1,
        targetSegment: targetSegment || null,
        targetCustomers: targetCustomers || null,
        isActive: true,
      },
    });

    return NextResponse.json(coupon, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("쿠폰 생성 오류:", error);
    return NextResponse.json(
      { error: "쿠폰 생성 실패", details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
