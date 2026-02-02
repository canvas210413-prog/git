import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 모든 주문 조회
export async function GET(request: NextRequest) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST: 새 주문 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const order = await prisma.order.create({
      data: {
        customerId: body.customerId,
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        totalAmount: body.totalAmount,
        status: body.status || "PENDING",
        recipientName: body.recipientName,
        recipientPhone: body.recipientPhone,
        recipientMobile: body.recipientMobile,
        recipientZipCode: body.recipientZipCode,
        recipientAddr: body.recipientAddr,
        orderNumber: body.orderNumber,
        productInfo: body.productInfo,
        deliveryMsg: body.deliveryMsg,
        orderSource: body.orderSource,
        unitPrice: body.unitPrice,
        shippingFee: body.shippingFee,
        courier: body.courier,
        trackingNumber: body.trackingNumber,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
