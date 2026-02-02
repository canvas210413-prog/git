"use server";

import { prisma } from "@/lib/prisma";
import { chatCompletion, ChatMessage } from "@/lib/ai";

// ============================================================================
// CRM 챗봇 시스템 프롬프트
// ============================================================================

const SYSTEM_PROMPT = `당신은 CRM 시스템의 AI 고객 서비스 챗봇입니다. 고객과 직원들의 질문에 친절하고 정확하게 답변합니다.

## 당신의 역할
1. 주문 조회 및 배송 상태 안내
2. 고객 정보 조회
3. 제품 및 재고 문의 응대
4. CS 티켓 상태 확인
5. 일반적인 서비스 안내

## 응답 규칙
- 항상 존댓말을 사용하세요.
- 개인정보는 최소한만 노출하세요 (이름은 일부 마스킹: 홍*동)
- 정확한 정보가 없으면 "확인이 필요합니다"라고 답변하세요.
- 답변은 간결하고 명확하게 작성하세요.

## 데이터 형식
주문 상태: PENDING(대기중), PROCESSING(처리중), SHIPPED(배송중), DELIVERED(배송완료), CANCELLED(취소됨)
티켓 상태: OPEN(접수), IN_PROGRESS(처리중), RESOLVED(해결), CLOSED(종료)

## 응답 예시
사용자: "주문번호 12345 상태 알려줘"
봇: "주문번호 12345 조회 결과입니다.
- 주문일시: 2024-12-01 14:30
- 고객명: 홍*동
- 상품: 프리미엄 노트북
- 배송상태: 배송중
- 송장번호: 1234567890
문의사항이 있으시면 말씀해주세요."`;

// ============================================================================
// 데이터 조회 함수들
// ============================================================================

async function findOrderByNumber(orderNumber: string) {
  // orderNumber 또는 id로 검색
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { orderNumber: { contains: orderNumber } },
        { id: { contains: orderNumber } },
      ],
    },
    include: {
      customer: true,
      items: {
        include: { product: true },
      },
    },
  });
  return order;
}

async function findOrdersByCustomerName(name: string) {
  const orders = await prisma.order.findMany({
    where: {
      customer: {
        name: { contains: name },
      },
    },
    include: {
      customer: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return orders;
}

async function findOrdersByPhone(phone: string) {
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { contactPhone: { contains: phone } },
        { customer: { phone: { contains: phone } } },
      ],
    },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return orders;
}

async function findCustomerByEmail(email: string) {
  const customer = await prisma.customer.findFirst({
    where: { email: { contains: email } },
    include: {
      orders: { take: 3, orderBy: { createdAt: "desc" } },
      tickets: { take: 3, orderBy: { createdAt: "desc" } },
    },
  });
  return customer;
}

async function findCustomerByName(name: string) {
  const customers = await prisma.customer.findMany({
    where: { name: { contains: name } },
    include: {
      orders: { take: 3, orderBy: { createdAt: "desc" } },
    },
    take: 5,
  });
  return customers;
}

async function findProductByName(name: string) {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: name } },
        { sku: { contains: name } },
      ],
    },
    take: 5,
  });
  return products;
}

async function findTicketById(ticketId: string) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      OR: [
        { id: { contains: ticketId } },
      ],
    },
    include: {
      customer: true,
      assignedTo: true,
    },
  });
  return ticket;
}

async function getRecentOrders(limit: number = 5) {
  return prisma.order.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

async function getOpenTickets() {
  return prisma.ticket.findMany({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

// ============================================================================
// 의도 분석 및 데이터 추출
// ============================================================================

interface QueryIntent {
  type: "order_status" | "customer_info" | "product_info" | "ticket_status" | "general" | "recent_orders" | "open_tickets";
  identifier?: string;
  searchType?: "order_number" | "customer_name" | "phone" | "email" | "product_name" | "ticket_id";
}

async function analyzeIntent(query: string): Promise<QueryIntent> {
  // 주문번호 패턴 (숫자 또는 영문숫자 조합)
  const orderNumberMatch = query.match(/(?:주문(?:번호)?|order|#)\s*[:\s]?\s*([a-zA-Z0-9\-]+)/i);
  if (orderNumberMatch) {
    return { type: "order_status", identifier: orderNumberMatch[1], searchType: "order_number" };
  }

  // 송장번호/운송장 패턴
  const trackingMatch = query.match(/(?:송장|운송장|택배)\s*(?:번호)?\s*[:\s]?\s*(\d+)/i);
  if (trackingMatch) {
    return { type: "order_status", identifier: trackingMatch[1], searchType: "order_number" };
  }

  // 전화번호 패턴
  const phoneMatch = query.match(/(?:전화|휴대폰|연락처|폰)\s*[:\s]?\s*([\d\-]+)/i) || 
                     query.match(/(01[0-9][\-\s]?\d{3,4}[\-\s]?\d{4})/);
  if (phoneMatch) {
    return { type: "order_status", identifier: phoneMatch[1].replace(/[\-\s]/g, ""), searchType: "phone" };
  }

  // 이메일 패턴
  const emailMatch = query.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    return { type: "customer_info", identifier: emailMatch[1], searchType: "email" };
  }

  // 티켓 패턴
  const ticketMatch = query.match(/(?:티켓|문의|접수)\s*(?:번호)?\s*[:\s]?\s*([a-zA-Z0-9\-]+)/i);
  if (ticketMatch) {
    return { type: "ticket_status", identifier: ticketMatch[1], searchType: "ticket_id" };
  }

  // 최근 주문
  if (query.includes("최근 주문") || query.includes("오늘 주문") || query.includes("주문 현황")) {
    return { type: "recent_orders" };
  }

  // 미해결 티켓
  if (query.includes("미해결") || query.includes("열린 티켓") || query.includes("대기 중인 문의")) {
    return { type: "open_tickets" };
  }

  // 제품/상품 검색
  const productMatch = query.match(/(?:제품|상품|재고)\s*[:\s]?\s*(.+?)(?:\s+(?:있|재고|가격|정보))?$/i);
  if (productMatch && productMatch[1].length > 1) {
    return { type: "product_info", identifier: productMatch[1].trim(), searchType: "product_name" };
  }

  // 고객명으로 검색
  const customerMatch = query.match(/(?:고객|이름)\s*[:\s]?\s*([가-힣a-zA-Z]+)/i);
  if (customerMatch) {
    return { type: "customer_info", identifier: customerMatch[1], searchType: "customer_name" };
  }

  // 배송 상태 문의 (이름 추출 시도)
  if (query.includes("배송") || query.includes("주문")) {
    const nameInQuery = query.match(/([가-힣]{2,4})(?:님|씨|고객)?/);
    if (nameInQuery) {
      return { type: "order_status", identifier: nameInQuery[1], searchType: "customer_name" };
    }
  }

  return { type: "general" };
}

// ============================================================================
// 데이터 포맷팅
// ============================================================================

function maskName(name: string): string {
  if (!name || name.length < 2) return name;
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "⏳ 주문 대기중",
    PROCESSING: "📦 처리중",
    SHIPPED: "🚚 배송중",
    DELIVERED: "✅ 배송완료",
    CANCELLED: "❌ 주문취소",
    COMPLETED: "✅ 완료",
  };
  return statusMap[status] || status;
}

function formatTicketStatus(status: string): string {
  const statusMap: Record<string, string> = {
    OPEN: "🔴 접수됨",
    IN_PROGRESS: "🟡 처리중",
    RESOLVED: "🟢 해결됨",
    CLOSED: "⚫ 종료",
  };
  return statusMap[status] || status;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number | any): string {
  const num = typeof amount === "number" ? amount : Number(amount);
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(num);
}

// ============================================================================
// 컨텍스트 빌더
// ============================================================================

async function buildContext(intent: QueryIntent): Promise<string> {
  let context = "";

  try {
    switch (intent.type) {
      case "order_status":
        if (intent.searchType === "order_number" && intent.identifier) {
          const order = await findOrderByNumber(intent.identifier);
          if (order) {
            const products = order.items?.map(i => `${i.product.name} x ${i.quantity}`).join(", ") || order.productInfo || "상품 정보 없음";
            context = `
[주문 정보 조회 결과]
- 주문번호: ${order.orderNumber || order.id}
- 주문일시: ${formatDate(order.createdAt)}
- 고객명: ${maskName(order.customer?.name || order.ordererName || "알 수 없음")}
- 연락처: ${order.contactPhone || "정보 없음"}
- 상품: ${products}
- 총 금액: ${formatCurrency(order.totalAmount)}
- 배송상태: ${formatOrderStatus(order.status)}
- 배송지: ${order.recipientAddr || "정보 없음"}
${order.courier ? `- 택배사: ${order.courier}` : ""}
${order.trackingNumber ? `- 송장번호: ${order.trackingNumber}` : ""}
`;
          } else {
            context = `[조회 결과] 주문번호 "${intent.identifier}"에 해당하는 주문을 찾을 수 없습니다.`;
          }
        } else if (intent.searchType === "customer_name" && intent.identifier) {
          const orders = await findOrdersByCustomerName(intent.identifier);
          if (orders.length > 0) {
            context = `[${intent.identifier}님 최근 주문 내역 - ${orders.length}건]\n`;
            orders.forEach((order, idx) => {
              context += `${idx + 1}. 주문번호: ${order.orderNumber || order.id.slice(-8)} | ${formatDate(order.createdAt)} | ${formatOrderStatus(order.status)} | ${formatCurrency(order.totalAmount)}\n`;
            });
          } else {
            context = `[조회 결과] "${intent.identifier}"님의 주문 내역을 찾을 수 없습니다.`;
          }
        } else if (intent.searchType === "phone" && intent.identifier) {
          const orders = await findOrdersByPhone(intent.identifier);
          if (orders.length > 0) {
            context = `[전화번호 ${intent.identifier} 관련 주문 - ${orders.length}건]\n`;
            orders.forEach((order, idx) => {
              context += `${idx + 1}. ${maskName(order.customer?.name || "고객")} | 주문번호: ${order.orderNumber || order.id.slice(-8)} | ${formatOrderStatus(order.status)}\n`;
            });
          } else {
            context = `[조회 결과] 해당 전화번호로 등록된 주문을 찾을 수 없습니다.`;
          }
        }
        break;

      case "customer_info":
        if (intent.searchType === "email" && intent.identifier) {
          const customer = await findCustomerByEmail(intent.identifier);
          if (customer) {
            context = `
[고객 정보]
- 이름: ${maskName(customer.name)}
- 이메일: ${customer.email}
- 회사: ${customer.company || "개인"}
- 상태: ${customer.status}
- 세그먼트: ${customer.segment || "미분류"}
- 최근 주문: ${customer.orders.length}건
- 문의 티켓: ${customer.tickets.length}건
`;
          } else {
            context = `[조회 결과] 해당 이메일의 고객을 찾을 수 없습니다.`;
          }
        } else if (intent.searchType === "customer_name" && intent.identifier) {
          const customers = await findCustomerByName(intent.identifier);
          if (customers.length > 0) {
            context = `[고객 검색 결과 - ${customers.length}명]\n`;
            customers.forEach((c, idx) => {
              context += `${idx + 1}. ${maskName(c.name)} | ${c.email} | ${c.company || "개인"} | 주문 ${c.orders.length}건\n`;
            });
          } else {
            context = `[조회 결과] "${intent.identifier}" 고객을 찾을 수 없습니다.`;
          }
        }
        break;

      case "product_info":
        if (intent.identifier) {
          const products = await findProductByName(intent.identifier);
          if (products.length > 0) {
            context = `[상품 검색 결과 - ${products.length}건]\n`;
            products.forEach((p, idx) => {
              context += `${idx + 1}. ${p.name} (SKU: ${p.sku})\n   - 가격: ${formatCurrency(p.price)} | 재고: ${p.stock}개 ${p.stock < 10 ? "⚠️ 재고 부족" : ""}\n`;
            });
          } else {
            context = `[조회 결과] "${intent.identifier}" 관련 상품을 찾을 수 없습니다.`;
          }
        }
        break;

      case "ticket_status":
        if (intent.identifier) {
          const ticket = await findTicketById(intent.identifier);
          if (ticket) {
            context = `
[문의 티켓 정보]
- 티켓번호: ${ticket.id.slice(-8)}
- 제목: ${ticket.subject}
- 상태: ${formatTicketStatus(ticket.status)}
- 우선순위: ${ticket.priority}
- 접수일: ${formatDate(ticket.createdAt)}
- 고객: ${maskName(ticket.customer?.name || "알 수 없음")}
- 담당자: ${ticket.assignedTo?.name || "미배정"}
${ticket.closedAt ? `- 해결일: ${formatDate(ticket.closedAt)}` : ""}
`;
          } else {
            context = `[조회 결과] 해당 티켓을 찾을 수 없습니다.`;
          }
        }
        break;

      case "recent_orders":
        const recentOrders = await getRecentOrders(5);
        if (recentOrders.length > 0) {
          context = `[최근 주문 현황 - ${recentOrders.length}건]\n`;
          recentOrders.forEach((order, idx) => {
            context += `${idx + 1}. ${formatDate(order.createdAt)} | ${maskName(order.customer?.name || "고객")} | ${formatCurrency(order.totalAmount)} | ${formatOrderStatus(order.status)}\n`;
          });
        } else {
          context = "[조회 결과] 최근 주문이 없습니다.";
        }
        break;

      case "open_tickets":
        const tickets = await getOpenTickets();
        if (tickets.length > 0) {
          context = `[미해결 티켓 - ${tickets.length}건]\n`;
          tickets.forEach((t, idx) => {
            context += `${idx + 1}. [${formatTicketStatus(t.status)}] ${t.subject} | ${maskName(t.customer?.name || "고객")} | ${formatDate(t.createdAt)}\n`;
          });
        } else {
          context = "[조회 결과] 미해결 티켓이 없습니다. 👍";
        }
        break;

      default:
        context = "[일반 문의] 데이터베이스 조회 없이 일반 응답을 제공합니다.";
    }
  } catch (error) {
    console.error("Context build error:", error);
    context = "[시스템 오류] 데이터 조회 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  return context;
}

// ============================================================================
// 메인 챗봇 함수
// ============================================================================

export interface ChatbotResponse {
  message: string;
  intent: string;
  context?: string;
  timestamp: string;
}

export async function processChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatbotResponse> {
  try {
    // 1. 의도 분석
    const intent = await analyzeIntent(userMessage);
    
    // 2. 컨텍스트 구축 (데이터 조회)
    const context = await buildContext(intent);
    
    // 3. LLM에 전달할 메시지 구성
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-6), // 최근 6개 대화만 유지
      { 
        role: "user", 
        content: `[시스템 조회 결과]\n${context}\n\n[고객 질문]\n${userMessage}\n\n위 조회 결과를 바탕으로 고객에게 친절하게 답변해주세요.` 
      },
    ];

    // 4. LLM 응답 생성
    const response = await chatCompletion(messages, {
      temperature: 0.7,
      maxTokens: 1024,
    });

    return {
      message: response.content,
      intent: intent.type,
      context: context,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Chatbot error:", error);
    return {
      message: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      intent: "error",
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// 빠른 응답 (데이터만 조회, LLM 없이)
// ============================================================================

export async function quickQuery(query: string): Promise<string> {
  const intent = await analyzeIntent(query);
  const context = await buildContext(intent);
  return context;
}
