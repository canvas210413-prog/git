import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, buildSessionCookie } from "@/lib/mall-auth";
import crypto from "crypto";

// 비밀번호 해시 함수
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    const user = await prisma.mallUser.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const passwordHash = hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      return NextResponse.json(
        { message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 세션 토큰 생성 (7일 유효)
    const maxAge = 60 * 60 * 24 * 7;
    const token = createSessionToken(
      { id: user.id.toString(), email: user.email, name: user.name },
      maxAge
    );

    const cookie = buildSessionCookie(token, maxAge);
    const response = NextResponse.json({
      message: "로그인 성공",
      user: { id: user.id, email: user.email, name: user.name },
    });

    response.cookies.set(cookie);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
