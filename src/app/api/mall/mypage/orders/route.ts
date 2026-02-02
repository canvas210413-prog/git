import { NextResponse } from "next/server";
import { getSessionUserFromCookies } from "@/lib/mall-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessionUser = await getSessionUserFromCookies();

    if (!sessionUser) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = parseInt(sessionUser.id);

    const orders = await prisma.mallOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Orders error:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
