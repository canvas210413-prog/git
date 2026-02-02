import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 상품 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (search) {
      where.name = { contains: search };
    }

    if (category && category !== "all") {
      where.category = category;
    }

    const [products, total] = await Promise.all([
      prisma.mallProduct.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.mallProduct.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "상품 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 상품 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      originalPrice,
      stock,
      category,
      images,
      isActive,
      isFeatured,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "상품명과 가격은 필수입니다." },
        { status: 400 }
      );
    }

    const product = await prisma.mallProduct.create({
      data: {
        name,
        description: description || null,
        price,
        originalPrice: originalPrice || null,
        stock: stock || 0,
        category: category || null,
        images: images || null,
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: "상품 등록에 실패했습니다." },
      { status: 500 }
    );
  }
}
