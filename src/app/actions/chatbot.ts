"use server";

import { 
  processChatMessage, 
  getExampleQuestions, 
  findCustomerByPhone,
  closeChatSession,
  CustomerInfo,
  ChatbotResponse 
} from "@/lib/customer-chatbot";
import { startChatSession, endChatSession } from "@/app/actions/chat-history";
import { escalateToAgent } from "@/app/actions/chat-assign";

// ============================================================================
// 미니쉴드 고객 챗봇 서버 액션
// ============================================================================

/**
 * 전화번호로 고객 확인 및 인증
 */
export async function verifyCustomerPhone(phone: string): Promise<{
  success: boolean;
  message: string;
  customerInfo?: CustomerInfo;
}> {
  if (!phone || phone.trim().length < 8) {
    return {
      success: false,
      message: "올바른 전화번호를 입력해주세요. (예: 010-1234-5678)",
    };
  }

  const customerInfo = await findCustomerByPhone(phone.trim());

  if (!customerInfo) {
    return {
      success: false,
      message: "📱 등록된 전화번호가 아닙니다.\n\n주문 시 입력하신 전화번호를 정확히 입력해주세요.\n\n그래도 조회가 안 되시면 고객센터로 문의해주세요.",
    };
  }

  // 이름 마스킹 (홍길동 → 홍*동)
  const maskedName = maskName(customerInfo.customerName);

  return {
    success: true,
    message: `✅ **${maskedName}** 고객님, 인증되었습니다!\n\n이제 주문 조회, 배송 확인, 쿠폰 조회 등을 이용하실 수 있습니다.\n\n💡 "배송 상태", "내 주문", "쿠폰 조회" 등을 입력해보세요!`,
    customerInfo,
  };
}

function maskName(name: string): string {
  if (!name || name.length < 2) return name || "";
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

/**
 * 채팅 메시지 처리 (세션 관리 포함)
 */
export async function sendChatMessage(
  message: string,
  customerInfo: CustomerInfo | null,
  sessionId?: string | null
): Promise<ChatbotResponse> {
  if (!message || message.trim().length === 0) {
    return {
      success: false,
      message: "메시지를 입력해주세요.",
      timestamp: new Date().toISOString(),
    };
  }

  return processChatMessage(message.trim(), customerInfo, sessionId);
}

/**
 * 상담 세션 종료
 */
export async function endChat(
  sessionId: string,
  summary?: string
): Promise<{ success: boolean; message: string }> {
  return closeChatSession(sessionId, summary);
}

/**
 * 상담 세션 종료 (요약 포함 저장)
 */
export async function endChatWithSummary(
  sessionId: string,
  summary: string
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await endChatSession(sessionId, summary);
    if (result.success) {
      return { success: true, message: "상담이 저장되었습니다." };
    }
    return { success: false, message: result.error || "저장 실패" };
  } catch (error) {
    console.error("[Chatbot] End chat with summary error:", error);
    return { success: false, message: "저장 중 오류 발생" };
  }
}

/**
 * 상담 세션 시작 (전화번호 인증 후 호출)
 */
export async function startChatSessionAction(phone: string): Promise<{
  success: boolean;
  sessionId?: string;
  message: string;
}> {
  try {
    const result = await startChatSession(phone);
    if (result.success && result.session) {
      return {
        success: true,
        sessionId: result.session.id,
        message: "세션이 시작되었습니다.",
      };
    }
    return { success: false, message: result.error || "세션 시작 실패" };
  } catch (error) {
    console.error("[Chatbot] Start session error:", error);
    return { success: false, message: "세션 시작 중 오류 발생" };
  }
}

/**
 * 예시 질문 목록
 */
export async function getSampleQuestions(): Promise<string[]> {
  return getExampleQuestions();
}

/**
 * 상담원 연결 요청
 */
export async function requestAgentConnection(
  sessionId: string | null,
  customerInfo: CustomerInfo | null
): Promise<{
  success: boolean;
  message: string;
  escalated: boolean;
  sessionId?: string;
  waitingNumber?: number;
}> {
  try {
    // customerInfo가 없으면 인증 필요
    if (!customerInfo || !customerInfo.phone) {
      return {
        success: false,
        message: "📱 상담원 연결을 위해 먼저 전화번호 인증을 해주세요.",
        escalated: false,
      };
    }
    
    // 세션이 없으면 새로 생성
    let currentSessionId = sessionId;
    
    if (!currentSessionId) {
      console.log("[AgentConnection] Creating new session for phone:", customerInfo.phone);
      const sessionResult = await startChatSession(customerInfo.phone);
      console.log("[AgentConnection] Session result:", sessionResult);
      
      if (sessionResult.success && sessionResult.session) {
        currentSessionId = sessionResult.session.id;
      } else {
        // 세션 생성 실패 시에도 직접 생성 시도
        console.log("[AgentConnection] Failed to create session, trying direct creation");
      }
    }
    
    if (!currentSessionId) {
      // 마지막으로 직접 prisma를 통해 세션 생성
      const { prisma } = await import("@/lib/prisma");
      const newSession = await prisma.chatSession.create({
        data: {
          phone: customerInfo.phone,
          customerName: customerInfo.customerName,
          status: "ACTIVE",
        },
      });
      currentSessionId = newSession.id;
      console.log("[AgentConnection] Created session directly:", currentSessionId);
    }
    
    // 이관 요청
    const result = await escalateToAgent(
      currentSessionId,
      "고객이 상담사 예약하기 버튼을 클릭함",
      0 // 일반 우선순위
    );
    
    console.log("[AgentConnection] Escalate result:", result);
    
    if (result.success) {
      const waitingNumber = result.queuePosition || 1;
      
      return {
        success: true,
        message: `📅 **상담 예약이 완료되었습니다!**\n\n📞 연락처: **${customerInfo.phone}**\n⏰ 예약 시간: **${new Date().toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}**\n🔢 대기 번호: **${waitingNumber}번**\n\n담당 상담사가 순서대로 연락드릴 예정입니다.\n감사합니다! 🙏\n\n💡 기다리시는 동안 궁금한 점을 계속 물어보실 수 있습니다.`,
        escalated: true,
        sessionId: currentSessionId,
        waitingNumber,
      };
    } else {
      return {
        success: false,
        message: `😔 **상담 예약 실패**\n\n${result.message}\n\n잠시 후 다시 시도해주세요.`,
        escalated: false,
        sessionId: currentSessionId,
      };
    }
  } catch (error) {
    console.error("[Chatbot] Agent connection error:", error);
    return {
      success: false,
      message: "죄송합니다. 상담 예약 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      escalated: false,
    };
  }
}
