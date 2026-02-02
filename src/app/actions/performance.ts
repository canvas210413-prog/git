"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * 현재 로그인한 사용자의 협력사 정보를 조회합니다.
 * null이면 본사 (전체 접근), 값이 있으면 해당 협력사만 접근
 */
async function getCurrentUserPartner(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return null;
    }
    return (session.user as any).assignedPartner || null;
  } catch (error) {
    console.error("세션 조회 실패:", error);
    return null;
  }
}

/**
 * 현재 로그인한 사용자의 협력사 정보를 외부에서 사용할 수 있도록 노출합니다.
 * 페이지에서 협력사 여부를 표시할 때 사용
 */
export async function getCurrentUserPartnerInfo(): Promise<{ assignedPartner: string | null }> {
  const assignedPartner = await getCurrentUserPartner();
  return { assignedPartner };
}

/**
 * 성과 KPI 데이터 조회
 * 주문, 리뷰, 티켓 등 실제 데이터 기반
 * 협력사 사용자는 자신의 업체 데이터만 조회
 */
export async function getPerformanceKPIs(period: "today" | "week" | "month" = "today") {
  try {
    // 현재 사용자의 협력사 정보 조회
    const assignedPartner = await getCurrentUserPartner();
    
    const now = new Date();
    let startDate: Date;

    // 기간 설정
    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // 이전 기간 (비교용)
    const periodDuration = now.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodDuration);
    const prevEndDate = new Date(startDate.getTime() - 1);

    // 협력사 필터 조건 생성
    const partnerOrderFilter = assignedPartner ? { orderSource: assignedPartner } : {};
    const partnerASFilter = assignedPartner ? { companyName: assignedPartner } : {};

    // 주문 데이터 (협력사 필터 적용)
    const [currentOrders, prevOrders, currentRevenue, prevRevenue] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: { gte: startDate },
          ...partnerOrderFilter,
        },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: prevStartDate, lte: prevEndDate },
          ...partnerOrderFilter,
        },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: "COMPLETED",
          ...partnerOrderFilter,
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: prevStartDate, lte: prevEndDate },
          status: "COMPLETED",
          ...partnerOrderFilter,
        },
        _sum: { totalAmount: true },
      }),
    ]);

    // 고객 데이터
    const [currentNewCustomers, prevNewCustomers] = await Promise.all([
      prisma.customer.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.customer.count({
        where: { createdAt: { gte: prevStartDate, lte: prevEndDate } },
      }),
    ]);

    // 리뷰 데이터
    const [currentReviews, prevReviews, avgRating] = await Promise.all([
      prisma.review.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.review.count({
        where: { createdAt: { gte: prevStartDate, lte: prevEndDate } },
      }),
      prisma.review.aggregate({
        where: { createdAt: { gte: startDate } },
        _avg: { rating: true },
      }),
    ]);

    // 리뷰 평점 분포
    const reviewDistribution = await prisma.review.groupBy({
      by: ["rating"],
      where: { createdAt: { gte: startDate } },
      _count: true,
    });

    // 긍정/부정 리뷰
    const sentimentStats = await prisma.review.groupBy({
      by: ["sentiment"],
      where: { createdAt: { gte: startDate } },
      _count: true,
    });

    // CS 티켓 데이터
    const [currentTickets, prevTickets, resolvedTickets, avgResolutionTime] = await Promise.all([
      prisma.ticket.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.ticket.count({
        where: { createdAt: { gte: prevStartDate, lte: prevEndDate } },
      }),
      prisma.ticket.count({
        where: {
          createdAt: { gte: startDate },
          status: "RESOLVED",
        },
      }),
      // 해결된 티켓의 평균 처리 시간 (createdAt - updatedAt)
      prisma.ticket.findMany({
        where: {
          createdAt: { gte: startDate },
          status: "RESOLVED",
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    // A/S 데이터 (협력사 필터 적용)
    const [currentAS, prevAS] = await Promise.all([
      prisma.afterservice.count({
        where: { 
          createdAt: { gte: startDate },
          ...partnerASFilter,
        },
      }),
      prisma.afterservice.count({
        where: { 
          createdAt: { gte: prevStartDate, lte: prevEndDate },
          ...partnerASFilter,
        },
      }),
    ]);

    // 평균 처리 시간 계산
    const avgResolutionHours = avgResolutionTime.length > 0
      ? avgResolutionTime.reduce((sum, ticket) => {
          const hours = (ticket.updatedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / avgResolutionTime.length
      : 0;

    // 변화율 계산
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const currentRevenueValue = Number(currentRevenue._sum.totalAmount || 0);
    const prevRevenueValue = Number(prevRevenue._sum.totalAmount || 0);

    return {
      // 매출
      revenue: {
        current: currentRevenueValue,
        previous: prevRevenueValue,
        change: calculateChange(currentRevenueValue, prevRevenueValue),
      },
      // 주문
      orders: {
        current: currentOrders,
        previous: prevOrders,
        change: calculateChange(currentOrders, prevOrders),
      },
      // 신규 고객
      newCustomers: {
        current: currentNewCustomers,
        previous: prevNewCustomers,
        change: calculateChange(currentNewCustomers, prevNewCustomers),
      },
      // 리뷰
      reviews: {
        current: currentReviews,
        previous: prevReviews,
        change: calculateChange(currentReviews, prevReviews),
        avgRating: Number(avgRating._avg.rating || 0),
        distribution: reviewDistribution.map(d => ({
          rating: d.rating,
          count: d._count,
        })),
        sentiment: {
          positive: sentimentStats.find(s => s.sentiment === "positive")?._count || 0,
          negative: sentimentStats.find(s => s.sentiment === "negative")?._count || 0,
          neutral: sentimentStats.find(s => s.sentiment === "neutral")?._count || 0,
        },
      },
      // CS 티켓
      tickets: {
        current: currentTickets,
        previous: prevTickets,
        change: calculateChange(currentTickets, prevTickets),
        resolved: resolvedTickets,
        resolutionRate: currentTickets > 0 ? (resolvedTickets / currentTickets) * 100 : 0,
        avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
      },
      // A/S
      afterService: {
        current: currentAS,
        previous: prevAS,
        change: calculateChange(currentAS, prevAS),
      },
      // 추가 메트릭
      metrics: {
        avgOrderValue: currentOrders > 0 ? currentRevenueValue / currentOrders : 0,
        customerSatisfaction: avgRating._avg.rating ? (Number(avgRating._avg.rating) / 5) * 100 : 0,
      },
    };
  } catch (error) {
    console.error("Failed to fetch performance KPIs:", error);
    throw error;
  }
}

/**
 * 상위 제품 조회 (리뷰 기준)
 */
export async function getTopProductsByReviews(limit: number = 5) {
  try {
    const products = await prisma.review.groupBy({
      by: ["productId", "productName"],
      _count: true,
      _avg: { rating: true },
      where: {
        productId: { not: null },
      },
      orderBy: {
        _count: {
          productId: "desc",
        },
      },
      take: limit,
    });

    return products.map(p => ({
      id: p.productId,
      name: p.productName,
      reviewCount: p._count,
      avgRating: Number(p._avg.rating || 0),
    }));
  } catch (error) {
    console.error("Failed to fetch top products:", error);
    return [];
  }
}

/**
 * 최근 리뷰 조회
 */
export async function getRecentReviews(limit: number = 10) {
  try {
    const reviews = await prisma.review.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        productName: true,
        rating: true,
        content: true,
        sentiment: true,
        authorName: true,
        createdAt: true,
      },
    });

    return reviews;
  } catch (error) {
    console.error("Failed to fetch recent reviews:", error);
    return [];
  }
}
