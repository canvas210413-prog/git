import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - 계정 잠금 해제
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        isLocked: false,
        failedLoginAttempts: 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("계정 잠금 해제 실패:", error);
    return NextResponse.json(
      { message: "계정 잠금 해제 실패" },
      { status: 500 }
    );
  }
}
