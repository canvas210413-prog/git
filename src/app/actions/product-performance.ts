"use server";

import { prisma } from "@/lib/prisma";

// ============================================================================
// Types
// ============================================================================

export interface ProductOrderStats {
  productId: string;
  productName: string;
  unitPrice: number;
  partnerCode: string | null;
  orderCount: number;        // 주문 건수
  totalQuantity: number;     // 총 수량
  totalAmount: number;       // 총 금액
  lastOrderDate: Date | null; // 최근 주문일
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
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// 상품별 주문 통계 조회
// ============================================================================

/**
 * 모든 상품의 주문 통계를 조회합니다.
 * BaseProduct의 상품명이 Order의 productInfo에 포함되어 있는지 확인합니다.
 */
export async function getProductOrderStats(
  partnerCode?: string | null,
  dateFrom?: Date,
  dateTo?: Date
): Promise<ApiResponse<ProductOrderStats[]>> {
  try {
    // 1. 기준 상품 목록 조회
    const baseProducts = await prisma.baseProduct.findMany({
      where: {
        isActive: true,
        ...(partnerCode !== undefined ? { partnerCode } : {}),
      },
      orderBy: { sortOrder: "asc" },
    });

    // 2. 주문 목록 조회
    // Order 테이블의 partner 필드가 대부분 null이므로, 전체 주문을 가져옴
    const orders = await prisma.order.findMany({
      where: {
        ...(dateFrom || dateTo
          ? {
              orderDate: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            }
          : {}),
      },
      select: {
        id: true,
        productInfo: true,
        orderDate: true,
        quantity: true,
        totalAmount: true,
      },
    });

    // 3. 각 주문에 대해 가장 정확하게 매칭되는 상품들 찾기
    // 동일한 점수의 상품이 여러 개 있으면 모두 매칭 (동일 이름의 상품이 여러 협력사에 있는 경우)
    const orderToProductsMap = new Map<string, string[]>(); // orderId -> productId[]
    
    orders.forEach((order) => {
      if (!order.productInfo) return;
      
      // 현재 주문과 매칭되는 모든 상품의 점수 계산
      const candidateProducts = baseProducts
        .map((product) => {
          const productInfo = order.productInfo!.toLowerCase().trim();
          const productName = product.name.toLowerCase().trim();
          
          // 정확도 점수 계산
          let score = 0;
          
          // 1. 완전 일치 (최고 점수)
          if (productInfo === productName) {
            score = 1000 + productName.length;
          }
          // 2. productInfo가 productName으로 시작하는 경우
          else if (productInfo.startsWith(productName + ' ') || 
                   productInfo.startsWith(productName + '/')) {
            score = 500 + productName.length;
          }
          // 3. productName이 productInfo에 포함되고 단어 경계가 있는 경우
          else {
            const wordBoundaryMatch = new RegExp(
              `(^|\\s|/)${productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|/|$|\\d)`, 
              'i'
            );
            if (wordBoundaryMatch.test(productInfo)) {
              score = 100 + productName.length;
            }
          }
          
          return { product, score };
        })
        .filter(({ score }) => score > 0);
      
      if (candidateProducts.length === 0) return;
      
      // 최고 점수 찾기
      const maxScore = Math.max(...candidateProducts.map(c => c.score));
      
      // 최고 점수를 가진 모든 상품 선택
      const bestMatches = candidateProducts
        .filter(c => c.score === maxScore)
        .map(c => c.product.id);
      
      if (bestMatches.length > 0) {
        orderToProductsMap.set(order.id, bestMatches);
      }
    });

    // 4. 각 상품별로 주문 통계 계산
    const stats: ProductOrderStats[] = baseProducts.map((product) => {
      // 이 상품에 매칭된 주문들 필터링
      // 동일한 점수로 여러 상품에 매칭된 경우, 해당 주문 수를 협력사 수로 나눔
      const matchingOrdersData = orders
        .map((order) => {
          const matchedProducts = orderToProductsMap.get(order.id) || [];
          if (!matchedProducts.includes(product.id)) return null;
          
          // 이 주문이 매칭된 상품 수 (동일 이름 상품이 여러 협력사에 있는 경우)
          const shareCount = matchedProducts.length;
          
          return { order, shareCount };
        })
        .filter((item): item is { order: typeof orders[0]; shareCount: number } => item !== null);

      // 주문 건수 (분할 계산)
      const orderCount = matchingOrdersData.reduce((sum, { shareCount }) => {
        return sum + (1 / shareCount);
      }, 0);
      
      // 총 수량 (분할 계산)
      const totalQuantity = matchingOrdersData.reduce((sum, { order, shareCount }) => {
        // productInfo에서 수량 추출 시도 (예: "실드 무선 2개")
        const quantityMatch = order.productInfo?.match(new RegExp(`${product.name}[^0-9]*?(\\d+)`, "i"));
        const qty = quantityMatch ? parseInt(quantityMatch[1], 10) : (order.quantity || 1);
        return sum + (qty / shareCount);
      }, 0);

      // 총 금액 계산
      const totalAmount = orderCount * Number(product.unitPrice) * (totalQuantity / Math.max(orderCount, 1));

      // 최근 주문일
      const lastOrderDate = matchingOrdersData.length > 0
        ? matchingOrdersData.reduce((latest, { order }) => 
            order.orderDate > latest ? order.orderDate : latest, 
            matchingOrdersData[0].order.orderDate
          )
        : null;

      return {
        productId: product.id,
        productName: product.name,
        unitPrice: Number(product.unitPrice),
        partnerCode: product.partnerCode,
        orderCount: Math.round(orderCount * 10) / 10, // 소수점 1자리
        totalQuantity: Math.round(totalQuantity),
        totalAmount,
        lastOrderDate,
      };
    });

    // 주문 건수 기준 내림차순 정렬
    stats.sort((a, b) => b.orderCount - a.orderCount);

    return { success: true, data: stats };
  } catch (error) {
    console.error("[getProductOrderStats] Error:", error);
    return {
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: "상품별 주문 통계 조회에 실패했습니다",
      },
    };
  }
}

/**
 * 특정 상품의 주문 상세 목록을 조회합니다.
 */
export async function getProductOrderDetails(
  productName: string,
  partnerCode?: string | null,
  dateFrom?: Date,
  dateTo?: Date
): Promise<ApiResponse<ProductOrderDetail[]>> {
  try {
    const orders = await prisma.order.findMany({
      where: {
        productInfo: {
          contains: productName,
        },
        ...(partnerCode !== undefined ? { partner: partnerCode } : {}),
        ...(dateFrom || dateTo
          ? {
              orderDate: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            }
          : {}),
      },
      select: {
        id: true,
        orderNumber: true,
        orderDate: true,
        productInfo: true,
        quantity: true,
        recipientName: true,
        orderSource: true,
        status: true,
      },
      orderBy: { orderDate: "desc" },
      take: 100, // 최대 100건
    });

    const details: ProductOrderDetail[] = orders.map((order) => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      productInfo: order.productInfo,
      quantity: order.quantity || 1,
      recipientName: order.recipientName,
      orderSource: order.orderSource,
      status: order.status,
    }));

    return { success: true, data: details };
  } catch (error) {
    console.error("[getProductOrderDetails] Error:", error);
    return {
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: "상품 주문 상세 조회에 실패했습니다",
      },
    };
  }
}

/**
 * 상품별 주문 요약 통계 (대시보드용)
 */
export async function getProductOrderSummary(): Promise<ApiResponse<{
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  topProducts: { name: string; count: number }[];
}>> {
  try {
    const [totalProducts, activeProducts, totalOrders] = await Promise.all([
      prisma.baseProduct.count(),
      prisma.baseProduct.count({ where: { isActive: true } }),
      prisma.order.count(),
    ]);

    // 상위 5개 상품
    const statsResult = await getProductOrderStats();
    const topProducts = statsResult.data
      ? statsResult.data.slice(0, 5).map((s) => ({
          name: s.productName,
          count: s.orderCount,
        }))
      : [];

    return {
      success: true,
      data: {
        totalProducts,
        activeProducts,
        totalOrders,
        topProducts,
      },
    };
  } catch (error) {
    console.error("[getProductOrderSummary] Error:", error);
    return {
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: "요약 통계 조회에 실패했습니다",
      },
    };
  }
}
