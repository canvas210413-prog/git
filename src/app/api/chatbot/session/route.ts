import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 세션 시작 API - DB에 ChatSession 저장
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, customerName, customerId } = await request.json();
    
    // DB에 새 세션 생성
    const session = await prisma.chatSession.create({
      data: {
        phone: phoneNumber || "unknown",
        customerName: customerName || null,
        customerId: customerId || null,
        status: "ACTIVE",
      },
    });
    
    console.log(`[chatbot/session] New session created: ${session.id} for ${phoneNumber}`);
    
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      message: "세션이 시작되었습니다.",
    });
  } catch (error) {
    console.error("[chatbot/session] Error:", error);
    return NextResponse.json({
      success: false,
      message: "세션 시작에 실패했습니다.",
    });
  }
}
