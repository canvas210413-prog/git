import { NextResponse } from "next/server";
import { getSessionUserFromCookies } from "@/lib/mall-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessionUser = await getSessionUserFromCookies();

    if (!sessionUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // DB에서 최신 사용자 정보 가져오기
    const user = await prisma.mallUser.findUnique({
      where: { id: parseInt(sessionUser.id) },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        grade: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
      isAdmin: false, // 추후 관리자 권한 로직 추가
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
