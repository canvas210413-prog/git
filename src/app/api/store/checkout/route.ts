import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CheckoutBody = {
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  shipping: {
    recipientName: string;
    recipientPhone?: string;
    recipientMobile?: string;
    recipientZipCode?: string;
    recipientAddr: string;
    deliveryMsg?: string;
  };
  items: Array<{ 
    productId: string; 
    quantity: number;
    sku?: string;
    priceSnapshot?: number;
    name?: string;
  }>;
};

function toSafeInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutBody;

    const email = body.customer?.email?.trim();
    const customerName = body.customer?.name?.trim();
    const recipientName = body.shipping?.recipientName?.trim();
    const recipientAddr = body.shipping?.recipientAddr?.trim();

    if (!email) {
      return NextResponse.json({ error: "customer.email is required" }, { status: 400 });
    }
    if (!customerName) {
      return NextResponse.json({ error: "customer.name is required" }, { status: 400 });
    }
    if (!recipientName) {
      return NextResponse.json({ error: "shipping.recipientName is required" }, { status: 400 });
    }
    if (!recipientAddr) {
      return NextResponse.json({ error: "shipping.recipientAddr is required" }, { status: 400 });
    }

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "items is required" }, { status: 400 });
    }

    // 상품 정보 수집
    const normalizedItems = items
      .map((item) => ({
        productId: String(item.productId || ""),
        quantity: toSafeInt(item.quantity, 1),
        sku: item.sku || null,
        priceSnapshot: item.priceSnapshot || 0,
        name: item.name || "",
      }))
      .filter((item) => item.quantity > 0);

    if (normalizedItems.length === 0) {
      return NextResponse.json({ error: "items must include quantity > 0" }, { status: 400 });
    }

    // DB에서 상품 찾기 시도 (productId 또는 SKU로)
    const productIds = normalizedItems.map((i) => i.productId).filter(Boolean);
    const skus = normalizedItems.map((i) => i.sku).filter((s): s is string => Boolean(s));
    
    const dbProducts = await prisma.product.findMany({
      where: { 
        OR: [
          ...(productIds.length > 0 ? [{ id: { in: productIds } }] : []),
          ...(skus.length > 0 ? [{ sku: { in: skus } }] : []),
        ].filter(Boolean)
      },
      select: { id: true, name: true, price: true, stock: true, sku: true },
    });

    const productMapById = new Map(dbProducts.map((p) => [p.id, p]));
    const productMapBySku = new Map(dbProducts.filter(p => p.sku).map((p) => [p.sku!, p]));

    // 주문 아이템 처리
    type ResolvedItem = {
      dbProductId: string | null;
      productName: string;
      quantity: number;
      price: number;
    };
    
    const resolvedItems: ResolvedItem[] = [];
    
    for (const item of normalizedItems) {
      // DB에서 상품 찾기
      let dbProduct = productMapById.get(item.productId);
      if (!dbProduct && item.sku) {
        dbProduct = productMapBySku.get(item.sku);
      }
      
      if (dbProduct) {
        // DB 상품 사용
        if (dbProduct.stock < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${dbProduct.name} (stock: ${dbProduct.stock})` },
            { status: 400 }
          );
        }
        resolvedItems.push({
          dbProductId: dbProduct.id,
          productName: dbProduct.name,
          quantity: item.quantity,
          price: decimalToNumber(dbProduct.price),
        });
      } else if (item.priceSnapshot > 0 && item.name) {
        // 외부 상품 (priceSnapshot 사용)
        resolvedItems.push({
          dbProductId: null,
          productName: item.name,
          quantity: item.quantity,
          price: item.priceSnapshot,
        });
      } else {
        // 상품을 찾을 수 없고 priceSnapshot도 없음
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
    }

    const totalAmount = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const productInfo = resolvedItems.map(item => `${item.productName} x ${item.quantity}`).join(", ");

    // 트랜잭션으로 주문 생성
    const order = await prisma.$transaction(async (tx) => {
      // 고객 생성/업데이트
      const customer = await tx.customer.upsert({
        where: { email },
        update: {
          name: customerName,
          ...(body.customer.phone ? { phone: body.customer.phone } : {}),
        },
        create: {
          email,
          name: customerName,
          phone: body.customer.phone ?? null,
          status: "ACTIVE",
        },
      });

      // DB 상품만 OrderItem으로 저장
      const dbItems = resolvedItems.filter(item => item.dbProductId !== null);
      
      const createdOrder = await tx.order.create({
        data: {
          customerId: customer.id,
          status: "PENDING",
          orderSource: "자사몰",
          ordererName: customerName,
          contactPhone: body.customer.phone ?? null,
          recipientName: recipientName,
          recipientPhone: body.shipping.recipientPhone ?? null,
          recipientMobile: body.shipping.recipientMobile ?? null,
          recipientZipCode: body.shipping.recipientZipCode ?? null,
          recipientAddr: recipientAddr,
          deliveryMsg: body.shipping.deliveryMsg ?? null,
          totalAmount,
          orderAmount: totalAmount,
          productInfo,
          items: {
            create: dbItems.map((item) => ({
              productId: item.dbProductId!,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          customer: { select: { id: true, name: true, email: true, phone: true } },
        },
      });

      // 재고 차감 (DB 상품만)
      for (const item of dbItems) {
        await tx.product.update({
          where: { id: item.dbProductId! },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return createdOrder;
    });

    console.log(`[store/checkout] Order created: ${order.id}, items: ${resolvedItems.length}`);

    return NextResponse.json({
      id: order.id,
      status: order.status,
      orderSource: order.orderSource,
      totalAmount: decimalToNumber(order.totalAmount),
      customer: order.customer,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        price: decimalToNumber(i.price),
        product: {
          id: i.product.id,
          name: i.product.name,
          sku: i.product.sku,
        },
      })),
    }, { status: 201 });
  } catch (error) {
    console.error("[store/checkout] Failed to checkout:", error);
    return NextResponse.json({ error: "Failed to checkout" }, { status: 500 });
  }
}
