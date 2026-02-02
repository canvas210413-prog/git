import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chatCompletion } from "@/lib/ai";

// MallOrder 타입 정의
interface MallOrderType {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  items: string;
  trackingNumber: string | null;
  courier: string | null;
  createdAt: Date;
}

// ChatbotConfig 타입 정의
interface ChatbotConfigType {
  systemPrompt: string | null;
  brandVoice: string | null;
  maxTokens: number;
  temperature: number;
}

// 주문 상태 한글화
const ORDER_STATUS_MAP: Record<string, string> = {
  PENDING: "주문 대기",
  PAID: "결제 완료",
  PREPARING: "상품 준비중",
  SHIPPING: "배송중",
  SHIPPED: "배송중",
  DELIVERED: "배송 완료",
  CANCELLED: "주문 취소",
  REFUNDED: "환불 완료",
};

// 쇼핑몰 챗봇 AI 응답 API
export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, customerInfo } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "메시지가 필요합니다." },
        { status: 400 }
      );
    }

    // FAQ 검색 - 질문에 포함된 키워드로 검색
    let faqContext = "";
    try {
      // @ts-expect-error - Prisma 타입이 아직 업데이트되지 않음
      const relatedFaqs = await prisma.fAQ.findMany({
        where: {
          isActive: true,
          OR: [
            { question: { contains: message } },
            { answer: { contains: message } },
          ],
        },
        take: 5,
        orderBy: { orderNum: "asc" },
      });

      if (relatedFaqs.length > 0) {
        faqContext = "\n\n## 관련 제품 가이드 (참고용)\n";
        relatedFaqs.forEach((faq: { category: string; question: string; answer: string }, idx: number) => {
          faqContext += `\n${idx + 1}. [${faq.category}] ${faq.question}\n답변: ${faq.answer}\n`;
        });
        faqContext += "\n위 가이드를 참고하여 고객의 질문에 정확하게 답변하세요.\n";
      }
    } catch (e) {
      console.log("FAQ 검색 실패 (테이블이 없을 수 있음):", e);
    }

    // 주문/배송 조회 관련 질문인지 확인
    const isOrderQuery = /주문.*(조회|확인|내역|상태)|배송.*(조회|확인|상태|어디)|내\s*주문|언제.*(도착|와|오)/.test(message);
    
    // 인증된 고객의 주문 조회
    let orderInfo = "";
    let queryType = "general";
    let resultCount = 0;
    
    if (isOrderQuery && customerInfo) {
      queryType = "order";
      
      // MallOrder에서 주문 조회
      // @ts-expect-error - Prisma 타입이 아직 업데이트되지 않음
      const orders: MallOrderType[] = await prisma.mallOrder.findMany({
        where: {
          OR: [
            { customerEmail: customerInfo.customerName ? undefined : "" },
            { customerPhone: { contains: customerInfo.customerPhone?.slice(-8) || "" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
      
      if (orders.length > 0) {
        resultCount = orders.length;
        orderInfo = `\n\n## 고객 주문 정보\n고객명: ${customerInfo.customerName}\n\n### 최근 주문 내역:\n`;
        
        for (const order of orders) {
          const statusText = ORDER_STATUS_MAP[order.status] || order.status;
          
          // items는 JSON string이므로 파싱
          let itemsText = "";
          try {
            const items = JSON.parse(order.items || "[]") as Array<{name?: string; productName?: string; quantity?: number}>;
            itemsText = items.map((item) => 
              `  - ${item.name || item.productName || '상품'} x ${item.quantity || 1}개`
            ).join('\n');
          } catch {
            itemsText = "  - 상품 정보 없음";
          }
          
          orderInfo += `
📦 주문번호: ${order.orderNumber}
- 상태: ${statusText}
- 주문일: ${order.createdAt.toLocaleDateString('ko-KR')}
- 금액: ${order.totalAmount.toLocaleString()}원
${order.trackingNumber ? `- 송장번호: ${order.trackingNumber} (${order.courier || '택배'})` : ''}
- 상품:
${itemsText}
---
`;
        }
      } else {
        orderInfo = `\n\n## 고객 정보\n고객명: ${customerInfo.customerName}\n주문 내역이 없습니다.`;
      }
    }

    // 챗봇 설정 조회
    let config: ChatbotConfigType | null = null;
    try {
      // @ts-expect-error - Prisma 타입이 아직 업데이트되지 않음
      config = await prisma.chatbotConfig.findFirst({
        orderBy: { createdAt: "desc" },
      });
    } catch {
      // ChatbotConfig 테이블이 없을 수 있음
      console.log("ChatbotConfig not found, using defaults");
    }

    // 시스템 프롬프트 구성
    const systemPrompt = config?.systemPrompt || `당신은 K-Project Mall의 친절한 고객 서비스 AI 챗봇입니다.

## 당신의 역할
1. 쇼핑몰 이용 안내
2. 배송 정보 안내
3. 교환/반품 정책 안내
4. 쿠폰 및 혜택 안내
5. 일반적인 상품 문의 응대

## 응답 규칙
- 항상 친절하고 공손한 말투를 사용하세요
- 답변은 간결하고 명확하게 작성하세요
- 확실하지 않은 정보는 고객센터 문의를 안내하세요
- 이모지를 적절히 사용하여 친근감을 주세요

## 쇼핑몰 정보
- 배송비: 50,000원 이상 무료배송, 미만 시 3,000원
- 배송기간: 결제 완료 후 1~3일 (주말/공휴일 제외)
- 교환/반품: 수령 후 7일 이내
- 고객센터: 1588-0000 (평일 09:00-18:00)`;

    // 브랜드 톤 추가
    const brandVoice = config?.brandVoice 
      ? `\n\n## 브랜드 톤\n${config.brandVoice}` 
      : "";

    // AI 응답 생성
    const response = await chatCompletion([
      {
        role: "system",
        content: systemPrompt + brandVoice + faqContext + orderInfo,
      },
      {
        role: "user",
        content: message,
      },
    ], {
      maxTokens: config?.maxTokens || 500,
      temperature: config?.temperature || 0.7,
    });

    // 세션이 있으면 메시지 저장
    if (sessionId) {
      try {
        // 사용자 메시지 저장
        await prisma.chatMessage.create({
          data: {
            sessionId,
            senderType: "USER",
            content: message,
          },
        });
        
        // AI 응답 저장
        await prisma.chatMessage.create({
          data: {
            sessionId,
            senderType: "BOT",
            content: response.content,
          },
        });
      } catch (e) {
        console.error("Failed to save chat message:", e);
      }
    }

    return NextResponse.json({
      message: response.content,
      timestamp: new Date().toISOString(),
      queryType,
      resultCount,
      sessionId,
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    return NextResponse.json({
      message: "죄송합니다. 일시적인 오류가 발생했습니다.\n\n고객센터: 1588-0000\n(평일 09:00 - 18:00)",
      timestamp: new Date().toISOString(),
    });
  }
}
