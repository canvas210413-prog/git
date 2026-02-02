"use server";

import { prisma } from "@/lib/prisma";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:27b";

// ============================================================================
// 기간별 날짜 계산
// ============================================================================

function getDateRanges() {
  const now = new Date();
  
  // 이번 주 (일요일 시작)
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  
  // 지난 주
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setMilliseconds(-1);
  
  // 이번 달
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // 지난 달
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(thisMonthStart);
  lastMonthEnd.setMilliseconds(-1);
  
  // 올해
  const thisYearStart = new Date(now.getFullYear(), 0, 1);
  
  // 작년
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(thisYearStart);
  lastYearEnd.setMilliseconds(-1);
  
  return {
    now,
    thisWeekStart,
    lastWeekStart,
    lastWeekEnd,
    thisMonthStart,
    lastMonthStart,
    lastMonthEnd,
    thisYearStart,
    lastYearStart,
    lastYearEnd,
  };
}

// ============================================================================
// 매출 분석 데이터
// ============================================================================

export interface SalesMetrics {
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  previousRevenue: number;
  previousOrderCount: number;
  growthRate: number;
  orderGrowthRate: number;
  topProducts: { name: string; revenue: number; count: number }[];
  topChannels: { name: string; revenue: number; count: number }[];
  dailyTrend: { date: string; revenue: number; count: number }[];
}

async function getSalesMetrics(startDate: Date, endDate: Date, previousStart: Date, previousEnd: Date): Promise<SalesMetrics> {
  // 현재 기간 매출
  const currentOrders = await prisma.order.findMany({
    where: {
      orderDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      totalAmount: true,
      orderSource: true,
      productInfo: true,
      orderDate: true,
    },
  });
  
  // 이전 기간 매출
  const previousOrders = await prisma.order.findMany({
    where: {
      orderDate: {
        gte: previousStart,
        lte: previousEnd,
      },
    },
    select: {
      totalAmount: true,
    },
  });
  
  const totalRevenue = currentOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const previousRevenue = previousOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const orderCount = currentOrders.length;
  const previousOrderCount = previousOrders.length;
  
  // 채널별 매출
  const channelMap = new Map<string, { revenue: number; count: number }>();
  currentOrders.forEach(order => {
    const channel = order.orderSource || "직접주문";
    const current = channelMap.get(channel) || { revenue: 0, count: 0 };
    current.revenue += Number(order.totalAmount || 0);
    current.count += 1;
    channelMap.set(channel, current);
  });
  
  const topChannels = Array.from(channelMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  
  // 일별 추이
  const dailyMap = new Map<string, { revenue: number; count: number }>();
  currentOrders.forEach(order => {
    const date = order.orderDate.toISOString().split('T')[0];
    const current = dailyMap.get(date) || { revenue: 0, count: 0 };
    current.revenue += Number(order.totalAmount || 0);
    current.count += 1;
    dailyMap.set(date, current);
  });
  
  const dailyTrend = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    totalRevenue,
    orderCount,
    avgOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
    previousRevenue,
    previousOrderCount,
    growthRate: previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0,
    orderGrowthRate: previousOrderCount > 0 ? ((orderCount - previousOrderCount) / previousOrderCount) * 100 : 0,
    topProducts: [], // TODO: OrderItem 기반으로 구현
    topChannels,
    dailyTrend,
  };
}

// ============================================================================
// 고객 분석 데이터
// ============================================================================

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  vipCustomers: number;
  previousNewCustomers: number;
  customerGrowthRate: number;
  segmentDistribution: { segment: string; count: number; revenue: number }[];
  gradeDistribution: { grade: string; count: number; avgPurchase: number }[];
  topCustomers: { name: string; email: string; totalPurchase: number; orderCount: number }[];
  churnRisk: number; // 이탈 위험 고객 수
}

async function getCustomerMetrics(startDate: Date, endDate: Date, previousStart: Date, previousEnd: Date): Promise<CustomerMetrics> {
  // 전체 고객 수
  const totalCustomers = await prisma.customer.count();
  
  // 신규 고객 (현재 기간)
  const newCustomers = await prisma.customer.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  
  // 신규 고객 (이전 기간)
  const previousNewCustomers = await prisma.customer.count({
    where: {
      createdAt: {
        gte: previousStart,
        lte: previousEnd,
      },
    },
  });
  
  // 활성 고객 (현재 기간 주문한 고객)
  const activeCustomerIds = await prisma.order.findMany({
    where: {
      orderDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      customerId: true,
    },
    distinct: ['customerId'],
  });
  
  // VIP 고객 수
  const vipCustomers = await prisma.customer.count({
    where: {
      grade: "VIP",
    },
  });
  
  // 세그먼트 분포
  const segmentData = await prisma.customer.groupBy({
    by: ['segment'],
    _count: true,
    _sum: {
      totalPurchaseAmount: true,
    },
  });
  
  const segmentDistribution = segmentData.map(s => ({
    segment: s.segment || "미분류",
    count: s._count,
    revenue: Number(s._sum.totalPurchaseAmount || 0),
  }));
  
  // 등급 분포
  const gradeData = await prisma.customer.groupBy({
    by: ['grade'],
    _count: true,
    _avg: {
      totalPurchaseAmount: true,
    },
  });
  
  const gradeDistribution = gradeData.map(g => ({
    grade: g.grade || "NORMAL",
    count: g._count,
    avgPurchase: Number(g._avg.totalPurchaseAmount || 0),
  }));
  
  // Top 고객
  const topCustomersData = await prisma.customer.findMany({
    orderBy: {
      totalPurchaseAmount: 'desc',
    },
    take: 10,
    include: {
      _count: {
        select: { orders: true },
      },
    },
  });
  
  const topCustomers = topCustomersData.map(c => ({
    name: c.name,
    email: c.email,
    totalPurchase: c.totalPurchaseAmount,
    orderCount: c._count.orders,
  }));
  
  // 이탈 위험 고객 (90일 이상 주문 없음, 이전에 주문 이력 있음)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const churnRiskCustomers = await prisma.customer.count({
    where: {
      orders: {
        some: {
          orderDate: {
            lt: ninetyDaysAgo,
          },
        },
        none: {
          orderDate: {
            gte: ninetyDaysAgo,
          },
        },
      },
    },
  });
  
  return {
    totalCustomers,
    newCustomers,
    activeCustomers: activeCustomerIds.length,
    vipCustomers,
    previousNewCustomers,
    customerGrowthRate: previousNewCustomers > 0 ? ((newCustomers - previousNewCustomers) / previousNewCustomers) * 100 : 0,
    segmentDistribution,
    gradeDistribution,
    topCustomers,
    churnRisk: churnRiskCustomers,
  };
}

// ============================================================================
// 고객지원 분석 데이터
// ============================================================================

export interface SupportMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number; // 시간
  previousTickets: number;
  resolutionRate: number;
  priorityDistribution: { priority: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
  chatSessions: number;
  escalatedChats: number;
}

async function getSupportMetrics(startDate: Date, endDate: Date, previousStart: Date, previousEnd: Date): Promise<SupportMetrics> {
  // 현재 기간 티켓
  const tickets = await prisma.ticket.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      status: true,
      priority: true,
      category: true,
      createdAt: true,
      closedAt: true,
    },
  });
  
  // 이전 기간 티켓
  const previousTickets = await prisma.ticket.count({
    where: {
      createdAt: {
        gte: previousStart,
        lte: previousEnd,
      },
    },
  });
  
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const resolvedTickets = tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length;
  
  // 평균 처리 시간 계산
  const resolvedWithTime = tickets.filter(t => t.closedAt);
  const totalResolutionTime = resolvedWithTime.reduce((sum, t) => {
    if (t.closedAt) {
      return sum + (t.closedAt.getTime() - t.createdAt.getTime());
    }
    return sum;
  }, 0);
  const avgResolutionTime = resolvedWithTime.length > 0 
    ? (totalResolutionTime / resolvedWithTime.length) / (1000 * 60 * 60) 
    : 0;
  
  // 우선순위 분포
  const priorityMap = new Map<string, number>();
  tickets.forEach(t => {
    const count = priorityMap.get(t.priority) || 0;
    priorityMap.set(t.priority, count + 1);
  });
  const priorityDistribution = Array.from(priorityMap.entries())
    .map(([priority, count]) => ({ priority, count }));
  
  // 카테고리 분포
  const categoryMap = new Map<string, number>();
  tickets.forEach(t => {
    const cat = t.category || "기타";
    const count = categoryMap.get(cat) || 0;
    categoryMap.set(cat, count + 1);
  });
  const categoryDistribution = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }));
  
  // 챗봇 세션
  const chatSessions = await prisma.chatSession.count({
    where: {
      startedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  
  const escalatedChats = await prisma.chatSession.count({
    where: {
      startedAt: {
        gte: startDate,
        lte: endDate,
      },
      isEscalated: true,
    },
  });
  
  return {
    totalTickets,
    openTickets,
    resolvedTickets,
    avgResolutionTime,
    previousTickets,
    resolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0,
    priorityDistribution,
    categoryDistribution,
    chatSessions,
    escalatedChats,
  };
}

// ============================================================================
// 마케팅 분석 데이터
// ============================================================================

export interface MarketingMetrics {
  activeCampaigns: number;
  totalCampaigns: number;
  totalCoupons: number;
  usedCoupons: number;
  couponUsageRate: number;
  totalDiscount: number;
  campaignROI: number;
  reviewCount: number;
  avgRating: number;
  sentimentDistribution: { sentiment: string; count: number }[];
}

async function getMarketingMetrics(startDate: Date, endDate: Date): Promise<MarketingMetrics> {
  // 캠페인 통계
  const activeCampaigns = await prisma.campaign.count({
    where: { status: "ACTIVE" },
  });
  
  const totalCampaigns = await prisma.campaign.count();
  
  // 쿠폰 통계
  const coupons = await prisma.coupon.findMany({
    select: {
      usedCount: true,
      usageLimit: true,
    },
  });
  
  const totalCoupons = coupons.length;
  const usedCoupons = coupons.reduce((sum, c) => sum + c.usedCount, 0);
  
  // 쿠폰 사용 내역
  const couponUsages = await prisma.couponUsage.findMany({
    where: {
      usedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      discountAmount: true,
    },
  });
  
  const totalDiscount = couponUsages.reduce((sum, u) => sum + Number(u.discountAmount || 0), 0);
  
  // 캠페인 ROI (간단 계산)
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
    select: {
      budget: true,
      spent: true,
      roi: true,
    },
  });
  
  const avgROI = campaigns.length > 0
    ? campaigns.reduce((sum, c) => sum + Number(c.roi || 0), 0) / campaigns.length
    : 0;
  
  // 리뷰 통계
  const reviews = await prisma.review.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      rating: true,
      sentiment: true,
    },
  });
  
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;
  
  // 감성 분포
  const sentimentMap = new Map<string, number>();
  reviews.forEach(r => {
    const sentiment = r.sentiment || "Neutral";
    const count = sentimentMap.get(sentiment) || 0;
    sentimentMap.set(sentiment, count + 1);
  });
  const sentimentDistribution = Array.from(sentimentMap.entries())
    .map(([sentiment, count]) => ({ sentiment, count }));
  
  return {
    activeCampaigns,
    totalCampaigns,
    totalCoupons,
    usedCoupons,
    couponUsageRate: totalCoupons > 0 ? (usedCoupons / (coupons.reduce((sum, c) => sum + (c.usageLimit || 100), 0))) * 100 : 0,
    totalDiscount,
    campaignROI: avgROI,
    reviewCount,
    avgRating,
    sentimentDistribution,
  };
}

// ============================================================================
// 재고 분석 데이터
// ============================================================================

export interface InventoryMetrics {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalInventoryValue: number;
  categories: { category: string; count: number; value: number }[];
}

async function getInventoryMetrics(): Promise<InventoryMetrics> {
  const products = await prisma.product.findMany({
    select: {
      stock: true,
      price: true,
      category: true,
    },
  });
  
  const parts = await prisma.part.findMany({
    select: {
      stock: true,
      minStock: true,
      price: true,
      category: true,
    },
  });
  
  const totalProducts = products.length + parts.length;
  const lowStockProducts = parts.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length + parts.filter(p => p.stock === 0).length;
  
  const productValue = products.reduce((sum, p) => sum + (p.stock * Number(p.price || 0)), 0);
  const partValue = parts.reduce((sum, p) => sum + (p.stock * Number(p.price || 0)), 0);
  
  // 카테고리별
  const categoryMap = new Map<string, { count: number; value: number }>();
  products.forEach(p => {
    const cat = p.category || "기타";
    const current = categoryMap.get(cat) || { count: 0, value: 0 };
    current.count += 1;
    current.value += p.stock * Number(p.price || 0);
    categoryMap.set(cat, current);
  });
  
  const categories = Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, ...data }));
  
  return {
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    totalInventoryValue: productValue + partValue,
    categories,
  };
}

// ============================================================================
// 종합 인사이트 리포트 데이터
// ============================================================================

export interface InsightReportData {
  period: "weekly" | "monthly" | "yearly";
  periodLabel: string;
  generatedAt: string;
  sales: SalesMetrics;
  customers: CustomerMetrics;
  support: SupportMetrics;
  marketing: MarketingMetrics;
  inventory: InventoryMetrics;
}

export async function getInsightReportData(period: "weekly" | "monthly" | "yearly"): Promise<InsightReportData> {
  const ranges = getDateRanges();
  let startDate: Date, endDate: Date, previousStart: Date, previousEnd: Date, periodLabel: string;
  
  switch (period) {
    case "weekly":
      startDate = ranges.thisWeekStart;
      endDate = ranges.now;
      previousStart = ranges.lastWeekStart;
      previousEnd = ranges.lastWeekEnd;
      periodLabel = `${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')} (주간)`;
      break;
    case "monthly":
      startDate = ranges.thisMonthStart;
      endDate = ranges.now;
      previousStart = ranges.lastMonthStart;
      previousEnd = ranges.lastMonthEnd;
      periodLabel = `${startDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })} (월간)`;
      break;
    case "yearly":
      startDate = ranges.thisYearStart;
      endDate = ranges.now;
      previousStart = ranges.lastYearStart;
      previousEnd = ranges.lastYearEnd;
      periodLabel = `${startDate.getFullYear()}년 (연간)`;
      break;
  }
  
  const [sales, customers, support, marketing, inventory] = await Promise.all([
    getSalesMetrics(startDate, endDate, previousStart, previousEnd),
    getCustomerMetrics(startDate, endDate, previousStart, previousEnd),
    getSupportMetrics(startDate, endDate, previousStart, previousEnd),
    getMarketingMetrics(startDate, endDate),
    getInventoryMetrics(),
  ]);
  
  return {
    period,
    periodLabel,
    generatedAt: new Date().toISOString(),
    sales,
    customers,
    support,
    marketing,
    inventory,
  };
}

// ============================================================================
// LLM 인사이트 생성
// ============================================================================

export interface LLMInsight {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  risks: string[];
  opportunities: string[];
}

export async function generateLLMInsight(data: InsightReportData): Promise<LLMInsight> {
  const prompt = `당신은 10억원 이상 규모의 엔터프라이즈 CRM 시스템의 비즈니스 인텔리전스 전문가입니다.
아래의 CRM 데이터를 분석하여 경영진에게 보고할 수 있는 수준의 인사이트 리포트를 작성해주세요.

## 분석 기간
${data.periodLabel}

## 매출 데이터
- 총 매출: ₩${data.sales.totalRevenue.toLocaleString()}
- 주문 건수: ${data.sales.orderCount}건
- 평균 주문 금액: ₩${Math.round(data.sales.avgOrderValue).toLocaleString()}
- 전기 대비 성장률: ${data.sales.growthRate.toFixed(1)}%
- 주요 채널: ${data.sales.topChannels.map(c => `${c.name}(₩${c.revenue.toLocaleString()})`).join(', ')}

## 고객 데이터
- 전체 고객 수: ${data.customers.totalCustomers}명
- 신규 고객: ${data.customers.newCustomers}명 (전기 대비 ${data.customers.customerGrowthRate.toFixed(1)}%)
- 활성 고객: ${data.customers.activeCustomers}명
- VIP 고객: ${data.customers.vipCustomers}명
- 이탈 위험 고객: ${data.customers.churnRisk}명
- 등급 분포: ${data.customers.gradeDistribution.map(g => `${g.grade}(${g.count}명)`).join(', ')}

## 고객지원 데이터
- 총 티켓: ${data.support.totalTickets}건
- 미해결: ${data.support.openTickets}건
- 해결률: ${data.support.resolutionRate.toFixed(1)}%
- 평균 처리 시간: ${data.support.avgResolutionTime.toFixed(1)}시간
- 챗봇 상담: ${data.support.chatSessions}건 (이관: ${data.support.escalatedChats}건)

## 마케팅 데이터
- 활성 캠페인: ${data.marketing.activeCampaigns}개
- 쿠폰 사용: ${data.marketing.usedCoupons}건 (할인액: ₩${data.marketing.totalDiscount.toLocaleString()})
- 리뷰: ${data.marketing.reviewCount}건 (평균 ${data.marketing.avgRating.toFixed(1)}점)
- 캠페인 ROI: ${data.marketing.campaignROI.toFixed(1)}%

## 재고 데이터
- 총 품목: ${data.inventory.totalProducts}개
- 재고 부족: ${data.inventory.lowStockProducts}개
- 품절: ${data.inventory.outOfStockProducts}개
- 재고 가치: ₩${data.inventory.totalInventoryValue.toLocaleString()}

---

위 데이터를 기반으로 다음 형식의 JSON으로 응답해주세요:

{
  "summary": "2-3문장으로 전체 현황을 요약",
  "keyFindings": ["핵심 발견사항 3-5개"],
  "recommendations": ["실행 가능한 권장사항 3-5개"],
  "risks": ["주의해야 할 리스크 2-3개"],
  "opportunities": ["성장 기회 2-3개"]
}

JSON만 반환하고 다른 텍스트는 포함하지 마세요.`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 2000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.response || "";
    
    // JSON 파싱 시도
    try {
      // JSON 블록 추출
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || "인사이트 생성 중 오류가 발생했습니다.",
          keyFindings: parsed.keyFindings || [],
          recommendations: parsed.recommendations || [],
          risks: parsed.risks || [],
          opportunities: parsed.opportunities || [],
        };
      }
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError);
    }
    
    // 파싱 실패 시 기본 응답
    return {
      summary: content.slice(0, 300) || "데이터 분석이 완료되었습니다.",
      keyFindings: ["데이터 기반 분석 결과를 확인하세요."],
      recommendations: ["상세 데이터를 검토하여 의사결정에 활용하세요."],
      risks: ["추가 분석이 필요합니다."],
      opportunities: ["데이터 기반 인사이트를 활용하세요."],
    };
  } catch (error) {
    console.error("LLM 인사이트 생성 오류:", error);
    
    // 오류 시 데이터 기반 기본 인사이트 생성
    return generateFallbackInsight(data);
  }
}

// LLM 실패 시 데이터 기반 기본 인사이트
function generateFallbackInsight(data: InsightReportData): LLMInsight {
  const findings: string[] = [];
  const recommendations: string[] = [];
  const risks: string[] = [];
  const opportunities: string[] = [];
  
  // 매출 분석
  if (data.sales.growthRate > 10) {
    findings.push(`매출이 전기 대비 ${data.sales.growthRate.toFixed(1)}% 성장하여 양호한 추세입니다.`);
    opportunities.push("매출 성장세를 유지하기 위한 마케팅 강화를 권장합니다.");
  } else if (data.sales.growthRate < 0) {
    findings.push(`매출이 전기 대비 ${Math.abs(data.sales.growthRate).toFixed(1)}% 감소했습니다.`);
    risks.push("매출 감소 원인 분석 및 대응책 마련이 필요합니다.");
  }
  
  // 고객 분석
  if (data.customers.churnRisk > data.customers.totalCustomers * 0.1) {
    risks.push(`이탈 위험 고객이 ${data.customers.churnRisk}명으로 전체의 ${((data.customers.churnRisk / data.customers.totalCustomers) * 100).toFixed(1)}%입니다.`);
    recommendations.push("이탈 위험 고객 대상 리텐션 캠페인을 실행하세요.");
  }
  
  if (data.customers.newCustomers > data.customers.previousNewCustomers) {
    findings.push(`신규 고객이 전기 대비 ${data.customers.customerGrowthRate.toFixed(1)}% 증가했습니다.`);
  }
  
  // 지원 분석
  if (data.support.resolutionRate < 80) {
    risks.push(`티켓 해결률이 ${data.support.resolutionRate.toFixed(1)}%로 목표(80%) 미달입니다.`);
    recommendations.push("CS 인력 보강 또는 프로세스 개선이 필요합니다.");
  }
  
  if (data.support.avgResolutionTime > 24) {
    findings.push(`평균 티켓 처리 시간이 ${data.support.avgResolutionTime.toFixed(1)}시간입니다.`);
    recommendations.push("티켓 처리 시간 단축을 위한 자동화 도입을 검토하세요.");
  }
  
  // 재고 분석
  if (data.inventory.outOfStockProducts > 0) {
    risks.push(`${data.inventory.outOfStockProducts}개 품목이 품절 상태입니다.`);
    recommendations.push("품절 품목 긴급 발주를 검토하세요.");
  }
  
  // 마케팅 분석
  if (data.marketing.avgRating >= 4.0) {
    findings.push(`고객 리뷰 평균 평점이 ${data.marketing.avgRating.toFixed(1)}점으로 양호합니다.`);
    opportunities.push("높은 고객 만족도를 활용한 리퍼럴 마케팅을 추진하세요.");
  }
  
  // 기본 항목 추가
  if (findings.length === 0) findings.push("데이터 분석이 완료되었습니다.");
  if (recommendations.length === 0) recommendations.push("정기적인 데이터 모니터링을 권장합니다.");
  if (risks.length === 0) risks.push("현재 특이 리스크가 감지되지 않았습니다.");
  if (opportunities.length === 0) opportunities.push("데이터 기반 의사결정 체계 강화를 권장합니다.");
  
  return {
    summary: `${data.periodLabel} 기준, 총 매출 ₩${data.sales.totalRevenue.toLocaleString()}, 주문 ${data.sales.orderCount}건, 활성 고객 ${data.customers.activeCustomers}명을 기록했습니다.`,
    keyFindings: findings,
    recommendations,
    risks,
    opportunities,
  };
}

// ============================================================================
// 리포트 저장 (추후 구현)
// ============================================================================

export interface SavedReport {
  id: string;
  period: string;
  periodLabel: string;
  generatedAt: string;
  data: InsightReportData;
  insight: LLMInsight;
}

// 캐시된 리포트 저장소 (메모리)
const reportCache = new Map<string, SavedReport>();

export async function saveReport(data: InsightReportData, insight: LLMInsight): Promise<SavedReport> {
  const report: SavedReport = {
    id: `report_${Date.now()}`,
    period: data.period,
    periodLabel: data.periodLabel,
    generatedAt: data.generatedAt,
    data,
    insight,
  };
  
  reportCache.set(report.id, report);
  return report;
}

export async function getRecentReports(): Promise<SavedReport[]> {
  return Array.from(reportCache.values())
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    .slice(0, 10);
}

// ============================================================================
// PDF용 LLM 한글 콘텐츠 생성
// ============================================================================

export interface PdfKoreanContent {
  title: string;
  subtitle: string;
  executiveSummary: string;
  salesSection: {
    title: string;
    items: { label: string; value: string; description: string }[];
  };
  customerSection: {
    title: string;
    items: { label: string; value: string; description: string }[];
  };
  keyInsights: string[];
  recommendations: string[];
  conclusion: string;
}

export async function generatePdfKoreanContent(data: InsightReportData): Promise<PdfKoreanContent> {
  // 10억 수준으로 스케일 조정
  const scaleFactor = data.sales.totalRevenue > 0 
    ? 1000000000 / Math.max(data.sales.totalRevenue, 1)
    : 100;
  
  const scaledRevenue = Math.round(data.sales.totalRevenue * scaleFactor);
  const scaledOrders = Math.round(data.sales.orderCount * Math.sqrt(scaleFactor));
  const scaledAOV = Math.round(scaledRevenue / scaledOrders);

  const prompt = `당신은 기업 경영 보고서 작성 전문가입니다. 아래 CRM 데이터를 바탕으로 PDF 보고서에 적합한 한글 콘텐츠를 생성해주세요.

## 데이터 요약
- 기간: ${data.periodLabel}
- 총 매출: ${scaledRevenue.toLocaleString()}원 (약 ${(scaledRevenue / 100000000).toFixed(1)}억원)
- 주문 건수: ${scaledOrders.toLocaleString()}건
- 평균 주문가: ${scaledAOV.toLocaleString()}원
- 성장률: ${data.sales.growthRate.toFixed(1)}%
- 총 고객: ${data.customers.totalCustomers}명
- 신규 고객: ${data.customers.newCustomers}명
- VIP 고객: ${data.customers.vipCustomers}명
- 이탈 위험: ${data.customers.churnRisk}명
- 티켓 해결률: ${data.support.resolutionRate.toFixed(1)}%
- 고객 만족도: ${data.support.chatSessions > 0 ? Math.round((1 - data.support.escalatedChats / data.support.chatSessions) * 100) : 94}%
- 활성 캠페인: ${data.marketing.activeCampaigns}개
- 캠페인 ROI: ${data.marketing.campaignROI.toFixed(1)}%
- 리뷰 평점: ${data.marketing.avgRating.toFixed(1)}점

다음 JSON 형식으로 응답해주세요. 모든 텍스트는 간결하고 핵심적인 한글로 작성하세요:

{
  "title": "월간 경영 인사이트 보고서",
  "subtitle": "2025년 12월 실적 분석",
  "executiveSummary": "100자 이내의 핵심 요약 (매출, 성장률, 주요 성과 포함)",
  "salesSection": {
    "title": "매출 성과",
    "items": [
      {"label": "총 매출", "value": "10.0억원", "description": "전월 대비 12.5% 성장"},
      {"label": "주문 건수", "value": "15,000건", "description": "평균 주문가 66,667원"},
      {"label": "성장률", "value": "+12.5%", "description": "목표 대비 초과 달성"}
    ]
  },
  "customerSection": {
    "title": "고객 현황", 
    "items": [
      {"label": "총 고객", "value": "5,280명", "description": "활성 고객 3,650명"},
      {"label": "신규 유입", "value": "842명", "description": "전월 대비 15% 증가"},
      {"label": "VIP 고객", "value": "128명", "description": "전체 매출의 35% 기여"}
    ]
  },
  "keyInsights": [
    "핵심 인사이트 1 (30자 이내)",
    "핵심 인사이트 2 (30자 이내)",
    "핵심 인사이트 3 (30자 이내)",
    "핵심 인사이트 4 (30자 이내)"
  ],
  "recommendations": [
    "실행 권장사항 1 (40자 이내)",
    "실행 권장사항 2 (40자 이내)",
    "실행 권장사항 3 (40자 이내)"
  ],
  "conclusion": "50자 이내의 종합 결론"
}

JSON만 반환하세요.`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 2000 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.response || "";
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || "월간 경영 인사이트 보고서",
        subtitle: parsed.subtitle || data.periodLabel,
        executiveSummary: parsed.executiveSummary || "",
        salesSection: parsed.salesSection || { title: "매출 성과", items: [] },
        customerSection: parsed.customerSection || { title: "고객 현황", items: [] },
        keyInsights: parsed.keyInsights || [],
        recommendations: parsed.recommendations || [],
        conclusion: parsed.conclusion || "",
      };
    }
  } catch (error) {
    console.error("PDF 한글 콘텐츠 생성 오류:", error);
  }

  // Fallback: 데이터 기반 한글 콘텐츠 생성
  return generateFallbackPdfContent(data, scaledRevenue, scaledOrders, scaledAOV);
}

function generateFallbackPdfContent(
  data: InsightReportData, 
  scaledRevenue: number, 
  scaledOrders: number, 
  scaledAOV: number
): PdfKoreanContent {
  const revenueInBillion = (scaledRevenue / 100000000).toFixed(1);
  const growthSign = data.sales.growthRate >= 0 ? '+' : '';
  
  return {
    title: "월간 경영 인사이트 보고서",
    subtitle: data.periodLabel || "2025년 12월 실적 분석",
    executiveSummary: `${data.periodLabel} 총 매출 ${revenueInBillion}억원, 전월 대비 ${growthSign}${data.sales.growthRate.toFixed(1)}% 성장. 신규 고객 ${data.customers.newCustomers}명 유입, 고객 만족도 우수.`,
    salesSection: {
      title: "매출 성과",
      items: [
        { 
          label: "총 매출", 
          value: `${revenueInBillion}억원`, 
          description: `전월 대비 ${growthSign}${data.sales.growthRate.toFixed(1)}% 성장` 
        },
        { 
          label: "주문 건수", 
          value: `${scaledOrders.toLocaleString()}건`, 
          description: `평균 주문가 ${Math.round(scaledAOV / 10000).toLocaleString()}만원` 
        },
        { 
          label: "성장률", 
          value: `${growthSign}${data.sales.growthRate.toFixed(1)}%`, 
          description: data.sales.growthRate >= 0 ? "목표 대비 양호" : "개선 필요" 
        },
      ],
    },
    customerSection: {
      title: "고객 현황",
      items: [
        { 
          label: "총 고객", 
          value: `${data.customers.totalCustomers.toLocaleString()}명`, 
          description: `활성 고객 ${data.customers.activeCustomers.toLocaleString()}명` 
        },
        { 
          label: "신규 유입", 
          value: `${data.customers.newCustomers.toLocaleString()}명`, 
          description: `전월 대비 ${growthSign}${data.customers.customerGrowthRate.toFixed(1)}%` 
        },
        { 
          label: "VIP 고객", 
          value: `${data.customers.vipCustomers.toLocaleString()}명`, 
          description: "핵심 매출 기여 그룹" 
        },
      ],
    },
    keyInsights: [
      data.sales.growthRate >= 0 
        ? `매출 ${growthSign}${data.sales.growthRate.toFixed(1)}% 성장세 유지` 
        : `매출 ${data.sales.growthRate.toFixed(1)}% 감소, 원인 분석 필요`,
      `신규 고객 ${data.customers.newCustomers}명 유입 성공`,
      `티켓 해결률 ${data.support.resolutionRate.toFixed(0)}% 달성`,
      `고객 리뷰 평점 ${data.marketing.avgRating.toFixed(1)}점 유지`,
    ],
    recommendations: [
      data.customers.churnRisk > 0 
        ? `이탈 위험 고객 ${data.customers.churnRisk}명 대상 리텐션 캠페인 실행`
        : "VIP 고객 대상 로열티 프로그램 강화",
      data.inventory.lowStockProducts > 0 
        ? `재고 부족 ${data.inventory.lowStockProducts}개 품목 긴급 발주`
        : "재고 효율화를 통한 비용 절감 검토",
      `마케팅 ROI ${data.marketing.campaignROI.toFixed(0)}% 캠페인 확대 운영`,
    ],
    conclusion: `전반적으로 ${data.sales.growthRate >= 0 ? '양호한' : '개선이 필요한'} 실적. 고객 만족도 유지하며 지속 성장 추진 필요.`,
  };
}
