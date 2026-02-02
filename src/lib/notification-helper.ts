/**
 * 알림 헬퍼 함수
 * 관리자에게 메시지를 전송하는 유틸리티
 */

import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";

/**
 * 모든 관리자에게 메시지 전송
 * @param subject 메시지 제목
 * @param content 메시지 내용
 * @param priority 우선순위 (LOW, NORMAL, HIGH, URGENT)
 * @param senderName 발신자 이름
 * @returns 전송 성공 여부
 */
export async function sendMessageToAdmins(
  subject: string,
  content: string,
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" = "NORMAL",
  senderName: string = "시스템"
): Promise<{ success: boolean; count: number }> {
  try {
    console.log(`[sendMessageToAdmins] 시작 - 제목: ${subject}, 발신자: ${senderName}`);
    
    // ADMIN 및 SUPER_ADMIN 역할을 가진 모든 사용자 조회
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "SUPER_ADMIN"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    console.log(`[sendMessageToAdmins] 관리자 ${admins.length}명 발견:`, admins.map(a => `${a.name}(${a.email})`));

    if (admins.length === 0) {
      console.log("[sendMessageToAdmins] 관리자가 없습니다.");
      return { success: false, count: 0 };
    }

    // 각 관리자에게 메시지 생성
    const messages = admins.map((admin) => ({
      id: createId(),
      senderId: "system", // 시스템 발신
      senderName: senderName,
      senderEmail: "system@company.co.kr",
      receiverId: admin.id,
      receiverName: admin.name || "관리자",
      receiverEmail: admin.email,
      subject: subject,
      content: content,
      priority: priority,
      isRead: false,
      // sentAt 대신 createdAt을 DB가 자동 설정
    }));

    console.log(`[sendMessageToAdmins] 메시지 생성 데이터:`, JSON.stringify(messages[0], null, 2));

    // 메시지 일괄 생성
    const result = await prisma.message.createMany({
      data: messages,
    });

    // 알림(notification) 레코드 생성 - 팝업 표시를 위함
    const notifications = admins.map((admin) => ({
      id: createId(),
      type: "ORDER_REGISTERED",
      title: subject,
      message: content,
      senderType: "PARTNER",
      senderName: senderName,
      targetType: "HEADQUARTERS",
      targetPartner: null,
      relatedId: null,
      relatedType: "ORDER",
      isRead: false,
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    console.log(`[sendMessageToAdmins] ✅ ${result.count}개 메시지 생성 완료`);
    console.log(`[sendMessageToAdmins] ✅ ${notifications.length}개 알림 생성 완료 (팝업용)`);
    console.log(`[sendMessageToAdmins] ${admins.length}명의 관리자에게 메시지 전송 완료`);
    return { success: true, count: admins.length };
  } catch (error) {
    console.error("[sendMessageToAdmins] ❌ 메시지 전송 실패:", error);
    console.error("[sendMessageToAdmins] 에러 상세:", JSON.stringify(error, null, 2));
    return { success: false, count: 0 };
  }
}

/**
 * 협력사 주문 생성 알림
 * @param partnerName 협력사명
 * @param orderNumber 주문번호
 * @param productInfo 상품정보
 */
export async function notifyNewOrderFromPartner(
  partnerName: string,
  orderNumber: string,
  productInfo: string
): Promise<void> {
  console.log(`📦 [notifyNewOrderFromPartner] 호출됨:`, {
    partnerName,
    orderNumber,
    productInfo
  });
  
  await sendMessageToAdmins(
    `[주문 알림] ${partnerName}에서 새 주문이 접수되었습니다`,
    `협력사 ${partnerName}에서 주문을 추가하였습니다.\n\n` +
    `- 주문번호: ${orderNumber}\n` +
    `- 상품정보: ${productInfo}\n\n` +
    `주문 상세 내역을 확인해주세요.`,
    "HIGH",
    partnerName
  );
  
  console.log(`📦 [notifyNewOrderFromPartner] 완료`);
}

/**
 * 협력사 A/S 접수 알림
 * @param partnerName 협력사명
 * @param ticketNumber 티켓번호
 * @param customerName 고객명
 * @param issueDescription 문제설명
 */
export async function notifyNewASFromPartner(
  partnerName: string,
  ticketNumber: string,
  customerName: string,
  issueDescription: string
): Promise<void> {
  await sendMessageToAdmins(
    `[A/S 알림] ${partnerName}에서 A/S 요청이 접수되었습니다`,
    `협력사 ${partnerName}에서 A/S 요청이 있습니다.\n\n` +
    `- 티켓번호: ${ticketNumber}\n` +
    `- 고객명: ${customerName}\n` +
    `- 문제내용: ${issueDescription || "상세 내용 없음"}\n\n` +
    `A/S 내역을 확인해주세요.`,
    "HIGH",
    partnerName
  );
}

/**
 * 특정 협력사 사용자에게 메시지 전송
 * @param partnerId 협력사 사용자 ID
 * @param partnerName 협력사명
 * @param subject 메시지 제목
 * @param content 메시지 내용
 * @param priority 우선순위
 * @returns 전송 성공 여부
 */
export async function sendMessageToPartner(
  partnerId: string,
  partnerName: string,
  subject: string,
  content: string,
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" = "NORMAL"
): Promise<{ success: boolean }> {
  try {
    console.log(`\n${'━'.repeat(80)}`);
    console.log(`📧 [sendMessageToPartner] 함수 시작`);
    console.log(`  입력 매개변수:`);
    console.log(`    - partnerId: "${partnerId}"`);
    console.log(`    - partnerName: "${partnerName}"`);
    console.log(`    - subject: "${subject}"`);
    console.log(`    - content: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);
    console.log(`    - priority: "${priority}"`);
    console.log(`${'━'.repeat(80)}`);
    
    console.log(`\n🔍 [sendMessageToPartner] 협력사 사용자 정보 조회 중...`);
    console.log(`  WHERE id = "${partnerId}"`);
    
    // 협력사 사용자 정보 조회 (이메일 필요)
    const partnerUser = await prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedPartner: true,
      },
    });

    console.log(`\n📋 [sendMessageToPartner] 조회 결과:`);
    if (partnerUser) {
      console.log(`  ✅ 사용자 발견!`);
      console.log(`    - ID: ${partnerUser.id}`);
      console.log(`    - 이름: ${partnerUser.name}`);
      console.log(`    - 이메일: ${partnerUser.email}`);
      console.log(`    - 역할: ${partnerUser.role}`);
      console.log(`    - 담당 협력사: ${partnerUser.assignedPartner || '없음'}`);
    } else {
      console.log(`  ❌ 사용자를 찾을 수 없습니다!`);
      console.error(`\n❌❌❌ [sendMessageToPartner] 오류: 협력사 사용자를 찾을 수 없습니다`);
      console.error(`  partnerId: "${partnerId}"`);
      console.error(`${'━'.repeat(80)}\n`);
      return { success: false };
    }
    
    console.log(`\n💾 [sendMessageToPartner] 메시지 생성 중...`);
    const messageData = {
      id: createId(),
      senderId: "system",
      senderName: "시스템",
      senderEmail: "system@company.co.kr",
      receiverId: partnerId,
      receiverName: partnerUser.name || partnerName,
      receiverEmail: partnerUser.email,
      subject: subject,
      content: content,
      priority: priority,
      isRead: false,
    };
    console.log(`  메시지 데이터:`, JSON.stringify(messageData, null, 2));
    
    const message = await prisma.message.create({
      data: messageData,
    });

    console.log(`\n✅ [sendMessageToPartner] 메시지 저장 완료! ID: ${message.id}`);

    // 알림(notification) 레코드 생성 - 팝업 표시를 위함
    // content가 너무 길면 요약본 사용 (최대 200자)
    const shortMessage = content.length > 200 
      ? content.substring(0, 200) + "..." 
      : content;

    const notificationData = {
      id: createId(),
      type: "DELIVERY_COMPLETED",
      title: subject,
      message: shortMessage,
      senderType: "HEADQUARTERS",
      senderName: "시스템",
      targetType: "PARTNER",
      targetPartner: partnerUser.assignedPartner || partnerName,
      relatedId: null,
      relatedType: "ORDER",
      isRead: false,
    };

    console.log(`\n🔔 [sendMessageToPartner] Notification 생성 중...`);
    console.log(`  Notification 데이터:`, JSON.stringify(notificationData, null, 2));

    await prisma.notification.create({
      data: notificationData,
    });

    console.log(`\n✅✅✅ [sendMessageToPartner] 메시지 및 알림 저장 완료!`);
    console.log(`  메시지 ID: ${message.id}`);
    console.log(`  수신자: ${message.receiverName} (${message.receiverEmail})`);
    console.log(`  제목: ${message.subject}`);
    console.log(`  알림 ID: ${notificationData.id} (팝업용)`);
    console.log(`  targetPartner: ${notificationData.targetPartner}`);
    console.log(`${'━'.repeat(80)}\n`);
    return { success: true };
  } catch (error) {
    console.error(`\n❌❌❌ [sendMessageToPartner] 메시지 전송 실패:`, error);
    console.error(`스택 트레이스:`, error instanceof Error ? error.stack : error);
    console.error(`${'━'.repeat(80)}\n`);
    return { success: false };
  }
}

/**
 * 협력사에게 운송장번호 부여 알림
 * @param partnerId 협력사 사용자 ID
 * @param partnerName 협력사명
 * @param orderNumber 주문번호
 * @param courier 택배사
 * @param trackingNumber 운송장번호
 */
export async function notifyTrackingNumberToPartner(
  partnerId: string,
  partnerName: string,
  orderNumber: string,
  courier: string,
  trackingNumber: string,
  orderDetails?: {
    ordererName: string;
    contactPhone: string;
    productInfo: string;
    quantity?: number | null;
    basePrice?: number | null;
    shippingFee?: number | null;
    totalAmount?: number | null;
  }
): Promise<void> {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`🚚 [notifyTrackingNumberToPartner] 함수 호출됨`);
  console.log(`  매개변수:`);
  console.log(`    - partnerId: ${partnerId}`);
  console.log(`    - partnerName: ${partnerName}`);
  console.log(`    - orderNumber: ${orderNumber}`);
  console.log(`    - courier: ${courier}`);
  console.log(`    - trackingNumber: ${trackingNumber}`);
  if (orderDetails) {
    console.log(`    - 주문자명: ${orderDetails.ordererName}`);
    console.log(`    - 연락처: ${orderDetails.contactPhone}`);
    console.log(`    - 상품정보: ${orderDetails.productInfo}`);
  }
  console.log(`${'─'.repeat(80)}`);
  
  const subject = `[배송 알림] 운송장번호가 부여되었습니다`;
  
  let content = `주문하신 상품의 운송장번호가 등록되었습니다.\n\n`;
  content += `📦 주문 정보\n`;
  content += `- 주문번호: ${orderNumber}\n`;
  
  if (orderDetails) {
    content += `- 주문자명: ${orderDetails.ordererName}\n`;
    content += `- 연락처: ${orderDetails.contactPhone}\n`;
    content += `\n🛒 주문 내역\n`;
    content += `- 상품: ${orderDetails.productInfo}\n`;
    if (orderDetails.quantity) {
      content += `- 수량: ${orderDetails.quantity}개\n`;
    }
    if (orderDetails.basePrice) {
      content += `- 상품금액: ${orderDetails.basePrice.toLocaleString()}원\n`;
    }
    if (orderDetails.shippingFee) {
      content += `- 배송비: ${orderDetails.shippingFee.toLocaleString()}원\n`;
    }
    if (orderDetails.totalAmount) {
      content += `- 총 금액: ${orderDetails.totalAmount.toLocaleString()}원\n`;
    }
  }
  
  content += `\n🚚 배송 정보\n`;
  content += `- 택배사: ${courier}\n`;
  content += `- 운송장번호: ${trackingNumber}\n\n`;
  content += `곧 배송이 시작됩니다.`;

  console.log(`\n📝 [notifyTrackingNumberToPartner] 메시지 내용 생성:`);
  console.log(`  제목: ${subject}`);
  console.log(`  내용: ${content.replace(/\n/g, ' | ')}`);
  console.log(`\n📤 [notifyTrackingNumberToPartner] sendMessageToPartner 호출 중...`);
  
  await sendMessageToPartner(
    partnerId,
    partnerName,
    subject,
    content,
    "HIGH"
  );
  
  console.log(`✅ [notifyTrackingNumberToPartner] 완료`);
  console.log(`${'─'.repeat(80)}\n`);
}
