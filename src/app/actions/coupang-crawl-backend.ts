"use server";

import { prisma } from "@/lib/prisma";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export interface CoupangReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  seller: string;
  option: string;
  title: string;
  content: string;
  images: string[];
  helpful_count: number;
  attributes: Record<string, string>;
}

/**
 * Python 크롤러로 HTML 파싱 실행
 */
async function executePythonHtmlParser(htmlContent: string): Promise<CoupangReview[]> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'coupang_review_crawler.py');
  const pythonPath = process.env.PYTHON_PATH || 'C:/Users/iyulab/AppData/Local/Programs/Python/Python312/python.exe';
  
  // HTML을 임시 파일로 저장
  const tempFile = path.join(tmpdir(), `coupang_html_${Date.now()}.html`);
  writeFileSync(tempFile, htmlContent, 'utf-8');
  
  try {
    const command = `Get-Content -Path "${tempFile}" -Encoding UTF8 | & "${pythonPath}" "${scriptPath}" "--html"`;
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000,
      maxBuffer: 1024 * 1024 * 10,
      shell: 'powershell.exe',
      encoding: 'utf8',
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      },
    });

    if (stderr && !stderr.includes('[INFO]') && !stderr.includes('[WARN]')) {
      console.error('Python stderr:', stderr);
    }
    
    // stdout에서 JSON 부분만 추출 (마지막 줄)
    const lines = stdout.trim().split('\n');
    const jsonLine = lines[lines.length - 1];
    const result = JSON.parse(jsonLine);

    if (result.error) {
      throw new Error(result.error);
    }

    return result.reviews || [];
  } finally {
    // 임시 파일 삭제
    try {
      unlinkSync(tempFile);
    } catch {}
  }
}

/**
 * HTML에서 쿠팡 리뷰 파싱 및 DB 저장 (Server Action)
 * Python 파서를 사용하여 HTML에서 리뷰 추출
 */
export async function parseCoupangHtmlAndSync(htmlContent: string) {
  try {
    // 1. Python 파서로 HTML에서 리뷰 추출
    const reviews = await executePythonHtmlParser(htmlContent);
    
    // 2. DB에 저장 (중복 체크)
    const newTickets: any[] = [];
    const skippedCount = { duplicate: 0, total: reviews.length };

    for (const review of reviews) {
      const coupangReviewId = review.id || '';
      
      // 중복 체크
      const existingTicket = await prisma.ticket.findFirst({
        where: {
          description: { contains: coupangReviewId ? coupangReviewId : `[쿠팡 리뷰 -` },
        },
      });

      if (existingTicket) {
        skippedCount.duplicate++;
        continue;
      }

      // 제목 생성
      const contentPreview = review.title || (review.content ? review.content.substring(0, 30) : '내용 없음');
      const subject = `[쿠팡 리뷰] ${review.rating || 5}점 - ${contentPreview}${!review.title && review.content && review.content.length > 30 ? '...' : ''}`;
      
      // 고객 찾기 또는 생성
      const authorName = review.author || '익명';
      let customer = await prisma.customer.findFirst({
        where: { name: authorName },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: authorName,
            email: `${authorName.replace(/[^a-zA-Z0-9가-힣]/g, "")}@coupang.com`,
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
      const sellerText = review.seller ? `\n판매자: ${review.seller}` : '';
      
      // 속성 평가 정보
      let attributesText = '';
      if (review.attributes && Object.keys(review.attributes).length > 0) {
        attributesText = '\n\n[상품 평가]\n' + 
          Object.entries(review.attributes)
            .map(([key, value]) => `• ${key}: ${value}`)
            .join('\n');
      }
      
      const helpfulText = review.helpful_count > 0 ? `\n도움됨: ${review.helpful_count}명` : '';
      const dateStr = review.date || '날짜 없음';

      // 티켓 생성
      const ticket = await prisma.ticket.create({
        data: {
          subject: subject,
          description: `[쿠팡 리뷰 - ${dateStr}]\n\n평점: ${rating}점${optionText}${sellerText}\n\n${review.title ? `제목: ${review.title}\n\n` : ''}내용: ${review.content || '내용 없음'}${attributesText}${imagesText}${helpfulText}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n작성자: ${authorName}\n작성일: ${dateStr}\n원문 ID: ${coupangReviewId}`,
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
    console.error("Failed to parse and sync Coupang HTML:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 모든 쿠팡 리뷰 티켓 삭제 (Server Action)
 */
export async function deleteAllCoupangReviews() {
  try {
    const result = await prisma.ticket.deleteMany({
      where: {
        description: {
          startsWith: "[쿠팡 리뷰 -",
        },
      },
    });

    return { success: true, count: result.count };
  } catch (error) {
    console.error("Failed to delete Coupang reviews:", error);
    return { success: false, error: String(error) };
  }
}
