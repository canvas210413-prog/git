import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 부정적 키워드 목록 (불만 감지용)
const negativeKeywords = [
  "불만", "환불", "반품", "교환", "불량", "고장", "망가", "깨진", "파손",
  "늦은", "지연", "안와", "안옴", "배송", "느림", "최악", "별로", "후회",
  "실망", "화남", "짜증", "불쾌", "사기", "가짜", "품질", "조잡", "싸구려",
  "소음", "시끄", "고객센터", "응대", "무시", "답변", "연락", "전화"
];

// 불만 리뷰 판별 함수
function detectComplaint(content: string, rating: number): boolean {
  // 1~2점은 무조건 불만
  if (rating <= 2) return true;
  
  // 3점이면서 부정적 키워드 포함
  if (rating === 3) {
    const lowerContent = content.toLowerCase();
    return negativeKeywords.some(keyword => lowerContent.includes(keyword));
  }
  
  return false;
}

// GET: 모든 리뷰 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const sentiment = searchParams.get("sentiment");
    const minRating = searchParams.get("minRating");
    const maxRating = searchParams.get("maxRating");

    const where: any = {};
    
    if (source) {
      where.source = source;
    }
    
    if (sentiment) {
      where.sentiment = sentiment;
    }
    
    if (minRating || maxRating) {
      where.rating = {};
      if (minRating) where.rating.gte = parseInt(minRating);
      if (maxRating) where.rating.lte = parseInt(maxRating);
    }

    const reviews = await prisma.review.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST: 새 리뷰 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 불만 감지
    const isAlerted = detectComplaint(body.content, body.rating);
    
    const review = await prisma.review.create({
      data: {
        source: body.source,
        author: body.author,
        content: body.content,
        rating: body.rating,
        date: body.date ? new Date(body.date) : new Date(),
        sentiment: body.sentiment,
        topics: body.topics,
        naverReviewId: body.naverReviewId,
        option: body.option,
        images: body.images,
        productUrl: body.productUrl,
        isAlerted: isAlerted,
        alertStatus: isAlerted ? "NEW" : null,
        alertNote: null,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Failed to create review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

// PATCH: 리뷰 알림 상태 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, alertStatus, alertNote, resolvedType } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      alertStatus,
      alertNote,
      resolvedType,
    };

    // RESOLVED 상태로 변경될 때 처리 완료 시간 기록
    if (alertStatus === "RESOLVED" && resolvedType) {
      updateData.resolvedAt = new Date();
    }

    const review = await prisma.review.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Failed to update review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}
