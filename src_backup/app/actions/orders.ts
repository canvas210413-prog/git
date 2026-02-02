"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PaginatedResponse, ApiResponse, OrderStatus } from "@/types";

// ============================================================================
// Types
// ============================================================================

interface OrderWithRelations {
  id: string;
  customerId: string;
  orderNumber?: string | null;
  orderDate: Date;
  totalAmount: number;
  unitPrice?: number | null;
  shippingFee?: number | null;
  status: string;
  recipientName?: string | null;
  recipientPhone?: string | null;
  recipientMobile?: string | null;
  recipientZipCode?: string | null;
  recipientAddr?: string | null;
  productInfo?: string | null;
  deliveryMsg?: string | null;
  orderSource?: string | null;
  courier?: string | null;
  trackingNumber?: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    product: {
      id: string;
      name: string;
    };
  }>;
}

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
}

interface CreateOrderInput {
  customerId: string;
  orderDate?: Date | string;
  totalAmount?: number;
  status?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientMobile?: string;
  recipientZipCode?: string;
  recipientAddr?: string;
  orderNumber?: string;
  productInfo?: string;
  deliveryMsg?: string;
  orderSource?: string;
  unitPrice?: number;
  shippingFee?: number;
  courier?: string;
  trackingNumber?: string;
}

interface UpdateOrderInput extends Partial<CreateOrderInput> {
  id?: never; // ID는 별도로 전달됨
}

// ============================================================================
// Validation Schemas
// ============================================================================

const CreateOrderSchema = z.object({
  customerId: z.string().min(1, "고객 ID가 필요합니다"),
  orderDate: z.union([z.date(), z.string()]).optional(),
  totalAmount: z.number().min(0).default(0),
  status: z.string().default("PENDING"),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientMobile: z.string().optional(),
  recipientZipCode: z.string().optional(),
  recipientAddr: z.string().optional(),
  orderNumber: z.string().optional(),
  productInfo: z.string().optional(),
  deliveryMsg: z.string().optional(),
  orderSource: z.string().optional(),
  unitPrice: z.number().optional(),
  shippingFee: z.number().default(0),
  courier: z.string().optional(),
  trackingNumber: z.string().optional(),
});

const UpdateOrderSchema = z.object({
  orderDate: z.union([z.date(), z.string()]).optional(),
  totalAmount: z.number().optional(),
  status: z.string().optional(),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientMobile: z.string().optional(),
  recipientZipCode: z.string().optional(),
  recipientAddr: z.string().optional(),
  orderNumber: z.string().optional(),
  productInfo: z.string().optional(),
  deliveryMsg: z.string().optional(),
  orderSource: z.string().optional(),
  unitPrice: z.number().optional(),
  shippingFee: z.number().optional(),
  courier: z.string().optional(),
  trackingNumber: z.string().optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Prisma Decimal 객체를 숫자로 변환합니다.
 */
function convertDecimalToNumber<T extends Record<string, unknown>>(
  obj: T,
  fields: string[]
): T {
  const result = { ...obj };
  for (const field of fields) {
    if (field in result && result[field] !== null) {
      result[field as keyof T] = Number(result[field]) as T[keyof T];
    }
  }
  return result;
}

// ============================================================================
// Actions
// ============================================================================

/**
 * 주문 목록을 조회합니다.
 */
export async function getOrders(): Promise<OrderWithRelations[]> {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert Decimal to number for client components
    return orders.map((order) =>
      convertDecimalToNumber(order, [
        "totalAmount",
        "unitPrice",
        "shippingFee",
        "supplyPrice",
        "vat",
        "costPrice",
        "commission",
        "margin",
        "marginRate",
      ])
    ) as unknown as OrderWithRelations[];
  } catch (error) {
    console.error("[getOrders] Error:", error);
    throw new Error("주문 목록을 불러오는데 실패했습니다");
  }
}

/**
 * 주문 ID로 단일 주문을 조회합니다.
 */
export async function getOrderById(
  id: string
): Promise<OrderWithRelations | null> {
  if (!id) return null;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) return null;

    return convertDecimalToNumber(order, [
      "totalAmount",
      "unitPrice",
      "shippingFee",
    ]) as unknown as OrderWithRelations;
  } catch (error) {
    console.error("[getOrderById] Error:", error);
    throw new Error("주문 정보를 불러오는데 실패했습니다");
  }
}

/**
 * 새 주문을 생성합니다.
 */
export async function createOrder(
  data: CreateOrderInput
): Promise<ApiResponse<{ id: string }>> {
  const validation = CreateOrderSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "입력값이 올바르지 않습니다",
        details: validation.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const order = await prisma.order.create({
      data: {
        customerId: validation.data.customerId,
        orderDate: validation.data.orderDate
          ? new Date(validation.data.orderDate)
          : new Date(),
        totalAmount: validation.data.totalAmount,
        status: validation.data.status,
        recipientName: validation.data.recipientName,
        recipientPhone: validation.data.recipientPhone,
        recipientMobile: validation.data.recipientMobile,
        recipientZipCode: validation.data.recipientZipCode,
        recipientAddr: validation.data.recipientAddr,
        orderNumber: validation.data.orderNumber,
        productInfo: validation.data.productInfo,
        deliveryMsg: validation.data.deliveryMsg,
        orderSource: validation.data.orderSource,
        unitPrice: validation.data.unitPrice,
        shippingFee: validation.data.shippingFee,
        courier: validation.data.courier,
        trackingNumber: validation.data.trackingNumber,
      },
    });

    revalidatePath("/dashboard/orders");
    return {
      success: true,
      data: { id: order.id },
    };
  } catch (error) {
    console.error("[createOrder] Error:", error);
    return {
      success: false,
      error: {
        code: "CREATE_FAILED",
        message: "주문 생성에 실패했습니다",
      },
    };
  }
}

/**
 * 주문을 업데이트합니다.
 */
export async function updateOrder(
  id: string,
  data: UpdateOrderInput
): Promise<ApiResponse<{ id: string }>> {
  if (!id) {
    return {
      success: false,
      error: {
        code: "INVALID_ID",
        message: "주문 ID가 필요합니다",
      },
    };
  }

  const validation = UpdateOrderSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "입력값이 올바르지 않습니다",
        details: validation.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const updateData: Record<string, unknown> = {};

    // 유효한 필드만 업데이트 데이터에 추가
    for (const [key, value] of Object.entries(validation.data)) {
      if (value !== undefined) {
        if (key === "orderDate") {
          updateData[key] = new Date(value as string);
        } else {
          updateData[key] = value;
        }
      }
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/dashboard/orders");
    return {
      success: true,
      data: { id: order.id },
    };
  } catch (error) {
    console.error("[updateOrder] Error:", error);
    return {
      success: false,
      error: {
        code: "UPDATE_FAILED",
        message: "주문 업데이트에 실패했습니다",
      },
    };
  }
}

/**
 * 주문을 삭제합니다.
 */
export async function deleteOrder(
  id: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  if (!id) {
    return {
      success: false,
      error: {
        code: "INVALID_ID",
        message: "주문 ID가 필요합니다",
      },
    };
  }

  try {
    await prisma.order.delete({
      where: { id },
    });

    revalidatePath("/dashboard/orders");
    return {
      success: true,
      data: { deleted: true },
    };
  } catch (error) {
    console.error("[deleteOrder] Error:", error);
    return {
      success: false,
      error: {
        code: "DELETE_FAILED",
        message: "주문 삭제에 실패했습니다",
      },
    };
  }
}

/**
 * 주문 통계를 조회합니다.
 */
export async function getOrderStats(): Promise<OrderStats> {
  try {
    const [total, pending, processing, shipped, delivered] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "PROCESSING" } }),
      prisma.order.count({ where: { status: "SHIPPED" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
    ]);

    return {
      total,
      pending,
      processing,
      shipped,
      delivered,
    };
  } catch (error) {
    console.error("[getOrderStats] Error:", error);
    return {
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
    };
  }
}
