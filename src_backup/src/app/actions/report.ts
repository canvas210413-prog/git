"use server";

export async function getReportData() {
  // In a real app, this would aggregate data from Prisma
  // For now, we return mock data for the charts
  
  return {
    monthlyRevenue: [
      { name: "1월", total: 15000000 },
      { name: "2월", total: 23000000 },
      { name: "3월", total: 18000000 },
      { name: "4월", total: 32000000 },
      { name: "5월", total: 28000000 },
      { name: "6월", total: 45000000 },
    ],
    categorySales: [
      { name: "Enterprise", value: 45 },
      { name: "SMB", value: 30 },
      { name: "Startup", value: 15 },
      { name: "Personal", value: 10 },
    ],
    customerGrowth: [
      { name: "1월", active: 120, new: 30 },
      { name: "2월", active: 145, new: 35 },
      { name: "3월", active: 170, new: 40 },
      { name: "4월", active: 210, new: 55 },
      { name: "5월", active: 250, new: 45 },
      { name: "6월", active: 310, new: 70 },
    ],
    kpi: {
      totalRevenue: 161000000,
      avgDealSize: 3500000,
      customerRetention: 94.5,
      ticketResolutionTime: 4.2, // hours
    }
  };
}