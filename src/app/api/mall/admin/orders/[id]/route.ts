import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 주문 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const order = await prisma.mallOrder.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { error: "주문 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 주문 수정 (상태 변경, 배송정보 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, courier, trackingNumber, shippedAt, deliveredAt, cancelledAt } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      
      // 상태에 따른 일시 자동 설정
      if (status === "SHIPPED" && !shippedAt) {
        updateData.shippedAt = new Date();
      }
      if (status === "DELIVERED" && !deliveredAt) {
        updateData.deliveredAt = new Date();
      }
      if (status === "CANCELLED" && !cancelledAt) {
        updateData.cancelledAt = new Date();
      }
    }

    if (courier !== undefined) updateData.courier = courier;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (shippedAt !== undefined) updateData.shippedAt = new Date(shippedAt);
    if (deliveredAt !== undefined) updateData.deliveredAt = new Date(deliveredAt);
    if (cancelledAt !== undefined) updateData.cancelledAt = new Date(cancelledAt);

    const order = await prisma.mallOrder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { error: "주문 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}
