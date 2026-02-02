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

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      { error: "상품 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 상품 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const product = await prisma.mallProduct.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price,
        originalPrice: originalPrice || null,
        stock: stock ?? 0,
        category: category || null,
        images: images || null,
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: "상품 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 상품 부분 수정 (활성화 상태 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const product = await prisma.mallProduct.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to patch product:", error);
    return NextResponse.json(
      { error: "상품 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 상품 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.mallProduct.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { error: "상품 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
