import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyTrackingNumberToPartner } from "@/lib/notification-helper";

// GET: 특정 주문 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // mall_ 접두어가 있으면 MallOrder에서 조회
    if (id.startsWith("mall_")) {
      const mallOrderId = id.replace("mall_", "");
      const mallOrder = await prisma.mallOrder.findUnique({
        where: { id: mallOrderId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!mallOrder) {
        return NextResponse.json(
          { error: "Mall Order not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(mallOrder);
    }
    
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

    // mall_ 접두어가 있으면 MallOrder 수정
    if (id.startsWith("mall_")) {
      const mallOrderId = id.replace("mall_", "");
      
      const mallOrder = await prisma.mallOrder.update({
        where: { id: mallOrderId },
        data: {
          ...(body.status && { status: body.status }),
          ...(body.courier !== undefined && { courier: body.courier }),
          ...(body.trackingNumber !== undefined && { trackingNumber: body.trackingNumber }),
          ...(body.shippedAt && { shippedAt: new Date(body.shippedAt) }),
          ...(body.deliveredAt && { deliveredAt: new Date(body.deliveredAt) }),
        },
      });

      return NextResponse.json(mallOrder);
    }

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
        ...(body.deliveryStatus !== undefined && { deliveryStatus: body.deliveryStatus }),
        ...(body.shippedAt && { shippedAt: new Date(body.shippedAt) }),
        ...(body.deliveredAt && { deliveredAt: new Date(body.deliveredAt) }),
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

    // 운송장 번호가 새로 등록되고 partner(고객주문처명)가 있으면 협력사에 알림
    if (body.trackingNumber && body.courier && order.partner) {
      console.log(`📦 [주문 API] 운송장 번호 등록 감지 - 협력사 알림 시작`);
      console.log(`  협력사(고객주문처명): ${order.partner}`);
      console.log(`  주문번호: ${order.orderNumber}`);
      console.log(`  택배사: ${body.courier}`);
      console.log(`  운송장: ${body.trackingNumber}`);

      try {
        // order.partner(고객주문처명)로 해당 협력사의 사용자 찾기
        const partnerUser = await prisma.user.findFirst({
          where: {
            assignedPartner: order.partner,
            role: { in: ["PARTNER", "USER"] },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        if (partnerUser) {
          console.log(`  협력사 사용자 발견: ${partnerUser.name} (${partnerUser.email})`);
          
          await notifyTrackingNumberToPartner(
            partnerUser.id,
            order.partner,
            order.orderNumber || "",
            body.courier,
            body.trackingNumber,
            {
              ordererName: order.ordererName || "",
              contactPhone: order.contactPhone || "",
              productInfo: order.productInfo || "",
              quantity: order.quantity,
              basePrice: order.basePrice,
              shippingFee: order.shippingFee,
              totalAmount: order.totalAmount,
            }
          );
          
          console.log(`✅ [주문 API] 협력사 알림 전송 성공`);
        } else {
          console.log(`⚠️ [주문 API] 협력사 사용자를 찾을 수 없음: ${order.partner}`);
        }
      } catch (notifyError) {
        console.error(`❌ [주문 API] 협력사 알림 전송 실패:`, notifyError);
        // 알림 실패해도 주문 업데이트는 성공으로 처리
      }
    }

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
    
    // mall_ 접두어가 있으면 MallOrder 삭제
    if (id.startsWith("mall_")) {
      const mallOrderId = id.replace("mall_", "");
      await prisma.mallOrder.delete({
        where: { id: mallOrderId },
      });
      return NextResponse.json({ message: "Mall Order deleted successfully" });
    }
    
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
