"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ============================================================================
// Types
// ============================================================================

export interface DailyOrderStats {
  date: string;
  partner: string;
  orderCount: number;
  basePriceTotal: number;
  shippingFeeTotal: number;
  totalAmount: number;
}

export interface CumulativeStats {
  partner: string;
  orderCount: number;
  basePriceTotal: number;
  shippingFeeTotal: number;
  totalAmount: number;
}

export interface ASStats {
  partner: string;
  totalCount: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
}

export interface StatisticsData {
  dailyOrders: DailyOrderStats[];
  cumulativeByPartner: CumulativeStats[];
  totalCumulative: CumulativeStats;
  asStats: ASStats[];
  totalASStats: ASStats;
  isHeadquarters: boolean;
  currentPartner: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getCurrentUserPartner(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  
  const userId = (session.user as any).id;
  if (!userId) return null;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { assignedPartner: true }
  });
  
  return user?.assignedPartner || null;
}

// ============================================================================
// Main Functions
// ============================================================================

export async function getStatistics(
  startDate: Date,
  endDate: Date
): Promise<StatisticsData> {
  try {
    const assignedPartner = await getCurrentUserPartner();
    const isHeadquarters = !assignedPartner;
    
    // 협력사 필터 조건
    const partnerFilter = assignedPartner ? { orderSource: assignedPartner } : {};
    
    // 주문 조회
    const orders = await prisma.order.findMany({
      where: {
        ...partnerFilter,
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        orderDate: true,
        orderSource: true,
        basePrice: true,
        shippingFee: true,
        totalAmount: true,
      },
      orderBy: {
        orderDate: 'asc',
      },
    });

    // 일자별 통계 계산
    const dailyMap = new Map<string, DailyOrderStats>();
    
    orders.forEach(order => {
      const dateStr = order.orderDate.toISOString().split('T')[0];
      const partner = order.orderSource || '미지정';
      const key = `${dateStr}_${partner}`;
      
      const basePrice = Number(order.basePrice || 0);
      const shippingFee = Number(order.shippingFee || 0);
      const totalAmount = Number(order.totalAmount || 0);
      
      if (dailyMap.has(key)) {
        const existing = dailyMap.get(key)!;
        existing.orderCount += 1;
        existing.basePriceTotal += basePrice;
        existing.shippingFeeTotal += shippingFee;
        existing.totalAmount += totalAmount;
      } else {
        dailyMap.set(key, {
          date: dateStr,
          partner,
          orderCount: 1,
          basePriceTotal: basePrice,
          shippingFeeTotal: shippingFee,
          totalAmount,
        });
      }
    });

    const dailyOrders = Array.from(dailyMap.values()).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.partner.localeCompare(b.partner);
    });

    // 협력사별 누적 통계
    const cumulativeMap = new Map<string, CumulativeStats>();
    
    orders.forEach(order => {
      const partner = order.orderSource || '미지정';
      const basePrice = Number(order.basePrice || 0);
      const shippingFee = Number(order.shippingFee || 0);
      const totalAmount = Number(order.totalAmount || 0);
      
      if (cumulativeMap.has(partner)) {
        const existing = cumulativeMap.get(partner)!;
        existing.orderCount += 1;
        existing.basePriceTotal += basePrice;
        existing.shippingFeeTotal += shippingFee;
        existing.totalAmount += totalAmount;
      } else {
        cumulativeMap.set(partner, {
          partner,
          orderCount: 1,
          basePriceTotal: basePrice,
          shippingFeeTotal: shippingFee,
          totalAmount,
        });
      }
    });

    const cumulativeByPartner = Array.from(cumulativeMap.values());

    // 전체 누적 통계
    const totalCumulative: CumulativeStats = {
      partner: '전체',
      orderCount: orders.length,
      basePriceTotal: orders.reduce((sum, o) => sum + Number(o.basePrice || 0), 0),
      shippingFeeTotal: orders.reduce((sum, o) => sum + Number(o.shippingFee || 0), 0),
      totalAmount: orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
    };

    // AS 통계 조회
    const asPartnerFilter = assignedPartner 
      ? { companyName: assignedPartner } 
      : {};
    
    const afterServices = await prisma.afterservice.findMany({
      where: {
        ...asPartnerFilter,
        serviceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        status: true,
        companyName: true,
      },
    });

    // AS 협력사별 통계
    const asMap = new Map<string, ASStats>();
    
    afterServices.forEach(as => {
      const partner = as.companyName || '미지정';
      
      if (!asMap.has(partner)) {
        asMap.set(partner, {
          partner,
          totalCount: 0,
          pendingCount: 0,
          inProgressCount: 0,
          completedCount: 0,
          cancelledCount: 0,
        });
      }
      
      const stats = asMap.get(partner)!;
      stats.totalCount += 1;
      
      switch (as.status) {
        case 'PENDING':
        case 'RECEIVED':
          stats.pendingCount += 1;
          break;
        case 'IN_PROGRESS':
        case 'DIAGNOSING':
        case 'REPAIRING':
          stats.inProgressCount += 1;
          break;
        case 'COMPLETED':
        case 'SHIPPED':
        case 'DELIVERED':
          stats.completedCount += 1;
          break;
        case 'CANCELLED':
          stats.cancelledCount += 1;
          break;
        default:
          stats.pendingCount += 1;
      }
    });

    const asStats = Array.from(asMap.values());

    // 전체 AS 통계
    const totalASStats: ASStats = {
      partner: '전체',
      totalCount: afterServices.length,
      pendingCount: afterServices.filter(a => ['PENDING', 'RECEIVED'].includes(a.status)).length,
      inProgressCount: afterServices.filter(a => ['IN_PROGRESS', 'DIAGNOSING', 'REPAIRING'].includes(a.status)).length,
      completedCount: afterServices.filter(a => ['COMPLETED', 'SHIPPED', 'DELIVERED'].includes(a.status)).length,
      cancelledCount: afterServices.filter(a => a.status === 'CANCELLED').length,
    };

    return {
      dailyOrders,
      cumulativeByPartner,
      totalCumulative,
      asStats,
      totalASStats,
      isHeadquarters,
      currentPartner: assignedPartner,
    };
  } catch (error) {
    console.error("[getStatistics] Error:", error);
    throw new Error("통계 데이터를 불러오는데 실패했습니다");
  }
}

// 일자별 누적 그래프 데이터 조회
export async function getDailyCumulativeData(
  startDate: Date,
  endDate: Date
): Promise<{ date: string; partner: string; cumulativeAmount: number }[]> {
  try {
    const assignedPartner = await getCurrentUserPartner();
    const partnerFilter = assignedPartner ? { orderSource: assignedPartner } : {};
    
    const orders = await prisma.order.findMany({
      where: {
        ...partnerFilter,
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        orderDate: true,
        orderSource: true,
        basePrice: true,
      },
      orderBy: {
        orderDate: 'asc',
      },
    });

    // 일자별로 그룹화하고 누적 계산
    const dailyTotals = new Map<string, Map<string, number>>();
    
    orders.forEach(order => {
      const dateStr = order.orderDate.toISOString().split('T')[0];
      const partner = order.orderSource || '미지정';
      const amount = Number(order.basePrice || 0);
      
      if (!dailyTotals.has(dateStr)) {
        dailyTotals.set(dateStr, new Map());
      }
      
      const partnerMap = dailyTotals.get(dateStr)!;
      partnerMap.set(partner, (partnerMap.get(partner) || 0) + amount);
    });

    // 날짜 정렬 및 누적 계산
    const sortedDates = Array.from(dailyTotals.keys()).sort();
    const cumulativeByPartner = new Map<string, number>();
    const result: { date: string; partner: string; cumulativeAmount: number }[] = [];

    sortedDates.forEach(date => {
      const partnerMap = dailyTotals.get(date)!;
      
      partnerMap.forEach((amount, partner) => {
        cumulativeByPartner.set(partner, (cumulativeByPartner.get(partner) || 0) + amount);
        result.push({
          date,
          partner,
          cumulativeAmount: cumulativeByPartner.get(partner)!,
        });
      });
    });

    return result;
  } catch (error) {
    console.error("[getDailyCumulativeData] Error:", error);
    throw new Error("누적 그래프 데이터를 불러오는데 실패했습니다");
  }
}
