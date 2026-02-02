"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 택배사 코드 매핑
const COURIER_CODE_MAP: Record<string, string> = {
  "CJ대한통운": "04",
  "한진택배": "05",
  "롯데택배": "08",
  "로젠택배": "06",
  "우체국택배": "01",
  "GS Postbox": "24",
  "대신택배": "22",
  "경동택배": "23",
};

// 스마트택배 API level을 deliveryStatus로 매핑
function mapLevelToDeliveryStatus(level: number): string {
  switch (level) {
    case 1:
      return "PICKED_UP"; // 상품인수
    case 2:
      return "IN_TRANSIT"; // 상품이동중
    case 3:
      return "ARRIVED"; // 배송지도착
    case 4:
      return "OUT_FOR_DELIVERY"; // 배송출발
    case 5:
    case 6:
      return "DELIVERED"; // 배송완료
    default:
      return "PENDING"; // 대기
  }
}

// 택배사명으로 코드 찾기
function getCourierCode(courierName: string): string | null {
  // 정확한 매칭
  if (COURIER_CODE_MAP[courierName]) {
    return COURIER_CODE_MAP[courierName];
  }
  
  // 부분 매칭 (예: "CJ" -> "CJ대한통운")
  const matchedKey = Object.keys(COURIER_CODE_MAP).find(key => 
    key.includes(courierName) || courierName.includes(key)
  );
  
  return matchedKey ? COURIER_CODE_MAP[matchedKey] : null;
}

/**
 * 스마트택배 API로 배송 정보 조회
 */
export async function fetchDeliveryInfo(
  courierCode: string,
  trackingNumber: string
): Promise<{
  success: boolean;
  level?: number;
  status?: string;
  details?: any[];
  error?: string;
}> {
  const apiKey = process.env.SWEETTRACKER_API_KEY;
  
  console.log('[fetchDeliveryInfo] API KEY 확인:', apiKey ? `설정됨 (${apiKey.substring(0, 10)}...)` : '설정되지 않음');
  
  if (!apiKey || apiKey === 'your-api-key-here') {
    return { 
      success: false, 
      error: "⚠️ .env 파일에 실제 API KEY를 설정해주세요. 현재: " + (apiKey || "없음") 
    };
  }

  try {
    const url = `https://info.sweettracker.co.kr/api/v1/trackingInfo?t_key=${apiKey}&t_code=${courierCode}&t_invoice=${trackingNumber}`;
    
    console.log('[fetchDeliveryInfo] 요청 URL:', url.replace(apiKey, '***'));
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    console.log('[fetchDeliveryInfo] 응답 상태:', response.status);
    console.log('[fetchDeliveryInfo] 응답 데이터:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return {
        success: false,
        error: `❌ ${data.msg || '배송 조회 실패'} (코드: ${data.code || response.status})`,
      };
    }

    return {
      success: true,
      level: data.level,
      status: mapLevelToDeliveryStatus(data.level),
      details: data.trackingDetails,
    };
  } catch (error) {
    console.error("[fetchDeliveryInfo] Error:", error);
    return {
      success: false,
      error: "배송 조회 중 오류가 발생했습니다: " + String(error),
    };
  }
}

/**
 * 주문의 배송 상태 업데이트
 */
export async function updateOrderDeliveryStatus(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        courier: true,
        trackingNumber: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: "주문을 찾을 수 없습니다",
      };
    }

    if (!order.courier || !order.trackingNumber) {
      return {
        success: false,
        error: "택배사 또는 운송장 번호가 없습니다",
      };
    }

    // 택배사 코드 찾기
    const courierCode = getCourierCode(order.courier);
    if (!courierCode) {
      return {
        success: false,
        error: `지원하지 않는 택배사입니다: ${order.courier}`,
      };
    }

    // 배송 정보 조회
    const deliveryInfo = await fetchDeliveryInfo(courierCode, order.trackingNumber);

    if (!deliveryInfo.success) {
      return deliveryInfo;
    }

    // 배송일, 도착일 추출
    let shippedAt: Date | undefined;
    let deliveredAt: Date | undefined;

    if (deliveryInfo.details && deliveryInfo.details.length > 0) {
      // 첫 번째 배송 이벤트 (상품인수) = 배송일
      const firstDetail = deliveryInfo.details[0];
      if (firstDetail.time) {
        shippedAt = new Date(firstDetail.time);
      }

      // 배송완료 상태인 경우 마지막 이벤트 = 도착일
      if (deliveryInfo.level === 5 || deliveryInfo.level === 6) {
        const lastDetail = deliveryInfo.details[deliveryInfo.details.length - 1];
        if (lastDetail.time) {
          deliveredAt = new Date(lastDetail.time);
        }
      }
    }

    // DB 업데이트
    await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus: deliveryInfo.status,
        shippedAt: shippedAt,
        deliveredAt: deliveredAt,
      },
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/orders/status");

    return {
      success: true,
      status: deliveryInfo.status,
      level: deliveryInfo.level,
    };
  } catch (error) {
    console.error("[updateOrderDeliveryStatus] Error:", error);
    return {
      success: false,
      error: "배송 상태 업데이트 실패",
    };
  }
}

/**
 * 배송 정보가 있는 모든 주문의 배송 상태 일괄 업데이트
 */
export async function updateAllDeliveryStatuses() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        courier: { not: null },
        trackingNumber: { not: null },
        deliveryStatus: { not: "DELIVERED" }, // 배송완료가 아닌 것만
      },
      select: {
        id: true,
        courier: true,
        trackingNumber: true,
      },
    });

    const results = {
      total: orders.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const order of orders) {
      const result = await updateOrderDeliveryStatus(order.id);
      
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`${order.trackingNumber}: ${result.error}`);
      }
      
      // API 요청 제한을 위한 딜레이 (1초)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/orders/status");

    return {
      success: true,
      ...results,
    };
  } catch (error) {
    console.error("[updateAllDeliveryStatuses] Error:", error);
    return {
      success: false,
      error: "일괄 업데이트 실패",
    };
  }
}
