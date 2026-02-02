import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  try {
    // 현재 사용자의 협력사 정보 조회
    const userPartner = await getCurrentUserPartner();
    
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 날짜 범위 설정
    // startDate와 endDate가 모두 없으면 전체 기간 조회
    const hasDateFilter = startDate || endDate;
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : (hasDateFilter ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : new Date("2020-01-01"));

    // 전체 AS 데이터 (날짜 필터 및 협력사 필터)
    const whereClause: any = {};
    
    if (hasDateFilter) {
      whereClause.createdAt = {
        gte: start,
        lte: end,
      };
    }
    
    // 협력사 사용자는 자신의 협력사 데이터만 조회
    if (userPartner) {
      whereClause.companyName = userPartner;
    }

    const allAS = await prisma.afterservice.findMany({
      where: whereClause,
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 기본 통계 (4가지 상태: RECEIVED, IN_PROGRESS, AS, EXCHANGE)
    const totalCount = allAS.length;
    const receivedCount = allAS.filter((as) => as.status === "RECEIVED").length;
    const inProgressCount = allAS.filter((as) => as.status === "IN_PROGRESS").length;
    const asCount = allAS.filter((as) => as.status === "AS").length;
    const exchangeCount = allAS.filter((as) => as.status === "EXCHANGE").length;
    const completedCount = allAS.filter((as) => as.completedAt !== null).length;

    // 평균 처리 시간 (completedAt이 있는 건만)
    const completedAS = allAS.filter((as) => as.completedAt);
    let avgProcessingTime = 0;
    if (completedAS.length > 0) {
      const totalTime = completedAS.reduce((sum, as) => {
        const created = new Date(as.createdAt).getTime();
        const completed = as.completedAt ? new Date(as.completedAt).getTime() : created;
        return sum + (completed - created);
      }, 0);
      avgProcessingTime = Math.round(totalTime / completedAS.length / (1000 * 60 * 60)); // 시간 단위
    }

    // 해결률 (completedAt이 있는 것 / 전체)
    const resolutionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // 업체별 분포
    const companyDistribution = allAS.reduce((acc, as) => {
      const company = as.companyName || "미등록";
      acc[company] = (acc[company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 제품별 분포
    const productDistribution = allAS.reduce((acc, as) => {
      const product = as.productName || "미등록";
      acc[product] = (acc[product] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 우선순위별 분포
    const priorityDistribution = allAS.reduce((acc, as) => {
      acc[as.priority] = (acc[as.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 상태별 분포
    const statusDistribution = allAS.reduce((acc, as) => {
      acc[as.status] = (acc[as.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 담당자별 처리 건수
    const assigneeDistribution = allAS.reduce((acc, as) => {
      const name = as.user?.name || "미배정";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 비용 통계 (actualCost 사용)
    const totalCost = allAS.reduce((sum, as) => sum + (Number(as.actualCost) || 0), 0);
    const avgCost = totalCount > 0 ? Math.round(totalCost / totalCount) : 0;
    const estimatedTotalCost = allAS.reduce((sum, as) => sum + (Number(as.estimatedCost) || 0), 0);

    // 일별 접수 추이 (최근 7일)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    }).reverse();

    const dailyTrend = last7Days.map((date) => {
      const count = allAS.filter((as) => {
        const asDate = new Date(as.createdAt).toISOString().split("T")[0];
        return asDate === date;
      }).length;
      return { date, count };
    });

    // 응답 시간 분석 (접수 -> 배정)
    const assignedAS = allAS.filter((as) => as.assignedToId);
    let avgResponseTime = 0;
    if (assignedAS.length > 0) {
      const totalResponseTime = assignedAS.reduce((sum, as) => {
        const created = new Date(as.createdAt).getTime();
        const updated = new Date(as.updatedAt).getTime();
        return sum + (updated - created);
      }, 0);
      avgResponseTime = Math.round(totalResponseTime / assignedAS.length / (1000 * 60 * 60)); // 시간
    }

    return NextResponse.json({
      summary: {
        totalCount,
        completedCount,
        inProgressCount,
        receivedCount,
        asCount,
        exchangeCount,
        resolutionRate,
        avgProcessingTime,
        avgResponseTime,
      },
      costs: {
        totalCost,
        avgCost,
        estimatedTotalCost,
      },
      distributions: {
        company: companyDistribution,
        product: productDistribution,
        priority: priorityDistribution,
        status: statusDistribution,
        assignee: assigneeDistribution,
      },
      trends: {
        daily: dailyTrend,
      },
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error("KPI 조회 오류:", error);
    return NextResponse.json(
      { error: "KPI 조회 실패", details: String(error) },
      { status: 500 }
    );
  }
}
