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

export interface InventoryMapping {
  id: string;
  productId: string;
  productName: string;
  partId: string;
  partName: string;
  deductQty: number;
  isActive: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

export interface CreateMappingInput {
  productId: string;
  productName: string;
  partId: string;
  partName: string;
  deductQty?: number;
  description?: string;
  createdBy?: string;
}

export interface UpdateMappingInput {
  deductQty?: number;
  isActive?: boolean;
  description?: string;
}

// ============================================================================
// 매핑 목록 조회
// ============================================================================

export async function getInventoryMappings(): Promise<ApiResponse<InventoryMapping[]>> {
  try {
    const mappings = await prisma.productinventorymapping.findMany({
      orderBy: [
        { productName: "asc" },
        { partName: "asc" },
      ],
    });

    return { success: true, data: mappings };
  } catch (error) {
    console.error("[getInventoryMappings] Error:", error);
    return {
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: "매핑 목록 조회에 실패했습니다",
      },
    };
  }
}

// ============================================================================
// 상품별 매핑 조회 (재고 차감 시 사용)
// ============================================================================

export async function getMappingsByProductId(productId: string): Promise<ApiResponse<InventoryMapping[]>> {
  try {
    const mappings = await prisma.productinventorymapping.findMany({
      where: {
        productId,
        isActive: true,
      },
    });

    return { success: true, data: mappings };
  } catch (error) {
    console.error("[getMappingsByProductId] Error:", error);
    return {
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: "상품 매핑 조회에 실패했습니다",
      },
    };
  }
}

// ============================================================================
// 상품명으로 매핑 조회 (주문 생성 시 사용)
// ============================================================================

export async function getMappingsByProductName(productInfo: string): Promise<ApiResponse<InventoryMapping[]>> {
  try {
    console.log(`\n[getMappingsByProductName] ====== 시작 ======`);
    console.log(`[getMappingsByProductName] 입력 productInfo: "${productInfo}"`);
    
    // 모든 활성 매핑을 조회
    const allMappings = await prisma.productinventorymapping.findMany({
      where: {
        isActive: true,
      },
    });

    console.log(`[getMappingsByProductName] 전체 활성 매핑 수: ${allMappings.length}`);
    allMappings.forEach((m, i) => {
      console.log(`  [${i}] productName: "${m.productName}", partName: "${m.partName}", partId: ${m.partId}`);
    });

    // 주문의 productInfo에 매핑의 productName이 포함되어 있는지 확인
    const matchedMappings: InventoryMapping[] = [];
    
    for (const mapping of allMappings) {
      let matched = false;
      
      // 정확히 일치하는 경우
      if (productInfo === mapping.productName) {
        console.log(`  [매칭] 정확 일치: "${mapping.productName}" === "${productInfo}"`);
        matched = true;
      }
      // productInfo에 productName이 포함된 경우
      else if (productInfo.includes(mapping.productName)) {
        console.log(`  [매칭] productInfo에 포함: "${productInfo}".includes("${mapping.productName}")`);
        matched = true;
      }
      // productName에 productInfo가 포함된 경우
      else if (mapping.productName.includes(productInfo)) {
        console.log(`  [매칭] productName에 포함: "${mapping.productName}".includes("${productInfo}")`);
        matched = true;
      }
      
      if (matched) {
        matchedMappings.push(mapping);
      }
    }

    console.log(`[getMappingsByProductName] 매칭된 매핑 수: ${matchedMappings.length}`);
    matchedMappings.forEach((m, i) => {
      console.log(`  [매칭${i}] partName: "${m.partName}", partId: ${m.partId}, deductQty: ${m.deductQty}`);
    });
    console.log(`[getMappingsByProductName] ====== 종료 ======\n`);

    return { success: true, data: matchedMappings };
  } catch (error) {
    console.error("[getMappingsByProductName] Error:", error);
    return {
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: "상품명 매핑 조회에 실패했습니다",
      },
    };
  }
}

// ============================================================================
// 매핑 생성
// ============================================================================

export async function createInventoryMapping(
  input: CreateMappingInput
): Promise<ApiResponse<InventoryMapping>> {
  try {
    // 중복 체크
    const existing = await prisma.productinventorymapping.findFirst({
      where: {
        productId: input.productId,
        partId: input.partId,
      },
    });

    if (existing) {
      return {
        success: false,
        error: {
          code: "DUPLICATE",
          message: "이미 동일한 상품-재고 매핑이 존재합니다",
        },
      };
    }

    const mapping = await prisma.productinventorymapping.create({
      data: {
        id: createId(),
        productId: input.productId,
        productName: input.productName,
        partId: input.partId,
        partName: input.partName,
        deductQty: input.deductQty || 1,
        description: input.description,
        createdBy: input.createdBy,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/master-data/inventory-mapping");
    return { success: true, data: mapping };
  } catch (error) {
    console.error("[createInventoryMapping] Error:", error);
    return {
      success: false,
      error: {
        code: "CREATE_FAILED",
        message: "매핑 생성에 실패했습니다",
      },
    };
  }
}

// ============================================================================
// 매핑 수정
// ============================================================================

export async function updateInventoryMapping(
  id: string,
  input: UpdateMappingInput
): Promise<ApiResponse<InventoryMapping>> {
  try {
    const mapping = await prisma.productinventorymapping.update({
      where: { id },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/master-data/inventory-mapping");
    return { success: true, data: mapping };
  } catch (error) {
    console.error("[updateInventoryMapping] Error:", error);
    return {
      success: false,
      error: {
        code: "UPDATE_FAILED",
        message: "매핑 수정에 실패했습니다",
      },
    };
  }
}

// ============================================================================
// 매핑 삭제
// ============================================================================

export async function deleteInventoryMapping(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
  try {
    await prisma.productinventorymapping.delete({
      where: { id },
    });

    revalidatePath("/dashboard/master-data/inventory-mapping");
    return { success: true, data: { deleted: true } };
  } catch (error) {
    console.error("[deleteInventoryMapping] Error:", error);
    return {
      success: false,
      error: {
        code: "DELETE_FAILED",
        message: "매핑 삭제에 실패했습니다",
      },
    };
  }
}

// ============================================================================
// 매핑 일괄 생성 (상품 하나에 여러 파트 매핑)
// ============================================================================

export async function createBulkMappings(
  productId: string,
  productName: string,
  mappings: { partId: string; partName: string; deductQty: number }[],
  createdBy?: string
): Promise<ApiResponse<{ created: number }>> {
  try {
    let createdCount = 0;

    for (const mapping of mappings) {
      // 중복 체크
      const existing = await prisma.productinventorymapping.findFirst({
        where: {
          productId,
          partId: mapping.partId,
        },
      });

      if (!existing) {
        await prisma.productinventorymapping.create({
          data: {
            id: createId(),
            productId,
            productName,
            partId: mapping.partId,
            partName: mapping.partName,
            deductQty: mapping.deductQty,
            createdBy,
            updatedAt: new Date(),
          },
        });
        createdCount++;
      }
    }

    revalidatePath("/dashboard/master-data/inventory-mapping");
    return { success: true, data: { created: createdCount } };
  } catch (error) {
    console.error("[createBulkMappings] Error:", error);
    return {
      success: false,
      error: {
        code: "BULK_CREATE_FAILED",
        message: "일괄 매핑 생성에 실패했습니다",
      },
    };
  }
}

// ============================================================================
// 주문 생성 시 재고 차감 (매핑 기반)
// ============================================================================

export async function deductInventoryByMapping(
  productName: string,
  quantity: number = 1,
  orderId?: string
): Promise<ApiResponse<{ deducted: { partName: string; qty: number }[] }>> {
  try {
    console.log(`\n========================================`);
    console.log(`[deductInventoryByMapping] 시작`);
    console.log(`[deductInventoryByMapping] productName: "${productName}"`);
    console.log(`[deductInventoryByMapping] quantity: ${quantity}`);
    console.log(`[deductInventoryByMapping] orderId: ${orderId}`);
    
    // 상품명으로 매핑 조회
    const result = await getMappingsByProductName(productName);
    
    console.log(`[deductInventoryByMapping] 매핑 조회 결과: success=${result.success}, count=${result.data?.length || 0}`);
    
    if (!result.success || !result.data || result.data.length === 0) {
      console.log(`[deductInventoryByMapping] No mapping found for: ${productName}`);
      console.log(`========================================\n`);
      return { success: true, data: { deducted: [] } };
    }

    console.log(`[deductInventoryByMapping] 매핑된 파트 목록:`);
    result.data.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.partName} (partId: ${m.partId}, deductQty: ${m.deductQty})`);
    });

    const deducted: { partName: string; qty: number }[] = [];

    for (const mapping of result.data) {
      const deductAmount = mapping.deductQty * quantity;
      console.log(`\n[deductInventoryByMapping] 차감 처리 중: ${mapping.partName}`);

      // 현재 재고 조회
      const currentPart = await prisma.part.findUnique({
        where: { id: mapping.partId },
      });
      
      if (!currentPart) {
        console.log(`[deductInventoryByMapping] 경고: 파트를 찾을 수 없음 - partId: ${mapping.partId}`);
        continue;
      }
      
      const beforeQty = currentPart.quantity;
      const afterQty = beforeQty - deductAmount;
      
      console.log(`[deductInventoryByMapping] ${mapping.partName}: beforeQty=${beforeQty}, deductAmount=${deductAmount}, afterQty=${afterQty}`);

      // 재고 차감
      await prisma.part.update({
        where: { id: mapping.partId },
        data: {
          quantity: { decrement: deductAmount },
        },
      });
      console.log(`[deductInventoryByMapping] ${mapping.partName}: 재고 차감 완료`);

      // 재고 로그 기록
      await prisma.inventorylog.create({
        data: {
          id: createId(),
          partId: mapping.partId,
          type: "출고",
          quantity: -deductAmount,
          beforeQty,
          afterQty,
          reason: orderId ? `주문 재고 차감 (주문번호: 주문-${orderId.slice(-8)}, ${productName})` : `주문 재고 차감 (${productName})`,
          createdAt: new Date(),
        },
      });
      console.log(`[deductInventoryByMapping] ${mapping.partName}: 로그 기록 완료`);

      deducted.push({ partName: mapping.partName, qty: deductAmount });
    }

    console.log(`\n[deductInventoryByMapping] 완료 - 총 ${deducted.length}개 파트 차감`);
    console.log(`========================================\n`);
    
    return { success: true, data: { deducted } };
  } catch (error) {
    console.error("[deductInventoryByMapping] Error:", error);
    return {
      success: false,
      error: {
        code: "DEDUCT_FAILED",
        message: "재고 차감에 실패했습니다",
      },
    };
  }
}

// ============================================================================
// 상품 목록 조회 (매핑 등록용)
// ============================================================================

export async function getBaseProductsForMapping(): Promise<ApiResponse<{ id: string; name: string; partnerCode: string | null }[]>> {
  try {
    const products = await prisma.baseproduct.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        partnerCode: true,
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: products };
  } catch (error) {
    console.error("[getBaseProductsForMapping] Error:", error);
    return {
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: "상품 목록 조회에 실패했습니다",
      },
    };
  }
}

// ============================================================================
// 파트 목록 조회 (매핑 등록용)
// ============================================================================

export async function getPartsForMapping(): Promise<ApiResponse<{ id: string; name: string; partNumber: string; quantity: number }[]>> {
  try {
    const parts = await prisma.part.findMany({
      select: {
        id: true,
        name: true,
        partNumber: true,
        quantity: true,
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: parts };
  } catch (error) {
    console.error("[getPartsForMapping] Error:", error);
    return {
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: "파트 목록 조회에 실패했습니다",
      },
    };
  }
}
