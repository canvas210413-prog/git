import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 회원 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const grade = searchParams.get("grade") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (grade && grade !== "all") {
      where.grade = grade;
    }

    const [users, total] = await Promise.all([
      prisma.mallUser.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          grade: true,
          totalSpent: true,
          addresses: true,
          emailNotification: true,
          smsNotification: true,
          marketingEmail: true,
          marketingSms: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              orders: true,
              coupons: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.mallUser.count({ where }),
    ]);

    // addresses JSON을 파싱하여 반환
    const usersWithParsedAddresses = users.map((user) => ({
      ...user,
      addresses: user.addresses ? JSON.parse(user.addresses) : [],
    }));

    return NextResponse.json({
      users: usersWithParsedAddresses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "회원 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
