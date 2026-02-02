import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
