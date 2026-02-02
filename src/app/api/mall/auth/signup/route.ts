import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { name, email, phone, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { message: "전화번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증 (간단한 검증)
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone.replace(/-/g, ""))) {
      return NextResponse.json(
        { message: "올바른 전화번호 형식이 아닙니다." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "비밀번호는 6자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await prisma.mallUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "이미 사용 중인 이메일입니다." },
        { status: 409 }
      );
    }

    // 사용자 생성
    const passwordHash = hashPassword(password);
    // 전화번호 정규화 (하이픈 포함 저장)
    const normalizedPhone = phone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3");
    const user = await prisma.mallUser.create({
      data: {
        name,
        email,
        phone: normalizedPhone,
        passwordHash,
      },
    });

    return NextResponse.json({
      message: "회원가입이 완료되었습니다.",
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
