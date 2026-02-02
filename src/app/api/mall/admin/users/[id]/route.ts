import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 회원 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await prisma.mallUser.findUnique({
      where: { id: parseInt(id) },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        coupons: {
          include: {
            coupon: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "회원을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 비밀번호 제외
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { error: "회원 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 회원 정보 수정 (등급 변경 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { grade, point } = body;

    const updateData: any = {};
    if (grade) updateData.grade = grade;
    if (point !== undefined) updateData.point = point;

    const user = await prisma.mallUser.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        grade: true,
        point: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "회원 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}
