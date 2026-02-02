// 알림 헬퍼 함수
import { prisma } from "@/lib/prisma";

export type NotificationType = 
  | "ORDER_REGISTERED"      // 협력사가 주문 등록
  | "DELIVERY_COMPLETED"    // 본사가 송장번호 입력
  | "AS_REGISTERED";        // 협력사가 AS 등록

interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  senderType: "PARTNER" | "HEADQUARTERS";
  senderName: string;
  senderId?: string;
  targetType: "PARTNER" | "HEADQUARTERS" | "ALL";
  targetPartner?: string | null;
  relatedId?: string;
  relatedType?: "ORDER" | "AS_REQUEST";
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        type: params.type,
        title: params.title,
        message: params.message,
        senderType: params.senderType,
        senderName: params.senderName,
        senderId: params.senderId,
        targetType: params.targetType,
        targetPartner: params.targetPartner,
        relatedId: params.relatedId,
        relatedType: params.relatedType,
      },
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

// 협력사가 주문 등록 시 본사에 알림
export async function notifyOrderRegistered(
  partnerName: string,
  orderId: string,
  senderId?: string
) {
  return createNotification({
    type: "ORDER_REGISTERED",
    title: "새 주문 등록",
    message: `${partnerName}에서 주문을 등록했습니다.`,
    senderType: "PARTNER",
    senderName: partnerName,
    senderId,
    targetType: "HEADQUARTERS",
    targetPartner: null,
    relatedId: orderId,
    relatedType: "ORDER",
  });
}

// 본사가 송장번호 입력 시 협력사에 알림
export async function notifyDeliveryCompleted(
  partnerName: string,
  orderId: string,
  senderId?: string
) {
  return createNotification({
    type: "DELIVERY_COMPLETED",
    title: "배송정보 연동 완료",
    message: `배송정보가 연동되었습니다.`,
    senderType: "HEADQUARTERS",
    senderName: "본사",
    senderId,
    targetType: "PARTNER",
    targetPartner: partnerName,
    relatedId: orderId,
    relatedType: "ORDER",
  });
}

// 협력사가 AS 등록 시 본사에 알림
export async function notifyAsRegistered(
  partnerName: string,
  asRequestId: string,
  senderId?: string
) {
  return createNotification({
    type: "AS_REGISTERED",
    title: "새 AS 요청",
    message: `${partnerName}에서 AS 요청을 등록했습니다.`,
    senderType: "PARTNER",
    senderName: partnerName,
    senderId,
    targetType: "HEADQUARTERS",
    targetPartner: null,
    relatedId: asRequestId,
    relatedType: "AS_REQUEST",
  });
}
