import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyValue = value as any;
  if (anyValue && typeof anyValue.toNumber === "function") return anyValue.toNumber();
  if (anyValue && typeof anyValue.toString === "function") return Number(anyValue.toString()) || 0;
  return 0;
}

// GET /api/store/orders?email=...
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: { customer: { email } },
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: true } },
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return NextResponse.json(
      orders.map((o) => ({
        id: o.id,
        status: o.status,
        orderSource: o.orderSource,
        createdAt: o.createdAt.toISOString(),
        totalAmount: decimalToNumber(o.totalAmount),
        orderAmount: decimalToNumber(o.orderAmount),
        recipientName: o.recipientName,
        recipientAddr: o.recipientAddr,
        deliveryMsg: o.deliveryMsg,
        productInfo: o.productInfo, // 외부 상품 정보 (items가 비어있을 때 사용)
        customer: o.customer,
        items: o.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          quantity: i.quantity,
          price: decimalToNumber(i.price),
          product: { id: i.product.id, name: i.product.name, sku: i.product.sku },
        })),
      }))
    );
  } catch (error) {
    console.error("[store/orders] Failed to fetch orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
