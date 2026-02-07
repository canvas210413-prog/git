import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// GET - 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      users: users.map((user) => ({
        ...user,
        password: undefined,
        roles: user.userrole.map((ur) => ur.role),
        assignedPartner: user.assignedPartner,
      })),
    });
  } catch (error) {
    console.error("사용자 조회 실패:", error);
    return NextResponse.json({ message: "사용자 조회 실패" }, { status: 500 });
  }
}

// POST - 사용자 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, roleIds, assignedPartner } = body;

    // 이메일 중복 확인
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { message: "이미 존재하는 이메일입니다." },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    // 사용자 생성 (ID 직접 생성 필요)
    const userId = randomUUID().replace(/-/g, '').substring(0, 25);
    
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        name,
        password: hashedPassword,
        isActive: true,
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
        assignedPartner: assignedPartner || null, // 협력사 할당 (null이면 본사 - 전체 접근)
      },
    });

    // 역할 할당
    if (roleIds && roleIds.length > 0) {
      await prisma.userrole.createMany({
        data: roleIds.map((roleId: string) => ({
          id: randomUUID().replace(/-/g, '').substring(0, 25),
          userId: user.id,
          roleId,
        })),
      });
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("사용자 생성 실패:", error);
    return NextResponse.json({ message: "사용자 생성 실패" }, { status: 500 });
  }
}
