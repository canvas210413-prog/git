"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================================
// 고객 Import
// ============================================================================

export interface CustomerImportData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  grade?: string;
  segment?: string;
}

export async function importCustomers(
  data: CustomerImportData[]
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    let successCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        // 이메일 중복 체크
        const existing = await prisma.customer.findUnique({
          where: { email: item.email },
        });

        if (existing) {
          // 업데이트
          await prisma.customer.update({
            where: { email: item.email },
            data: {
              name: item.name,
              phone: item.phone || null,
              company: item.company || null,
              grade: item.grade || "BRONZE",
              segment: item.segment || null,
            },
          });
        } else {
          // 신규 생성
          await prisma.customer.create({
            data: {
              name: item.name,
              email: item.email,
              phone: item.phone || null,
              company: item.company || null,
              grade: item.grade || "BRONZE",
              segment: item.segment || null,
              status: "ACTIVE",
            },
          });
        }
        successCount++;
      } catch (e) {
        errors.push(`${item.email}: ${String(e)}`);
      }
    }

    revalidatePath("/dashboard/customers");

    if (errors.length > 0) {
      return {
        success: successCount > 0,
        message: `${successCount}건 저장 완료, ${errors.length}건 실패`,
        count: successCount,
      };
    }

    return {
      success: true,
      message: `${successCount}건의 고객 데이터가 저장되었습니다.`,
      count: successCount,
    };
  } catch (error) {
    console.error("고객 Import 오류:", error);
    return {
      success: false,
      message: "데이터 저장 중 오류가 발생했습니다.",
    };
  }
}

// ============================================================================
// 주문 Import
// ============================================================================

export interface OrderImportData {
  orderNumber?: string;
  customerEmail: string;
  status?: string;
  paymentStatus?: string;
  totalAmount: number;
  productInfo?: string;
  shippingAddress?: string;
}

export async function importOrders(
  data: OrderImportData[]
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    let successCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        // 고객 찾기
        const customer = await prisma.customer.findUnique({
          where: { email: item.customerEmail },
        });

        if (!customer) {
          errors.push(`${item.orderNumber || "N/A"}: 고객(${item.customerEmail})을 찾을 수 없습니다.`);
          continue;
        }

        await prisma.order.create({
          data: {
            orderNumber: item.orderNumber || `ORD-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            customerId: customer.id,
            status: item.status || "PENDING",
            paymentStatus: item.paymentStatus || "PENDING",
            totalAmount: item.totalAmount,
            productInfo: item.productInfo || "",
            shippingAddress: item.shippingAddress || "",
            orderDate: new Date(),
          },
        });
        successCount++;
      } catch (e) {
        errors.push(`${item.orderNumber || "N/A"}: ${String(e)}`);
      }
    }

    revalidatePath("/dashboard/orders");

    if (errors.length > 0) {
      return {
        success: successCount > 0,
        message: `${successCount}건 저장 완료, ${errors.length}건 실패`,
        count: successCount,
      };
    }

    return {
      success: true,
      message: `${successCount}건의 주문 데이터가 저장되었습니다.`,
      count: successCount,
    };
  } catch (error) {
    console.error("주문 Import 오류:", error);
    return {
      success: false,
      message: "데이터 저장 중 오류가 발생했습니다.",
    };
  }
}

// ============================================================================
// 상품 Import
// ============================================================================

export interface ProductImportData {
  name: string;
  category?: string;
  price: number;
  stock?: number;
  description?: string;
  status?: string;
}

export async function importProducts(
  data: ProductImportData[]
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    let successCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        await prisma.product.create({
          data: {
            name: item.name,
            category: item.category || "기타",
            price: item.price,
            stock: item.stock || 0,
            description: item.description || "",
            status: item.status || "ACTIVE",
          },
        });
        successCount++;
      } catch (e) {
        errors.push(`${item.name}: ${String(e)}`);
      }
    }

    revalidatePath("/dashboard/inventory");

    return {
      success: errors.length === 0,
      message: errors.length === 0 
        ? `${successCount}건의 상품 데이터가 저장되었습니다.`
        : `${successCount}건 저장 완료, ${errors.length}건 실패`,
      count: successCount,
    };
  } catch (error) {
    console.error("상품 Import 오류:", error);
    return {
      success: false,
      message: "데이터 저장 중 오류가 발생했습니다.",
    };
  }
}

// ============================================================================
// 티켓 Import
// ============================================================================

export interface TicketImportData {
  title: string;
  customerEmail: string;
  category?: string;
  priority?: string;
  status?: string;
  description?: string;
}

export async function importTickets(
  data: TicketImportData[]
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    let successCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        // 고객 찾기
        const customer = await prisma.customer.findUnique({
          where: { email: item.customerEmail },
        });

        if (!customer) {
          errors.push(`${item.title}: 고객(${item.customerEmail})을 찾을 수 없습니다.`);
          continue;
        }

        await prisma.ticket.create({
          data: {
            title: item.title,
            customerId: customer.id,
            category: item.category || "GENERAL",
            priority: item.priority || "MEDIUM",
            status: item.status || "OPEN",
            description: item.description || "",
          },
        });
        successCount++;
      } catch (e) {
        errors.push(`${item.title}: ${String(e)}`);
      }
    }

    revalidatePath("/dashboard/support");

    return {
      success: errors.length === 0,
      message: errors.length === 0 
        ? `${successCount}건의 티켓 데이터가 저장되었습니다.`
        : `${successCount}건 저장 완료, ${errors.length}건 실패`,
      count: successCount,
    };
  } catch (error) {
    console.error("티켓 Import 오류:", error);
    return {
      success: false,
      message: "데이터 저장 중 오류가 발생했습니다.",
    };
  }
}

// ============================================================================
// 리드 Import
// ============================================================================

export interface LeadImportData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  status?: string;
  source?: string;
  expectedValue?: number;
}

export async function importLeads(
  data: LeadImportData[]
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    let successCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        // 이메일 중복 체크
        const existing = await prisma.lead.findFirst({
          where: { email: item.email },
        });

        if (existing) {
          // 업데이트
          await prisma.lead.update({
            where: { id: existing.id },
            data: {
              name: item.name,
              phone: item.phone || null,
              company: item.company || null,
              position: item.position || null,
              status: item.status || "NEW",
              source: item.source || null,
              expectedValue: item.expectedValue || null,
            },
          });
        } else {
          // 신규 생성
          await prisma.lead.create({
            data: {
              name: item.name,
              email: item.email,
              phone: item.phone || null,
              company: item.company || null,
              position: item.position || null,
              status: item.status || "NEW",
              source: item.source || null,
              expectedValue: item.expectedValue || null,
            },
          });
        }
        successCount++;
      } catch (e) {
        errors.push(`${item.email}: ${String(e)}`);
      }
    }

    revalidatePath("/dashboard/leads");

    return {
      success: errors.length === 0,
      message: errors.length === 0 
        ? `${successCount}건의 리드 데이터가 저장되었습니다.`
        : `${successCount}건 저장 완료, ${errors.length}건 실패`,
      count: successCount,
    };
  } catch (error) {
    console.error("리드 Import 오류:", error);
    return {
      success: false,
      message: "데이터 저장 중 오류가 발생했습니다.",
    };
  }
}

// ============================================================================
// 파트너 Import
// ============================================================================

export interface PartnerImportData {
  companyName: string;
  contactName?: string;
  email: string;
  phone?: string;
  type?: string;
  tier?: string;
  status?: string;
}

export async function importPartners(
  data: PartnerImportData[]
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    let successCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        // 이메일 중복 체크
        const existing = await prisma.partner.findFirst({
          where: { email: item.email },
        });

        if (existing) {
          // 업데이트
          await prisma.partner.update({
            where: { id: existing.id },
            data: {
              companyName: item.companyName,
              contactName: item.contactName || null,
              phone: item.phone || null,
              type: item.type || "RESELLER",
              tier: item.tier || "BRONZE",
              status: item.status || "ACTIVE",
            },
          });
        } else {
          // 신규 생성
          await prisma.partner.create({
            data: {
              companyName: item.companyName,
              contactName: item.contactName || null,
              email: item.email,
              phone: item.phone || null,
              type: item.type || "RESELLER",
              tier: item.tier || "BRONZE",
              status: item.status || "ACTIVE",
            },
          });
        }
        successCount++;
      } catch (e) {
        errors.push(`${item.email}: ${String(e)}`);
      }
    }

    revalidatePath("/dashboard/partners");

    return {
      success: errors.length === 0,
      message: errors.length === 0 
        ? `${successCount}건의 파트너 데이터가 저장되었습니다.`
        : `${successCount}건 저장 완료, ${errors.length}건 실패`,
      count: successCount,
    };
  } catch (error) {
    console.error("파트너 Import 오류:", error);
    return {
      success: false,
      message: "데이터 저장 중 오류가 발생했습니다.",
    };
  }
}

// ============================================================================
// 재고 부품 Import
// ============================================================================

export interface PartImportData {
  name: string;
  partNumber?: string;
  category?: string;
  quantity: number;
  minStock?: number;
  unitPrice?: number;
  location?: string;
  supplier?: string;
}

export async function importParts(
  data: PartImportData[]
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    let successCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        // 부품번호로 중복 체크
        if (item.partNumber) {
          const existing = await prisma.part.findFirst({
            where: { partNumber: item.partNumber },
          });

          if (existing) {
            // 업데이트
            await prisma.part.update({
              where: { id: existing.id },
              data: {
                name: item.name,
                category: item.category || "기타",
                quantity: item.quantity,
                minStock: item.minStock || 10,
                unitPrice: item.unitPrice || 0,
                location: item.location || null,
                supplier: item.supplier || null,
              },
            });
            successCount++;
            continue;
          }
        }

        // 신규 생성
        await prisma.part.create({
          data: {
            name: item.name,
            partNumber: item.partNumber || `PART-${Date.now()}`,
            category: item.category || "기타",
            quantity: item.quantity,
            minStock: item.minStock || 10,
            unitPrice: item.unitPrice || 0,
            location: item.location || null,
            supplier: item.supplier || null,
          },
        });
        successCount++;
      } catch (e) {
        errors.push(`${item.name}: ${String(e)}`);
      }
    }

    revalidatePath("/dashboard/inventory");

    return {
      success: errors.length === 0,
      message: errors.length === 0 
        ? `${successCount}건의 재고 데이터가 저장되었습니다.`
        : `${successCount}건 저장 완료, ${errors.length}건 실패`,
      count: successCount,
    };
  } catch (error) {
    console.error("재고 Import 오류:", error);
    return {
      success: false,
      message: "데이터 저장 중 오류가 발생했습니다.",
    };
  }
}
