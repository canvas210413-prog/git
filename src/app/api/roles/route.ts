import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - 역할 목록 조회
export async function GET(request: NextRequest) {
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolepermission: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userrole: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      roles: roles.map((role) => ({
        ...role,
        userCount: role._count.userrole,
        permissions: role.rolepermission.map((rp) => rp.permission),
      })),
    });
  } catch (error) {
    console.error("역할 조회 실패:", error);
    return NextResponse.json({ message: "역할 조회 실패" }, { status: 500 });
  }
}

// POST - 역할 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, displayName, description, permissionIds } = body;

    // 역할명 중복 확인
    const existing = await prisma.role.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { message: "이미 존재하는 역할명입니다." },
        { status: 400 }
      );
    }

    // 역할 생성
    const role = await prisma.role.create({
      data: {
        name,
        displayName,
        description,
        isSystem: false,
        isActive: true,
      },
    });

    // 권한 할당
    if (permissionIds && permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({
          roleId: role.id,
          permissionId,
        })),
      });
    }

    return NextResponse.json({ success: true, roleId: role.id });
  } catch (error) {
    console.error("역할 생성 실패:", error);
    return NextResponse.json({ message: "역할 생성 실패" }, { status: 500 });
  }
}
