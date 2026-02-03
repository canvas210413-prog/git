import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/orders/clear-tracking
 * 
 * 선택한 주문들의 운송장번호를 일괄 삭제합니다.
 * 운송장번호가 있는 주문만 처리됩니다.
 */
export async function POST(req: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await req.json();
    const { orderIds } = body;

    // 유효성 검사
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "삭제할 주문 ID를 선택해주세요." },
        { status: 400 }
      );
    }

    // 운송장번호가 있는 주문만 조회
    const ordersWithTracking = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        trackingNumber: { not: null },
      },
      select: {
        id: true,
        trackingNumber: true,
        orderNumber: true,
      },
    });

    if (ordersWithTracking.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "운송장번호가 입력된 주문이 없습니다.",
          cleared: 0,
          total: orderIds.length,
        },
        { status: 200 }
      );
    }

    // 운송장번호 일괄 삭제
    const result = await prisma.order.updateMany({
      where: {
        id: { in: ordersWithTracking.map(o => o.id) },
      },
      data: {
        trackingNumber: null,
        courier: null, // 택배사도 함께 삭제
        updatedAt: new Date(),
      },
    });

    // 감사 로그 기록
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        userEmail: session.user.email,
        action: "BULK_CLEAR_TRACKING_NUMBER",
        category: "ORDER",
        details: JSON.stringify({
          clearedCount: result.count,
          totalRequested: orderIds.length,
          orderIds: ordersWithTracking.map(o => o.id),
          orderNumbers: ordersWithTracking.map(o => o.orderNumber),
        }),
        ipAddress: req.headers.get("x-forwarded-for") || 
                   req.headers.get("x-real-ip") || 
                   "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        status: "SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count}개 주문의 운송장번호가 삭제되었습니다.`,
      cleared: result.count,
      total: orderIds.length,
      details: ordersWithTracking.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        previousTrackingNumber: o.trackingNumber,
      })),
    });

  } catch (error) {
    console.error("운송장번호 일괄 삭제 중 오류:", error);
    
    return NextResponse.json(
      { 
        error: "운송장번호 삭제 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}
