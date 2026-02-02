"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================================
// 상담 내역 관리 서버 액션
// ============================================================================

export interface ChatSession {
  id: string;
  phone: string;
  customerName: string | null;
  customerId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  summary: string | null;
  category: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: ChatMessage[];
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  intent: string | null;
  createdAt: Date;
}

export interface CreateSessionInput {
  phone: string;
  customerName?: string;
  customerId?: string;
}

export interface SaveMessageInput {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
}

// 상담 카테고리
const CHAT_CATEGORIES = [
  "배송문의",
  "주문문의",
  "제품문의",
  "AS문의",
  "필터문의",
  "교환/반품",
  "기타문의",
];

export async function getChatCategories(): Promise<string[]> {
  return CHAT_CATEGORIES;
}

/**
 * 새 상담 세션 생성
 */
export async function createChatSession(input: CreateSessionInput): Promise<ChatSession> {
  const session = await prisma.chatSession.create({
    data: {
      phone: input.phone,
      customerName: input.customerName,
      customerId: input.customerId,
      status: "ACTIVE",
    },
  });

  return session;
}

/**
 * 상담 세션에 메시지 저장
 */
export async function saveChatMessage(input: SaveMessageInput): Promise<ChatMessage> {
  const message = await prisma.chatMessage.create({
    data: {
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      intent: input.intent,
    },
  });

  // 세션의 카테고리 자동 업데이트 (첫 번째 의도 기반)
  if (input.intent && input.role === "user") {
    const session = await prisma.chatSession.findUnique({
      where: { id: input.sessionId },
    });
    
    if (session && !session.category) {
      const category = intentToCategory(input.intent);
      if (category) {
        await prisma.chatSession.update({
          where: { id: input.sessionId },
          data: { category },
        });
      }
    }
  }

  return message;
}

function intentToCategory(intent: string): string | null {
  const mapping: Record<string, string> = {
    delivery_status: "배송문의",
    order_inquiry: "주문문의",
    order_by_number: "주문문의",
    product_info: "제품문의",
    product_usage: "제품문의",
    filter_inquiry: "필터문의",
    as_inquiry: "AS문의",
    exchange_refund: "교환/반품",
    noise_complaint: "AS문의",
    led_inquiry: "제품문의",
  };
  return mapping[intent] || null;
}

/**
 * 상담 세션 종료
 */
export async function closeChatSession(
  sessionId: string, 
  summary?: string
): Promise<ChatSession> {
  const session = await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      status: "CLOSED",
      endedAt: new Date(),
      summary,
    },
  });

  revalidatePath("/dashboard/chat/history");
  return session;
}

/**
 * 상담 세션 요약 업데이트
 */
export async function updateSessionSummary(
  sessionId: string,
  summary: string,
  category?: string
): Promise<ChatSession> {
  const session = await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      summary,
      ...(category && { category }),
    },
  });

  revalidatePath("/dashboard/chat/history");
  return session;
}

/**
 * 모든 상담 세션 조회
 */
export async function getAllChatSessions(): Promise<ChatSession[]> {
  const sessions = await prisma.chatSession.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 1, // 첫 메시지만
      },
    },
  });

  return sessions;
}

/**
 * 전화번호로 상담 세션 조회
 */
export async function getChatSessionsByPhone(phone: string): Promise<ChatSession[]> {
  const normalizedPhone = phone.replace(/[-\s]/g, "");
  
  const sessions = await prisma.chatSession.findMany({
    where: {
      OR: [
        { phone: normalizedPhone },
        { phone: phone },
        { phone: { contains: normalizedPhone.slice(-8) } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return sessions;
}

/**
 * 상담 세션 상세 조회 (메시지 포함)
 */
export async function getChatSessionDetail(sessionId: string): Promise<ChatSession | null> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return session;
}

/**
 * 활성 상담 세션 찾기 (전화번호 기준)
 */
export async function findActiveSession(phone: string): Promise<ChatSession | null> {
  const normalizedPhone = phone.replace(/[-\s]/g, "");
  
  // 최근 30분 이내의 활성 세션 찾기
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  const session = await prisma.chatSession.findFirst({
    where: {
      OR: [
        { phone: normalizedPhone },
        { phone: phone },
      ],
      status: "ACTIVE",
      createdAt: { gte: thirtyMinutesAgo },
    },
    orderBy: { createdAt: "desc" },
  });

  return session;
}

/**
 * 상담 세션 삭제
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  await prisma.chatSession.delete({
    where: { id: sessionId },
  });

  revalidatePath("/dashboard/chat/history");
}

/**
 * 상담 통계
 */
export async function getChatStatistics(): Promise<{
  totalSessions: number;
  activeSessions: number;
  closedSessions: number;
  todaySessions: number;
  categoryStats: Record<string, number>;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, active, closed, todayCount, channelGroups] = await Promise.all([
    prisma.chatSession.count(),
    prisma.chatSession.count({ where: { status: "ACTIVE" } }),
    prisma.chatSession.count({ where: { status: "CLOSED" } }),
    prisma.chatSession.count({ where: { createdAt: { gte: today } } }),
    prisma.chatSession.groupBy({
      by: ["channel"],
      _count: { id: true },
    }),
  ]);

  const channelStats: Record<string, number> = {};
  for (const group of channelGroups) {
    if (group.channel) {
      channelStats[group.channel] = group._count.id;
    }
  }

  return {
    totalSessions: total,
    activeSessions: active,
    closedSessions: closed,
    todaySessions: todayCount,
    channelStats,
  };
}

// ============================================================================
// 챗봇용 간편 함수 (Alias)
// ============================================================================

/**
 * 챗봇에서 사용하는 세션 시작 함수
 */
export async function startChatSession(phone: string): Promise<{
  success: boolean;
  session?: ChatSession;
  error?: string;
}> {
  try {
    // 해당 전화번호로 고객 찾기
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: phone },
          { phone: phone.replace(/-/g, "") },
        ],
      },
    });

    const session = await createChatSession({
      phone,
      customerName: customer?.name,
      customerId: customer?.id,
    });

    return { success: true, session };
  } catch (error) {
    console.error("[ChatHistory] Start session error:", error);
    return { success: false, error: "세션 생성 실패" };
  }
}

/**
 * 챗봇에서 사용하는 메시지 저장 함수
 */
export async function addChatMessage(
  sessionId: string,
  role: "USER" | "ASSISTANT" | "SYSTEM",
  content: string,
  intent?: string
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  try {
    const normalizedRole = role.toLowerCase() as "user" | "assistant";
    if (normalizedRole !== "user" && normalizedRole !== "assistant") {
      return { success: true }; // SYSTEM 메시지는 저장하지 않음
    }

    const message = await saveChatMessage({
      sessionId,
      role: normalizedRole,
      content,
      intent,
    });

    return { success: true, message };
  } catch (error) {
    console.error("[ChatHistory] Add message error:", error);
    return { success: false, error: "메시지 저장 실패" };
  }
}

/**
 * 챗봇에서 사용하는 세션 종료 함수
 */
export async function endChatSession(
  sessionId: string,
  summary?: string
): Promise<{ success: boolean; session?: ChatSession; error?: string }> {
  try {
    const session = await closeChatSession(sessionId, summary);
    return { success: true, session };
  } catch (error) {
    console.error("[ChatHistory] End session error:", error);
    return { success: false, error: "세션 종료 실패" };
  }
}
