"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 현재 로그인한 사용자의 협력사 정보를 조회합니다.
 * null이면 본사/어드민 (전체 접근), 값이 있으면 해당 협력사만 접근
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

/**
 * 사용자가 어드민 또는 본사 권한인지 확인
 */
async function isAdminUser(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return false;
    }
    const role = (session.user as any).role;
    const assignedPartner = (session.user as any).assignedPartner;
    
    // role이 ADMIN이거나 assignedPartner가 null이면 어드민
    return role === "ADMIN" || assignedPartner === null || assignedPartner === undefined;
  } catch (error) {
    console.error("권한 확인 실패:", error);
    return false;
  }
}

// ============================================================================
// Types
// ============================================================================

export interface PartnerProductStats {
  partner: string;
  productName: string;
  quantity: number;
  orderCount: number;
  totalAmount: number;
  lastOrderDate: Date | null;
}

export interface ProductOrderDetail {
  orderId: string;
  orderNumber: string | null;
  orderDate: Date;
  productInfo: string | null;
  quantity: number;
  recipientName: string | null;
  orderSource: string | null;
  status: string;
  totalAmount: number;
}

// ============================================================================
// Actions
// ============================================================================

/**
 * 현재 사용자의 권한 정보 조회
 */
export async function getCurrentUserInfo() {
  try {
    const isAdmin = await isAdminUser();
    const assignedPartner = await getCurrentUserPartner();
    
    return {
      success: true,
      data: {
        isAdmin,
        assignedPartner,
      },
    };
  } catch (error) {
    console.error("Error fetching user info:", error);
    return {
      success: false,
      error: "사용자 정보를 가져오는데 실패했습니다.",
    };
  }
}

/**
 * 협력사별 상품명+수량 조합의 주문건수 통계
 * 어드민: 전체 데이터 조회 가능
 * 협력사 계정: 본인 협력사 데이터만 조회
 */
export async function getPartnerProductStats(
  partnerFilter?: string,
  dateFrom?: Date,
  dateTo?: Date
) {
  try {
    // 현재 사용자의 권한 및 협력사 정보 확인
    const currentUserPartner = await getCurrentUserPartner();
    const isAdmin = await isAdminUser();
    
    // 날짜 필터 조건
    const whereCondition: any = {};
    
    if (dateFrom || dateTo) {
      whereCondition.orderDate = {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      };
    }
    
    // 협력사 필터 - 권한에 따라 제한
    // 실제 협력사 정보는 orderSource 필드에 저장됨 (스몰닷, 해피포즈, 그로트 등)
    if (!isAdmin && currentUserPartner) {
      // 협력사 계정: 본인 협력사만 조회 (UI 필터 무시)
      whereCondition.orderSource = currentUserPartner;
    } else if (isAdmin && partnerFilter && partnerFilter !== "all") {
      // 어드민: UI 필터 적용
      if (partnerFilter === "headquarters") {
        whereCondition.OR = [
          { orderSource: null },
          { orderSource: "" },
          { orderSource: "본사" },
          { orderSource: "자사몫" }
        ];
      } else {
        whereCondition.orderSource = partnerFilter;
      }
    }

    // 주문 가져오기
    const orders = await prisma.order.findMany({
      where: whereCondition,
      select: {
        orderSource: true,
        productInfo: true,
        quantity: true,
        totalAmount: true,
        orderDate: true,
      },
    });

    // 협력사별 > 상품명+수량 조합으로 그룹화
    const statsMap = new Map<string, PartnerProductStats>();

    orders.forEach((order) => {
      // orderSource가 협력사 정보 (스몰닷, 해피포즈, 그로트, 자사몫 등)
      const partner = order.orderSource || "본사";
      const productName = order.productInfo || "상품정보 없음";
      const quantity = order.quantity || 1;
      
      // 고유 키: partner_productName_quantity
      const key = `${partner}_${productName}_${quantity}`;
      
      if (statsMap.has(key)) {
        const existing = statsMap.get(key)!;
        existing.orderCount++;
        existing.totalAmount += Number(order.totalAmount || 0);
        if (order.orderDate && (!existing.lastOrderDate || order.orderDate > existing.lastOrderDate)) {
          existing.lastOrderDate = order.orderDate;
        }
      } else {
        statsMap.set(key, {
          partner,
          productName,
          quantity,
          orderCount: 1,
          totalAmount: Number(order.totalAmount || 0),
          lastOrderDate: order.orderDate,
        });
      }
    });

    const stats = Array.from(statsMap.values());

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Error fetching partner product stats:", error);
    return {
      success: false,
      error: "협력사별 상품 통계를 가져오는데 실패했습니다.",
    };
  }
}

/**
 * 특정 협력사+상품명+수량 조합의 주문 상세 목록
 * 어드민: 모든 협력사의 상세 조회 가능
 * 협력사 계정: 본인 협력사 데이터만 조회
 */
export async function getPartnerProductOrderDetails(
  partner: string,
  productName: string,
  quantity: number,
  dateFrom?: Date,
  dateTo?: Date
) {
  try {
    // 권한 확인
    const currentUserPartner = await getCurrentUserPartner();
    const isAdmin = await isAdminUser();
    
    // 협력사 계정이 다른 협력사 데이터를 조회하려는 경우 차단
    if (!isAdmin && currentUserPartner && partner !== currentUserPartner) {
      return {
        success: false,
        error: "본인 협력사의 데이터만 조회할 수 있습니다.",
      };
    }
    
    const whereCondition: any = {
      quantity: quantity,
    };
    
    // 상품명 조건
    if (productName === "상품정보 없음") {
      whereCondition.productInfo = null;
    } else {
      whereCondition.productInfo = productName;
    }
    
    // 협력사 조건 - orderSource 필드 사용
    if (partner === "본사" || partner === "자사몫") {
      whereCondition.OR = [
        { orderSource: null },
        { orderSource: "" },
        { orderSource: "본사" },
        { orderSource: "자사몫" }
      ];
    } else {
      whereCondition.orderSource = partner;
    }
    
    // 날짜 필터
    if (dateFrom || dateTo) {
      whereCondition.orderDate = {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      };
    }

    const orders = await prisma.order.findMany({
      where: whereCondition,
      select: {
        id: true,
        orderNumber: true,
        orderDate: true,
        productInfo: true,
        quantity: true,
        recipientName: true,
        orderSource: true,
        status: true,
        totalAmount: true,
      },
      orderBy: {
        orderDate: "desc",
      },
      take: 100,
    });

    return {
      success: true,
      data: orders,
    };
  } catch (error) {
    console.error("Error fetching order details:", error);
    return {
      success: false,
      error: "주문 상세 목록을 가져오는데 실패했습니다.",
    };
  }
}

/**
 * 협력사별 주문 요약 (대시보드용)
 */
export async function getPartnerProductSummary() {
  try {
    const orders = await prisma.order.findMany({
      select: {
        partner: true,
        productInfo: true,
        quantity: true,
      },
    });

    const partnerSet = new Set<string>();
    const combinationSet = new Set<string>();
    
    orders.forEach((order) => {
      const partner = order.partner || "본사";
      const productName = order.productInfo || "상품정보 없음";
      const quantity = order.quantity || 1;
      
      partnerSet.add(partner);
      combinationSet.add(`${partner}_${productName}_${quantity}`);
    });

    return {
      success: true,
      data: {
        totalPartners: partnerSet.size,
        totalCombinations: combinationSet.size,
        totalOrders: orders.length,
      },
    };
  } catch (error) {
    console.error("Error fetching summary:", error);
    return {
      success: false,
      error: "요약 정보를 가져오는데 실패했습니다.",
    };
  }
}
