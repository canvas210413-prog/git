"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Customer, PaginatedResponse, ApiResponse } from "@/types";

// ============================================================================
// Validation Schemas
// ============================================================================

const CustomerFiltersSchema = z.object({
  segment: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const CreateCustomerSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다"),
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  company: z.string().optional(),
  phone: z.string().optional(),
});

const UpdateCustomerSchema = z.object({
  id: z.string().min(1, "고객 ID가 필요합니다"),
  name: z.string().min(1, "이름은 필수입니다"),
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  company: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
});

// ============================================================================
// Types
// ============================================================================

interface CustomerFilters {
  segment?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface CustomerFormState {
  success?: boolean;
  error?: Record<string, string[]>;
  message?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildCustomerWhereClause(filters?: CustomerFilters) {
  const where: Record<string, unknown> = {};

  if (filters?.segment) {
    where.segment = filters.segment;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { email: { contains: filters.search } },
      { company: { contains: filters.search } },
    ];
  }

  return where;
}

// ============================================================================
// Actions
// ============================================================================

/**
 * 고객 목록을 조회합니다.
 * @param filters - 필터링 옵션 (segment, status, search)
 * @returns 고객 목록
 */
export async function getCustomers(
  filters?: CustomerFilters
): Promise<Customer[]> {
  try {
    const where = buildCustomerWhereClause(filters);

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return customers as Customer[];
  } catch (error) {
    console.error("[getCustomers] Error:", error);
    throw new Error("고객 목록을 불러오는데 실패했습니다");
  }
}

/**
 * 페이지네이션이 적용된 고객 목록을 조회합니다.
 */
export async function getCustomersPaginated(
  filters?: CustomerFilters
): Promise<PaginatedResponse<Customer>> {
  try {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = buildCustomerWhereClause(filters);

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: customers as Customer[],
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  } catch (error) {
    console.error("[getCustomersPaginated] Error:", error);
    throw new Error("고객 목록을 불러오는데 실패했습니다");
  }
}

/**
 * 새 고객을 생성합니다.
 */
export async function createCustomer(
  prevState: CustomerFormState | null,
  formData: FormData
): Promise<CustomerFormState> {
  const validatedFields = CreateCustomerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    phone: formData.get("phone"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.customer.create({
      data: {
        name: validatedFields.data.name,
        email: validatedFields.data.email,
        company: validatedFields.data.company || null,
        phone: validatedFields.data.phone || null,
        status: "ACTIVE",
      },
    });

    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (error: unknown) {
    console.error("[createCustomer] Error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        error: {
          email: ["이미 등록된 이메일입니다"],
        },
      };
    }

    return { message: "고객 생성에 실패했습니다" };
  }
}

/**
 * 고객 정보를 업데이트합니다.
 */
export async function updateCustomer(
  prevState: CustomerFormState | null,
  formData: FormData
): Promise<CustomerFormState> {
  const validatedFields = UpdateCustomerSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    phone: formData.get("phone"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.customer.update({
      where: { id: validatedFields.data.id },
      data: {
        name: validatedFields.data.name,
        email: validatedFields.data.email,
        company: validatedFields.data.company || null,
        phone: validatedFields.data.phone || null,
        status: validatedFields.data.status,
      },
    });

    revalidatePath(`/dashboard/customers/${validatedFields.data.id}`);
    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (error) {
    console.error("[updateCustomer] Error:", error);
    return { message: "고객 정보 업데이트에 실패했습니다" };
  }
}

/**
 * 고객을 삭제합니다.
 */
export async function deleteCustomer(
  id: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  if (!id) {
    return {
      success: false,
      error: {
        code: "INVALID_ID",
        message: "고객 ID가 필요합니다",
      },
    };
  }

  try {
    await prisma.customer.delete({
      where: { id },
    });

    revalidatePath("/dashboard/customers");
    return {
      success: true,
      data: { deleted: true },
    };
  } catch (error) {
    console.error("[deleteCustomer] Error:", error);
    return {
      success: false,
      error: {
        code: "DELETE_FAILED",
        message: "고객 삭제에 실패했습니다",
      },
    };
  }
}
