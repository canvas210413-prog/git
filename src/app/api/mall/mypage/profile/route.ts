import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromCookies } from "@/lib/mall-auth";
import crypto from "crypto";

// 비밀번호 해시 함수 (로그인과 동일한 방식)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// 프로필 수정
export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFromCookies();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(sessionUser.id);
    const body = await request.json();
    const { name, phone, currentPassword, newPassword } = body;

    const user = await prisma.mallUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 비밀번호 변경 시 현재 비밀번호 확인
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: "현재 비밀번호를 입력해주세요" },
          { status: 400 }
        );
      }

      const currentPasswordHash = hashPassword(currentPassword);
      if (currentPasswordHash !== user.passwordHash) {
        return NextResponse.json(
          { message: "현재 비밀번호가 일치하지 않습니다" },
          { status: 400 }
        );
      }
    }

    const updateData: any = { name };

    // 전화번호 업데이트
    if (phone !== undefined) {
      // 전화번호 정규화 (하이픈 포함 저장)
      const normalizedPhone = phone.replace(/[^0-9]/g, "").replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3");
      updateData.phone = normalizedPhone || null;
    }

    if (newPassword) {
      updateData.passwordHash = hashPassword(newPassword);
    }

    const updatedUser = await prisma.mallUser.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        grade: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "프로필 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}
