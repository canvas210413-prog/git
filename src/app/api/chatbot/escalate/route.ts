import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 상담원 연결 (에스컬레이션) API
export async function POST(request: NextRequest) {
  try {
    const { sessionId, customerInfo } = await request.json();

    console.log(`[chatbot/escalate] Escalation request - Session: ${sessionId}, Customer: ${customerInfo?.customerName}`);

    // 티켓 생성 (상담원이 처리할 수 있도록)
    if (customerInfo?.customerId && customerInfo.customerId !== "guest") {
      try {
        await prisma.ticket.create({
          data: {
            subject: `[챗봇 에스컬레이션] ${customerInfo.customerName}님 상담 요청`,
            description: `세션 ID: ${sessionId}\n고객명: ${customerInfo.customerName}\n전화번호: ${customerInfo.phoneNumber}\n\n챗봇에서 상담원 연결을 요청하셨습니다.`,
            status: "OPEN",
            priority: "HIGH",
            customerId: customerInfo.customerId,
          },
        });
      } catch (ticketError) {
        console.error("[chatbot/escalate] Failed to create ticket:", ticketError);
      }
    }

    return NextResponse.json({
      success: true,
      escalated: true,
      message: `📞 상담원 연결 요청이 접수되었습니다!\n\n${customerInfo?.customerName || "고객"}님, 잠시만 기다려주세요.\n\n평균 대기 시간: 약 3-5분\n운영 시간: 평일 09:00 - 18:00\n\n💡 빠른 상담을 원하시면 고객센터(1588-0000)로 전화주세요.`,
      estimatedWait: "3-5분",
    });
  } catch (error) {
    console.error("[chatbot/escalate] Error:", error);
    return NextResponse.json({
      success: false,
      message: "상담원 연결 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
}
