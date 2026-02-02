"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 파트너 포털용 - 파트너 정보 조회 (이메일로)
export async function getPartnerByEmail(email: string) {
  try {
    const partner = await prisma.partner.findUnique({
      where: { email },
      include: {
        performances: {
          orderBy: { period: 'desc' },
          take: 12, // 최근 12개월
        },
      },
    });

    if (!partner) return null;

    // 성과 집계
    const totalSales = partner.performances.reduce(
      (sum, p) => sum + Number(p.salesAmount),
      0
    );
    const totalCommission = partner.performances.reduce(
      (sum, p) => sum + Number(p.commission),
      0
    );
    const totalLeads = partner.performances.reduce(
      (sum, p) => sum + p.leadsCount,
      0
    );
    const totalDeals = partner.performances.reduce(
      (sum, p) => sum + p.dealsClosed,
      0
    );

    // 보상 계산 (수수료의 일정 비율)
    const commissionRate = partner.type === 'DISTRIBUTOR' ? 0.15 : partner.type === 'RESELLER' ? 0.10 : 0.05;
    const estimatedReward = totalSales * commissionRate;

    return {
      ...partner,
      stats: {
        totalSales,
        totalCommission,
        totalLeads,
        totalDeals,
        estimatedReward,
        commissionRate: commissionRate * 100,
      },
      performances: partner.performances.map((p) => ({
        ...p,
        salesAmount: Number(p.salesAmount),
        commission: Number(p.commission),
      })),
    };
  } catch (error) {
    console.error("Failed to fetch partner by email:", error);
    throw error;
  }
}

// 파트너 포털 대시보드 데이터
export async function getPartnerPortalData(partnerId: string) {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        performances: {
          orderBy: { period: 'desc' },
        },
      },
    });

    if (!partner) return null;

    // 월별 성과 데이터
    const monthlyData = partner.performances.map((p) => ({
      period: p.period,
      salesAmount: Number(p.salesAmount),
      commission: Number(p.commission),
      leadsCount: p.leadsCount,
      dealsClosed: p.dealsClosed,
    }));

    // 올해 성과
    const currentYear = new Date().getFullYear().toString();
    const thisYearPerformances = partner.performances.filter((p) =>
      p.period.startsWith(currentYear)
    );

    const thisYearSales = thisYearPerformances.reduce(
      (sum, p) => sum + Number(p.salesAmount),
      0
    );
    const thisYearCommission = thisYearPerformances.reduce(
      (sum, p) => sum + Number(p.commission),
      0
    );

    // 전체 누적
    const totalSales = partner.performances.reduce(
      (sum, p) => sum + Number(p.salesAmount),
      0
    );
    const totalCommission = partner.performances.reduce(
      (sum, p) => sum + Number(p.commission),
      0
    );

    // 등급 및 보상 계산
    let tier = 'Bronze';
    let nextTierSales = 50000000; // 5천만원
    let rewardRate = 5;

    if (totalSales >= 100000000) {
      tier = 'Platinum';
      nextTierSales = 0;
      rewardRate = 15;
    } else if (totalSales >= 50000000) {
      tier = 'Gold';
      nextTierSales = 100000000;
      rewardRate = 10;
    } else if (totalSales >= 20000000) {
      tier = 'Silver';
      nextTierSales = 50000000;
      rewardRate = 7;
    }

    const progress = nextTierSales > 0 
      ? Math.min((totalSales / nextTierSales) * 100, 100) 
      : 100;

    return {
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        company: partner.company,
        status: partner.status,
        type: partner.type,
      },
      stats: {
        thisYearSales,
        thisYearCommission,
        totalSales,
        totalCommission,
        tier,
        nextTierSales,
        rewardRate,
        progress,
      },
      monthlyData,
    };
  } catch (error) {
    console.error("Failed to fetch partner portal data:", error);
    throw error;
  }
}

// 파트너 목록 (포털 관리용)
export async function getAllPartnersForPortal() {
  try {
    const partners = await prisma.partner.findMany({
      include: {
        performances: {
          orderBy: { period: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    return partners.map((partner) => {
      const latestPerformance = partner.performances[0];
      return {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        company: partner.company,
        status: partner.status,
        type: partner.type,
        latestSales: latestPerformance ? Number(latestPerformance.salesAmount) : 0,
        latestCommission: latestPerformance ? Number(latestPerformance.commission) : 0,
      };
    });
  } catch (error) {
    console.error("Failed to fetch partners for portal:", error);
    throw error;
  }
}

// 파트너 성과 기록 추가
export async function addPartnerPerformance(data: {
  partnerId: string;
  period: string;
  salesAmount: number;
  commission: number;
  leadsCount: number;
  dealsClosed: number;
}) {
  try {
    await prisma.partnerPerformance.upsert({
      where: {
        partnerId_period: {
          partnerId: data.partnerId,
          period: data.period,
        },
      },
      update: {
        salesAmount: data.salesAmount,
        commission: data.commission,
        leadsCount: data.leadsCount,
        dealsClosed: data.dealsClosed,
      },
      create: data,
    });

    revalidatePath('/dashboard/partners');
    revalidatePath('/dashboard/partners/performance');
    return { success: true };
  } catch (error) {
    console.error("Failed to add partner performance:", error);
    return { success: false, error: String(error) };
  }
}
