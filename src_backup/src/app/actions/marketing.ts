"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==================== 쿠폰 관리 ====================

// 쿠폰 목록 조회
export async function getCoupons(filters?: {
  status?: "active" | "expired" | "all";
  targetSegment?: string;
}) {
  const where: any = {};

  if (filters?.status === "active") {
    where.isActive = true;
    where.validUntil = { gte: new Date() };
  } else if (filters?.status === "expired") {
    where.OR = [
      { isActive: false },
      { validUntil: { lt: new Date() } },
    ];
  }

  if (filters?.targetSegment) {
    where.targetSegment = filters.targetSegment;
  }

  const coupons = await prisma.coupon.findMany({
    where,
    include: {
      _count: {
        select: { usages: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return coupons.map((coupon: any) => ({
    ...coupon,
    discountValue: Number(coupon.discountValue),
    minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
    maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null,
    usageCount: coupon._count.usages,
  }));
}

// 쿠폰 상세 조회
export async function getCouponById(id: string) {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: {
      usages: {
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { usedAt: "desc" },
        take: 50,
      },
      _count: {
        select: { usages: true },
      },
    },
  });

  if (!coupon) return null;

  return {
    ...coupon,
    discountValue: Number(coupon.discountValue),
    minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
    maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null,
    usageCount: coupon._count.usages,
    usages: coupon.usages.map((usage: any) => ({
      ...usage,
      discountAmount: Number(usage.discountAmount),
    })),
  };
}

// 쿠폰 생성
export async function createCoupon(data: {
  code: string;
  name: string;
  description?: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usagePerCustomer?: number;
  targetSegment?: string;
  targetCustomers?: string[];
}) {
  const coupon = await prisma.coupon.create({
    data: {
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderAmount: data.minOrderAmount,
      maxDiscountAmount: data.maxDiscountAmount,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      usageLimit: data.usageLimit,
      usagePerCustomer: data.usagePerCustomer || 1,
      targetSegment: data.targetSegment,
      targetCustomers: data.targetCustomers ? JSON.stringify(data.targetCustomers) : null,
    },
  });

  revalidatePath("/dashboard/marketing");
  return coupon;
}

// 쿠폰 수정
export async function updateCoupon(id: string, data: Partial<{
  name: string;
  description: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number;
  usagePerCustomer: number;
  targetSegment: string;
  isActive: boolean;
}>) {
  const coupon = await prisma.coupon.update({
    where: { id },
    data,
  });

  revalidatePath("/dashboard/marketing");
  return coupon;
}

// 쿠폰 삭제
export async function deleteCoupon(id: string) {
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/dashboard/marketing");
  return { success: true };
}

// 쿠폰 코드 생성 유틸
export async function generateCouponCode(prefix: string = "COUPON") {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `${prefix}-${randomPart}`;
  
  // 중복 체크
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    return generateCouponCode(prefix); // 재귀 호출
  }
  
  return code;
}

// ==================== 쿠폰 발급 ====================

// 특정 고객에게 쿠폰 발급 (수동)
export async function issueCouponToCustomer(couponId: string, customerId: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) throw new Error("쿠폰을 찾을 수 없습니다.");

  // 이미 발급받았는지 확인
  const existingUsage = await prisma.couponUsage.count({
    where: { couponId, customerId },
  });

  if (existingUsage >= coupon.usagePerCustomer) {
    throw new Error("이미 최대 발급 횟수에 도달했습니다.");
  }

  // 발급 기록 (사용 전 상태)
  // 실제로는 발급 테이블을 따로 만들 수 있지만, 여기서는 간단히 처리
  return { success: true, couponCode: coupon.code };
}

// 세그먼트별 대량 쿠폰 발급
export async function issueCouponToSegment(couponId: string, segment: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) throw new Error("쿠폰을 찾을 수 없습니다.");

  // 해당 세그먼트 고객 조회
  const customers = await prisma.customer.findMany({
    where: { segment, status: "ACTIVE" },
    select: { id: true, name: true, email: true },
  });

  // 쿠폰 타겟 세그먼트 업데이트
  await prisma.coupon.update({
    where: { id: couponId },
    data: { targetSegment: segment },
  });

  revalidatePath("/dashboard/marketing");

  return {
    success: true,
    issuedCount: customers.length,
    customers: customers.slice(0, 10), // 미리보기용
  };
}

// 조건 기반 자동 쿠폰 발급
export async function issueAutoCoupons(conditions: {
  segment?: string;
  minOrders?: number;
  maxOrders?: number;
  minTotalSpent?: number;
  dormantDays?: number; // 휴면 고객 (N일 이상 주문 없음)
}, couponId: string) {
  const where: any = { status: "ACTIVE" };

  if (conditions.segment) {
    where.segment = conditions.segment;
  }

  // 고객 조회
  let customers = await prisma.customer.findMany({
    where,
    include: {
      orders: {
        select: { id: true, totalAmount: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // 조건 필터링
  customers = customers.filter((customer: any) => {
    const orderCount = customer.orders.length;
    const totalSpent = customer.orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
    const lastOrderDate = customer.orders[0]?.createdAt;
    const daysSinceLastOrder = lastOrderDate
      ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    if (conditions.minOrders && orderCount < conditions.minOrders) return false;
    if (conditions.maxOrders && orderCount > conditions.maxOrders) return false;
    if (conditions.minTotalSpent && totalSpent < conditions.minTotalSpent) return false;
    if (conditions.dormantDays && daysSinceLastOrder < conditions.dormantDays) return false;

    return true;
  });

  // 타겟 고객 ID 저장
  const customerIds = customers.map((c: any) => c.id);
  await prisma.coupon.update({
    where: { id: couponId },
    data: { targetCustomers: JSON.stringify(customerIds) },
  });

  revalidatePath("/dashboard/marketing");

  return {
    success: true,
    targetCount: customers.length,
    customers: customers.slice(0, 10).map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      orderCount: c.orders.length,
    })),
  };
}

// ==================== 쿠폰 사용 ====================

// 쿠폰 유효성 검증
export async function validateCoupon(code: string, customerId: string, orderAmount: number) {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      usages: {
        where: { customerId },
      },
    },
  });

  if (!coupon) {
    return { valid: false, error: "존재하지 않는 쿠폰입니다." };
  }

  if (!coupon.isActive) {
    return { valid: false, error: "비활성화된 쿠폰입니다." };
  }

  const now = new Date();
  if (now < coupon.validFrom) {
    return { valid: false, error: "아직 사용 기간이 아닙니다." };
  }

  if (now > coupon.validUntil) {
    return { valid: false, error: "만료된 쿠폰입니다." };
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, error: "쿠폰 사용 한도가 초과되었습니다." };
  }

  if (coupon.usages.length >= coupon.usagePerCustomer) {
    return { valid: false, error: "이미 사용한 쿠폰입니다." };
  }

  if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
    return { 
      valid: false, 
      error: `최소 주문 금액은 ${Number(coupon.minOrderAmount).toLocaleString()}원입니다.` 
    };
  }

  // 타겟 세그먼트 확인
  if (coupon.targetSegment) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { segment: true },
    });
    if (customer?.segment !== coupon.targetSegment) {
      return { valid: false, error: "해당 쿠폰을 사용할 수 없는 고객입니다." };
    }
  }

  // 할인 금액 계산
  let discountAmount: number;
  if (coupon.discountType === "PERCENT") {
    discountAmount = Math.floor(orderAmount * Number(coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
    }
  } else {
    discountAmount = Number(coupon.discountValue);
  }

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
    },
    discountAmount,
    finalAmount: orderAmount - discountAmount,
  };
}

// 쿠폰 사용 처리
export async function useCoupon(couponId: string, customerId: string, orderId: string, discountAmount: number) {
  await prisma.$transaction([
    prisma.couponUsage.create({
      data: {
        couponId,
        customerId,
        orderId,
        discountAmount,
      },
    }),
    prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    }),
  ]);

  return { success: true };
}

// ==================== 캠페인 관리 ====================

export async function getCampaigns(filters?: {
  status?: string;
  type?: string;
}) {
  const where: any = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.type) {
    where.type = filters.type;
  }

  const campaigns = await prisma.campaign.findMany({
    where,
    include: {
      coupon: {
        select: { id: true, code: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return campaigns.map((c: any) => ({
    ...c,
    budget: c.budget ? Number(c.budget) : null,
    spent: Number(c.spent),
    roi: Number(c.roi),
  }));
}

export async function createCampaign(data: {
  name: string;
  description?: string;
  type: string;
  targetSegment?: string;
  targetCondition?: object;
  couponId?: string;
  budget?: number;
  startDate: Date;
  endDate: Date;
}) {
  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      targetSegment: data.targetSegment,
      targetCondition: data.targetCondition ? JSON.stringify(data.targetCondition) : null,
      couponId: data.couponId,
      budget: data.budget,
      startDate: data.startDate,
      endDate: data.endDate,
    },
  });

  revalidatePath("/dashboard/marketing");
  return campaign;
}

export async function updateCampaignStatus(id: string, status: string) {
  await prisma.campaign.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/dashboard/marketing");
  return { success: true };
}

// ==================== 마케팅 통계 ====================

export async function getMarketingStats() {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCoupons,
    activeCoupons,
    totalUsages,
    thisMonthUsages,
    activeCampaigns,
  ] = await Promise.all([
    prisma.coupon.count(),
    prisma.coupon.count({
      where: { isActive: true, validUntil: { gte: now } },
    }),
    prisma.couponUsage.count(),
    prisma.couponUsage.count({
      where: { usedAt: { gte: thisMonth } },
    }),
    prisma.campaign.count({
      where: { status: "ACTIVE" },
    }),
  ]);

  // 총 할인 금액
  const discountSum = await prisma.couponUsage.aggregate({
    _sum: { discountAmount: true },
  });

  return {
    totalCoupons,
    activeCoupons,
    totalUsages,
    thisMonthUsages,
    activeCampaigns,
    totalDiscount: Number(discountSum._sum.discountAmount || 0),
  };
}

// ==================== 자동화 규칙 ====================

export async function getAutomationRules() {
  return prisma.automationRule.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createAutomationRule(data: {
  name: string;
  description?: string;
  triggerType: string;
  triggerCondition?: object;
  actionType: string;
  actionConfig?: object;
}) {
  const rule = await prisma.automationRule.create({
    data: {
      name: data.name,
      description: data.description,
      triggerType: data.triggerType,
      triggerCondition: data.triggerCondition ? JSON.stringify(data.triggerCondition) : null,
      actionType: data.actionType,
      actionConfig: data.actionConfig ? JSON.stringify(data.actionConfig) : null,
    },
  });

  revalidatePath("/dashboard/marketing");
  return rule;
}

export async function toggleAutomationRule(id: string, isActive: boolean) {
  await prisma.automationRule.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/dashboard/marketing");
  return { success: true };
}

// ==================== 재구매 알림 ====================

// 재구매 대상 고객 조회 (마지막 주문 후 N일 경과)
export async function getRepurchaseTargetCustomers(daysSinceLastOrder: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastOrder);

  const customers = await prisma.customer.findMany({
    where: {
      status: "ACTIVE",
      orders: {
        some: {}, // 주문 이력이 있는 고객만
      },
    },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, createdAt: true, totalAmount: true, productInfo: true },
      },
    },
  });

  // 마지막 주문이 cutoffDate 이전인 고객만 필터링
  const targetCustomers = customers.filter((c: any) => {
    const lastOrder = c.orders[0];
    return lastOrder && new Date(lastOrder.createdAt) < cutoffDate;
  });

  return targetCustomers.map((c: any) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    segment: c.segment,
    lastOrderDate: c.orders[0]?.createdAt,
    lastOrderAmount: c.orders[0] ? Number(c.orders[0].totalAmount) : 0,
    lastOrderProduct: c.orders[0]?.productInfo,
    daysSinceOrder: Math.floor((Date.now() - new Date(c.orders[0]?.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
  }));
}

// 재구매 알림 발송 (시뮬레이션)
export async function sendRepurchaseNotifications(customerIds: string[], message?: string) {
  // 실제로는 SMS, 이메일, 푸시 등 발송
  // 여기서는 시뮬레이션
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, email: true, phone: true },
  });

  // 알림 발송 로그 기록 (향후 NotificationLog 테이블 추가 가능)
  console.log(`재구매 알림 발송: ${customers.length}명에게 발송`);

  return {
    success: true,
    sentCount: customers.length,
    customers: customers.slice(0, 10),
    message: message || "고객님, 다시 방문해주세요! 특별 혜택을 준비했습니다.",
  };
}

// ==================== 이탈고객 재유입 ====================

// 이탈 위험/휴면 고객 조회
export async function getChurnRiskCustomers(dormantDays: number = 60) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - dormantDays);

  const customers = await prisma.customer.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, createdAt: true, totalAmount: true },
      },
    },
  });

  // 휴면 고객 (N일 이상 주문 없음)
  const churnRiskCustomers = customers.filter((c: any) => {
    if (c.orders.length === 0) return true; // 주문 이력 없음
    const lastOrderDate = new Date(c.orders[0].createdAt);
    return lastOrderDate < cutoffDate;
  });

  return churnRiskCustomers.map((c: any) => {
    const lastOrder = c.orders[0];
    const totalSpent = c.orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
    const daysSinceLastOrder = lastOrder
      ? Math.floor((Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      segment: c.segment,
      orderCount: c.orders.length,
      totalSpent,
      lastOrderDate: lastOrder?.createdAt || null,
      daysSinceLastOrder,
      churnRisk: daysSinceLastOrder > 90 ? "HIGH" : daysSinceLastOrder > 60 ? "MEDIUM" : "LOW",
    };
  });
}

// 이탈고객 재유입 캠페인 발송
export async function sendWinbackCampaign(customerIds: string[], couponId?: string) {
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, email: true },
  });

  let couponInfo = null;
  if (couponId) {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      select: { code: true, name: true, discountType: true, discountValue: true },
    });
    couponInfo = coupon;
  }

  // 고객 세그먼트를 휴면에서 활성으로 변경 (재유입 시도 표시)
  // 실제로는 별도 상태 관리가 필요할 수 있음

  return {
    success: true,
    sentCount: customers.length,
    customers: customers.slice(0, 10),
    coupon: couponInfo,
    message: couponInfo 
      ? `고객님을 위한 특별 쿠폰: ${couponInfo.name} (${couponInfo.code})`
      : "고객님, 오랜만이에요! 다시 만나서 반갑습니다.",
  };
}

// ==================== 이벤트/프로모션 알림 ====================

// 이벤트 대상 고객 조회
export async function getEventTargetCustomers(segment?: string, minOrders?: number) {
  const where: any = { status: "ACTIVE" };
  
  if (segment) {
    where.segment = segment;
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      orders: {
        select: { id: true, totalAmount: true },
      },
    },
  });

  let targetCustomers = customers;

  if (minOrders) {
    targetCustomers = customers.filter((c: any) => c.orders.length >= minOrders);
  }

  return targetCustomers.map((c: any) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    segment: c.segment,
    orderCount: c.orders.length,
    totalSpent: c.orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0),
  }));
}

// 이벤트 알림 발송
export async function sendEventNotification(
  customerIds: string[], 
  eventInfo: { title: string; description: string; startDate?: string; endDate?: string }
) {
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, email: true },
  });

  return {
    success: true,
    sentCount: customers.length,
    customers: customers.slice(0, 10),
    event: eventInfo,
  };
}

// ==================== 고객 세그먼트 업데이트 ====================

// 고객 세그먼트 자동 분류
export async function updateCustomerSegments() {
  const customers = await prisma.customer.findMany({
    include: {
      orders: {
        select: { id: true, totalAmount: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  let updateResults = { VIP: 0, REGULAR: 0, NEW: 0, DORMANT: 0 };

  for (const customer of customers) {
    const orderCount = customer.orders.length;
    const totalSpent = customer.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const lastOrderDate = customer.orders[0]?.createdAt;
    const isNew = new Date(customer.createdAt) > thirtyDaysAgo;

    let newSegment: string;

    if (orderCount === 0 && isNew) {
      newSegment = "NEW";
    } else if (lastOrderDate && new Date(lastOrderDate) < sixtyDaysAgo) {
      newSegment = "DORMANT";
    } else if (totalSpent >= 500000 || orderCount >= 5) {
      newSegment = "VIP";
    } else {
      newSegment = "REGULAR";
    }

    if (customer.segment !== newSegment) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { segment: newSegment },
      });
      updateResults[newSegment as keyof typeof updateResults]++;
    }
  }

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/marketing");

  return {
    success: true,
    updated: updateResults,
    total: Object.values(updateResults).reduce((a, b) => a + b, 0),
  };
}

// ==================== 캠페인 효과 분석 ====================

// 캠페인별 성과 데이터 조회
export async function getCampaignAnalytics(campaignId?: string) {
  const where = campaignId ? { id: campaignId } : {};

  const campaigns = await prisma.campaign.findMany({
    where,
    include: {
      coupon: {
        include: {
          usages: {
            select: { id: true, discountAmount: true, customerId: true, orderId: true, usedAt: true },
          },
        },
      },
    },
  });

  return campaigns.map((campaign: any) => {
    const usages = campaign.coupon?.usages || [];
    const totalDiscount = usages.reduce((sum: number, u: any) => sum + Number(u.discountAmount), 0);
    const uniqueCustomers = new Set(usages.map((u: any) => u.customerId)).size;
    
    return {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      budget: Number(campaign.budget || 0),
      spent: Number(campaign.spent || 0),
      roi: Number(campaign.roi || 0),
      couponUsageCount: usages.length,
      totalDiscount,
      uniqueCustomers,
      conversionRate: uniqueCustomers > 0 ? (usages.length / uniqueCustomers * 100) : 0,
    };
  });
}