import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function decimalToNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  // Prisma Decimal (decimal.js)
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

function serializeProduct(product: {
  id: string;
  name: string;
  description: string | null;
  price: unknown;
  sku: string;
  stock: number;
  category: string | null;
}) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: decimalToNumber(product.price) ?? 0,
    sku: product.sku,
    stock: product.stock,
    category: product.category,
  };
}

// GET /api/store/products
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim();
    const all = url.searchParams.get("all") === "1";

    const products = await prisma.product.findMany({
      where: {
        ...(all ? {} : { sku: { startsWith: "KPROJ-" } }),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { sku: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json(products.map(serializeProduct));
  } catch (error) {
    console.error("[store/products] Failed to fetch products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
