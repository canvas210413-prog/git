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
  partnerCode: string | null;  // ?묐젰??援щ텇 異붽?
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBaseProductInput {
  name: string;
  unitPrice: number;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  partnerCode?: string | null;  // ?묐젰??援щ텇 異붽?
}

export interface UpdateBaseProductInput {
  id: string;
  name?: string;
  unitPrice?: number;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  partnerCode?: string | null;  // ?묐젰??援щ텇 異붽?
}

// 紐⑤뱺 湲곗??곹뭹 議고쉶 (?묐젰?щ퀎 ?꾪꽣留?吏??
// partnerCode: null = 蹂몄궗, "洹몃줈??, "?ㅻぐ?? ??= ?묐젰??
export async function getBaseProducts(partnerCode?: string | null): Promise<BaseProductData[]> {
  try {
    // partnerCode媛 undefined硫??꾩껜 議고쉶 (愿由ъ옄??
    // partnerCode媛 null?대㈃ 蹂몄궗 ?곹뭹留?
    // partnerCode媛 ?뱀젙 媛믪씠硫??대떦 ?묐젰???곹뭹留?
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
    }));
  } catch (error) {
    console.error("Error fetching base products:", error);
    return [];
  }
}

// ?쒖꽦?붾맂 湲곗??곹뭹留?議고쉶 (二쇰Ц ?깅줉 ???ъ슜, ?묐젰?щ퀎 ?꾪꽣留?吏??
export async function getActiveBaseProducts(partnerCode?: string | null): Promise<BaseProductData[]> {
  try {
    // partnerCode媛 undefined硫??쒖꽦?붾맂 ?꾩껜 議고쉶
    // partnerCode媛 null?대㈃ 蹂몄궗 ?곹뭹留?
    // partnerCode媛 ?뱀젙 媛믪씠硫??대떦 ?묐젰???곹뭹留?
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
    }));
  } catch (error) {
    console.error("Error fetching active base products:", error);
    return [];
  }
}

// 湲곗??곹뭹 ?앹꽦
export async function createBaseProduct(input: CreateBaseProductInput): Promise<{ success: boolean; data?: BaseProductData; error?: string }> {
  try {
    const product = await prisma.baseproduct.create({
      data: {
        name: input.name,
        unitPrice: input.unitPrice,
        description: input.description || null,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
        partnerCode: input.partnerCode ?? null,  // ?묐젰??援щ텇 ???
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
      },
    };
  } catch (error) {
    console.error("Error creating base product:", error);
    return { success: false, error: "?곹뭹 ?앹꽦???ㅽ뙣?덉뒿?덈떎." };
  }
}

// 湲곗??곹뭹 ?섏젙
export async function updateBaseProduct(input: UpdateBaseProductInput): Promise<{ success: boolean; data?: BaseProductData; error?: string }> {
  try {
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.unitPrice !== undefined) updateData.unitPrice = input.unitPrice;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
    if (input.partnerCode !== undefined) updateData.partnerCode = input.partnerCode;  // ?묐젰??援щ텇 ?섏젙

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
      },
    };
  } catch (error) {
    console.error("Error updating base product:", error);
    return { success: false, error: "?곹뭹 ?섏젙???ㅽ뙣?덉뒿?덈떎." };
  }
}

// 湲곗??곹뭹 ??젣
export async function deleteBaseProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.baseproduct.delete({
      where: { id },
    });

    revalidatePath("/dashboard/master-data/products");

    return { success: true };
  } catch (error) {
    console.error("Error deleting base product:", error);
    return { success: false, error: "?곹뭹 ??젣???ㅽ뙣?덉뒿?덈떎." };
  }
}

// 湲곗??곹뭹 ?뺣젹 ?쒖꽌 ?쇨큵 ?섏젙
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
    return { success: false, error: "?뺣젹 ?쒖꽌 ?섏젙???ㅽ뙣?덉뒿?덈떎." };
  }
}

