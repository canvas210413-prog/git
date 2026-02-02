"use server";

import { prisma } from "@/lib/prisma";

export interface MallQnAItem {
  id: number;
  title: string;
  content: string;
  status: string;
  category: string | null;
  answer: string | null;
  userId: number | null;
  productId: number | null;
  createdAt: string;
  user: { name: string; email: string } | null;
  product: { name: string } | null;
}

/**
 * 자사몰 Q&A API에서 데이터 가져오기
 */
async function fetchMallQnA(mallUrl: string): Promise<MallQnAItem[]> {
  const apiUrl = `${mallUrl}/api/qna?limit=100`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`자사몰 API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    return data.questions || [];
  } catch (error: any) {
    console.error('자사몰 Q&A 조회 오류:', error);
    throw new Error(error.message || '자사몰 Q&A 조회 중 오류가 발생했습니다.');
  }
}

/**
 * 자사몰 Q&A 크롤링 및 DB 저장 (Server Action)
 */
export async function crawlMallQnA(mallUrl: string) {
  try {
    // 1. 자사몰 Q&A API 호출
    const qnaList = await fetchMallQnA(mallUrl);
    
    // 2. DB에 저장 (중복 체크)
    const newTickets: any[] = [];
    const skippedCount = { duplicate: 0, total: qnaList.length };

    for (const qna of qnaList) {
      // 중복 체크: mallQnaId가 동일하면 스킵
      const existingTicket = await prisma.ticket.findFirst({
        where: {
          description: {
            contains: `[자사몰 Q&A #${qna.id}]`,
          },
        },
      });

      if (existingTicket) {
        skippedCount.duplicate++;
        continue;
      }

      // 고객 찾기 또는 생성
      const authorName = qna.user?.name || '비회원';
      const authorEmail = qna.user?.email || `guest_${qna.id}@mall.com`;

      let customer = await prisma.customer.findFirst({
        where: { email: authorEmail },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: authorName,
            email: authorEmail,
            status: "ACTIVE",
          },
        });
      }

      // 상태 결정
      const hasAnswer = qna.status === 'answered' || (qna.answer && qna.answer.trim().length > 0);
      const ticketStatus = hasAnswer ? "RESOLVED" : "OPEN";
      const priority = ticketStatus === "OPEN" ? "HIGH" : "LOW";

      // 카테고리 한글 변환
      const categoryMap: Record<string, string> = {
        'shipping': '배송',
        'product': '상품',
        'return': '교환/반품',
        'payment': '결제',
        'other': '기타',
      };
      const categoryName = qna.category ? (categoryMap[qna.category] || qna.category) : '기타';

      // 티켓 생성
      const ticket = await prisma.ticket.create({
        data: {
          subject: qna.title,
          description: `[자사몰 Q&A #${qna.id}]\n\n📝 문의내용:\n${qna.content}\n\n${qna.answer ? `💬 답변:\n${qna.answer}\n\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n카테고리: ${categoryName}\n작성자: ${authorName}\n작성일: ${new Date(qna.createdAt).toLocaleDateString('ko-KR')}\n상태: ${hasAnswer ? '답변완료' : '답변대기'}${qna.product ? `\n관련상품: ${qna.product.name}` : ''}`,
          status: ticketStatus,
          priority: priority,
          customerId: customer.id,
        },
      });

      newTickets.push(ticket);
    }

    return { 
      success: true, 
      newTickets: newTickets.length,
      skipped: skippedCount.duplicate,
      total: skippedCount.total,
    };
  } catch (error: any) {
    console.error("자사몰 Q&A 크롤링 실패:", error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * 자사몰 Q&A에서 가져온 티켓 전체 삭제
 */
export async function deleteAllMallQnATickets() {
  try {
    // 자사몰 Q&A에서 가져온 티켓만 삭제 (description에 [자사몰 Q&A] 포함된 것)
    const result = await prisma.ticket.deleteMany({
      where: {
        description: {
          contains: "[자사몰 Q&A",
        },
      },
    });

    return { success: true, count: result.count };
  } catch (error: any) {
    console.error("자사몰 Q&A 티켓 삭제 실패:", error);
    return { success: false, error: error.message || String(error) };
  }
}
