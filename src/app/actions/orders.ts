"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { moveAllOrdersToTrash, moveOrderToTrash } from "@/app/actions/trash";
import { notifyNewOrderFromPartner } from "@/lib/notification-helper";
import type { PaginatedResponse, ApiResponse, OrderStatus } from "@/types";
import { createId } from "@paralleldrive/cuid2";

// ============================================================================
// Types
// ============================================================================

interface OrderWithRelations {
  id: string;
  customerId: string;
  orderNumber?: string | null;
  orderDate: Date;
  totalAmount: number;
  orderAmount?: number | null;
  shippingFee?: number | null;
  status: string;
  ordererName?: string | null;
  contactPhone?: string | null;
  recipientZipCode?: string | null;
  recipientAddr?: string | null;
  productInfo?: string | null;
  deliveryMsg?: string | null;
  orderSource?: string | null;
  courier?: string | null;
  trackingNumber?: string | null;
  partner?: string | null;
  deliveryStatus?: string | null;
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
  // AS 접수 정보
  afterServiceInfo?: {
    id: string;
    ticketNumber: string;
    status: string;
    issueType: string;
    serviceDate: Date;
  } | null;
  // 재구매 고객 여부
  isRepeatCustomer?: boolean;
}

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
}

interface CreateOrderInput {
  customerId?: string; // optional로 변경
  customerName?: string; // 고객명 직접 입력
  orderDate?: Date | string;
  totalAmount?: number;
  status?: string;
  ordererName?: string;
  contactPhone?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientMobile?: string;
  recipientZipCode?: string;
  recipientAddr?: string;
  orderNumber?: string;
  productInfo?: string;
  deliveryMsg?: string;
  orderSource?: string;
  partner?: string; // 협력사 추가
  orderAmount?: number;
  basePrice?: number; // 단가
  shippingFee?: number;
  additionalFee?: number;
  courier?: string;
  trackingNumber?: string;
  giftSent?: boolean; // 사은품 발송 여부
  skipNotification?: boolean; // 알림 건너뛰기 (일괄 처리용)
}

interface UpdateOrderInput extends Partial<CreateOrderInput> {
  id?: never; // ID는 별도로 전달됨
}

// ============================================================================
// Validation Schemas
// ============================================================================

const CreateOrderSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  orderDate: z.union([z.date(), z.string()]).optional(),
  totalAmount: z.number().min(0).default(0),
  status: z.string().default("PENDING"),
  ordererName: z.string().optional(),
  contactPhone: z.string().optional(),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientMobile: z.string().optional(),
  recipientZipCode: z.string().optional(),
  recipientAddr: z.string().optional(),
  orderNumber: z.string().optional(),
  productInfo: z.string().optional(),
  deliveryMsg: z.string().optional(),
  orderSource: z.string().optional(),
  partner: z.string().optional(),
  orderAmount: z.number().optional(),
  basePrice: z.number().optional(),
  shippingFee: z.number().default(0),
  additionalFee: z.number().optional(),
  courier: z.string().optional(),
  trackingNumber: z.string().optional(),
  deliveryStatus: z.string().optional(),
  giftSent: z.boolean().optional(),
});

const UpdateOrderSchema = z.object({
  orderDate: z.union([z.date(), z.string()]).optional(),
  totalAmount: z.number().optional(),
  status: z.string().nullable().optional(),
  ordererName: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  recipientName: z.string().nullable().optional(),
  recipientPhone: z.string().nullable().optional(),
  recipientMobile: z.string().nullable().optional(),
  recipientZipCode: z.string().nullable().optional(),
  recipientAddr: z.string().nullable().optional(),
  orderNumber: z.string().nullable().optional(),
  productInfo: z.string().nullable().optional(),
  deliveryMsg: z.string().nullable().optional(),
  orderSource: z.string().nullable().optional(),
  shippingFee: z.number().optional(),
  basePrice: z.number().optional(),
  additionalFee: z.number().optional(),
  courier: z.string().nullable().optional(),
  trackingNumber: z.string().nullable().optional(),
  partner: z.string().nullable().optional(),
  giftSent: z.boolean().optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 현재 사용자의 협력사 정보를 가져옵니다.
 * null이면 본사 (전체 접근), 값이 있으면 해당 협력사만 접근
 */
async function getCurrentUserPartner(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return null;
    }
    return (session.user as any).assignedPartner || null;
  } catch (error) {
    console.error("세션 조회 실패:", error);
    return null;
  }
}

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
  
  // items 배열의 Decimal 변환 (OrderItem의 price 등)
  if ('items' in result && Array.isArray(result.items)) {
    result.items = result.items.map(item => {
      const convertedItem = { ...item };
      if ('price' in convertedItem && convertedItem.price !== null) {
        convertedItem.price = Number(convertedItem.price);
      }
      if ('unitPrice' in convertedItem && convertedItem.unitPrice !== null) {
        convertedItem.unitPrice = Number(convertedItem.unitPrice);
      }
      // product의 price도 변환
      if ('product' in convertedItem && convertedItem.product && typeof convertedItem.product === 'object') {
        const product = convertedItem.product as any;
        if ('price' in product && product.price !== null) {
          product.price = Number(product.price);
        }
        if ('rating' in product && product.rating !== null) {
          product.rating = Number(product.rating);
        }
      }
      return convertedItem;
    }) as any;
  }
  
  return result;
}

// ============================================================================
// Actions
// ============================================================================

/**
 * 주문 목록을 조회합니다. (Order + MallOrder 통합)
 * @param filter - 'all' | 'pending-delivery' | 'delivery-ready' | 'with-tracking'
 */
export async function getOrders(filter: 'all' | 'pending-delivery' | 'delivery-ready' | 'with-tracking' = 'all'): Promise<OrderWithRelations[]> {
  try {
    // 현재 사용자의 협력사 정보 조회
    const assignedPartner = await getCurrentUserPartner();
    
    // 협력사 필터 조건 생성
    const partnerFilter = assignedPartner ? { orderSource: assignedPartner } : {};
    
    // CRM Order 조회
    const orders = await prisma.order.findMany({
      where: partnerFilter, // 협력사 필터 적용
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            orders: {
              select: {
                id: true,
              },
            },
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

    // MallOrder 조회
    const mallOrders = await prisma.mallOrder.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // AS 접수 정보 조회 (고객명 기반)
    const afterServices = await prisma.afterService.findMany({
      where: {
        customerName: {
          in: orders.map(o => o.customer.name),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 고객명별 AS 정보 맵 생성 (가장 최신 AS만)
    const asMap = new Map<string, any>();
    afterServices.forEach(as => {
      if (!asMap.has(as.customerName)) {
        asMap.set(as.customerName, {
          id: as.id,
          ticketNumber: as.ticketNumber,
          status: as.status,
          issueType: as.issueType,
          serviceDate: as.serviceDate,
        });
      }
    });

    // 전화번호별 주문 수 계산 (재구매 체크용)
    const phoneOrderCount = new Map<string, number>();
    orders.forEach(order => {
      const phone = order.recipientPhone || order.recipientMobile || order.contactPhone;
      if (phone) {
        phoneOrderCount.set(phone, (phoneOrderCount.get(phone) || 0) + 1);
      }
    });

    // Convert Decimal to number for client components
    const convertedOrders = orders.map((order) => {
      const converted = convertDecimalToNumber(order, [
        "totalAmount",
        "shippingFee",
        "basePrice",
        "additionalFee",
      ]);
      
      // AS 접수 정보 추가
      const afterServiceInfo = asMap.get(order.customer.name) || null;
      
      // 재구매 고객 여부 (같은 전화번호로 2회 이상 주문)
      const phone = order.recipientPhone || order.recipientMobile || order.contactPhone;
      const isRepeatCustomer = phone ? (phoneOrderCount.get(phone) || 0) >= 2 : false;
      
      return {
        ...converted,
        afterServiceInfo,
        isRepeatCustomer,
      };
    }) as unknown as OrderWithRelations[];

    // MallOrder를 Order 형식으로 변환
    const convertedMallOrders: OrderWithRelations[] = mallOrders.map((mallOrder) => {
      // items JSON 파싱
      let productInfo = "-";
      try {
        const items = JSON.parse(mallOrder.items);
        if (Array.isArray(items) && items.length > 0) {
          productInfo = items.map((item: any) => item.productName || item.name || "상품").join(", ");
        }
      } catch {
        productInfo = "-";
      }

      // MallOrder 상태를 Order 상태로 매핑
      const statusMap: Record<string, string> = {
        PENDING: "PENDING",
        PAID: "PROCESSING",
        PREPARING: "PROCESSING",
        SHIPPED: "SHIPPED",
        DELIVERED: "DELIVERED",
        CANCELLED: "CANCELLED",
      };
      
      const customerName = mallOrder.customerName || mallOrder.user?.name || "-";
      
      // AS 접수 정보 추가
      const afterServiceInfo = asMap.get(customerName) || null;
      
      // 재구매 고객 여부 (MallOrder는 userId로 판단)
      const isRepeatCustomer = mallOrder.userId ? 
        mallOrders.filter(mo => mo.userId === mallOrder.userId).length >= 2 : false;

      return {
        id: `mall_${mallOrder.id}`,
        customerId: mallOrder.userId?.toString() || mallOrder.id,
        orderNumber: mallOrder.orderNumber,
        orderDate: mallOrder.createdAt,
        totalAmount: Number(mallOrder.totalAmount) || 0,
        orderAmount: Number(mallOrder.subtotal) || null,
        shippingFee: Number(mallOrder.shippingFee) || 0,
        status: statusMap[mallOrder.status] || "PENDING",
        ordererName: customerName,
        contactPhone: mallOrder.customerPhone || mallOrder.user?.phone || null,
        recipientZipCode: mallOrder.recipientZip || null,
        recipientAddr: mallOrder.shippingAddress || mallOrder.recipientAddr || null,
        productInfo,
        deliveryMsg: mallOrder.deliveryMsg || null,
        orderSource: "자사몰",
        courier: mallOrder.courier || null,
        trackingNumber: mallOrder.trackingNumber || null,
        partner: null,
        deliveryStatus: null,
        createdAt: mallOrder.createdAt,
        updatedAt: mallOrder.updatedAt,
        customer: {
          id: mallOrder.userId?.toString() || mallOrder.id,
          name: customerName,
          email: mallOrder.customerEmail || mallOrder.user?.email || "",
          phone: mallOrder.customerPhone || mallOrder.user?.phone || null,
        },
        items: [], // MallOrder는 items를 별도 테이블로 관리하지 않음
        afterServiceInfo,
        isRepeatCustomer,
      };
    });

    // 두 배열 합치기 (날짜순 정렬)
    let allOrders = [...convertedOrders, ...convertedMallOrders].sort((a, b) => {
      return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
    });

    // 필터 적용
    if (filter === 'pending-delivery') {
      // 배송정보 미등록 (주문상태확인용)
      allOrders = allOrders.filter(order => !order.trackingNumber);
    } else if (filter === 'with-tracking') {
      // 배송정보 등록 완료 (주문데이터통합용) - 운송장번호만 있으면 OK
      allOrders = allOrders.filter(order => order.trackingNumber);
    } else if (filter === 'delivery-ready') {
      // 배송정보 등록 대상 (배송정보연동의 "주문상태 불러오기"용)
      allOrders = allOrders.filter(order => !order.trackingNumber);
    }

    return allOrders;
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
  console.log(`🆕 [createOrder] 시작`);
  console.log(`📦 [createOrder] 입력 데이터:`, JSON.stringify(data, null, 2));
  
  const validation = CreateOrderSchema.safeParse(data);

  if (!validation.success) {
    console.error(`❌ [createOrder] Validation 실패:`, validation.error.flatten());
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "입력값이 올바르지 않습니다",
        details: validation.error.flatten().fieldErrors,
      },
    };
  }

  console.log(`✅ [createOrder] Validation 통과`);

  try {
    // customerId 또는 customerName 또는 recipientName으로 고객 찾기/생성
    let customerId = validation.data.customerId;
    
    if (!customerId) {
      const name = validation.data.customerName || validation.data.recipientName || "고객";
      console.log(`👤 [createOrder] 고객 찾기/생성: ${name}`);
      
      // 이름으로 기존 고객 찾기
      let customer = await prisma.customer.findFirst({
        where: { name }
      });
      
      // 없으면 새로 생성
      if (!customer) {
        console.log(`🆕 [createOrder] 새 고객 생성: ${name}`);
        customer = await prisma.customer.create({
          data: {
            id: createId(),
            name,
            email: `${name.replace(/\s/g, '')}@temp.com`,
            phone: validation.data.recipientPhone || validation.data.recipientMobile || null,
            updatedAt: new Date(),
          }
        });
      } else {
        console.log(`✅ [createOrder] 기존 고객 사용: ${customer.id}`);
      }
      
      customerId = customer.id;
    }

    if (!customerId) {
      console.error(`❌ [createOrder] customerId 없음`);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "고객 정보가 필요합니다",
        },
      };
    }

    console.log(`📝 [createOrder] Prisma create 데이터 준비 중... (giftSent: ${data.giftSent})`);

    const order = await prisma.order.create({
      data: {
        id: createId(),
        customerId: customerId,
        orderDate: validation.data.orderDate
          ? new Date(validation.data.orderDate)
          : new Date(),
        totalAmount: validation.data.totalAmount,
        status: validation.data.status,
        ordererName: validation.data.ordererName,
        contactPhone: validation.data.contactPhone,
        recipientName: validation.data.recipientName,
        recipientPhone: validation.data.recipientPhone,
        recipientMobile: validation.data.recipientMobile,
        recipientZipCode: validation.data.recipientZipCode,
        recipientAddr: validation.data.recipientAddr,
        orderNumber: validation.data.orderNumber && validation.data.orderNumber !== "" ? validation.data.orderNumber : null,
        productInfo: validation.data.productInfo,
        deliveryMsg: validation.data.deliveryMsg,
        orderSource: validation.data.orderSource,
        partner: validation.data.partner,
        basePrice: validation.data.basePrice,
        shippingFee: validation.data.shippingFee,
        additionalFee: validation.data.additionalFee,
        courier: validation.data.courier,
        trackingNumber: validation.data.trackingNumber,
        giftSent: data.giftSent ?? false,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ [createOrder] 주문 생성 성공 - ID: ${order.id}`);
    console.log(`🎁 [createOrder] 생성된 주문의 giftSent: ${order.giftSent}`);

    // 협력사가 주문을 생성한 경우 관리자에게 알림 (일괄 처리 시 건너뛰기)
    console.log(`🔔 [createOrder] skipNotification: ${data.skipNotification}`);
    if (!data.skipNotification) {
      console.log(`🔔 [createOrder] 개별 알림 전송 시작`);
      const session = await getServerSession(authOptions);
      const assignedPartner = (session?.user as any)?.assignedPartner;
      console.log(`🔔 [createOrder] assignedPartner: ${assignedPartner}`);
      if (assignedPartner) {
        // 협력사 계정이 주문을 생성한 경우
        console.log(`📢 [createOrder] 협력사 알림 전송: ${assignedPartner}`);
        await notifyNewOrderFromPartner(
          assignedPartner,
          order.orderNumber || `주문-${order.id.substring(0, 8)}`,
          order.productInfo || "상품정보 없음"
        ).catch(err => {
          console.error("관리자 알림 전송 실패:", err);
        });
      }
    }

    revalidatePath("/dashboard/orders");
    return {
      success: true,
      data: { id: order.id },
    };
  } catch (error: any) {
    console.error("❌ [createOrder] Error:", error);
    
    // 실제 에러 메시지 추출
    let errorMessage = "주문 생성에 실패했습니다";
    let errorDetails = null;
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    // Prisma 에러 상세 정보
    if (error.code) {
      errorDetails = {
        prismaCode: error.code,
        meta: error.meta,
        clientVersion: error.clientVersion
      };
    }
    
    return {
      success: false,
      error: {
        code: "CREATE_FAILED",
        message: errorMessage,
        details: errorDetails || error.toString(),
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
  console.log(`🔧 [updateOrder] 시작 - ID: ${id}`);
  console.log(`📦 [updateOrder] 입력 데이터:`, JSON.stringify(data, null, 2));
  
  if (!id) {
    console.error(`❌ [updateOrder] ID 없음`);
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
    console.error("❌ [updateOrder] Validation failed:", validation.error.flatten());
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

    // Decimal 타입 필드 목록
    const decimalFields = ['totalAmount', 'shippingFee', 'basePrice', 'additionalFee'];

    // 유효한 필드만 업데이트 데이터에 추가
    for (const [key, value] of Object.entries(validation.data)) {
      if (value !== undefined) {
        if (key === "orderDate") {
          updateData[key] = new Date(value as string);
        } else if (decimalFields.includes(key)) {
          // Decimal 필드는 문자열로 변환
          updateData[key] = String(value);
        } else if (key === "orderNumber") {
          // orderNumber가 빈 문자열이면 null로 저장 (unique 제약 조건 회피)
          updateData[key] = value === "" ? null : value;
        } else {
          updateData[key] = value;
        }
      }
    }

    console.log(`📝 [updateOrder] Prisma 업데이트 데이터:`, JSON.stringify(updateData, null, 2));

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    console.log(`✅ [updateOrder] 성공 - Order ID: ${order.id}`);
    console.log(`📊 [updateOrder] 업데이트된 필드:`, Object.keys(updateData).join(', '));

    // 운송장번호가 부여되었고, skipNotification이 false인 경우 협력사에게 알림
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔔 [updateOrder] 운송장번호 알림 체크`);
    console.log(`  - skipNotification: ${data.skipNotification}`);
    console.log(`  - trackingNumber: ${updateData.trackingNumber || '없음'}`);
    console.log(`  - courier: ${updateData.courier || '없음'}`);
    console.log(`${'='.repeat(80)}\n`);
    
    if (!data.skipNotification && updateData.trackingNumber && updateData.courier) {
      try {
        console.log(`✅ [updateOrder] 알림 조건 충족 - 협력사 알림 전송 시작`);
        
        // 주문의 orderSource(협력사명)로 해당 협력사 사용자 찾기
        const orderWithSource = await prisma.order.findUnique({
          where: { id },
          select: {
            id: true,
            orderNumber: true,
            orderSource: true,
            ordererName: true,
            customerName: true,
            contactPhone: true,
            customerPhone: true,
            recipientName: true,
            recipientPhone: true,
            productInfo: true,
            productName: true,
            quantity: true,
            basePrice: true,
            shippingFee: true,
            totalAmount: true,
          },
        });

        console.log(`\n📦 [updateOrder] 주문 정보 조회 완료:`);
        console.log(`  - 주문 ID: ${orderWithSource?.id}`);
        console.log(`  - 주문번호: ${orderWithSource?.orderNumber || '없음'}`);
        console.log(`  - 고객주문처명(orderSource): "${orderWithSource?.orderSource}"`);
        console.log(`  - 주문자명: ${orderWithSource?.ordererName || orderWithSource?.customerName || '없음'}`);
        console.log(`  - 연락처: ${orderWithSource?.contactPhone || orderWithSource?.customerPhone || '없음'}`);
        console.log(`  - 상품정보: ${orderWithSource?.productInfo || orderWithSource?.productName || '없음'}`);

        if (orderWithSource?.orderSource) {
          console.log(`\n🔍 [updateOrder] 협력사 사용자 조회 시작`);
          console.log(`  조회 조건:`);
          console.log(`    - assignedPartner: "${orderWithSource.orderSource}"`);
          console.log(`    - isActive: true`);
          console.log(`    ⚠️ role 조건 없음 - assignedPartner가 있는 모든 사용자에게 알림`);
          
          // orderSource(협력사명)과 일치하는 assignedPartner를 가진 모든 사용자 찾기 (role 무관)
          const partnerUsers = await prisma.user.findMany({
            where: {
              assignedPartner: orderWithSource.orderSource,
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              email: true,
              assignedPartner: true,
              role: true,
            },
          });

          console.log(`\n👥 [updateOrder] 협력사 사용자 조회 결과: ${partnerUsers.length}명`);
          if (partnerUsers.length > 0) {
            partnerUsers.forEach((user, index) => {
              console.log(`  ${index + 1}. ${user.name} (${user.email})`);
              console.log(`     - ID: ${user.id}`);
              console.log(`     - 역할: ${user.role}`);
              console.log(`     - 담당 협력사: "${user.assignedPartner}"`);
            });
          } else {
            console.log(`  ⚠️ 조건에 맞는 사용자 없음!`);
            console.log(`\n🔍 [updateOrder] assignedPartner가 있는 모든 사용자 확인:`);
            const allPartners = await prisma.user.findMany({
              where: { 
                NOT: { assignedPartner: null }
              },
              select: { id: true, name: true, email: true, role: true, assignedPartner: true, isActive: true },
            });
            console.log(`  assignedPartner가 있는 사용자: ${allPartners.length}명`);
            allPartners.forEach((p, i) => {
              console.log(`    ${i + 1}. ${p.name} (${p.email}) - role: ${p.role} - assignedPartner: "${p.assignedPartner}" - isActive: ${p.isActive}`);
            });
          }

          if (partnerUsers.length > 0) {
            console.log(`\n📧 [updateOrder] 알림 전송 시작 (${partnerUsers.length}명)`);
            const { notifyTrackingNumberToPartner } = await import("@/lib/notification-helper");
            
            // 각 협력사 사용자에게 알림 전송
            for (let i = 0; i < partnerUsers.length; i++) {
              const partnerUser = partnerUsers[i];
              console.log(`\n  [${i + 1}/${partnerUsers.length}] ${partnerUser.name}에게 알림 전송 중...`);
              console.log(`    - receiverId: ${partnerUser.id}`);
              console.log(`    - receiverEmail: ${partnerUser.email}`);
              console.log(`    - partnerName: ${partnerUser.assignedPartner || orderWithSource.orderSource}`);
              console.log(`    - orderNumber: ${orderWithSource.orderNumber || order.id}`);
              console.log(`    - courier: ${String(updateData.courier)}`);
              console.log(`    - trackingNumber: ${String(updateData.trackingNumber)}`);
              
              try {
                await notifyTrackingNumberToPartner(
                  partnerUser.id,
                  partnerUser.assignedPartner || orderWithSource.orderSource,
                  orderWithSource.orderNumber || order.id,
                  String(updateData.courier),
                  String(updateData.trackingNumber),
                  {
                    ordererName: orderWithSource.ordererName || orderWithSource.customerName || orderWithSource.recipientName || '정보 없음',
                    contactPhone: orderWithSource.contactPhone || orderWithSource.customerPhone || orderWithSource.recipientPhone || '정보 없음',
                    productInfo: orderWithSource.productInfo || orderWithSource.productName || '정보 없음',
                    quantity: orderWithSource.quantity || null,
                    basePrice: orderWithSource.basePrice || null,
                    shippingFee: orderWithSource.shippingFee || null,
                    totalAmount: orderWithSource.totalAmount || null,
                  }
                );
                console.log(`    ✅ 알림 전송 성공!`);
              } catch (err) {
                console.error(`    ❌ 알림 전송 실패:`, err);
                throw err;
              }
            }
            console.log(`\n✅ [updateOrder] 모든 협력사 사용자에게 알림 전송 완료`);
          } else {
            console.log(`⚠️ [updateOrder] 협력사 "${orderWithSource.orderSource}"에 해당하는 활성 사용자가 없습니다`);
          }
        } else {
          console.log(`⚠️ [updateOrder] orderSource가 없습니다 (본사 주문 또는 직접 등록)`);
        }
      } catch (notifyError) {
        console.error("\n❌❌❌ [updateOrder] 알림 전송 실패:", notifyError);
        console.error("스택 트레이스:", notifyError instanceof Error ? notifyError.stack : notifyError);
        // 알림 실패는 주문 업데이트 성공에 영향을 주지 않음
      }
    } else {
      console.log(`❌ [updateOrder] 알림 조건 미충족 - 알림 전송 건너뜀`);
    }
    console.log(`${'='.repeat(80)}\n`);

    revalidatePath("/dashboard/orders");
    return {
      success: true,
      data: { id: order.id },
    };
  } catch (error) {
    console.error("❌ [updateOrder] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    return {
      success: false,
      error: {
        code: "UPDATE_FAILED",
        message: `주문 업데이트 실패: ${errorMessage}`,
      },
    };
  }
}

/**
 * 주문을 삭제합니다. (휴지통으로 이동)
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
    // 휴지통으로 이동
    const result = await moveOrderToTrash(id);
    
    if (result.success) {
      revalidatePath("/dashboard/orders");
      return {
        success: true,
        data: { deleted: true },
      };
    } else {
      return {
        success: false,
        error: {
          code: "DELETE_FAILED",
          message: result.error?.message || "휴지통 이동에 실패했습니다",
        },
      };
    }
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
 * 모든 주문을 삭제합니다. (휴지통으로 이동)
 */
export async function deleteAllOrders(): Promise<ApiResponse<{ deletedCount: number }>> {
  try {
    // Order를 휴지통으로 이동
    const result = await moveAllOrdersToTrash(undefined, undefined, "전체 삭제");
    
    // MallOrder는 직접 삭제 (휴지통 미적용 - 추후 확장 가능)
    const mallOrderResult = await prisma.mallOrder.deleteMany({});

    const totalDeleted = (result.data?.movedCount || 0) + mallOrderResult.count;
    
    console.log(`[deleteAllOrders] Moved ${result.data?.movedCount || 0} Orders to trash and deleted ${mallOrderResult.count} MallOrders`);

    revalidatePath("/dashboard/orders");
    return {
      success: true,
      data: { deletedCount: totalDeleted },
    };
  } catch (error) {
    console.error("[deleteAllOrders] Error:", error);
    return {
      success: false,
      error: {
        code: "DELETE_ALL_FAILED",
        message: "전체 주문 삭제에 실패했습니다",
      },
    };
  }
}

/**
 * 주문 통계를 조회합니다. (Order + MallOrder 통합)
 * - 전체주문: 모든 주문 (운송장 있는 것 + 없는 것)
 * - 대기: 운송장번호가 없는 주문 (null 또는 빈 문자열) - /dashboard/orders/status 기준
 * - 배송중: 운송장번호 있음 + 배송완료 아님
 * - 배송완료: status가 DELIVERED
 */
export async function getOrderStats(): Promise<OrderStats> {
  try {
    // 현재 사용자의 협력사 정보 조회
    const assignedPartner = await getCurrentUserPartner();
    
    // 협력사 필터 조건 생성 (본사는 전체 접근)
    const partnerFilter = assignedPartner ? { orderSource: assignedPartner } : {};
    
    // CRM Order 통계
    const [orderTotal, orderPendingDelivery, orderDelivered] = await Promise.all([
      // 전체 주문
      prisma.order.count({ where: partnerFilter }),
      // 대기: 운송장번호가 없거나 빈 문자열인 주문 (/dashboard/orders/status 페이지 기준)
      prisma.order.count({ 
        where: { 
          ...partnerFilter, 
          OR: [
            { trackingNumber: null },
            { trackingNumber: "" },
          ]
        } 
      }),
      // 배송완료
      prisma.order.count({ where: { ...partnerFilter, status: "DELIVERED" } }),
    ]);

    // 배송중: 운송장번호가 있고 + 배송완료 아닌 것
    const orderShipped = await prisma.order.count({ 
      where: { 
        ...partnerFilter, 
        trackingNumber: { not: null },
        NOT: [
          { trackingNumber: "" },
          { status: "DELIVERED" },
        ]
      } 
    });

    // MallOrder 통계 (협력사 계정이면 제외)
    let mallTotal = 0, mallPendingDelivery = 0, mallShipped = 0, mallDelivered = 0;
    if (!assignedPartner) {
      [mallTotal, mallPendingDelivery, mallDelivered] = await Promise.all([
        prisma.mallOrder.count(),
        prisma.mallOrder.count({ where: { OR: [{ trackingNumber: null }, { trackingNumber: "" }] } }),
        prisma.mallOrder.count({ where: { status: "DELIVERED" } }),
      ]);
      
      // MallOrder 배송중
      mallShipped = await prisma.mallOrder.count({ 
        where: { 
          trackingNumber: { not: null },
          NOT: [{ trackingNumber: "" }, { status: "DELIVERED" }]
        } 
      });
    }

    return {
      total: orderTotal + mallTotal,
      pending: orderPendingDelivery + mallPendingDelivery, // 대기 = 운송장 미등록
      processing: 0, // 처리중은 사용하지 않음
      shipped: orderShipped + mallShipped, // 배송중
      delivered: orderDelivered + mallDelivered, // 배송완료
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
