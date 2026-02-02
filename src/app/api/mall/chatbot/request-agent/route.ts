import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, customerInfo } = await request.json();
    
    if (!customerInfo) {
      return NextResponse.json(
        { message: "고객 정보가 필요합니다." },
        { status: 400 }
      );
    }
    
    // 세션이 있으면 상담 요청 상태로 업데이트
    if (sessionId) {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          status: "ESCALATED",
          isEscalated: true,
          escalatedAt: new Date(),
          escalateReason: "고객 요청 (쇼핑몰 챗봇)",
        },
      });
      
      // 상담 요청 메시지 추가
      await prisma.chatMessage.create({
        data: {
          sessionId,
          senderType: "SYSTEM",
          content: `상담원 연결 요청 - 고객: ${customerInfo.customerName} (${customerInfo.customerPhone})`,
        },
      });
    }
    
    // 세션의 대화 내역 가져오기
    let conversationHistory = "";
    if (sessionId) {
      const messages = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
        select: {
          senderType: true,
          content: true,
          createdAt: true,
        },
      });
      
      if (messages.length > 0) {
        conversationHistory = "\n\n[대화 내역]\n" + messages.map((msg, idx) => {
          const roleLabel = msg.senderType === "USER" ? "고객" : msg.senderType === "BOT" ? "챗봇" : "시스템";
          const time = new Date(msg.createdAt).toLocaleTimeString("ko-KR", { 
            hour: "2-digit", 
            minute: "2-digit" 
          });
          return `${idx + 1}. [${time}] ${roleLabel}: ${msg.content}`;
        }).join("\n");
      }
    }
    
    // Ticket 생성 (상담 대기열)
    await prisma.ticket.create({
      data: {
        customerId: customerInfo.customerId,
        subject: "쇼핑몰 챗봇 상담원 연결 요청",
        description: `고객명: ${customerInfo.customerName}\n전화번호: ${customerInfo.customerPhone}\n\n챗봇에서 상담원 연결을 요청하였습니다.${conversationHistory}`,
        category: "INQUIRY",
        priority: "MEDIUM",
        status: "OPEN",
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "상담원 연결이 예약되었습니다.",
    });
    
  } catch (error) {
    console.error("Request agent error:", error);
    return NextResponse.json(
      { message: "상담원 연결 요청 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
