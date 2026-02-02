import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 상품 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const featured = searchParams.get("featured");
    const search = searchParams.get("search");

    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const orderBy: any = {};
    if (sort === "price") {
      orderBy.price = order;
    } else if (sort === "rating") {
      orderBy.rating = order;
    } else if (sort === "soldCount") {
      orderBy.soldCount = order;
    } else {
      orderBy.createdAt = order;
    }

    const [products, total] = await Promise.all([
      prisma.mallProduct.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.mallProduct.count({ where }),
    ]);

    // 이미지 URL 파싱 및 할인율 계산
    const formattedProducts = products.map((product) => {
      let images = [];
      try {
        if (product.images) {
          images = typeof product.images === 'string' 
            ? JSON.parse(product.images) 
            : product.images;
        }
      } catch (e) {
        images = [];
      }

      const discountRate = product.originalPrice && Number(product.originalPrice) > 0
        ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
        : 0;

      return {
        ...product,
        price: Number(product.price),
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        rating: product.rating ? Number(product.rating) : null,
        images,
        discountRate,
      };
    });

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "상품 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
