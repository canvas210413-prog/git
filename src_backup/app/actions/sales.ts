"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSalesReport(filters?: {
  startDate?: string;
  endDate?: string;
  orderSource?: string;
}) {
  const where: any = {};

  if (filters?.startDate || filters?.endDate) {
    where.orderDate = {};
    if (filters.startDate) {
      where.orderDate.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.orderDate.lte = new Date(filters.endDate);
    }
  }

  if (filters?.orderSource) {
    where.orderSource = filters.orderSource;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders.map((order: any) => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    unitPrice: order.unitPrice ? Number(order.unitPrice) : null,
    shippingFee: order.shippingFee ? Number(order.shippingFee) : null,
    supplyPrice: order.supplyPrice ? Number(order.supplyPrice) : null,
    vat: order.vat ? Number(order.vat) : null,
    costPrice: order.costPrice ? Number(order.costPrice) : null,
    commission: order.commission ? Number(order.commission) : null,
    margin: order.margin ? Number(order.margin) : null,
    marginRate: order.marginRate ? Number(order.marginRate) : null,
  }));
}

export async function getSalesStatsByChannel(filters?: {
  startDate?: string;
  endDate?: string;
}) {
  const where: any = {
    status: {
      in: ["DELIVERED", "SHIPPED"],
    },
  };

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      orderSource: true,
      productInfo: true,
      totalAmount: true,
      unitPrice: true,
    },
  });

  const channelStats: Record<string, any> = {};

  orders.forEach((order: any) => {
    const channel = order.orderSource || "기타";
    if (!channelStats[channel]) {
      channelStats[channel] = {
        totalSales: 0,
        totalOrders: 0,
        products: { shield: 0, shieldWired: 0, mini: 0, stand: 0 },
      };
    }

    channelStats[channel].totalSales += Number(order.totalAmount);
    channelStats[channel].totalOrders += 1;

    const productInfo = order.productInfo?.toLowerCase() || "";
    if (productInfo.includes("유선")) {
      channelStats[channel].products.shieldWired += 1;
    } else if (productInfo.includes("미니")) {
      channelStats[channel].products.mini += 1;
    } else if (productInfo.includes("거치대") || productInfo.includes("스탠드")) {
      channelStats[channel].products.stand += 1;
    } else if (productInfo.includes("쉴드")) {
      channelStats[channel].products.shield += 1;
    }
  });

  return channelStats;
}

export async function getPeriodStats(filters?: {
  startDate?: string;
  endDate?: string;
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
  const currentMonthStart = new Date(currentYear, currentMonth, 1);
  const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

  // If filters are provided, use them for "currentMonth" (which acts as "Selected Period")
  let selectedStart = currentMonthStart;
  let selectedEnd = currentMonthEnd;

  if (filters?.startDate) {
    selectedStart = new Date(filters.startDate);
  }
  if (filters?.endDate) {
    selectedEnd = new Date(filters.endDate);
    // Set to end of day if only date is provided
    if (filters.endDate.length === 10) {
      selectedEnd.setHours(23, 59, 59, 999);
    }
  }

  const [lastMonth, currentMonthData, yearData] = await Promise.all([
    calculatePeriodStats(lastMonthStart, lastMonthEnd),
    calculatePeriodStats(selectedStart, selectedEnd),
    calculatePeriodStats(yearStart, yearEnd),
  ]);

  return {
    lastMonth,
    currentMonth: currentMonthData,
    year: yearData,
  };
}

async function calculatePeriodStats(startDate: Date, endDate: Date) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ["DELIVERED", "SHIPPED", "PROCESSING"],
      },
    },
    select: {
      supplyPrice: true,
      vat: true,
      totalAmount: true,
      costPrice: true,
      shippingFee: true,
      commission: true,
      margin: true,
    },
  });

  const stats = orders.reduce(
    (acc: any, order: any) => {
      acc.supplyPrice += Number(order.supplyPrice || 0);
      acc.vat += Number(order.vat || 0);
      acc.total += Number(order.totalAmount || 0);
      acc.costPrice += Number(order.costPrice || 0);
      acc.shippingFee += Number(order.shippingFee || 0);
      acc.commission += Number(order.commission || 0);
      acc.margin += Number(order.margin || 0);
      return acc;
    },
    {
      supplyPrice: 0,
      vat: 0,
      total: 0,
      costPrice: 0,
      shippingFee: 0,
      commission: 0,
      margin: 0,
      orderCount: orders.length,
    }
  );

  return stats;
}

export async function recalculateOrderFinancials(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) return null;

  const unitPrice = Number(order.unitPrice || 0);
  const supplyPrice = Math.floor(unitPrice / 1.1);
  const vat = unitPrice - supplyPrice;
  const costPrice = Math.floor(unitPrice * 0.6);
  const commission = Math.floor(unitPrice * 0.1);
  const margin = supplyPrice - costPrice - commission;
  const marginRate = supplyPrice > 0 ? (margin / supplyPrice) * 100 : 0;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      supplyPrice,
      vat,
      costPrice,
      commission,
      margin,
      marginRate,
    } as any,
  });

  revalidatePath("/dashboard/sales");
  return updated;
}

export async function recalculateAllOrders() {
  const orders = await prisma.order.findMany({});

  let updated = 0;
  for (const order of orders) {
    await recalculateOrderFinancials(order.id);
    updated++;
  }

  revalidatePath("/dashboard/sales");
  return { updated };
}

// 최근 주문 조회
export async function getRecentOrders(limit: number = 10) {
  const orders = await prisma.order.findMany({
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      customer: {
        select: {
          name: true,
        },
      },
    },
  });

  return orders.map((order: any) => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    unitPrice: order.unitPrice ? Number(order.unitPrice) : null,
    shippingFee: order.shippingFee ? Number(order.shippingFee) : null,
    supplyPrice: order.supplyPrice ? Number(order.supplyPrice) : null,
    vat: order.vat ? Number(order.vat) : null,
    costPrice: order.costPrice ? Number(order.costPrice) : null,
    commission: order.commission ? Number(order.commission) : null,
    margin: order.margin ? Number(order.margin) : null,
    marginRate: order.marginRate ? Number(order.marginRate) : null,
  }));
}

// 매출 개요 조회
export async function getSalesOverview() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
      status: {
        in: ["DELIVERED", "SHIPPED", "PROCESSING"],
      },
    },
    select: {
      totalAmount: true,
      margin: true,
    },
  });

  const totalRevenue = orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0);
  const totalMargin = orders.reduce((sum: number, order: any) => sum + Number(order.margin || 0), 0);
  const orderCount = orders.length;

  return {
    totalRevenue,
    totalMargin,
    orderCount,
    avgOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
  };
}

// 상위 상품 조회
export async function getTopProducts(limit: number = 5) {
  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ["DELIVERED", "SHIPPED"],
      },
    },
    select: {
      productInfo: true,
      totalAmount: true,
    },
  });

  // 상품별 집계
  const productStats: Record<string, { count: number; revenue: number }> = {};
  
  orders.forEach((order: any) => {
    const product = order.productInfo || "기타";
    if (!productStats[product]) {
      productStats[product] = { count: 0, revenue: 0 };
    }
    productStats[product].count += 1;
    productStats[product].revenue += Number(order.totalAmount);
  });

  // 매출 기준 정렬
  const topProducts = Object.entries(productStats)
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);

  return topProducts;
}

export async function getMonthlySalesTrend() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: sixMonthsAgo,
      },
      status: {
        in: ["DELIVERED", "SHIPPED", "PROCESSING"],
      },
    },
    select: {
      createdAt: true,
      totalAmount: true,
      margin: true,
    },
    orderBy: {
      createdAt: 'asc',
    }
  });

  const monthlyStats: Record<string, { revenue: number; margin: number }> = {};

  // Initialize last 6 months
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyStats[key] = { revenue: 0, margin: 0 };
  }

  orders.forEach((order: any) => {
    const d = new Date(order.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyStats[key]) {
      monthlyStats[key].revenue += Number(order.totalAmount);
      monthlyStats[key].margin += Number(order.margin || 0);
    }
  });

  return Object.entries(monthlyStats).map(([month, stats]) => ({
    name: month,
    revenue: stats.revenue,
    margin: stats.margin,
  }));
}
