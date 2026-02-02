"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================================
// 엔터프라이즈급 문의 우선순위 분류 시스템
// ============================================================================

// 우선순위 레벨 정의
export type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface PriorityRule {
  id: string;
  name: string;
  description: string;
  priority: PriorityLevel;
  conditions: PriorityCondition[];
  slaMinutes: number; // SLA 응답 목표 시간 (분)
  autoEscalate: boolean;
  escalateAfterMinutes: number;
  isActive: boolean;
  createdAt: Date;
}

export interface PriorityCondition {
  type: "keyword" | "customer_grade" | "order_amount" | "sentiment" | "category";
  operator: "contains" | "equals" | "greater_than" | "less_than";
  value: string;
}

export interface PrioritizedSession {
  id: string;
  phone: string;
  customerName: string | null;
  customerGrade: string | null;
  totalPurchase: number;
  priority: PriorityLevel;
  priorityScore: number;
  slaDeadline: Date | null;
  slaStatus: "on_track" | "warning" | "breached";
  waitingMinutes: number;
  escalateReason: string | null;
  lastMessage: string | null;
  category: string | null;
  sentiment: string | null;
  createdAt: Date;
  matchedRules: string[];
}

export interface PriorityStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
  slaBreached: number;
  slaWarning: number;
  avgResponseTime: number;
  todayResolved: number;
}

// 기본 우선순위 규칙
const DEFAULT_RULES: Omit<PriorityRule, "id" | "createdAt">[] = [
  {
    name: "VIP 고객 문의",
    description: "VIP/VVIP 등급 고객의 모든 문의",
    priority: "CRITICAL",
    conditions: [
      { type: "customer_grade", operator: "equals", value: "VIP" },
    ],
    slaMinutes: 5,
    autoEscalate: true,
    escalateAfterMinutes: 3,
    isActive: true,
  },
  {
    name: "긴급 키워드 감지",
    description: "긴급, 불만, 환불, 취소, 클레임 등 긴급 키워드 포함",
    priority: "HIGH",
    conditions: [
      { type: "keyword", operator: "contains", value: "긴급|불만|환불|취소|클레임|고소|신고|항의" },
    ],
    slaMinutes: 15,
    autoEscalate: true,
    escalateAfterMinutes: 10,
    isActive: true,
  },
  {
    name: "고액 구매 고객",
    description: "누적 구매액 100만원 이상 고객",
    priority: "HIGH",
    conditions: [
      { type: "order_amount", operator: "greater_than", value: "1000000" },
    ],
    slaMinutes: 15,
    autoEscalate: false,
    escalateAfterMinutes: 30,
    isActive: true,
  },
  {
    name: "부정적 감정 감지",
    description: "AI가 부정적 감정으로 분석한 문의",
    priority: "MEDIUM",
    conditions: [
      { type: "sentiment", operator: "equals", value: "negative" },
    ],
    slaMinutes: 30,
    autoEscalate: false,
    escalateAfterMinutes: 60,
    isActive: true,
  },
  {
    name: "일반 문의",
    description: "기타 모든 문의",
    priority: "LOW",
    conditions: [],
    slaMinutes: 60,
    autoEscalate: false,
    escalateAfterMinutes: 120,
    isActive: true,
  },
];

// 긴급 키워드 목록
const URGENT_KEYWORDS = [
  "긴급", "급해요", "빨리", "당장", "지금바로",
  "불만", "화나", "실망", "최악", "짜증",
  "환불", "취소", "반품", "교환",
  "클레임", "고소", "신고", "항의", "소보원",
  "파손", "불량", "고장", "안됨", "오류",
];

// 우선순위 점수 계산
function calculatePriorityScore(
  customerGrade: string | null,
  totalPurchase: number,
  messageContent: string | null,
  sentiment: string | null,
  waitingMinutes: number
): { priority: PriorityLevel; score: number; matchedRules: string[] } {
  let score = 0;
  const matchedRules: string[] = [];

  // 1. 고객 등급 점수
  if (customerGrade === "VIP" || customerGrade === "VVIP") {
    score += 100;
    matchedRules.push("VIP 고객");
  } else if (customerGrade === "GOLD") {
    score += 50;
    matchedRules.push("GOLD 고객");
  }

  // 2. 구매 금액 점수
  if (totalPurchase >= 10000000) {
    score += 80;
    matchedRules.push("1천만원 이상 구매");
  } else if (totalPurchase >= 1000000) {
    score += 50;
    matchedRules.push("100만원 이상 구매");
  } else if (totalPurchase >= 500000) {
    score += 30;
    matchedRules.push("50만원 이상 구매");
  }

  // 3. 긴급 키워드 점수
  if (messageContent) {
    const urgentCount = URGENT_KEYWORDS.filter(kw => 
      messageContent.includes(kw)
    ).length;
    if (urgentCount >= 3) {
      score += 70;
      matchedRules.push("다중 긴급 키워드");
    } else if (urgentCount >= 1) {
      score += 40;
      matchedRules.push("긴급 키워드 감지");
    }
  }

  // 4. 감정 분석 점수
  if (sentiment === "negative") {
    score += 30;
    matchedRules.push("부정적 감정");
  } else if (sentiment === "very_negative") {
    score += 60;
    matchedRules.push("매우 부정적 감정");
  }

  // 5. 대기 시간 점수 (오래 기다릴수록 높음)
  if (waitingMinutes >= 30) {
    score += 40;
    matchedRules.push("장시간 대기");
  } else if (waitingMinutes >= 15) {
    score += 20;
    matchedRules.push("대기 시간 초과");
  }

  // 우선순위 결정
  let priority: PriorityLevel;
  if (score >= 100) {
    priority = "CRITICAL";
  } else if (score >= 60) {
    priority = "HIGH";
  } else if (score >= 30) {
    priority = "MEDIUM";
  } else {
    priority = "LOW";
  }

  return { priority, score, matchedRules };
}

// SLA 상태 계산
function calculateSlaStatus(
  createdAt: Date,
  priority: PriorityLevel,
  isResolved: boolean
): { slaDeadline: Date; slaStatus: "on_track" | "warning" | "breached" } {
  const slaMintues: Record<PriorityLevel, number> = {
    CRITICAL: 5,
    HIGH: 15,
    MEDIUM: 30,
    LOW: 60,
  };

  const deadline = new Date(createdAt);
  deadline.setMinutes(deadline.getMinutes() + slaMintues[priority]);

  const now = new Date();
  const remainingMinutes = (deadline.getTime() - now.getTime()) / 60000;

  let slaStatus: "on_track" | "warning" | "breached";
  if (isResolved || remainingMinutes > slaMintues[priority] * 0.3) {
    slaStatus = "on_track";
  } else if (remainingMinutes > 0) {
    slaStatus = "warning";
  } else {
    slaStatus = "breached";
  }

  return { slaDeadline: deadline, slaStatus };
}

/**
 * 우선순위별 세션 목록 조회
 */
export async function getPrioritizedSessions(): Promise<PrioritizedSession[]> {
  const sessions = await prisma.chatSession.findMany({
    where: {
      status: { in: ["ACTIVE", "ESCALATED", "ASSIGNED"] },
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      customer: {
        select: {
          id: true,
          name: true,
          grade: true,
          totalPurchaseAmount: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();

  return sessions.map((session) => {
    const waitingMinutes = Math.floor(
      (now.getTime() - session.createdAt.getTime()) / 60000
    );

    const lastMessage = session.messages[0]?.content || null;
    const allMessages = session.messages.map(m => m.content).join(" ");

    const { priority, score, matchedRules } = calculatePriorityScore(
      session.customer?.grade || null,
      session.customer?.totalPurchaseAmount || 0,
      allMessages,
      null, // sentiment - 추후 AI 분석 연동
      waitingMinutes
    );

    const { slaDeadline, slaStatus } = calculateSlaStatus(
      session.createdAt,
      priority,
      session.status === "CLOSED"
    );

    return {
      id: session.id,
      phone: session.phone,
      customerName: session.customerName || session.customer?.name || null,
      customerGrade: session.customer?.grade || null,
      totalPurchase: session.customer?.totalPurchaseAmount || 0,
      priority,
      priorityScore: score,
      slaDeadline,
      slaStatus,
      waitingMinutes,
      escalateReason: session.escalateReason,
      lastMessage,
      category: session.category || null,
      sentiment: null,
      createdAt: session.createdAt,
      matchedRules,
    };
  }).sort((a, b) => {
    // 우선순위 순서: CRITICAL > HIGH > MEDIUM > LOW
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // 같은 우선순위면 점수 높은 순
    return b.priorityScore - a.priorityScore;
  });
}

/**
 * 우선순위 통계 조회
 */
export async function getPriorityStats(): Promise<PriorityStats> {
  const sessions = await getPrioritizedSessions();

  const stats: PriorityStats = {
    critical: sessions.filter(s => s.priority === "CRITICAL").length,
    high: sessions.filter(s => s.priority === "HIGH").length,
    medium: sessions.filter(s => s.priority === "MEDIUM").length,
    low: sessions.filter(s => s.priority === "LOW").length,
    slaBreached: sessions.filter(s => s.slaStatus === "breached").length,
    slaWarning: sessions.filter(s => s.slaStatus === "warning").length,
    avgResponseTime: 0,
    todayResolved: 0,
  };

  // 오늘 완료된 세션 수
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayResolved = await prisma.chatSession.count({
    where: {
      status: "CLOSED",
      endedAt: { gte: today },
    },
  });
  stats.todayResolved = todayResolved;

  // 평균 응답 시간 계산
  const closedSessions = await prisma.chatSession.findMany({
    where: {
      status: "CLOSED",
      endedAt: { gte: today },
      assignedAt: { not: null },
    },
    select: {
      createdAt: true,
      assignedAt: true,
    },
  });

  if (closedSessions.length > 0) {
    const totalTime = closedSessions.reduce((sum, s) => {
      if (s.assignedAt) {
        return sum + (s.assignedAt.getTime() - s.createdAt.getTime());
      }
      return sum;
    }, 0);
    stats.avgResponseTime = Math.round(totalTime / closedSessions.length / 60000);
  }

  return stats;
}

/**
 * 세션 우선순위 수동 변경
 */
export async function updateSessionPriority(
  sessionId: string,
  priority: number // 0: 일반, 1: 높음, 2: 긴급
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { priority },
    });

    revalidatePath("/dashboard/chat/priority");
    return { success: true, message: "우선순위가 변경되었습니다." };
  } catch (error) {
    console.error("[Priority] Update error:", error);
    return { success: false, message: "우선순위 변경 중 오류가 발생했습니다." };
  }
}

/**
 * 긴급 에스컬레이션
 */
export async function escalateUrgent(
  sessionId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        priority: 2,
        isEscalated: true,
        escalatedAt: new Date(),
        escalateReason: reason,
        status: "ESCALATED",
      },
    });

    // 시스템 메시지 추가
    await prisma.chatMessage.create({
      data: {
        sessionId,
        senderType: "SYSTEM",
        content: `[긴급 에스쾌레이션] ${reason}`,
      },
    });

    revalidatePath("/dashboard/chat/priority");
    revalidatePath("/dashboard/chat/assign");

    return { success: true, message: "긴급 에스컬레이션이 완료되었습니다." };
  } catch (error) {
    console.error("[Priority] Escalate error:", error);
    return { success: false, message: "에스컬레이션 중 오류가 발생했습니다." };
  }
}

/**
 * SLA 위반 세션 조회
 */
export async function getSlaBreachedSessions(): Promise<PrioritizedSession[]> {
  const sessions = await getPrioritizedSessions();
  return sessions.filter(s => s.slaStatus === "breached" || s.slaStatus === "warning");
}

/**
 * 우선순위 규칙 목록 조회 (UI용 기본값)
 */
export async function getPriorityRules(): Promise<Omit<PriorityRule, "id" | "createdAt">[]> {
  return DEFAULT_RULES;
}
