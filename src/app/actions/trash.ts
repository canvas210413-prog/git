"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";

// ============================================================================
// Types
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface TrashItem {
  id: string;
  originalId: string;
  originalTable: string;
  originalData: any;
  deletedBy: string | null;
  deletedByName: string | null;
  deleteReason: string | null;
  displayTitle: string | null;
  displayInfo: string | null;
  expiresAt: Date;
  createdAt: Date;
}

// 테이블별 표시 정보 생성 함수
function getDisplayInfo(tableName: string, data: any): { title: string; info: string } {
  switch (tableName) {
    case "Order":
      return {
        title: data.orderNumber || `주문 ${data.id?.slice(0, 8)}`,
        info: `${data.recipientName || data.customerName || "고객"} | ${data.productInfo || data.productName || "상품"} | ${data.totalAmount ? `₩${Number(data.totalAmount).toLocaleString()}` : ""}`
      };
    case "AfterService":
      return {
        title: data.asNumber || data.ticketNumber || `AS ${data.id?.slice(0, 8)}`,
        info: `${data.customerName || "고객"} | ${data.productName || "제품"} | ${data.type || "유형없음"}`
      };
    case "MallOrder":
      return {
        title: data.orderNumber || `몰주문 ${data.id?.slice(0, 8)}`,
        info: `${data.customerName || "고객"} | ₩${Number(data.totalAmount || 0).toLocaleString()}`
      };
    default:
      return {
        title: `${tableName} ${data.id?.slice(0, 8)}`,
        info: JSON.stringify(data).slice(0, 100)
      };
  }
}

// ============================================================================
// 휴지통으로 이동 (삭제 대신)
// ============================================================================

/**
 * 주문을 휴지통으로 이동
 */
export async function moveOrderToTrash(
  orderId: string,
  userId?: string,
  userName?: string,
  reason?: string
): Promise<ApiResponse<{ moved: boolean }>> {
  if (!orderId) {
    return {
      success: false,
      error: { code: "INVALID_ID", message: "주문 ID가 필요합니다" }
    };
  }

  try {
    // 1. 원본 주문 데이터 조회
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderitem: true }
    });

    if (!order) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "주문을 찾을 수 없습니다" }
      };
    }

    // 2. 휴지통에 저장(30일 만료)
    const displayInfo = getDisplayInfo("Order", order);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Date 객체를 문자열로 변환하여 JSON 직렬화 문제 방지
    const orderDataForSave = {
      ...order,
      orderDate: order.orderDate?.toISOString(),
      shippingDate: order.shippingDate?.toISOString(),
      deliveryDate: order.deliveryDate?.toISOString(),
      createdAt: order.createdAt?.toISOString(),
      updatedAt: order.updatedAt?.toISOString(),
      orderitem: order.orderitem?.map(item => ({
        ...item,
        createdAt: item.createdAt?.toISOString(),
        updatedAt: item.updatedAt?.toISOString(),
      }))
    };

    await prisma.trashbin.create({
      data: {
        id: createId(),
        originalId: order.id,
        originalTable: "Order",
        originalData: orderDataForSave,
        deletedBy: userId,
        deletedByName: userName,
        deleteReason: reason,
        displayTitle: displayInfo.title,
        displayInfo: displayInfo.info,
        expiresAt
      }
    });

    // 3. 원본 삭제 (OrderItem은 Cascade로 자동 삭제)
    await prisma.order.delete({
      where: { id: orderId }
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/data/trash");

    return { success: true, data: { moved: true } };
  } catch (error) {
    console.error("[moveOrderToTrash] Error:", error);
    console.error("[moveOrderToTrash] Error details:", error instanceof Error ? error.message : String(error));
    return {
      success: false,
      error: { 
        code: "MOVE_FAILED", 
        message: `휴지통 이동에 실패했습니다: ${error instanceof Error ? error.message : String(error)}` 
      }
    };
  }
}

/**
 * AS를 휴지통으로 이동
 */
export async function moveAfterServiceToTrash(
  asId: string,
  userId?: string,
  userName?: string,
  reason?: string
): Promise<ApiResponse<{ moved: boolean }>> {
  if (!asId) {
    return {
      success: false,
      error: { code: "INVALID_ID", message: "AS ID가 필요합니다" }
    };
  }

  try {
    // 1. 원본 AS 데이터 조회
    const asItem = await prisma.afterservice.findUnique({
      where: { id: asId }
    });

    if (!asItem) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "AS를 찾을 수 없습니다" }
      };
    }

    // 2. 휴지통에 저장
    const displayInfo = getDisplayInfo("AfterService", asItem);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.trashbin.create({
      data: {
        id: createId(),
        originalId: asItem.id,
        originalTable: "AfterService",
        originalData: JSON.parse(JSON.stringify(asItem)),
        deletedBy: userId,
        deletedByName: userName,
        deleteReason: reason,
        displayTitle: displayInfo.title,
        displayInfo: displayInfo.info,
        expiresAt
      }
    });

    // 3. 원본 삭제
    await prisma.afterservice.delete({
      where: { id: asId }
    });

    revalidatePath("/dashboard/after-service");
    revalidatePath("/dashboard/data/trash");

    return { success: true, data: { moved: true } };
  } catch (error) {
    console.error("[moveAfterServiceToTrash] Error:", error);
    return {
      success: false,
      error: { code: "MOVE_FAILED", message: "휴지통 이동에 실패했습니다" }
    };
  }
}

/**
 * 여러 주문을 한번에 휴지통으로 이동
 */
export async function moveMultipleOrdersToTrash(
  orderIds: string[],
  userId?: string,
  userName?: string,
  reason?: string
): Promise<ApiResponse<{ movedCount: number }>> {
  if (!orderIds || orderIds.length === 0) {
    return {
      success: false,
      error: { code: "INVALID_IDS", message: "주문 ID 목록이 필요합니다" }
    };
  }

  try {
    let movedCount = 0;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    for (const orderId of orderIds) {
      try {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true }
        });

        if (order) {
          const displayInfo = getDisplayInfo("Order", order);
          
          await prisma.trashbin.create({
            data: {
              id: createId(),
              originalId: order.id,
              originalTable: "Order",
              originalData: JSON.parse(JSON.stringify(order)),
              deletedBy: userId,
              deletedByName: userName,
              deleteReason: reason,
              displayTitle: displayInfo.title,
              displayInfo: displayInfo.info,
              expiresAt
            }
          });

          await prisma.order.delete({
            where: { id: orderId }
          });

          movedCount++;
        }
      } catch (err) {
        console.error(`[moveMultipleOrdersToTrash] Error moving order ${orderId}:`, err);
      }
    }

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/data/trash");

    return { success: true, data: { movedCount } };
  } catch (error) {
    console.error("[moveMultipleOrdersToTrash] Error:", error);
    return {
      success: false,
      error: { code: "MOVE_FAILED", message: "휴지통 이동에 실패했습니다" }
    };
  }
}

/**
 * 모든 주문을 휴지통으로 이동
 */
export async function moveAllOrdersToTrash(
  userId?: string,
  userName?: string,
  reason?: string
): Promise<ApiResponse<{ movedCount: number }>> {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true }
    });

    let movedCount = 0;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    for (const order of orders) {
      try {
        const displayInfo = getDisplayInfo("Order", order);
        
        await prisma.trashbin.create({
          data: {
            id: createId(),
            originalId: order.id,
            originalTable: "Order",
            originalData: JSON.parse(JSON.stringify(order)),
            deletedBy: userId,
            deletedByName: userName,
            deleteReason: reason || "전체 삭제",
            displayTitle: displayInfo.title,
            displayInfo: displayInfo.info,
            expiresAt
          }
        });

        movedCount++;
      } catch (err) {
        console.error(`[moveAllOrdersToTrash] Error creating trash for order ${order.id}:`, err);
      }
    }

    // 원본 전체 삭제
    await prisma.order.deleteMany({});

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/data/trash");

    return { success: true, data: { movedCount } };
  } catch (error) {
    console.error("[moveAllOrdersToTrash] Error:", error);
    return {
      success: false,
      error: { code: "MOVE_FAILED", message: "휴지통 이동에 실패했습니다" }
    };
  }
}

/**
 * 모든 AS를 휴지통으로 이동
 */
export async function moveAllASToTrash(
  userId?: string,
  userName?: string,
  reason?: string
): Promise<ApiResponse<{ movedCount: number }>> {
  try {
    const asItems = await prisma.afterservice.findMany();

    let movedCount = 0;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    for (const asItem of asItems) {
      try {
        const displayInfo = getDisplayInfo("AfterService", asItem);
        
        await prisma.trashbin.create({
          data: {
            id: createId(),
            originalId: asItem.id,
            originalTable: "AfterService",
            originalData: JSON.parse(JSON.stringify(asItem)),
            deletedBy: userId,
            deletedByName: userName,
            deleteReason: reason || "전체 삭제",
            displayTitle: displayInfo.title,
            displayInfo: displayInfo.info,
            expiresAt
          }
        });

        movedCount++;
      } catch (err) {
        console.error(`[moveAllASToTrash] Error creating trash for AS ${asItem.id}:`, err);
      }
    }

    // 원본 전체 삭제
    await prisma.afterservice.deleteMany({});

    revalidatePath("/dashboard/after-service");
    revalidatePath("/dashboard/data/trash");

    return { success: true, data: { movedCount } };
  } catch (error) {
    console.error("[moveAllASToTrash] Error:", error);
    return {
      success: false,
      error: { code: "MOVE_FAILED", message: "휴지통 이동에 실패했습니다" }
    };
  }
}

// ============================================================================
// 휴지통 조회
// ============================================================================

/**
 * 휴지통 목록 조회
 */
export async function getTrashItems(
  tableFilter?: string
): Promise<ApiResponse<TrashItem[]>> {
  try {
    const items = await prisma.trashbin.findMany({
      where: tableFilter ? { originalTable: tableFilter } : undefined,
      orderBy: { createdAt: "desc" }
    });

    return { success: true, data: items as TrashItem[] };
  } catch (error) {
    console.error("[getTrashItems] Error:", error);
    return {
      success: false,
      error: { code: "FETCH_FAILED", message: "휴지통 조회에 실패했습니다" }
    };
  }
}

/**
 * 휴지통 통계 조회
 */
export async function getTrashStats(): Promise<ApiResponse<{
  total: number;
  byTable: Record<string, number>;
  expiringToday: number;
  expiringThisWeek: number;
}>> {
  try {
    const items = await prisma.trashbin.findMany({
      select: { originalTable: true, expiresAt: true }
    });

    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const byTable: Record<string, number> = {};
    let expiringToday = 0;
    let expiringThisWeek = 0;

    for (const item of items) {
      byTable[item.originalTable] = (byTable[item.originalTable] || 0) + 1;
      
      if (item.expiresAt <= endOfToday) {
        expiringToday++;
      }
      if (item.expiresAt <= endOfWeek) {
        expiringThisWeek++;
      }
    }

    return {
      success: true,
      data: {
        total: items.length,
        byTable,
        expiringToday,
        expiringThisWeek
      }
    };
  } catch (error) {
    console.error("[getTrashStats] Error:", error);
    return {
      success: false,
      error: { code: "FETCH_FAILED", message: "휴지통 통계 조회에 실패했습니다" }
    };
  }
}

// ============================================================================
// 복구
// ============================================================================

/**
 * 휴지통에서 주문 복구
 */
export async function restoreOrder(
  trashId: string
): Promise<ApiResponse<{ restored: boolean; orderId: string }>> {
  if (!trashId) {
    return {
      success: false,
      error: { code: "INVALID_ID", message: "휴지통 ID가 필요합니다" }
    };
  }

  try {
    const trashItem = await prisma.trashbin.findUnique({
      where: { id: trashId }
    });

    if (!trashItem || trashItem.originalTable !== "Order") {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "복구할 주문을 찾을 수 없습니다" }
      };
    }

    const originalData = trashItem.originalData as any;
    
    // items 분리 (별도 테이블)
    const { items, customer, afterServices, ...orderData } = originalData;

    // Decimal 필드 변환
    const cleanOrderData = {
      ...orderData,
      totalAmount: orderData.totalAmount ? parseFloat(String(orderData.totalAmount)) : 0,
      shippingFee: orderData.shippingFee ? parseFloat(String(orderData.shippingFee)) : null,
      basePrice: orderData.basePrice ? parseFloat(String(orderData.basePrice)) : null,
      additionalFee: orderData.additionalFee ? parseFloat(String(orderData.additionalFee)) : null,
    };

    // 새 ID로 주문 생성 (원본 ID 충돌 방지)
    const newOrder = await prisma.order.create({
      data: {
        ...cleanOrderData,
        id: undefined, // 새 ID 생성
        createdAt: new Date(orderData.createdAt),
        updatedAt: new Date(),
      }
    });

    // OrderItem 복구 (있다면)
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        try {
          await prisma.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              price: parseFloat(String(item.price))
            }
          });
        } catch (itemErr) {
          console.error("[restoreOrder] Error restoring order item:", itemErr);
        }
      }
    }

    // 휴지통에서 삭제
    await prisma.trashbin.delete({
      where: { id: trashId }
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/data/trash");

    return { success: true, data: { restored: true, orderId: newOrder.id } };
  } catch (error) {
    console.error("[restoreOrder] Error:", error);
    return {
      success: false,
      error: { code: "RESTORE_FAILED", message: "주문 복구에 실패했습니다" }
    };
  }
}

/**
 * 휴지통에서 AS 복구
 */
export async function restoreAfterService(
  trashId: string
): Promise<ApiResponse<{ restored: boolean; asId: string }>> {
  if (!trashId) {
    return {
      success: false,
      error: { code: "INVALID_ID", message: "휴지통 ID가 필요합니다" }
    };
  }

  try {
    const trashItem = await prisma.trashbin.findUnique({
      where: { id: trashId }
    });

    if (!trashItem || trashItem.originalTable !== "AfterService") {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "복구할 AS를 찾을 수 없습니다" }
      };
    }

    const originalData = trashItem.originalData as any;
    
    // 관계 필드 제거
    const { customer, order, assignedTo, ...asData } = originalData;

    // Decimal 필드 변환
    const cleanAsData = {
      ...asData,
      estimatedCost: asData.estimatedCost ? parseFloat(String(asData.estimatedCost)) : null,
      actualCost: asData.actualCost ? parseFloat(String(asData.actualCost)) : null,
    };

    // 새 ID로 AS 생성
    const newAS = await prisma.afterservice.create({
      data: {
        ...cleanAsData,
        id: undefined, // 새 ID 생성
        createdAt: new Date(asData.createdAt),
        updatedAt: new Date(),
      }
    });

    // 휴지통에서 삭제
    await prisma.trashbin.delete({
      where: { id: trashId }
    });

    revalidatePath("/dashboard/after-service");
    revalidatePath("/dashboard/data/trash");

    return { success: true, data: { restored: true, asId: newAS.id } };
  } catch (error) {
    console.error("[restoreAfterService] Error:", error);
    return {
      success: false,
      error: { code: "RESTORE_FAILED", message: "AS 복구에 실패했습니다" }
    };
  }
}

/**
 * 여러 항목 복구
 */
export async function restoreMultipleItems(
  trashIds: string[]
): Promise<ApiResponse<{ restoredCount: number }>> {
  if (!trashIds || trashIds.length === 0) {
    return {
      success: false,
      error: { code: "INVALID_IDS", message: "휴지통 ID 목록이 필요합니다" }
    };
  }

  try {
    let restoredCount = 0;

    for (const trashId of trashIds) {
      const trashItem = await prisma.trashbin.findUnique({
        where: { id: trashId }
      });

      if (!trashItem) continue;

      try {
        if (trashItem.originalTable === "Order") {
          const result = await restoreOrder(trashId);
          if (result.success) restoredCount++;
        } else if (trashItem.originalTable === "AfterService") {
          const result = await restoreAfterService(trashId);
          if (result.success) restoredCount++;
        }
      } catch (err) {
        console.error(`[restoreMultipleItems] Error restoring ${trashId}:`, err);
      }
    }

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/after-service");
    revalidatePath("/dashboard/data/trash");

    return { success: true, data: { restoredCount } };
  } catch (error) {
    console.error("[restoreMultipleItems] Error:", error);
    return {
      success: false,
      error: { code: "RESTORE_FAILED", message: "복구에 실패했습니다" }
    };
  }
}

// ============================================================================
// 영구 삭제
// ============================================================================

/**
 * 휴지통에서 영구 삭제
 */
export async function permanentlyDelete(
  trashId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  if (!trashId) {
    return {
      success: false,
      error: { code: "INVALID_ID", message: "휴지통 ID가 필요합니다" }
    };
  }

  try {
    await prisma.trashbin.delete({
      where: { id: trashId }
    });

    revalidatePath("/dashboard/data/trash");

    return { success: true, data: { deleted: true } };
  } catch (error) {
    console.error("[permanentlyDelete] Error:", error);
    return {
      success: false,
      error: { code: "DELETE_FAILED", message: "영구 삭제에 실패했습니다" }
    };
  }
}

/**
 * 휴지통 비우기(전체 영구 삭제)
 */
export async function emptyTrash(
  tableFilter?: string
): Promise<ApiResponse<{ deletedCount: number }>> {
  try {
    const result = await prisma.trashbin.deleteMany({
      where: tableFilter ? { originalTable: tableFilter } : undefined
    });

    revalidatePath("/dashboard/data/trash");

    return { success: true, data: { deletedCount: result.count } };
  } catch (error) {
    console.error("[emptyTrash] Error:", error);
    return {
      success: false,
      error: { code: "DELETE_FAILED", message: "휴지통 비우기에 실패했습니다" }
    };
  }
}

/**
 * 만료된 항목 자동 삭제 (스케줄러용)
 */
export async function cleanupExpiredTrash(): Promise<ApiResponse<{ deletedCount: number }>> {
  try {
    const result = await prisma.trashbin.deleteMany({
      where: {
        expiresAt: { lte: new Date() }
      }
    });

    console.log(`[cleanupExpiredTrash] Deleted ${result.count} expired items`);

    return { success: true, data: { deletedCount: result.count } };
  } catch (error) {
    console.error("[cleanupExpiredTrash] Error:", error);
    return {
      success: false,
      error: { code: "CLEANUP_FAILED", message: "만료 항목 정리에 실패했습니다" }
    };
  }
}
