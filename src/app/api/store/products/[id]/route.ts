import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function decimalToNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyValue = value as any;
  if (anyValue && typeof anyValue.toNumber === "function") {
    return anyValue.toNumber();
  }
  if (anyValue && typeof anyValue.toString === "function") {
    const parsed = Number(anyValue.toString());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

// GET /api/store/products/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        sku: true,
        stock: true,
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...product,
      price: decimalToNumber(product.price) ?? 0,
    });
  } catch (error) {
    console.error("[store/products/:id] Failed to fetch product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
