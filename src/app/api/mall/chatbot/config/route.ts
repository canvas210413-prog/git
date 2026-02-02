import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 챗봇 설정 조회 API (공개용 - 쇼핑몰에서 사용)
export async function GET() {
  try {
    // ChatbotConfig에서 설정 조회
    const config = await prisma.chatbotConfig.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!config) {
      // 기본 설정 반환
      return NextResponse.json({
        name: "K-Project 고객센터",
        isActive: true,
        welcomeMessage: "안녕하세요! K-Project Mall 고객센터입니다. 😊\n무엇을 도와드릴까요?",
        themeColor: "#3B82F6",
        chatPosition: "bottom-right",
        showSuggestions: true,
        autoGreeting: true,
      });
    }

    // 공개용 설정만 반환 (민감한 정보 제외)
    return NextResponse.json({
      name: config.name,
      isActive: config.isActive,
      welcomeMessage: config.welcomeMessage || "안녕하세요! 무엇을 도와드릴까요?",
      themeColor: config.themeColor,
      chatPosition: config.chatPosition,
      showSuggestions: config.showSuggestions,
      autoGreeting: config.autoGreeting,
      brandVoice: config.brandVoice,
      responseStyle: config.responseStyle,
    });
  } catch (error) {
    console.error("Failed to get chatbot config:", error);
    // 에러 시 기본 설정 반환
    return NextResponse.json({
      name: "K-Project 고객센터",
      isActive: true,
      welcomeMessage: "안녕하세요! K-Project Mall 고객센터입니다. 😊\n무엇을 도와드릴까요?",
      themeColor: "#3B82F6",
      chatPosition: "bottom-right",
      showSuggestions: true,
      autoGreeting: true,
    });
  }
}
