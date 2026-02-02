"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================================
// CS 담당자 상담 할당 서버 액션
// ============================================================================

export interface EscalatedSession {
  id: string;
  phone: string;
  customerName: string | null;
  customerId: string | null;
  startedAt: Date;
  escalatedAt: Date | null;
  escalateReason: string | null;
  priority: number;
  status: string;
  assignedToId: string | null;
  assignedToName: string | null;
  assignedAt: Date | null;
  endedAt: Date | null;
  lastMessage: string | null;
  messageCount: number;
  waitingTime: number; // 대기 시간 (분)
  consultTime: number; // 상담 시간 (분)
}

export interface CSAgent {
  id: string;
  name: string | null;
  email: string;
  isOnline: boolean;
  maxChats: number;
  currentChats: number;
  role: string;
}

/**
 * 이관 요청 (챗봇에서 호출)
 */
export async function escalateToAgent(
  sessionId: string,
  reason: string,
  priority: number = 0
): Promise<{ success: boolean; message: string; queuePosition?: number }> {
  try {
    // 세션 업데이트
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        isEscalated: true,
        escalatedAt: new Date(),
        escalateReason: reason,
        priority,
        status: "ESCALATED",
      },
    });

    // 대기 순번 계산
    const queuePosition = await prisma.chatSession.count({
      where: {
        isEscalated: true,
        assignedToId: null,
        status: "ESCALATED",
        escalatedAt: {
          lt: new Date(),
        },
      },
    });

    // 시스템 메시지 추가
    await prisma.chatMessage.create({
      data: {
        sessionId,
        senderType: "SYSTEM",
        content: `[상담원 연결 요청] 사유: ${reason}`,
      },
    });

    revalidatePath("/dashboard/chat/assign");

    return {
      success: true,
      message: `상담원 연결을 요청했습니다. 현재 대기 순번: ${queuePosition + 1}번`,
      queuePosition: queuePosition + 1,
    };
  } catch (error) {
    console.error("[ChatAssign] Escalate error:", error);
    return { success: false, message: "이관 요청 중 오류가 발생했습니다." };
  }
}

/**
 * 이관 대기 목록 조회 (오늘 완료된 세션 포함)
 */
export async function getEscalatedSessions(): Promise<EscalatedSession[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sessions = await prisma.chatSession.findMany({
    where: {
      isEscalated: true,
      OR: [
        { status: { in: ["ESCALATED", "ASSIGNED", "WAITING_AGENT"] } },
        {
          status: "CLOSED",
          endedAt: { gte: today },
        },
      ],
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      assignedTo: {
        select: { name: true },
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: [
      { priority: "desc" },
      { escalatedAt: "asc" },
    ],
  });

  const now = new Date();

  return sessions.map((session) => {
    // 대기 시간 계산: 예약시간 ~ 상담시작시간 또는 현재
    let waitingTime = 0;
    if (session.escalatedAt) {
      const endTime = session.assignedAt || now;
      waitingTime = Math.floor((endTime.getTime() - session.escalatedAt.getTime()) / 60000);
    }

    // 상담 시간 계산: 상담시작시간 ~ 완료시간 또는 현재
    let consultTime = 0;
    if (session.assignedAt) {
      const endTime = session.endedAt || now;
      consultTime = Math.floor((endTime.getTime() - session.assignedAt.getTime()) / 60000);
    }

    return {
      id: session.id,
      phone: session.phone,
      customerName: session.customerName,
      customerId: session.customerId,
      startedAt: session.startedAt,
      escalatedAt: session.escalatedAt,
      escalateReason: session.escalateReason,
      priority: session.priority,
      status: session.status,
      assignedToId: session.assignedToId,
      assignedToName: session.assignedTo?.name || null,
      assignedAt: session.assignedAt,
      endedAt: session.endedAt,
      lastMessage: session.messages[0]?.content || null,
      messageCount: session._count.messages,
      waitingTime,
      consultTime,
    };
  });
}

/**
 * 전체 상담 세션 조회 (모든 이관 세션)
 */
export async function getAllSessions(): Promise<EscalatedSession[]> {
  const sessions = await prisma.chatSession.findMany({
    where: {
      isEscalated: true,
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      assignedTo: {
        select: { name: true },
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: [
      { escalatedAt: "desc" },
    ],
  });

  const now = new Date();

  return sessions.map((session) => {
    // 대기 시간 계산: 예약시간 ~ 상담시작시간 또는 현재
    let waitingTime = 0;
    if (session.escalatedAt) {
      const endTime = session.assignedAt || (session.status === "CLOSED" ? session.endedAt : now);
      if (endTime) {
        waitingTime = Math.floor((endTime.getTime() - session.escalatedAt.getTime()) / 60000);
      }
    }

    // 상담 시간 계산: 상담시작시간 ~ 완료시간 또는 현재
    let consultTime = 0;
    if (session.assignedAt) {
      const endTime = session.endedAt || now;
      consultTime = Math.floor((endTime.getTime() - session.assignedAt.getTime()) / 60000);
    }

    return {
      id: session.id,
      phone: session.phone,
      customerName: session.customerName,
      customerId: session.customerId,
      startedAt: session.startedAt,
      escalatedAt: session.escalatedAt,
      escalateReason: session.escalateReason,
      priority: session.priority,
      status: session.status,
      assignedToId: session.assignedToId,
      assignedToName: session.assignedTo?.name || null,
      assignedAt: session.assignedAt,
      endedAt: session.endedAt,
      lastMessage: session.messages[0]?.content || null,
      messageCount: session._count.messages,
      waitingTime,
      consultTime,
    };
  });
}

/**
 * CS 상담원 목록 조회
 */
export async function getCSAgents(): Promise<CSAgent[]> {
  const agents = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "CS_AGENT"] },
    },
    include: {
      _count: {
        select: {
          assignedSessions: {
            where: { status: "ASSIGNED" },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    email: agent.email,
    isOnline: agent.isOnline,
    maxChats: agent.maxChats,
    currentChats: agent._count.assignedSessions,
    role: agent.role,
  }));
}

/**
 * 상담 할당 (CS 담당자에게)
 */
export async function assignSessionToAgent(
  sessionId: string,
  agentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      include: {
        _count: {
          select: {
            assignedSessions: {
              where: { status: "ASSIGNED" },
            },
          },
        },
      },
    });

    if (!agent) {
      return { success: false, message: "담당자를 찾을 수 없습니다." };
    }

    if (agent._count.assignedSessions >= agent.maxChats) {
      return { success: false, message: "해당 담당자의 상담 한도를 초과했습니다." };
    }

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        assignedToId: agentId,
        assignedAt: new Date(),
        status: "ASSIGNED",
      },
    });

    // 시스템 메시지 추가
    await prisma.chatMessage.create({
      data: {
        sessionId,
        senderType: "SYSTEM",
        content: `[상담원 연결 완료] ${agent.name || agent.email} 상담원이 배정되었습니다.`,
      },
    });

    revalidatePath("/dashboard/chat/assign");

    return {
      success: true,
      message: `${agent.name || agent.email} 상담원에게 할당되었습니다.`,
    };
  } catch (error) {
    console.error("[ChatAssign] Assign error:", error);
    return { success: false, message: "할당 중 오류가 발생했습니다." };
  }
}

/**
 * 상담 시작 (상담원 배정 없이 바로 상담중으로 변경)
 */
export async function autoAssignSession(
  sessionId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        assignedAt: new Date(),
        status: "ASSIGNED",
      },
    });

    // 시스템 메시지 추가
    await prisma.chatMessage.create({
      data: {
        sessionId,
        senderType: "SYSTEM",
        content: "[상담 시작] 상담이 시작되었습니다.",
      },
    });

    revalidatePath("/dashboard/chat/assign");

    return {
      success: true,
      message: "상담이 시작되었습니다.",
    };
  } catch (error) {
    console.error("[ChatAssign] Start session error:", error);
    return { success: false, message: "상담 시작 중 오류가 발생했습니다." };
  }
}

/**
 * 상담 완료 처리
 */
export async function completeSession(
  sessionId: string,
  summary?: string
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: "CLOSED",
        endedAt: new Date(),
        summary,
      },
    });

    revalidatePath("/dashboard/chat/assign");
    revalidatePath("/dashboard/chat/history");

    return { success: true, message: "상담이 완료 처리되었습니다." };
  } catch (error) {
    console.error("[ChatAssign] Complete error:", error);
    return { success: false, message: "완료 처리 중 오류가 발생했습니다." };
  }
}

/**
 * 상담원 온라인 상태 변경
 */
export async function setAgentOnlineStatus(
  agentId: string,
  isOnline: boolean
): Promise<{ success: boolean }> {
  try {
    await prisma.user.update({
      where: { id: agentId },
      data: { isOnline },
    });

    revalidatePath("/dashboard/chat/assign");
    return { success: true };
  } catch (error) {
    console.error("[ChatAssign] Status update error:", error);
    return { success: false };
  }
}

/**
 * 세션 메시지 조회 (실시간 채팅용)
 */
export async function getSessionMessages(sessionId: string) {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  return messages;
}

/**
 * 상담원 메시지 전송
 */
export async function sendAgentMessage(
  sessionId: string,
  content: string,
  agentId: string
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const message = await prisma.chatMessage.create({
      data: {
        sessionId,
        senderType: "AGENT",
        content,
      },
    });

    return { success: true, messageId: message.id };
  } catch (error) {
    console.error("[ChatAssign] Send message error:", error);
    return { success: false };
  }
}

/**
 * 대기열 통계 (KPI 포함)
 */
export async function getQueueStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [waiting, assigned, completedToday, timeStats] = await Promise.all([
    // 대기 중
    prisma.chatSession.count({
      where: { status: { in: ["ESCALATED", "WAITING_AGENT"] }, assignedToId: null },
    }),
    // 진행 중
    prisma.chatSession.count({
      where: { status: "ASSIGNED" },
    }),
    // 오늘 완료
    prisma.chatSession.count({
      where: {
        status: "CLOSED",
        isEscalated: true,
        endedAt: { gte: today },
      },
    }),
    // 시간 통계 계산용 데이터
    prisma.chatSession.findMany({
      where: {
        isEscalated: true,
        status: "CLOSED",
        endedAt: { gte: today },
        assignedAt: { not: null },
        escalatedAt: { not: null },
      },
      select: {
        escalatedAt: true,
        assignedAt: true,
        endedAt: true,
      },
    }),
  ]);

  // 평균 대기 시간 계산 (분)
  let avgWait = 0;
  let avgConsult = 0;
  let totalWaitTime = 0;
  let totalConsultTime = 0;

  if (timeStats.length > 0) {
    timeStats.forEach((s) => {
      if (s.escalatedAt && s.assignedAt) {
        totalWaitTime += s.assignedAt.getTime() - s.escalatedAt.getTime();
      }
      if (s.assignedAt && s.endedAt) {
        totalConsultTime += s.endedAt.getTime() - s.assignedAt.getTime();
      }
    });
    avgWait = Math.round(totalWaitTime / timeStats.length / 60000);
    avgConsult = Math.round(totalConsultTime / timeStats.length / 60000);
  }

  return {
    waiting,
    assigned,
    completedToday,
    avgWaitTime: avgWait,
    avgConsultTime: avgConsult,
    totalWaitTime: Math.round(totalWaitTime / 60000),
    totalConsultTime: Math.round(totalConsultTime / 60000),
  };
}

/**
 * 모든 상담 세션 삭제
 */
export async function deleteAllSessions(): Promise<{ success: boolean; message: string; deletedCount?: number }> {
  try {
    // 먼저 모든 관련 메시지 삭제
    await prisma.chatMessage.deleteMany({});
    
    // 그 다음 세션 삭제
    const result = await prisma.chatSession.deleteMany({});
    
    revalidatePath("/dashboard/chat/assign");
    
    return {
      success: true,
      message: "모든 세션이 삭제되었습니다.",
      deletedCount: result.count,
    };
  } catch (error) {
    console.error("[ChatAssign] Delete all sessions error:", error);
    return { success: false, message: "삭제 중 오류가 발생했습니다." };
  }
}
