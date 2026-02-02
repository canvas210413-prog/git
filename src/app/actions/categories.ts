"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface CategoryStats {
  name: string;
  productCount: number;
  totalStock: number;
  totalRevenue: number;
  avgPrice: number;
}

export interface CategoryWithProducts {
  name: string;
  products: {
    id: string;
    name: string;
    price: number;
    stock: number;
    sku: string;
  }[];
}

// 카테고리별 통계 조회
export async function getCategoryStats(): Promise<CategoryStats[]> {
  try {
    const products = await prisma.product.findMany({
      include: {
        orderItems: {
          select: {
            quantity: true,
            price: true,
          },
        },
      },
    });

    const categoryMap: Record<string, {
      productCount: number;
      totalStock: number;
      totalRevenue: number;
      totalPrice: number;
    }> = {};

    products.forEach((product) => {
      const category = product.category || '미분류';
      
      if (!categoryMap[category]) {
        categoryMap[category] = {
          productCount: 0,
          totalStock: 0,
          totalRevenue: 0,
          totalPrice: 0,
        };
      }

      categoryMap[category].productCount += 1;
      categoryMap[category].totalStock += product.stock;
      categoryMap[category].totalPrice += Number(product.price);
      
      product.orderItems.forEach((item) => {
        categoryMap[category].totalRevenue += Number(item.price) * item.quantity;
      });
    });

    return Object.entries(categoryMap).map(([name, stats]) => ({
      name,
      productCount: stats.productCount,
      totalStock: stats.totalStock,
      totalRevenue: stats.totalRevenue,
      avgPrice: stats.productCount > 0 ? Math.round(stats.totalPrice / stats.productCount) : 0,
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);
  } catch (error) {
    console.error("Failed to fetch category stats:", error);
    throw error;
  }
}

// 카테고리 목록 조회
export async function getCategories(): Promise<string[]> {
  try {
    const products = await prisma.product.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return products
      .map((p) => p.category || '미분류')
      .filter((c, i, arr) => arr.indexOf(c) === i);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw error;
  }
}

// 카테고리별 상품 조회
export async function getProductsByCategory(category: string): Promise<CategoryWithProducts> {
  try {
    const products = await prisma.product.findMany({
      where: {
        category: category === '미분류' ? null : category,
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        sku: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      name: category,
      products: products.map((p) => ({
        ...p,
        price: Number(p.price),
      })),
    };
  } catch (error) {
    console.error("Failed to fetch products by category:", error);
    throw error;
  }
}

// 상품 카테고리 변경
export async function updateProductCategory(productId: string, category: string) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { category: category === '미분류' ? null : category },
    });

    revalidatePath('/dashboard/sales/categories');
    return { success: true };
  } catch (error) {
    console.error("Failed to update product category:", error);
    return { success: false, error: String(error) };
  }
}

// 새 카테고리 생성 (상품에 할당)
export async function createCategory(name: string, productIds: string[]) {
  try {
    await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { category: name },
    });

    revalidatePath('/dashboard/sales/categories');
    return { success: true };
  } catch (error) {
    console.error("Failed to create category:", error);
    return { success: false, error: String(error) };
  }
}

// 카테고리 삭제 (해당 상품들을 미분류로)
export async function deleteCategory(category: string) {
  try {
    await prisma.product.updateMany({
      where: { category },
      data: { category: null },
    });

    revalidatePath('/dashboard/sales/categories');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { success: false, error: String(error) };
  }
}

// 카테고리 이름 변경
export async function renameCategory(oldName: string, newName: string) {
  try {
    await prisma.product.updateMany({
      where: { category: oldName },
      data: { category: newName },
    });

    revalidatePath('/dashboard/sales/categories');
    return { success: true };
  } catch (error) {
    console.error("Failed to rename category:", error);
    return { success: false, error: String(error) };
  }
}
