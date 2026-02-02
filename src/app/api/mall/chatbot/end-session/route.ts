import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, summary, messages } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { message: "세션 ID가 필요합니다." },
        { status: 400 }
      );
    }
    
    // 세션 찾기
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    
    if (!session) {
      return NextResponse.json(
        { message: "세션을 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    
    // 메시지 저장
    if (messages && messages.length > 0) {
      for (const msg of messages) {
        await prisma.chatMessage.create({
          data: {
            sessionId,
            senderType: msg.role === "user" ? "USER" : "BOT",
            content: msg.content,
            createdAt: new Date(msg.timestamp),
          },
        });
      }
    }
    
    // 세션 종료 처리
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: "CLOSED",
        endedAt: new Date(),
        summary: summary || "쇼핑몰 챗봇 상담",
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "세션이 종료되었습니다.",
    });
    
  } catch (error) {
    console.error("End session error:", error);
    return NextResponse.json(
      { message: "세션 종료 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
