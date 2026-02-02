"use server";

import { prisma } from "@/lib/prisma";

// 모든 컬럼 정의 (주문, 고객, AS)
export const ORDER_COLUMNS = [
  { id: "orderDate", name: "주문일자", required: true },
  { id: "orderNumber", name: "주문번호", required: false },
  { id: "recipientName", name: "고객명", required: true },
  { id: "recipientPhone", name: "전화번호", required: false },
  { id: "recipientMobile", name: "휴대폰", required: true },
  { id: "recipientZipCode", name: "우편번호", required: false },
  { id: "recipientAddr", name: "주소", required: true },
  { id: "productInfo", name: "상품정보", required: true },
  { id: "totalAmount", name: "총금액", required: true },
  { id: "basePrice", name: "상품금액", required: false },
  { id: "shippingFee", name: "배송비", required: false },
  { id: "orderSource", name: "고객주문처명", required: true },
  { id: "courier", name: "택배사", required: false },
  { id: "trackingNumber", name: "운송장번호", required: false },
  { id: "deliveryMsg", name: "배송메세지", required: false },
  { id: "giftSent", name: "사은품발송", required: false },
  { id: "status", name: "상태", required: true },
];

export const CUSTOMER_COLUMNS = [
  { id: "name", name: "고객명", required: true },
  { id: "email", name: "이메일", required: false },
  { id: "phone", name: "전화번호", required: true },
  { id: "company", name: "회사", required: false },
  { id: "status", name: "상태", required: true },
  { id: "segment", name: "세그먼트", required: false },
  { id: "grade", name: "등급", required: false },
  { id: "totalPurchaseAmount", name: "총구매금액", required: false },
  { id: "address", name: "주소", required: false },
  { id: "createdAt", name: "등록일", required: false },
];

export const AS_COLUMNS = [
  { id: "asNumber", name: "AS번호", required: true },
  { id: "ticketNumber", name: "티켓번호", required: false },
  { id: "customerName", name: "고객명", required: true },
  { id: "customerPhone", name: "전화번호", required: true },
  { id: "customerAddress", name: "주소", required: false },
  { id: "companyName", name: "회사명", required: false },
  { id: "type", name: "유형", required: true },
  { id: "issueType", name: "문제유형", required: false },
  { id: "status", name: "상태", required: true },
  { id: "priority", name: "우선순위", required: false },
  { id: "description", name: "설명", required: false },
  { id: "productName", name: "상품명", required: true },
  { id: "symptom", name: "증상", required: false },
  { id: "diagnosis", name: "진단", required: false },
  { id: "resolution", name: "해결방법", required: false },
  { id: "pickupRequestDate", name: "수거요청일", required: false },
  { id: "processDate", name: "처리일", required: false },
  { id: "shipDate", name: "발송일", required: false },
  { id: "trackingNumber", name: "운송장번호", required: false },
  { id: "courier", name: "택배사", required: false },
  { id: "createdAt", name: "등록일", required: true },
];

// 기본 컬럼 설정 (필수 + 주요 컬럼)
const DEFAULT_ORDER_COLUMNS = ORDER_COLUMNS.filter(c => c.required).map(c => c.id);
const DEFAULT_CUSTOMER_COLUMNS = CUSTOMER_COLUMNS.filter(c => c.required).map(c => c.id);
const DEFAULT_AS_COLUMNS = AS_COLUMNS.filter(c => c.required).map(c => c.id);

// 협력사별 컬럼 설정 조회
export async function getPartnerColumnSettings(partnerCode: string) {
  try {
    const settings = await prisma.partnerColumnSettings.findUnique({
      where: { partnerCode },
    });

    if (!settings) {
      // 기본 설정 반환
      return {
        partnerCode,
        orderColumns: DEFAULT_ORDER_COLUMNS,
        customerColumns: DEFAULT_CUSTOMER_COLUMNS,
        asColumns: DEFAULT_AS_COLUMNS,
      };
    }

    return {
      partnerCode: settings.partnerCode,
      orderColumns: settings.orderColumns as string[],
      customerColumns: settings.customerColumns as string[],
      asColumns: settings.asColumns as string[],
    };
  } catch (error) {
    console.error("컬럼 설정 조회 실패:", error);
    return {
      partnerCode,
      orderColumns: DEFAULT_ORDER_COLUMNS,
      customerColumns: DEFAULT_CUSTOMER_COLUMNS,
      asColumns: DEFAULT_AS_COLUMNS,
    };
  }
}

// 모든 협력사 컬럼 설정 조회
export async function getAllPartnerColumnSettings() {
  try {
    const settings = await prisma.partnerColumnSettings.findMany();
    return settings.map(s => ({
      partnerCode: s.partnerCode,
      orderColumns: s.orderColumns as string[],
      customerColumns: s.customerColumns as string[],
      asColumns: s.asColumns as string[],
    }));
  } catch (error) {
    console.error("모든 컬럼 설정 조회 실패:", error);
    return [];
  }
}

// 협력사별 컬럼 설정 저장/업데이트
export async function savePartnerColumnSettings(
  partnerCode: string,
  orderColumns: string[],
  customerColumns: string[],
  asColumns: string[]
) {
  try {
    // 필수 컬럼이 포함되어 있는지 확인
    const requiredOrderCols = ORDER_COLUMNS.filter(c => c.required).map(c => c.id);
    const requiredCustomerCols = CUSTOMER_COLUMNS.filter(c => c.required).map(c => c.id);
    const requiredASCols = AS_COLUMNS.filter(c => c.required).map(c => c.id);

    // 필수 컬럼 자동 추가
    const finalOrderColumns = [...new Set([...requiredOrderCols, ...orderColumns])];
    const finalCustomerColumns = [...new Set([...requiredCustomerCols, ...customerColumns])];
    const finalASColumns = [...new Set([...requiredASCols, ...asColumns])];

    await prisma.partnerColumnSettings.upsert({
      where: { partnerCode },
      create: {
        partnerCode,
        orderColumns: finalOrderColumns,
        customerColumns: finalCustomerColumns,
        asColumns: finalASColumns,
      },
      update: {
        orderColumns: finalOrderColumns,
        customerColumns: finalCustomerColumns,
        asColumns: finalASColumns,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("컬럼 설정 저장 실패:", error);
    return { success: false, error: "설정 저장에 실패했습니다." };
  }
}

// 협력사 목록 조회 (기존 데이터에서 추출)
export async function getPartnerList() {
  try {
    // Order 테이블에서 고유한 orderSource 목록 추출
    const orders = await prisma.order.findMany({
      select: { orderSource: true },
      distinct: ["orderSource"],
      where: {
        orderSource: { not: null },
      },
    });

    const partners = orders
      .map(o => o.orderSource)
      .filter((p): p is string => p !== null && p !== "")
      .sort();

    // 기본 협력사 목록 추가
    const defaultPartners = ["본사", "로켓그로스", "그로트", "스몰닷", "해피포즈", "기타"];
    const allPartners = [...new Set([...defaultPartners, ...partners])].sort();

    return allPartners;
  } catch (error) {
    console.error("협력사 목록 조회 실패:", error);
    return ["본사", "로켓그로스", "그로트", "스몰닷", "해피포즈", "기타"];
  }
}
