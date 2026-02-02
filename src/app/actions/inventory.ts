"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";
import { createId } from "@paralleldrive/cuid2";

// ============================================================================
// Types
// ============================================================================

interface PartInput {
  name: string;
  partNumber: string;
  description?: string;
  quantity: number;
  minStock: number;
  unitPrice: number;
  location?: string;
  supplier?: string;
  category?: string;
}

interface InventoryStats {
  total: number;
  lowStock: number;
  totalValue: number;
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * 모든 부품 조회 (Part 테이블 사용)
 */
export async function getParts() {
  try {
    const parts = await prisma.part.findMany();

    // "완제품재고" 필터링 (숨김)
    const filteredParts = parts.filter(part => part.name !== "완제품 재고");

    // "완제품 박스" → "제품박스"로 이름 변경
    const renamedParts = filteredParts.map(part => {
      if (part.name === "완제품 박스") {
        return { ...part, name: "제품박스" };
      }
      return part;
    });

    // 우선순위 항목 정의
    const priorityOrder = [
      "거치대(본사)",
      "거치대(스몰닷)",
      "거치대(그로트)",
      "거치대(해피포즈)",
      "쉴드유무선 재고",
      "쉴드유선 재고",
    ];

    // 커스텀 정렬: 우선순위 항목을 먼저, 나머지는 이름순
    const sortedParts = renamedParts.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.name);
      const bIndex = priorityOrder.indexOf(b.name);

      // 둘 다 우선순위 항목인 경우
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // a만 우선순위 항목인 경우
      if (aIndex !== -1) {
        return -1;
      }
      // b만 우선순위 항목인 경우
      if (bIndex !== -1) {
        return 1;
      }
      // 둘 다 일반 항목인 경우 이름순
      return a.name.localeCompare(b.name, 'ko');
    });

    return sortedParts;
  } catch (error) {
    console.error("Failed to fetch parts:", error);
    throw error;
  }
}

/**
 * 재고 통계 조회
 */
export async function getInventoryStats(): Promise<InventoryStats> {
  try {
    const parts = await prisma.part.findMany();

    const total = parts.length;
    const lowStock = parts.filter((p) => p.quantity <= p.minStock).length;
    const totalValue = parts.reduce(
      (sum, part) => sum + part.quantity * Number(part.unitPrice || 0),
      0
    );

    return { total, lowStock, totalValue };
  } catch (error) {
    console.error("Failed to fetch inventory stats:", error);
    return { total: 0, lowStock: 0, totalValue: 0 };
  }
}

// ============================================================================
// ============================================================================
// Write Operations
// ============================================================================

/**
 * 재고 로그 생성 헬퍼 함수
 */
function createInventoryLog(
  partId: string,
  type: string,
  quantity: number,
  beforeQty: number,
  afterQty: number,
  reason?: string,
  relatedPartId?: string,
  relatedPartName?: string
) {
  return prisma.inventorylog.create({
    data: {
      id: createId(),
      partId,
      type,
      quantity,
      beforeQty,
      afterQty,
      reason,
      relatedPartId,
      relatedPartName,
    },
  });
}

/**
 * 부품 생성
 */
export async function createPart(data: PartInput): Promise<ActionResponse> {
  try {
    const part = await prisma.part.create({
      data: {
        name: data.name,
        partNumber: data.partNumber,
        description: data.description,
        quantity: data.quantity,
        minStock: data.minStock,
        unitPrice: data.unitPrice,
        location: data.location,
        supplier: data.supplier,
        category: data.category,
      },
    });

    revalidatePath("/dashboard/inventory");
    return { success: true, data: part };
  } catch (error) {
    console.error("Failed to create part:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 재고 수량 업데이트
 */
export async function updatePartStock(
  partId: string, 
  quantity: number
): Promise<ActionResponse> {
  try {
    console.log(`[updatePartStock] 호출됨 - partId: ${partId}, quantity: ${quantity}`);
    
    // 현재 부품 정보 가져오기
    const currentPart = await prisma.part.findUnique({
      where: { id: partId },
    });

    if (!currentPart) {
      console.error(`[updatePartStock] 부품을 찾을 수 없음 - partId: ${partId}`);
      return { success: false, error: "부품을 찾을 수 없습니다" };
    }
    
    console.log(`[updatePartStock] 현재 부품 - name: ${currentPart.name}, 현재수량: ${currentPart.quantity}, 목표수량: ${quantity}`);

    // 수량 변화 계산
    const quantityChange = quantity - currentPart.quantity;

    // 완제품인 경우 부품 자동 차감
    const isFinishedProduct = 
      currentPart.name === "쉴드유무선 재고" || 
      currentPart.name === "쉴드유선 재고";

    // 완제품의 재고가 변경되면 (증가 또는 감소) 부품 차감
    if (isFinishedProduct && quantityChange !== 0) {
      // 완제품이 증가하거나 감소한 경우 부품 차감
      const allParts = await prisma.part.findMany();
      
      // 업데이트할 부품 목록
      const updates = [];
      const logs = [];

      // quantityChange의 절대값만큼 부품 차감
      const productionAmount = Math.abs(quantityChange);

      for (const part of allParts) {
        // 완제품 자신은 제외
        if (part.id === partId) continue;
        
        // 다른 완제품도 제외
        if (part.name === "쉴드유무선 재고" || part.name === "쉴드유선 재고") {
          continue;
        }

        let deduction = 0;
        
        // 볼트(대) 체크 - 이름에 "볼트" 포함하고 "대" 포함
        if ((part.name.includes("볼트") && part.name.includes("대")) || 
            part.name === "볼트대" || 
            part.name === "볼트(대)") {
          deduction = 4 * productionAmount;
        } 
        // 볼트(소) 체크 - 이름에 "볼트" 포함하고 "소" 포함
        else if ((part.name.includes("볼트") && part.name.includes("소")) || 
                 part.name === "볼트소" || 
                 part.name === "볼트(소)") {
          deduction = 11 * productionAmount;
        } 
        // 나머지 모든 부품
        else {
          deduction = 1 * productionAmount;
        }

        if (deduction > 0) {
          const newPartQuantity = part.quantity - deduction;
          
          if (newPartQuantity < 0) {
            return { 
              success: false, 
              error: `${part.name} 재고가 부족합니다 (필요: ${deduction}, 현재: ${part.quantity})` 
            };
          }

          updates.push(
            prisma.part.update({
              where: { id: part.id },
              data: { quantity: newPartQuantity },
            })
          );

          // 로그 생성
          logs.push(
            createInventoryLog(
              part.id,
              'AUTO_DEDUCT',
              -deduction,
              part.quantity,
              newPartQuantity,
              `${currentPart.name} ${quantityChange > 0 ? '생산' : '출고'}으로 인한 자동 차감`,
              partId,
              currentPart.name
            )
          );
        }
      }

      // 완제품 로그
      logs.push(
        createInventoryLog(
          partId,
          quantityChange > 0 ? 'IN' : 'OUT',
          quantityChange,
          currentPart.quantity,
          quantity,
          '완제품 생산'
        )
      );

      // 완제품과 모든 부품 업데이트를 트랜잭션으로 처리
      await prisma.$transaction([
        prisma.part.update({
          where: { id: partId },
          data: { quantity },
        }),
        ...updates,
        ...logs,
      ]);
    } else {
      // 일반 부품이거나 완제품 감소인 경우 단순 업데이트
      const logType = quantityChange > 0 ? 'IN' : 'OUT';
      const reason = quantityChange > 0 ? '입고' : '출고';

      await prisma.$transaction([
        prisma.part.update({
          where: { id: partId },
          data: { quantity },
        }),
        createInventoryLog(
          partId,
          logType,
          quantityChange,
          currentPart.quantity,
          quantity,
          reason
        ),
      ]);
    }

    revalidatePath("/dashboard/inventory");
    console.log("[updatePartStock] 업데이트 성공!");
    return { success: true };
  } catch (error) {
    console.error("[updatePartStock] 에러 발생:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 재고 증감 (입고/출고)
 */
export async function adjustPartStock(
  partId: string,
  adjustment: number,
  type: "IN" | "OUT"
): Promise<ActionResponse> {
  try {
    const part = await prisma.part.findUnique({
      where: { id: partId },
    });

    if (!part) {
      return { success: false, error: "Part not found" };
    }

    const newQuantity = type === "IN" 
      ? part.quantity + adjustment 
      : part.quantity - adjustment;

    if (newQuantity < 0) {
      return { success: false, error: "재고가 부족합니다" };
    }

    const updatedPart = await prisma.part.update({
      where: { id: partId },
      data: { quantity: newQuantity },
    });

    revalidatePath("/dashboard/inventory");
    return { success: true, data: updatedPart };
  } catch (error) {
    console.error("Failed to adjust stock:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 부품 삭제
 */
export async function deletePart(partId: string): Promise<ActionResponse> {
  try {
    await prisma.part.delete({
      where: { id: partId },
    });

    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete part:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 재고 로그 조회 (특정 부품)
 */
export async function getInventoryLogs(partId?: string, limit: number = 100) {
  try {
    const logs = await prisma.inventoryLog.findMany({
      where: partId ? { partId } : undefined,
      include: {
        part: {
          select: {
            name: true,
            partNumber: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs;
  } catch (error) {
    console.error("Failed to fetch inventory logs:", error);
    throw error;
  }
}

/**
 * 모든 재고 로그 조회 (최신순)
 */
export async function getAllInventoryLogs(limit: number = 500) {
  try {
    const logs = await prisma.inventoryLog.findMany({
      include: {
        part: {
          select: {
            name: true,
            partNumber: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs;
  } catch (error) {
    console.error("Failed to fetch all inventory logs:", error);
    throw error;
  }
}

