'use server'

import { prisma } from '@/lib/prisma';

export async function getPartners() {
  if (!prisma.partner) {
    throw new Error('Partner model not found. Please restart the server to apply database changes.');
  }

  try {
    const partners = await prisma.partner.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        performances: {
          orderBy: { period: 'desc' },
          take: 1,
        },
      },
    });
    return partners;
  } catch (error) {
    console.error('Error fetching partners:', error);
    throw new Error('Failed to fetch partners');
  }
}

export async function getPartnerStats() {
  if (!prisma.partner || !prisma.partnerPerformance) {
    throw new Error('Partner models not found. Please restart the server to apply database changes.');
  }

  try {
    const totalPartners = await prisma.partner.count();
    const activePartners = await prisma.partner.count({
      where: { status: 'ACTIVE' },
    });
    
    // Get total sales from all performances
    const performances = await prisma.partnerPerformance.findMany();
    const totalSales = performances.reduce((acc, curr) => acc + Number(curr.salesAmount), 0);
    const totalCommission = performances.reduce((acc, curr) => acc + Number(curr.commission), 0);

    return {
      totalPartners,
      activePartners,
      totalSales,
      totalCommission,
    };
  } catch (error) {
    console.error('Error fetching partner stats:', error);
    throw new Error('Failed to fetch partner stats');
  }
}

export async function getPartnerPerformanceData() {
  if (!prisma.partnerPerformance) {
    throw new Error('PartnerPerformance model not found. Please restart the server to apply database changes.');
  }

  try {
    // Get aggregated performance by period
    const performances = await prisma.partnerPerformance.findMany({
      orderBy: { period: 'asc' },
    });

    // Group by period
    const groupedByPeriod = performances.reduce((acc, curr) => {
      const period = curr.period;
      if (!acc[period]) {
        acc[period] = {
          period,
          salesAmount: 0,
          commission: 0,
          leadsCount: 0,
          dealsClosed: 0,
        };
      }
      acc[period].salesAmount += Number(curr.salesAmount);
      acc[period].commission += Number(curr.commission);
      acc[period].leadsCount += curr.leadsCount;
      acc[period].dealsClosed += curr.dealsClosed;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedByPeriod);
  } catch (error) {
    console.error('Error fetching partner performance data:', error);
    throw new Error('Failed to fetch partner performance data');
  }
}
