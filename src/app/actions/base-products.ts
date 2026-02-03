"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface BaseProductData {
  id: string;
  name: string;
  unitPrice: number;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  partnerCode: string | null;
  // KPI 설정 필드
  kpiSupplyPrice: number | null;
  kpiCostPrice: number | null;
  kpiCommissionRate: number | null;  // 수수료율 (기본 0.02585 = 2.585%)
  kpiUnitCount: number;               // 기본단가당 건수 (예: 198000원=2건)
  kpiCountEnabled: boolean;
  kpiSalesEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBaseProductInput {
  name: string;
  unitPrice: number;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  partnerCode?: string | null;
  // KPI 설정
  kpiSupplyPrice?: number | null;
  kpiCostPrice?: number | null;
  kpiCommissionRate?: number | null;
  kpiUnitCount?: number;
  kpiCountEnabled?: boolean;
  kpiSalesEnabled?: boolean;
}

export interface UpdateBaseProductInput {
  id: string;
  name?: string;
  unitPrice?: number;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  partnerCode?: string | null;
  // KPI 설정
  kpiSupplyPrice?: number | null;
  kpiCostPrice?: number | null;
  kpiCommissionRate?: number | null;
  kpiUnitCount?: number;
  kpiCountEnabled?: boolean;
  kpiSalesEnabled?: boolean;
}

// 모든 기준상품 조회 (협력사별 필터링 지원)
export async function getBaseProducts(partnerCode?: string | null): Promise<BaseProductData[]> {
  try {
    const whereClause = partnerCode === undefined 
      ? {} 
      : { partnerCode: partnerCode };
    
    const products = await prisma.baseproduct.findMany({
      where: whereClause,
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });

    return products.map((p) => ({
      ...p,
      unitPrice: Number(p.unitPrice),
      kpiSupplyPrice: p.kpiSupplyPrice ? Number(p.kpiSupplyPrice) : null,
      kpiCostPrice: p.kpiCostPrice ? Number(p.kpiCostPrice) : null,
      kpiCommissionRate: p.kpiCommissionRate ? Number(p.kpiCommissionRate) : null,
      kpiUnitCount: p.kpiUnitCount,
    }));
  } catch (error) {
    console.error("Error fetching base products:", error);
    return [];
  }
}

// 활성화된 기준상품만 조회 (주문 등록 시 사용)
export async function getActiveBaseProducts(partnerCode?: string | null): Promise<BaseProductData[]> {
  try {
    const whereClause = partnerCode === undefined 
      ? { isActive: true }
      : { isActive: true, partnerCode: partnerCode };
    
    const products = await prisma.baseproduct.findMany({
      where: whereClause,
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });

    return products.map((p) => ({
      ...p,
      unitPrice: Number(p.unitPrice),
      kpiSupplyPrice: p.kpiSupplyPrice ? Number(p.kpiSupplyPrice) : null,
      kpiCostPrice: p.kpiCostPrice ? Number(p.kpiCostPrice) : null,
      kpiCommissionRate: p.kpiCommissionRate ? Number(p.kpiCommissionRate) : null,
      kpiUnitCount: p.kpiUnitCount,
    }));
  } catch (error) {
    console.error("Error fetching active base products:", error);
    return [];
  }
}

// 모든 협력사의 모든 상품 조회 (KPI 설정용)
export async function getAllBaseProductsForKPI(): Promise<BaseProductData[]> {
  try {
    const products = await prisma.baseproduct.findMany({
      where: { isActive: true },
      orderBy: [
        { partnerCode: "asc" },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });

    return products.map((p) => ({
      ...p,
      unitPrice: Number(p.unitPrice),
      kpiSupplyPrice: p.kpiSupplyPrice ? Number(p.kpiSupplyPrice) : null,
      kpiCostPrice: p.kpiCostPrice ? Number(p.kpiCostPrice) : null,
      kpiCommissionRate: p.kpiCommissionRate ? Number(p.kpiCommissionRate) : null,
      kpiUnitCount: p.kpiUnitCount,
    }));
  } catch (error) {
    console.error("Error fetching all base products for KPI:", error);
    return [];
  }
}

// KPI 설정 일괄 업데이트
export async function updateKPISettings(
  settings: Array<{
    id: string;
    kpiSupplyPrice?: number | null;
    kpiCostPrice?: number | null;
    kpiCommissionRate?: number | null;
    kpiUnitCount?: number;
    kpiCountEnabled?: boolean;
    kpiSalesEnabled?: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(
      settings.map((item) =>
        prisma.baseproduct.update({
          where: { id: item.id },
          data: {
            kpiSupplyPrice: item.kpiSupplyPrice,
            kpiCostPrice: item.kpiCostPrice,
            kpiCommissionRate: item.kpiCommissionRate,
            kpiUnitCount: item.kpiUnitCount,
            kpiCountEnabled: item.kpiCountEnabled,
            kpiSalesEnabled: item.kpiSalesEnabled,
          },
        })
      )
    );

    revalidatePath("/dashboard/performance/integrated");
    revalidatePath("/dashboard/master-data/products");

    return { success: true };
  } catch (error) {
    console.error("Error updating KPI settings:", error);
    return { success: false, error: "KPI 설정 업데이트에 실패했습니다." };
  }
}

// 기준상품 생성
export async function createBaseProduct(input: CreateBaseProductInput): Promise<{ success: boolean; data?: BaseProductData; error?: string }> {
  try {
    const product = await prisma.baseproduct.create({
      data: {
        name: input.name,
        unitPrice: input.unitPrice,
        description: input.description || null,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
        partnerCode: input.partnerCode ?? null,
        kpiSupplyPrice: input.kpiSupplyPrice ?? null,
        kpiCostPrice: input.kpiCostPrice ?? null,
        kpiCommissionRate: input.kpiCommissionRate ?? null,
        kpiUnitCount: input.kpiUnitCount ?? 1,
        kpiCountEnabled: input.kpiCountEnabled ?? true,
        kpiSalesEnabled: input.kpiSalesEnabled ?? true,
      },
    });

    revalidatePath("/dashboard/master-data/products");
    revalidatePath("/dashboard/orders/status");
    revalidatePath("/dashboard/orders/delivery");
    revalidatePath("/dashboard/orders");

    return {
      success: true,
      data: {
        ...product,
        unitPrice: Number(product.unitPrice),
        kpiSupplyPrice: product.kpiSupplyPrice ? Number(product.kpiSupplyPrice) : null,
        kpiCostPrice: product.kpiCostPrice ? Number(product.kpiCostPrice) : null,
        kpiCommissionRate: product.kpiCommissionRate ? Number(product.kpiCommissionRate) : null,
        kpiUnitCount: product.kpiUnitCount,
      },
    };
  } catch (error) {
    console.error("Error creating base product:", error);
    return { success: false, error: "상품 생성에 실패했습니다." };
  }
}

// 기준상품 수정
export async function updateBaseProduct(input: UpdateBaseProductInput): Promise<{ success: boolean; data?: BaseProductData; error?: string }> {
  try {
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.unitPrice !== undefined) updateData.unitPrice = input.unitPrice;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
    if (input.partnerCode !== undefined) updateData.partnerCode = input.partnerCode;
    if (input.kpiSupplyPrice !== undefined) updateData.kpiSupplyPrice = input.kpiSupplyPrice;
    if (input.kpiCostPrice !== undefined) updateData.kpiCostPrice = input.kpiCostPrice;
    if (input.kpiCommissionRate !== undefined) updateData.kpiCommissionRate = input.kpiCommissionRate;
    if (input.kpiUnitCount !== undefined) updateData.kpiUnitCount = input.kpiUnitCount;
    if (input.kpiCountEnabled !== undefined) updateData.kpiCountEnabled = input.kpiCountEnabled;
    if (input.kpiSalesEnabled !== undefined) updateData.kpiSalesEnabled = input.kpiSalesEnabled;

    const product = await prisma.baseproduct.update({
      where: { id: input.id },
      data: updateData,
    });

    revalidatePath("/dashboard/master-data/products");
    revalidatePath("/dashboard/orders/status");
    revalidatePath("/dashboard/orders/delivery");
    revalidatePath("/dashboard/orders");

    return {
      success: true,
      data: {
        ...product,
        unitPrice: Number(product.unitPrice),
        kpiSupplyPrice: product.kpiSupplyPrice ? Number(product.kpiSupplyPrice) : null,
        kpiCostPrice: product.kpiCostPrice ? Number(product.kpiCostPrice) : null,
        kpiCommissionRate: product.kpiCommissionRate ? Number(product.kpiCommissionRate) : null,
        kpiUnitCount: product.kpiUnitCount,
      },
    };
  } catch (error) {
    console.error("Error updating base product:", error);
    return { success: false, error: "상품 수정에 실패했습니다." };
  }
}

// 기준상품 삭제
export async function deleteBaseProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.baseproduct.delete({
      where: { id },
    });

    revalidatePath("/dashboard/master-data/products");

    return { success: true };
  } catch (error) {
    console.error("Error deleting base product:", error);
    return { success: false, error: "상품 삭제에 실패했습니다." };
  }
}

// 기준상품 정렬 순서 일괄 수정
export async function updateBaseProductSortOrders(items: { id: string; sortOrder: number }[]): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(
      items.map((item) =>
        prisma.baseproduct.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    revalidatePath("/dashboard/master-data/products");

    return { success: true };
  } catch (error) {
    console.error("Error updating sort orders:", error);
    return { success: false, error: "정렬 순서 수정에 실패했습니다." };
  }
}

