"use server";

import { prisma } from "@/lib/prisma";

export async function getSegmentationData() {
  try {
    // In a real scenario, we would use groupBy, but for now let's fetch all and aggregate in JS
    // or use prisma.customer.groupBy if available (it is).
    
    // However, since we are in "Safe Mode" and DB might be down, we'll wrap this.
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        segment: true,
        orders: {
          select: {
            totalAmount: true,
          },
        },
      },
    });

    // Aggregate Data
    const segmentStats: Record<string, { count: number; revenue: number }> = {};

    customers.forEach((c: any) => {
      const seg = c.segment || "Uncategorized";
      if (!segmentStats[seg]) {
        segmentStats[seg] = { count: 0, revenue: 0 };
      }
      segmentStats[seg].count += 1;
      const customerRevenue = c.orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
      segmentStats[seg].revenue += customerRevenue;
    });

    const data = Object.entries(segmentStats).map(([name, stats]) => ({
      name,
      value: stats.count,
      revenue: stats.revenue,
    }));

    return { data };
  } catch (error) {
    console.error("Failed to fetch segmentation data:", error);
    throw error;
  }
}
