import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: 티켓(크롤링된 리뷰)을 Review 테이블로 동기화
export async function POST(request: NextRequest) {
  try {
    // 리뷰 카테고리 티켓만 가져오기 (description에 "리뷰" 또는 "네이버" 포함)
    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { category: "review" },
          { description: { contains: "리뷰" } },
          { description: { contains: "네이버" } },
          { subject: { contains: "점]" } }, // 별점을 포함한 제목
        ],
      },
      include: {
        customer: true,
      },
    });

    let syncedCount = 0;
    let skippedCount = 0;

    for (const ticket of tickets) {
      // 제목에서 별점 추출 (예: "[5점] 좋아요" 또는 "5점 - 좋아요")
      const ratingMatch = ticket.subject.match(/(\d)점/);
      const rating = ratingMatch ? parseInt(ratingMatch[1]) : 3;

      // description에서 날짜 추출
      const dateMatch = ticket.description?.match(/(\d{4})\.(\d{2})\.(\d{2})/);
      const reviewDate = dateMatch
        ? new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`)
        : ticket.createdAt;

      // description에서 실제 리뷰 내용 추출
      let reviewContent = ticket.description || "";
      // [네이버 리뷰 - 날짜] 형식 제거
      reviewContent = reviewContent.replace(/\[네이버\s*(리뷰|Q&A)\s*-\s*\d{4}\.\d{2}\.\d{2}\.\]/g, "").trim();
      // 옵션 정보 추출 및 제거
      const optionMatch = reviewContent.match(/옵션:\s*([^\n]+)/);
      const option = optionMatch ? optionMatch[1].trim() : null;
      reviewContent = reviewContent.replace(/옵션:\s*[^\n]+\n?/g, "").trim();

      // 중복 체크 (같은 내용, 같은 작성자, 같은 날짜)
      const existingReview = await prisma.review.findFirst({
        where: {
          author: ticket.customer?.name || "익명",
          content: reviewContent.substring(0, 100), // 앞 100자로 비교
          date: {
            gte: new Date(reviewDate.getTime() - 86400000), // 하루 오차 허용
            lte: new Date(reviewDate.getTime() + 86400000),
          },
        },
      });

      if (existingReview) {
        skippedCount++;
        continue;
      }

      // naverReviewId 중복 체크
      const naverReviewId = `ticket-${ticket.id}`;
      const existingByNaverId = await prisma.review.findFirst({
        where: { naverReviewId },
      });

      if (existingByNaverId) {
        skippedCount++;
        continue;
      }

      // 감성 분석 (간단 버전)
      const sentiment = analyzeSentiment(reviewContent, rating);

      // 토픽 추출
      const topics = extractTopics(reviewContent);

      // Review 생성
      await prisma.review.create({
        data: {
          source: "Naver SmartStore",
          author: ticket.customer?.name || "익명",
          content: reviewContent,
          rating: rating,
          date: reviewDate,
          sentiment: sentiment,
          topics: topics.join(", "),
          option: option,
          naverReviewId: naverReviewId,
        },
      });

      syncedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `${syncedCount}건 동기화 완료, ${skippedCount}건 중복 스킵`,
      synced: syncedCount,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error("Failed to sync reviews:", error);
    return NextResponse.json(
      { error: "Failed to sync reviews", details: String(error) },
      { status: 500 }
    );
  }
}

// 감성 분석
function analyzeSentiment(content: string, rating: number): string {
  if (rating >= 4) return "Positive";
  if (rating <= 2) return "Negative";

  const positiveWords = ["좋", "만족", "추천", "최고", "굿", "잘", "빠른", "친절", "깔끔", "예쁜"];
  const negativeWords = ["불만", "별로", "실망", "불친", "불편", "느린", "최악", "후회"];

  const positiveCount = positiveWords.filter(w => content.includes(w)).length;
  const negativeCount = negativeWords.filter(w => content.includes(w)).length;

  if (positiveCount > negativeCount) return "Positive";
  if (negativeCount > positiveCount) return "Negative";
  return "Neutral";
}

// 토픽 추출
function extractTopics(content: string): string[] {
  const topicKeywords: Record<string, string[]> = {
    "품질": ["품질", "퀄리티", "마감", "튼튼", "견고", "내구성"],
    "배송": ["배송", "도착", "빠른", "느린", "배달"],
    "가격": ["가격", "가성비", "비싼", "저렴", "할인", "쿠폰"],
    "디자인": ["디자인", "색상", "예쁜", "이쁜", "모양", "깔끔"],
    "사용감": ["사용", "편리", "불편", "사용감", "착용감"],
    "소음": ["소음", "시끄러운", "조용", "소리"],
    "크기": ["크기", "사이즈", "큰", "작은", "딱맞"],
    "고객서비스": ["고객센터", "응대", "친절", "답변", "문의"],
  };

  const detected: string[] = [];
  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(k => content.includes(k))) {
      detected.push(topic);
    }
  });

  return detected;
}

// GET: 동기화 상태 확인
export async function GET() {
  try {
    const reviewCount = await prisma.review.count();
    const ticketCount = await prisma.ticket.count({
      where: {
        OR: [
          { category: "review" },
          { description: { contains: "리뷰" } },
          { description: { contains: "네이버" } },
        ],
      },
    });

    return NextResponse.json({
      reviewCount,
      ticketCount,
      lastSync: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to get sync status:", error);
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    );
  }
}
