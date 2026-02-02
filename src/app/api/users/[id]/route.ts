import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - 사용자 수정
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.id;
    const body = await request.json();
    const { name, email, roleIds, assignedPartner } = body;

    console.log("PUT /api/users/[id]", { userId, body });

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error("User not found:", userId);
      return NextResponse.json(
        { message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이메일 변경 시 중복 확인
    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email },
      });
      if (existing) {
        return NextResponse.json(
          { message: "이미 존재하는 이메일입니다." },
          { status: 400 }
        );
      }
    }

    // 사용자 정보 업데이트
    const updateData: any = {
      name,
      email,
    };
    
    // assignedPartner가 body에 포함되어 있으면 업데이트
    if ('assignedPartner' in body) {
      updateData.assignedPartner = assignedPartner;
    }
    
    console.log("Updating user with data:", updateData);
    
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // 역할 업데이트
    if (roleIds) {
      console.log("Updating roles:", roleIds);
      // 기존 역할 삭제
      await prisma.userrole.deleteMany({
        where: { userId },
      });

      // 새 역할 할당
      if (roleIds.length > 0) {
        await prisma.userrole.createMany({
          data: roleIds.map((roleId: string) => ({
            userId,
            roleId,
          })),
        });
      }
    }

    console.log("User updated successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("사용자 수정 실패:", error);
    return NextResponse.json({ 
      message: "사용자 수정 실패",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// DELETE - 사용자 비활성화
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.id;

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("사용자 비활성화 실패:", error);
    return NextResponse.json(
      { message: "사용자 비활성화 실패" },
      { status: 500 }
    );
  }
}
