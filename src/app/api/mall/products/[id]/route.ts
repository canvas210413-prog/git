import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 상품 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.mallProduct.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 조회수 증가
    await prisma.mallProduct.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // 데이터 가공
    const formattedProduct = {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      options: product.options ? JSON.parse(product.options) : null,
      discountRate: product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0,
      reviews: product.reviews.map((review) => ({
        ...review,
        images: review.images ? JSON.parse(review.images) : [],
      })),
    };

    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      { error: "상품 정보를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
