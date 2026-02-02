import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 특정 리뷰 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Failed to fetch review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

// PUT: 리뷰 수정 (알림 상태 업데이트 등)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 기존 리뷰 조회
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // 리뷰 업데이트 - alertStatus와 alertNote는 topics 필드에 JSON으로 저장
    // (실제로는 스키마를 확장하는 것이 좋지만, 기존 스키마 활용)
    let updatedTopics = existingReview.topics || "";
    
    if (body.alertStatus || body.alertNote) {
      // topics 필드에 알림 정보 저장 (JSON 형태로)
      try {
        const topicsData = existingReview.topics ? JSON.parse(existingReview.topics) : {};
        if (typeof topicsData === "object" && !Array.isArray(topicsData)) {
          topicsData.alertStatus = body.alertStatus || topicsData.alertStatus;
          topicsData.alertNote = body.alertNote || topicsData.alertNote;
          updatedTopics = JSON.stringify(topicsData);
        } else {
          // topics가 문자열이면 새 객체로 변환
          updatedTopics = JSON.stringify({
            originalTopics: existingReview.topics,
            alertStatus: body.alertStatus,
            alertNote: body.alertNote,
          });
        }
      } catch {
        updatedTopics = JSON.stringify({
          originalTopics: existingReview.topics,
          alertStatus: body.alertStatus,
          alertNote: body.alertNote,
        });
      }
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(body.source && { source: body.source }),
        ...(body.author && { author: body.author }),
        ...(body.content && { content: body.content }),
        ...(body.rating !== undefined && { rating: body.rating }),
        ...(body.date && { date: new Date(body.date) }),
        ...(body.sentiment && { sentiment: body.sentiment }),
        topics: updatedTopics,
        ...(body.option && { option: body.option }),
        ...(body.images && { images: body.images }),
        ...(body.productUrl && { productUrl: body.productUrl }),
      },
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

// DELETE: 리뷰 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Failed to delete review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
