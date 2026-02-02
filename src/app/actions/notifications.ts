"use server";

import { notifyNewOrderFromPartner } from "@/lib/notification-helper";
import { sendMessageToPartner } from "@/lib/notification-helper";
import { prisma } from "@/lib/prisma";

/**
 * 협력사 발주서 업로드 알림 (Server Action)
 * @param partnerName 협력사명
 * @param successCount 성공 건수
 */
export async function notifyPartnerOrderUpload(
  partnerName: string,
  successCount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🔔 [notifyPartnerOrderUpload] Server Action 호출:`, {
      partnerName,
      successCount
    });

    await notifyNewOrderFromPartner(
      partnerName,
      `발주서 업로드 (${successCount}건)`,
      `${successCount}건의 주문이 일괄등록되었습니다.`
    );

    console.log(`✅ [notifyPartnerOrderUpload] 알림 전송 완료`);
    return { success: true };
  } catch (error) {
    console.error(`❌ [notifyPartnerOrderUpload] 알림 전송 실패:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 배송정보 일괄 업로드 시 협력사별 통합 알림 (Server Action)
 * @param partnerUpdates 협력사별 업데이트 정보
 */
export async function notifyPartnerDeliveryUpdates(
  partnerUpdates: Map<string, { orderSource: string; count: number; orders: string[] }>
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🚚 [notifyPartnerDeliveryUpdates] Server Action 호출:`, {
      partnerCount: partnerUpdates.size
    });

    for (const [orderSource, info] of partnerUpdates) {
      console.log(`📦 [배송정보 알림] 협력사 "${orderSource}" 처리 중...`);
      
      // orderSource(협력사명)와 일치하는 assignedPartner를 가진 PARTNER 역할의 사용자 찾기
      const partnerUsers = await prisma.user.findMany({
        where: {
          role: "PARTNER",
          assignedPartner: orderSource,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          assignedPartner: true,
        },
      });

      console.log(`👥 [배송정보 알림] 협력사 "${orderSource}" 사용자: ${partnerUsers.length}명`, partnerUsers.map(u => u.email));

      if (partnerUsers.length > 0) {
        const orderList = info.orders.slice(0, 5).join(", ");
        const moreCount = info.orders.length > 5 ? ` 외 ${info.orders.length - 5}건` : "";
        
        // 각 협력사 사용자에게 알림 전송
        for (const partnerUser of partnerUsers) {
          console.log(`📧 [배송정보 알림] 사용자 ${partnerUser.name}(${partnerUser.email})에게 알림 전송 중...`);
          
          const result = await sendMessageToPartner(
            partnerUser.id,
            partnerUser.assignedPartner || orderSource,
            `[배송 알림] 운송장번호가 일괄 등록되었습니다 (${info.count}건)`,
            `${info.count}건의 주문에 운송장번호가 등록되었습니다.\n\n` +
            `- 주문번호: ${orderList}${moreCount}\n\n` +
            `곧 배송이 시작됩니다.`,
            "HIGH"
          );
          
          if (result.success) {
            console.log(`✅ [배송정보 알림] 협력사 사용자 ${partnerUser.name}에게 알림 전송 완료`);
          } else {
            console.error(`❌ [배송정보 알림] 협력사 사용자 ${partnerUser.name}에게 알림 전송 실패`);
          }
        }
      } else {
        console.log(`⚠️ [배송정보 알림] 협력사 "${orderSource}"에 해당하는 활성 사용자가 없습니다`);
      }
    }
    
    console.log(`✅ [notifyPartnerDeliveryUpdates] ${partnerUpdates.size}개 협력사 알림 전송 완료`);
    return { success: true };
  } catch (error) {
    console.error(`❌ [notifyPartnerDeliveryUpdates] 알림 전송 실패:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
