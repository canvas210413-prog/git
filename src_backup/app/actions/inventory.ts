"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";

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
    const parts = await prisma.part.findMany({
      orderBy: [
        { quantity: "asc" },
        { name: "asc" },
      ],
    });

    return parts;
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
// Write Operations
// ============================================================================

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
    const part = await prisma.part.update({
      where: { id: partId },
      data: { quantity },
    });

    revalidatePath("/dashboard/inventory");
    return { success: true, data: part };
  } catch (error) {
    console.error("Failed to update stock:", error);
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

// ============================================================================
// Compatibility Exports
// ============================================================================

// 기존 함수 호환성 유지
export async function getInventoryParts() {
  return getParts();
}
