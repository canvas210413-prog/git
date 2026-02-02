"use server";

import { prisma } from "@/lib/prisma";

export interface QnAListItem {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  source: "NAVER" | "MALL";
  qnaId: string | null;
  category: string | null;
  customer: {
    id: string;
    name: string;
    email: string;
  } | null;
}

/**
 * 네이버 Q&A 목록 조회
 */
export async function getNaverQnAList(limit: number = 50): Promise<QnAListItem[]> {
  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        description: {
          contains: "[네이버 Q&A",
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return tickets.map(ticket => {
      // Q&A ID 추출
      const qnaIdMatch = ticket.description?.match(/\[네이버 Q&A #(\d+)\]/);
      const qnaId = qnaIdMatch ? qnaIdMatch[1] : null;

      return {
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description || "",
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        source: "NAVER" as const,
        qnaId,
        category: null,
        customer: ticket.customer,
      };
    });
  } catch (error) {
    console.error("네이버 Q&A 목록 조회 실패:", error);
    return [];
  }
}

/**
 * 자사몰 Q&A 목록 조회
 */
export async function getMallQnAList(limit: number = 50): Promise<QnAListItem[]> {
  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        description: {
          contains: "[자사몰 Q&A",
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return tickets.map(ticket => {
      // Q&A ID 추출
      const qnaIdMatch = ticket.description?.match(/\[자사몰 Q&A #(\d+)\]/);
      const qnaId = qnaIdMatch ? qnaIdMatch[1] : null;

      // 카테고리 추출
      const categoryMatch = ticket.description?.match(/카테고리: ([^\n]+)/);
      const category = categoryMatch ? categoryMatch[1] : null;

      return {
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description || "",
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        source: "MALL" as const,
        qnaId,
        category,
        customer: ticket.customer,
      };
    });
  } catch (error) {
    console.error("자사몰 Q&A 목록 조회 실패:", error);
    return [];
  }
}

/**
 * 모든 Q&A 목록 조회 (네이버 + 자사몰)
 */
export async function getAllQnAList(limit: number = 100) {
  const [naverList, mallList] = await Promise.all([
    getNaverQnAList(limit),
    getMallQnAList(limit),
  ]);

  return {
    naver: naverList,
    mall: mallList,
    total: naverList.length + mallList.length,
  };
}

/**
 * Q&A 통계
 */
export async function getQnAStats() {
  try {
    const [naverTotal, naverOpen, mallTotal, mallOpen] = await Promise.all([
      prisma.ticket.count({
        where: { description: { contains: "[네이버 Q&A" } },
      }),
      prisma.ticket.count({
        where: { 
          description: { contains: "[네이버 Q&A" },
          status: "OPEN",
        },
      }),
      prisma.ticket.count({
        where: { description: { contains: "[자사몰 Q&A" } },
      }),
      prisma.ticket.count({
        where: { 
          description: { contains: "[자사몰 Q&A" },
          status: "OPEN",
        },
      }),
    ]);

    return {
      naver: { total: naverTotal, open: naverOpen, resolved: naverTotal - naverOpen },
      mall: { total: mallTotal, open: mallOpen, resolved: mallTotal - mallOpen },
      total: naverTotal + mallTotal,
      totalOpen: naverOpen + mallOpen,
    };
  } catch (error) {
    console.error("Q&A 통계 조회 실패:", error);
    return {
      naver: { total: 0, open: 0, resolved: 0 },
      mall: { total: 0, open: 0, resolved: 0 },
      total: 0,
      totalOpen: 0,
    };
  }
}
