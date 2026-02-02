import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - 역할 수정
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js 15 호환성: params가 Promise일 수 있음
    const params = await Promise.resolve(context.params);
    const roleId = params.id;
    const body = await request.json();
    const { displayName, description, permissionIds } = body;

    console.log('역할 수정 요청:', { roleId, displayName, description, permissionIds: permissionIds?.length });

    // 역할 존재 확인
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      console.error('역할을 찾을 수 없음:', roleId);
      return NextResponse.json(
        { error: "역할을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 역할 정보 업데이트
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        displayName,
        description,
      },
    });

    console.log('역할 정보 업데이트 완료:', updatedRole.name);

    // 권한 업데이트 (모든 역할 가능)
    if (permissionIds !== undefined) {
      // 기존 권한 삭제
      await prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      console.log('기존 권한 삭제 완료');

      // 새 권한 할당
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId: string) => ({
            roleId,
            permissionId,
          })),
        });
        console.log(`${permissionIds.length}개 권한 할당 완료`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("역할 수정 실패:", error);
    return NextResponse.json({ 
      error: "역할 수정 실패",
      message: error instanceof Error ? error.message : "알 수 없는 오류",
      details: error 
    }, { status: 500 });
  }
}
}

// DELETE - 역할 삭제
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js 15 호환성: params가 Promise일 수 있음
    const params = await Promise.resolve(context.params);
    const roleId = params.id;

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { userRoles: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { message: "역할을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 시스템 역할은 삭제 불가
    if (role.isSystem) {
      return NextResponse.json(
        { message: "시스템 역할은 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    // 할당된 사용자가 있으면 삭제 불가
    if (role._count.userRoles > 0) {
      return NextResponse.json(
        { message: "사용자에게 할당된 역할은 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id: roleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("역할 삭제 실패:", error);
    return NextResponse.json({ message: "역할 삭제 실패" }, { status: 500 });
  }
}
