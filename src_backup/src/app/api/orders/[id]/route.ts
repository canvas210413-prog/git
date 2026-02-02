import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 특정 주문 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const order = await prisma.order.findUnique({
      where: { id },
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

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PUT: 주문 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(body.orderDate && { orderDate: new Date(body.orderDate) }),
        ...(body.totalAmount !== undefined && { totalAmount: body.totalAmount }),
        ...(body.status && { status: body.status }),
        ...(body.recipientName !== undefined && { recipientName: body.recipientName }),
        ...(body.recipientPhone !== undefined && { recipientPhone: body.recipientPhone }),
        ...(body.recipientMobile !== undefined && { recipientMobile: body.recipientMobile }),
        ...(body.recipientZipCode !== undefined && { recipientZipCode: body.recipientZipCode }),
        ...(body.recipientAddr !== undefined && { recipientAddr: body.recipientAddr }),
        ...(body.orderNumber !== undefined && { orderNumber: body.orderNumber }),
        ...(body.productInfo !== undefined && { productInfo: body.productInfo }),
        ...(body.deliveryMsg !== undefined && { deliveryMsg: body.deliveryMsg }),
        ...(body.orderSource !== undefined && { orderSource: body.orderSource }),
        ...(body.unitPrice !== undefined && { unitPrice: body.unitPrice }),
        ...(body.shippingFee !== undefined && { shippingFee: body.shippingFee }),
        ...(body.courier !== undefined && { courier: body.courier }),
        ...(body.trackingNumber !== undefined && { trackingNumber: body.trackingNumber }),
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

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE: 주문 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Failed to delete order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
