import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type AdminProductBody = {
  sku: string;
  name: string;
  description?: string | null;
  price: number;
  stock?: number;
  category?: string | null;
};

function toSafeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function toSafeInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

function toSafeNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

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
  if (anyValue && typeof anyValue.toNumber === "function") return anyValue.toNumber();
  if (anyValue && typeof anyValue.toString === "function") {
    const parsed = Number(anyValue.toString());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<AdminProductBody>;

    const sku = toSafeString(body.sku);
    const name = toSafeString(body.name);
    const description = body.description ? toSafeString(body.description) : null;
    const category = body.category ? toSafeString(body.category) : null;

    const price = toSafeNumber(body.price, NaN);
    const stock = Math.max(0, toSafeInt(body.stock, 0));

    if (!sku) return NextResponse.json({ error: "sku is required" }, { status: 400 });
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "price must be a non-negative number" }, { status: 400 });
    }

    const product = await prisma.product.upsert({
      where: { sku },
      update: {
        name,
        description,
        price,
        stock,
        category,
      },
      create: {
        sku,
        name,
        description,
        price,
        stock,
        category,
      },
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

    return NextResponse.json(
      {
        id: product.id,
        name: product.name,
        description: product.description,
        price: decimalToNumber(product.price) ?? 0,
        sku: product.sku,
        stock: product.stock,
        category: product.category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[store/admin/products] Failed to upsert product:", error);
    return NextResponse.json({ error: "Failed to upsert product" }, { status: 500 });
  }
}
