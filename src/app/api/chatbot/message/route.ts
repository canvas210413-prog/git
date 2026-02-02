import { NextRequest, NextResponse } from "next/server";
import { chatCompletion, ChatMessage } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

// 메시지를 DB에 저장하는 헬퍼 함수
async function saveMessageToDb(sessionId: string | null, role: "user" | "assistant", content: string, intent?: string) {
  if (!sessionId) return;
  
  try {
    // 세션이 존재하는지 확인
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    
    if (session) {
      await prisma.chatMessage.create({
        data: {
          sessionId,
          senderType: role.toUpperCase(),
          content,
        },
      });
    }
  } catch (error) {
    console.error("[chatbot/message] Failed to save message:", error);
  }
}

// FAQ 데이터 (간단한 키워드 매칭용)
const FAQ_DATA: Record<string, string> = {
  "배송": "배송은 주문 후 평균 2-3일 소요됩니다.\n\n📦 평일 오후 2시 이전 주문: 당일 발송\n📦 주말/공휴일 주문: 다음 영업일 발송\n📦 제주/도서산간: 추가 1-2일 소요",
  "반품": "반품은 상품 수령 후 7일 이내 가능합니다.\n\n📋 반품 절차:\n1. 고객센터 또는 챗봇으로 반품 신청\n2. 반품 접수 확인 후 택배 기사 방문\n3. 상품 회수 후 검수\n4. 환불 처리 (영업일 기준 3-5일)",
  "교환": "교환은 동일 상품 내 색상/사이즈 변경이 가능합니다.\n\n🔄 교환 절차:\n1. 교환 신청 (챗봇 또는 마이페이지)\n2. 기존 상품 회수\n3. 신규 상품 발송",
  "결제": "다양한 결제 수단을 지원합니다.\n\n💳 신용/체크카드 (무이자 할부 최대 12개월)\n💰 무통장입금\n📱 간편결제 (카카오페이, 네이버페이, 토스)",
  "주문조회": "주문 조회는 마이페이지 > 주문내역에서 확인하실 수 있습니다.\n\n또는 주문번호를 알려주시면 조회해드리겠습니다.",
  "취소": "주문 취소는 발송 전까지 가능합니다.\n\n❗ 발송 완료 후에는 반품 절차로 진행됩니다.\n\n취소를 원하시면 주문번호를 알려주세요.",
  "필터": "공기청정기 필터는 6개월~1년 주기로 교체를 권장합니다.\n\n🔄 교체 시기:\n- 표준 사용: 12개월\n- 고농도 미세먼지 지역: 6-9개월\n- 펫 가정: 6개월\n\n필터 구매는 쇼핑몰에서 가능합니다.",
  "소음": "K-Project 공기청정기는 최저 25dB의 초저소음을 자랑합니다.\n\n🔇 모드별 소음:\n- 수면 모드: 25dB (속삭이는 소리)\n- 자동 모드: 35-45dB\n- 터보 모드: 55dB",
  "as": "A/S는 구매일로부터 1년간 무상 보증됩니다.\n\n🔧 A/S 신청:\n1. 고객센터 연락 (1588-0000)\n2. 챗봇 A/S 신청\n3. 홈페이지 A/S 접수\n\n방문 수리 또는 택배 수리 선택 가능합니다.",
};

// 키워드 기반 FAQ 검색
function findFaqAnswer(message: string): string | null {
  const lowerMsg = message.toLowerCase();
  
  for (const [keyword, answer] of Object.entries(FAQ_DATA)) {
    if (lowerMsg.includes(keyword.toLowerCase())) {
      return answer;
    }
  }
  return null;
}

// 시스템 프롬프트
const SYSTEM_PROMPT = `당신은 K-Project Mall의 친절한 AI 고객 상담사입니다.

역할:
- 고객의 문의에 친절하고 정확하게 답변합니다
- 주문, 배송, 반품, 교환, 제품 문의 등을 처리합니다
- 공기청정기 전문 쇼핑몰의 상담사로서 제품 관련 문의도 안내합니다

응답 규칙:
1. 항상 친절하고 공손한 어조를 사용합니다
2. 이모지를 적절히 사용하여 친근감을 표현합니다
3. 답변은 간결하면서도 필요한 정보를 포함합니다
4. 확실하지 않은 정보는 상담원 연결을 안내합니다
5. 한국어로 답변합니다

제품 정보:
- K-AIR 3000: 프리미엄 공기청정기, 42평형, 899,000원
- K-PURE 500: 소형 공기청정기, 15평형, 349,000원
- K-AIR PRO: 최상위 모델, 60평형, 1,490,000원
- 필터 교체 주기: 6개월~1년 권장

고객 정보가 제공되면 맞춤형 응답을 제공합니다.`;

export async function POST(request: NextRequest) {
  try {
    const { message, customerInfo, sessionId } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({
        message: "메시지를 입력해주세요.",
        timestamp: new Date().toISOString(),
      });
    }

    // 사용자 메시지를 DB에 저장
    await saveMessageToDb(sessionId, "user", message);

    // 1. FAQ 키워드 매칭 시도
    const faqAnswer = findFaqAnswer(message);
    if (faqAnswer) {
      // FAQ 응답을 DB에 저장
      await saveMessageToDb(sessionId, "assistant", faqAnswer, "faq");
      
      return NextResponse.json({
        message: faqAnswer,
        timestamp: new Date().toISOString(),
        sessionId,
        source: "faq",
      });
    }

    // 2. LLM 응답 시도
    try {
      const messages: ChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
      ];

      // 고객 정보가 있으면 컨텍스트에 추가
      if (customerInfo) {
        let customerContext = `\n\n[고객 정보]\n이름: ${customerInfo.customerName}\n주문 건수: ${customerInfo.orderCount}건`;
        
        if (customerInfo.recentOrders && customerInfo.recentOrders.length > 0) {
          customerContext += "\n\n최근 주문:";
          customerInfo.recentOrders.slice(0, 3).forEach((order: { orderNumber: string; status: string; totalAmount: number }) => {
            const statusKr: Record<string, string> = {
              PENDING: "결제대기",
              PAID: "결제완료",
              PROCESSING: "처리중",
              SHIPPED: "배송중",
              DELIVERED: "배송완료",
              CANCELLED: "취소됨",
            };
            customerContext += `\n- ${order.orderNumber}: ${statusKr[order.status] || order.status} (${order.totalAmount?.toLocaleString()}원)`;
          });
        }
        
        messages[0].content += customerContext;
      }

      messages.push({ role: "user", content: message });

      const llmResponse = await chatCompletion(messages, {
        temperature: 0.7,
        maxTokens: 500,
      });

      // LLM 응답을 DB에 저장
      await saveMessageToDb(sessionId, "assistant", llmResponse.content, "llm");

      return NextResponse.json({
        message: llmResponse.content,
        timestamp: new Date().toISOString(),
        sessionId,
        source: "llm",
        provider: llmResponse.provider,
      });
    } catch (llmError) {
      console.error("[chatbot/message] LLM error:", llmError);
      
      // LLM 실패 시 기본 응답
      const fallbackResponses = [
        "죄송합니다, 현재 시스템이 바쁩니다. 잠시 후 다시 시도해주세요. 🙏\n\n급한 문의는 '상담원 연결' 버튼을 눌러주세요.",
        "문의 감사합니다! 😊\n\n더 정확한 답변을 위해 상담원 연결을 추천드립니다.\n\n💡 자주 묻는 질문: 배송, 반품, 교환, 결제, 필터, AS",
        "안녕하세요! 현재 AI 상담이 원활하지 않습니다.\n\n빠른 상담을 위해 '상담원 연결' 버튼을 이용해주세요. 감사합니다! 🙏",
      ];
      
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      // 폴백 응답도 DB에 저장
      await saveMessageToDb(sessionId, "assistant", randomResponse, "fallback");
      
      return NextResponse.json({
        message: randomResponse,
        timestamp: new Date().toISOString(),
        sessionId,
        source: "fallback",
      });
    }
  } catch (error) {
    console.error("[chatbot/message] Error:", error);
    return NextResponse.json({
      message: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요. 🙏",
      timestamp: new Date().toISOString(),
    });
  }
}
