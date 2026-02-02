"use server";

import { prisma } from "@/lib/prisma";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
// import { crawlNaverReviews } from "@/lib/crawler"; // Removed as we use Python script now

const execAsync = promisify(exec);

export interface CrawledQnA {
  status: string;
  title: string;
  author: string;
  date: string;
  answer: string;
  isSecret: boolean;
}

/**
 * Python 크롤러를 실행하여 네이버 Q&A 데이터 가져오기
 */
async function executeCrawler(productUrl: string): Promise<CrawledQnA[]> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'naver_crawler_simple.py');
  const pythonPath = 'C:/Python312/python.exe';
  
  const command = `& "${pythonPath}" "${scriptPath}" "${productUrl}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 90000,
      maxBuffer: 1024 * 1024 * 10,
      shell: 'powershell.exe',
      encoding: 'utf8',
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      },
    });

    if (stderr && !stderr.includes('DevTools')) {
      console.error('Python stderr:', stderr);
    }

    const result = JSON.parse(stdout);

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  } catch (error: any) {
    console.error('크롤링 실행 오류:', error);
    throw new Error(error.message || '크롤링 중 오류가 발생했습니다.');
  }
}

/**
 * 네이버 Q&A 크롤링 및 DB 저장 (Server Action)
 */
export async function crawlAndSyncNaverQnA(productUrl: string) {
  try {
    // 1. Python 크롤러 실행
    const crawledData = await executeCrawler(productUrl);
    
    // 2. DB에 저장 (중복 체크: 제목 + 작성자 + 작성일)
    const newTickets: any[] = [];
    const skippedCount = { duplicate: 0, total: crawledData.length };

    for (const qna of crawledData) {
      // 중복 체크: 제목, 작성자, 작성일이 모두 같으면 스킵
      const existingTicket = await prisma.ticket.findFirst({
        where: {
          subject: qna.title,
          customer: {
            name: qna.author,
          },
          description: {
            contains: qna.date, // 작성일이 description에 포함되어 있는지 확인
          },
        },
      });

      if (existingTicket) {
        skippedCount.duplicate++;
        continue; // 중복이면 건너뛰기
      }

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

      // 상태 결정
      const ticketStatus = qna.status.includes("답변완료") ? "RESOLVED" : "OPEN";
      const priority = ticketStatus === "OPEN" ? "HIGH" : "LOW";

      // 티켓 생성
      const ticket = await prisma.ticket.create({
        data: {
          subject: qna.title,
          description: `[네이버 Q&A - ${qna.date}]\n\n${qna.answer || '답변 없음'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n작성자: ${qna.author}\n작성일: ${qna.date}\n상태: ${qna.status}${qna.isSecret ? '\n[비밀글]' : ''}`,
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
    console.error("Failed to crawl and sync:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 모든 네이버 Q&A 티켓 삭제 (Server Action)
 */
export async function deleteAllNaverTickets() {
  try {
    // "[네이버 Q&A -"로 시작하는 description을 가진 티켓 모두 삭제
    const result = await prisma.ticket.deleteMany({
      where: {
        description: {
          startsWith: "[네이버 Q&A -",
        },
      },
    });

    return { success: true, count: result.count };
  } catch (error) {
    console.error("Failed to delete Naver tickets:", error);
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

/**
 * Python 리뷰 크롤러를 실행하여 네이버 리뷰 데이터 가져오기 (DrissionPage 버전)
 */
async function executeReviewCrawler(productUrl: string): Promise<any[]> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'naver_review_drission.py');
  const pythonPath = 'C:/Python312/python.exe';
  
  // DrissionPage 크롤러 실행 (3페이지 제한)
  const command = `& "${pythonPath}" "${scriptPath}" "${productUrl}" --pages 3`;
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 180000, // 3분 타임아웃 (DrissionPage는 더 오래 걸릴 수 있음)
      maxBuffer: 1024 * 1024 * 10,
      shell: 'powershell.exe',
      encoding: 'utf8',
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      },
    });

    if (stderr && !stderr.includes('DevTools')) {
      console.error('Python stderr:', stderr);
    }

    const result = JSON.parse(stdout);

    if (!result.success) {
      throw new Error(result.error || '크롤링 실패');
    }

    return result.reviews || [];
  } catch (error: any) {
    console.error('리뷰 크롤링 실행 오류:', error);
    throw new Error(error.message || '리뷰 크롤링 중 오류가 발생했습니다.');
  }
}

/**
 * 네이버 리뷰 크롤링 및 DB 저장 (Server Action) - DrissionPage 버전
 */
export async function crawlAndSyncNaverReviews(productUrl: string) {
  try {
    // 1. Python 크롤러 실행 (DrissionPage)
    const reviews = await executeReviewCrawler(productUrl);
    
    // 2. DB에 저장 (naverReviewId 기준 중복 체크)
    const newTickets: any[] = [];
    const skippedCount = { duplicate: 0, total: reviews.length };

    for (const review of reviews) {
      // naverReviewId (리뷰 고유 ID)로 중복 체크
      const naverReviewId = review.id || '';
      
      // 중복 체크: naverReviewId가 있으면 해당 ID로, 없으면 내용으로 체크
      const existingTicket = await prisma.ticket.findFirst({
        where: {
          OR: [
            { description: { contains: `원문 ID: ${naverReviewId}` } },
            naverReviewId ? { description: { contains: naverReviewId } } : {},
          ].filter(c => Object.keys(c).length > 0),
        },
      });

      if (existingTicket) {
        skippedCount.duplicate++;
        continue;
      }

      // 제목 생성: 평점과 내용 일부
      const contentPreview = review.content ? review.content.substring(0, 30) : '내용 없음';
      const subject = `[리뷰] ${review.rating || 5}점 - ${contentPreview}${review.content && review.content.length > 30 ? '...' : ''}`;
      
      // 고객 찾기 또는 생성
      const authorName = review.author || '익명';
      let customer = await prisma.customer.findFirst({
        where: { name: authorName },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: authorName,
            email: `${authorName.replace(/[^a-zA-Z0-9]/g, "")}@naver.com`,
            status: "ACTIVE",
          },
        });
      }

      // 상태 및 우선순위 결정 (평점 기준)
      const rating = review.rating || 5;
      let priority = "LOW";
      let status = "RESOLVED";
      
      if (rating <= 2) {
        priority = "HIGH";
        status = "OPEN";
      } else if (rating === 3) {
        priority = "MEDIUM";
        status = "OPEN";
      }

      // 이미지 정보
      const imagesText = review.images && review.images.length > 0 
        ? `\n\n[이미지]\n${review.images.slice(0, 5).join('\n')}${review.images.length > 5 ? `\n... 외 ${review.images.length - 5}개` : ''}` 
        : '';
      
      // 옵션 정보
      const optionText = review.option ? `\n옵션: ${review.option}` : '';

      // 날짜 정보 정리
      const dateStr = review.date || '날짜 없음';

      // 티켓 생성
      const ticket = await prisma.ticket.create({
        data: {
          subject: subject,
          description: `[네이버 리뷰 - ${dateStr}]\n\n평점: ${rating}점${optionText}\n내용: ${review.content || '내용 없음'}${imagesText}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n작성자: ${authorName}\n작성일: ${dateStr}\n원문 ID: ${naverReviewId}`,
          status: status,
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
    console.error("Failed to crawl and sync reviews:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 모든 네이버 리뷰 티켓 삭제 (Server Action)
 */
export async function deleteAllNaverReviews() {
  try {
    const result = await prisma.ticket.deleteMany({
      where: {
        description: {
          startsWith: "[네이버 리뷰 -",
        },
      },
    });

    return { success: true, count: result.count };
  } catch (error) {
    console.error("Failed to delete Naver reviews:", error);
    return { success: false, error: String(error) };
  }
}
