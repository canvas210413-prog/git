import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 전화번호 인증 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phoneNumber = body?.phoneNumber;

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json({ success: false, message: "전화번호를 입력해주세요." });
    }

    // 전화번호 정규화 (하이픈 제거)
    const normalized = phoneNumber.replace(/[^0-9]/g, "");
    const withHyphen = phoneNumber.includes("-") ? phoneNumber : normalized;

    // 고객 찾기 (phone 필드가 있는 경우)
    let customer = null;
    try {
      customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { phone: { contains: normalized } },
            { phone: withHyphen },
            { phone: normalized.slice(-8) }, // 뒷 8자리로도 검색
          ],
        },
        include: {
          orders: {
            orderBy: { orderDate: "desc" },
            take: 5,
            select: {
              id: true,
              orderNumber: true,
              status: true,
              orderDate: true,
              totalAmount: true,
            },
          },
        },
      });
    } catch (dbError) {
      console.error("[chatbot/verify-phone] DB error:", dbError);
    }

    if (!customer) {
      // 데모 모드: 고객을 찾지 못해도 기본 응답 제공
      return NextResponse.json({
        success: true,
        message: `전화번호 ${phoneNumber}로 인증되었습니다.\n\n등록된 주문 내역이 없습니다. 주문하시면 내역 조회가 가능합니다.`,
        customerInfo: {
          customerId: "guest",
          customerName: "고객",
          phoneNumber: normalized,
          orderCount: 0,
          recentOrders: [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${customer.name}님, 인증되었습니다! 😊\n\n총 ${customer.orders.length}건의 주문 내역이 있습니다.\n무엇을 도와드릴까요?`,
      customerInfo: {
        customerId: customer.id,
        customerName: customer.name,
        phoneNumber: normalized,
        orderCount: customer.orders.length,
        recentOrders: customer.orders.map((o) => ({
          orderId: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          orderDate: o.orderDate.toISOString(),
          totalAmount: o.totalAmount,
        })),
      },
    });
  } catch (error) {
    console.error("[chatbot/verify-phone] Error:", error);
    return NextResponse.json({
      success: false,
      message: "인증 처리 중 오류가 발생했습니다.",
    });
  }
}
