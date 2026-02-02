import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 주문 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { shippingName: { contains: search } },
        { shippingPhone: { contains: search } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.mallOrder.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.mallOrder.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "주문 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
