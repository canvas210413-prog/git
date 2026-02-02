"use server";

import { prisma } from "@/lib/prisma";

export interface CrawledQnA {
  status: string;
  title: string;
  author: string;
  date: string;
  answer: string;
  isSecret: boolean;
}

/**
 * 크롤링된 데이터를 DB Ticket으로 변환
 * @param crawledData Python 크롤러로부터 받은 데이터
 */
export async function syncCrawledDataToTickets(crawledData: CrawledQnA[]) {
  try {
    const newTickets: any[] = [];

    for (const qna of crawledData) {
      // DB에 이미 존재하는지 확인 (제목과 작성자로 중복 체크)
      const existingTicket = await prisma.ticket.findFirst({
        where: {
          subject: qna.title,
          customer: {
            name: qna.author,
          },
        },
      });

      if (!existingTicket) {
        // 고객 찾기 또는 생성
        let customer = await prisma.customer.findFirst({
          where: { name: qna.author },
        });

        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              name: qna.author,
              email: `${qna.author.replace(/\s/g, "")}@naver.com`,
              status: "ACTIVE",
            },
          });
        }

        // 상태 결정: 답변 완료면 RESOLVED, 아니면 OPEN
        const ticketStatus = qna.status.includes("답변완료") ? "RESOLVED" : "OPEN";
        
        // 우선순위: 답변 대기 중이면 HIGH, 완료면 LOW
        const priority = ticketStatus === "OPEN" ? "HIGH" : "LOW";

        // 티켓 생성 (비밀글 포함)
        const ticket = await prisma.ticket.create({
          data: {
            subject: qna.title,
            description: qna.answer || `네이버 스마트스토어 Q&A\n작성일: ${qna.date}\n상태: ${qna.status}${qna.isSecret ? '\n[비밀글]' : ''}`,
            status: ticketStatus,
            priority: priority,
            customerId: customer.id,
          },
        });

        newTickets.push(ticket);
      }
    }

    return { success: true, newTickets: newTickets.length };
  } catch (error) {
    console.error("Failed to sync crawled data:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Mock 데이터 생성 (테스트용)
 */
export async function createMockNaverTickets() {
  try {
    const mockQnA = [
      {
        question: "배송은 언제쯤 도착하나요?",
        customerName: "김철수",
        priority: "HIGH" as const,
      },
      {
        question: "사이즈 교환 가능한가요?",
        customerName: "이영희",
        priority: "MEDIUM" as const,
      },
      {
        question: "색상이 실제와 다른가요?",
        customerName: "박지민",
        priority: "LOW" as const,
      },
    ];

    const createdTickets = [];

    for (const qna of mockQnA) {
      let customer = await prisma.customer.findFirst({
        where: { name: qna.customerName },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: qna.customerName,
            email: `${qna.customerName.replace(/\s/g, "")}@naver.com`,
            status: "ACTIVE",
          },
        });
      }

      const ticket = await prisma.ticket.create({
        data: {
          subject: qna.question,
          description: "네이버 스마트스토어 Q&A",
          status: "OPEN",
          priority: qna.priority,
          customerId: customer.id,
        },
      });

      createdTickets.push(ticket);
    }

    return { success: true, count: createdTickets.length };
  } catch (error) {
    console.error("Failed to create mock tickets:", error);
    return { success: false, error: String(error) };
  }
}
