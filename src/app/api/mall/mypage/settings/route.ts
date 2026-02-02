import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromCookies } from "@/lib/mall-auth";

// 알림 설정 수정
export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFromCookies();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(sessionUser.id);
    const body = await request.json();
    const { emailNotification, smsNotification, marketingEmail, marketingSms } = body;

    const updatedUser = await prisma.mallUser.update({
      where: { id: userId },
      data: {
        emailNotification,
        smsNotification,
        marketingEmail,
        marketingSms,
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailNotification: true,
        smsNotification: true,
        marketingEmail: true,
        marketingSms: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "설정 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
