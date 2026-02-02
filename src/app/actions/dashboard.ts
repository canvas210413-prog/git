"use server";

import { prisma } from "@/lib/prisma";

/**
 * 대시보드 전체 KPI 조회
 */
export async function getDashboardKPIs() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 매출 지표
    const [currentMonthOrders, lastMonthOrders, totalRevenue] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfMonth },
          status: "COMPLETED",
        },
        select: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: "COMPLETED",
        },
        select: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { status: "COMPLETED" },
        _sum: { totalAmount: true },
      }),
    ]);

    const currentMonthRevenue = currentMonthOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );
    const lastMonthRevenue = lastMonthOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );
    const revenueGrowth = lastMonthRevenue > 0
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    // 고객 지표
    const [totalCustomers, activeCustomers, newCustomers, repeatCustomers] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: "ACTIVE" } }),
      prisma.customer.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(DISTINCT customerId) as count
        FROM \`Order\`
        WHERE customerId IN (
          SELECT customerId
          FROM \`Order\`
          GROUP BY customerId
          HAVING COUNT(*) > 1
        )
      `,
    ]);

    const repeatRate = totalCustomers > 0 
      ? (Number(repeatCustomers[0]?.count || 0) / totalCustomers) * 100 
      : 0;

    // 이탈률 계산 (30일간 주문 없는 고객)
    const inactiveCustomers = await prisma.customer.count({
      where: {
        orders: {
          none: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
        status: "ACTIVE",
      },
    });
    const churnRate = activeCustomers > 0 ? (inactiveCustomers / activeCustomers) * 100 : 0;

    // 주문 지표
    const [totalOrders, pendingOrders, completedOrders, averageOrderValue] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.order.aggregate({
        where: { status: "COMPLETED" },
        _avg: { totalAmount: true },
      }),
    ]);

    // CS 티켓 지표
    const ticketStats = await prisma.ticket.groupBy({
      by: ["status"],
      _count: true,
    });

    const ticketCounts = {
      total: ticketStats.reduce((sum, s) => sum + s._count, 0),
      open: ticketStats.find((s) => s.status === "OPEN")?._count || 0,
      inProgress: ticketStats.find((s) => s.status === "IN_PROGRESS")?._count || 0,
      resolved: ticketStats.find((s) => s.status === "RESOLVED")?._count || 0,
    };

    const resolutionRate = ticketCounts.total > 0
      ? (ticketCounts.resolved / ticketCounts.total) * 100
      : 0;

    // 재고 지표
    const inventoryStats = await prisma.part.aggregate({
      _sum: { quantity: true },
    });
    
    // minStock보다 quantity가 적거나 같은 부품 수
    const allParts = await prisma.part.findMany({
      select: { quantity: true, minStock: true },
    });
    const lowStockParts = allParts.filter(p => p.quantity <= p.minStock).length;

    // 리드 전환율
    const [totalLeads, wonLeads] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "WON" } }),
    ]);

    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    // AS 접수 지표
    const asStats = await prisma.afterservice.groupBy({
      by: ["status"],
      _count: true,
    });

    const asCounts = {
      total: asStats.reduce((sum, s) => sum + s._count, 0),
      pending: asStats.find((s) => s.status === "PENDING")?._count || 0,
      inProgress: asStats.find((s) => s.status === "IN_PROGRESS")?._count || 0,
      completed: asStats.find((s) => s.status === "COMPLETED")?._count || 0,
    };

    return {
      revenue: {
        total: Number(totalRevenue._sum.totalAmount || 0),
        currentMonth: currentMonthRevenue,
        previousMonth: lastMonthRevenue,
        growth: revenueGrowth,
      },
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        new: newCustomers,
        repeatRate: repeatRate,
        churnRate: churnRate,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        averageValue: Number(averageOrderValue._avg.totalAmount || 0),
      },
      support: {
        tickets: ticketCounts,
        resolutionRate: resolutionRate,
        avgResponseTime: 0, // TODO: 실제 응답 시간 계산 추가
      },
      inventory: {
        totalStock: inventoryStats._sum.quantity || 0,
        lowStockItems: lowStockParts,
        outOfStockItems: 0, // TODO: 품절 항목 수 계산 추가
      },
      leads: {
        total: totalLeads,
        won: wonLeads,
        lost: 0, // TODO: 실패 리드 수 계산 추가
        conversionRate: conversionRate,
      },
      afterService: {
        total: asCounts.total,
        pending: asCounts.pending,
        inProgress: asCounts.inProgress,
        completed: asCounts.completed,
      },
    };
  } catch (error) {
    console.error("Failed to fetch dashboard KPIs:", error);
    throw error;
  }
}

/**
 * 최근 활동 조회
 */
export async function getRecentActivities() {
  try {
    const [recentOrders, recentTickets] = await Promise.all([
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.ticket.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          subject: true,
          status: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      orders: recentOrders.map(o => ({
        id: o.id,
        totalAmount: Number(o.totalAmount || 0),
        status: o.status,
        createdAt: o.createdAt,
        customer: o.customer,
      })),
      tickets: recentTickets
        .filter(t => t.customer !== null)
        .map(t => ({
          id: t.id,
          subject: t.subject,
          status: t.status,
          customer: t.customer!,
        })),
    };
  } catch (error) {
    console.error("Failed to fetch recent activities:", error);
    return { orders: [], tickets: [] };
  }
}
