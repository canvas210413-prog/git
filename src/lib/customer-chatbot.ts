"use server";

import { prisma } from "@/lib/prisma";
import { chatCompletion } from "@/lib/ai";
import { startChatSession, addChatMessage, endChatSession } from "@/app/actions/chat-history";

// ============================================================================
// 미니쉴드 고객 챗봇 - 시나리오 기반 응대 시스템
// ============================================================================

/**
 * 고객 인증 정보
 */
export interface CustomerInfo {
  customerId: string;
  customerName: string;
  phone: string;
}

/**
 * 챗봇 응답
 */
export interface ChatbotResponse {
  success: boolean;
  message: string;
  intent?: string;
  requiresPhone?: boolean;
  orderData?: any[];
  sessionId?: string;
  timestamp: string;
  escalated?: boolean;           // 상담원 이관 요청됨
  waitingNumber?: number;        // 대기 번호
  estimatedWaitTime?: string;    // 예상 대기 시간
}

// ============================================================================
// 미니쉴드 제품 지식베이스
// ============================================================================

const PRODUCT_KNOWLEDGE = `
## 미니쉴드 공기청정기 제품 정보

### 제품 개요
- 브랜드: 20vs80
- 제품명: 미니쉴드 공기청정기
- 카테고리: 휴대용/차량용 공기청정기
- 가격대: 10만원 ~ 17만원
- 주요 타겟: 차량 운전자(흡연자 포함), 유모차 사용 부모, 독서실 이용자, 캠핑족

### 핵심 기술 사양
1. **4단계 필터 시스템**
   - 프리 필터: 큰 먼지, 머리카락, 애완동물 털 제거
   - 헤파(HEPA) 필터: 미세먼지(PM2.5), 초미세먼지 제거
   - 활성탄 필터: 냄새, 유해가스(VOCs), 담배냄새, 새차증후군 제거
   - 광촉매 필터: 살균, 항균, 악취 분해 (냄새를 덮는게 아니라 분해)

2. **배터리**
   - 내장 배터리 탑재 (저가형 대비 차별점)
   - 약풍: 4~6시간 / 강풍: 2~3시간 사용 가능
   - 무선 사용으로 차량, 유모차, 사무실 등 이동 가능

3. **센서**
   - 공기질 자동 감지 센서 탑재
   - LED 색상으로 공기질 표시 (초록: 좋음, 노랑: 보통, 빨강: 나쁨)
   - 자동 풍량 조절 기능

4. **성능**
   - 커버 면적: 1~3평 (퍼스널 존)
   - 차량 내부, 유모차, 작은 방 등 밀폐된 소공간에 최적화
   - BLDC 모터: 저소음, 고효율, 내구성 우수

### 사용 모드
- 취침 모드 (저소음)
- 약풍/중풍/강풍 모드
- 터보 모드 (최대 성능)
- 자동 모드 (센서 기반)

### 필터 교체 안내
- 교체 주기: 약 6개월 (사용 환경에 따라 다름)
- 교체 알림: 빨간 불 깜빡임
- 교체 방법:
  1. 전원 끄기
  2. 상단을 시계 반대 방향으로 돌려 분리
  3. 기존 필터 제거 후 새 필터 장착 (⚠️ 비닐 포장 반드시 제거!)
  4. 결합 후 전원 버튼 15초 길게 눌러 리셋
- 프리필터는 세탁 가능 (미온수 + 중성세제, 완전 건조 후 재사용)

### 주의사항
- 여름철 차량 내부 70도 이상 환경에 장시간 방치 금지 (배터리 손상 위험)
- 물에 직접 세척 금지 (프리필터 제외)
- 필터 비닐 제거 필수 (제거하지 않으면 고장 원인)

### AS 정책
- 무상 AS: 구매일로부터 1년
- 유상 AS: 1년 이후 또는 사용자 과실
- AS 접수: 고객센터 연락 또는 스토어 문의
- 필터는 소모품으로 AS 대상 아님

### 배송 정보
- 당일 발송: 평일 오후 3시 이전 주문
- 배송 기간: 1~2일 (도서산간 추가 소요)
- 배송사: CJ대한통운, 한진택배, 롯데택배, 우체국택배, 로젠택배
- 배송비: 50,000원 이상 무료배송, 미만 시 3,000원

### 교환/반품
- 단순 변심: 수령 후 7일 이내 (왕복 배송비 고객 부담, 약 6,000원)
- 제품 불량: 무료 교환/반품 (사진 첨부 필요)
- 반품 불가: 사용 흔적 있는 제품, 필터 비닐 개봉 제품

### 자주 묻는 질문 (FAQ)
Q: 효과가 있나요? 담배 냄새 빠져요?
A: 미니쉴드는 탈취에 특화된 제품입니다. 활성탄+광촉매 이중 필터로 담배 냄새, 새차 냄새를 강력하게 제거합니다. 흡연 후 창문 1분 환기 후 터보 모드 사용을 권장합니다.

Q: 소음이 큰가요?
A: 터보/강풍 모드는 바람 소리가 있으나 정상입니다. 취침 모드는 저소음 설계입니다. 기계적 소음(덜컹덜컹)이 나면 불량일 수 있으니 영상 촬영 후 문의 바랍니다.

Q: 빨간 불이 안 꺼져요
A: 1) 공기질 나쁨 경고 - 환기 필요 2) 필터 교체 알림 (6개월) 3) 센서 오염 - 면봉으로 센서 닦기

Q: 차 컵홀더에 들어가나요?
A: 제품 하단 지름은 약 7cm로 대부분의 차량 컵홀더에 장착 가능합니다.

Q: 거실에서도 쓸 수 있나요?
A: 미니쉴드는 1~3평 소공간 전용입니다. 거실 전체 정화는 대형 공기청정기를 권장드립니다. 책상 위, 침대 옆 등 '숨쉬는 반경 1m' 집중 케어에 적합합니다.
`;

// ============================================================================
// 의도 분류 시스템
// ============================================================================

type IntentType = 
  | "delivery_status"      // 배송 조회
  | "order_inquiry"        // 주문 내역 조회
  | "order_by_number"      // 주문번호로 조회
  | "product_info"         // 제품 정보 문의
  | "product_usage"        // 사용법 문의
  | "filter_inquiry"       // 필터 관련
  | "as_inquiry"           // AS/수리 문의
  | "exchange_refund"      // 교환/환불
  | "noise_complaint"      // 소음 문의
  | "led_inquiry"          // LED/표시등 문의
  | "coupon_inquiry"       // 쿠폰 문의
  | "ticket_inquiry"       // 문의 내역 조회
  | "agent_transfer"       // 상담원 연결 요청
  | "greeting"             // 인사
  | "general"              // 일반 질문
  | "unknown";             // 알 수 없음

interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities: Record<string, string>;
}

function classifyIntent(message: string): IntentResult {
  const msg = message.toLowerCase();
  
  // 주문번호 패턴 체크 (예: 251208-234384, ORD-xxxx, 숫자 6자리 이상)
  const orderNumberPattern = /(\d{6}-\d{4,6})|(\d{6,})|([a-z]*\d{4,}[-_]?\d*)/i;
  const orderNumberMatch = message.match(orderNumberPattern);
  if (orderNumberMatch) {
    return { 
      intent: "order_by_number", 
      confidence: 0.95, 
      entities: { orderNumber: orderNumberMatch[0] } 
    };
  }

  // 상담원 연결 요청 (최우선 처리)
  if (/(상담원|상담사|직원|사람).*(연결|바꿔|대화|통화|전환)/.test(msg) ||
      /(상담원|상담사|직원|사람)\s*(연결|대화|통화)/.test(msg) ||
      /상담원\s*연결|실제\s*상담|사람과\s*대화|담당자\s*연결/.test(msg) ||
      /(연결해|바꿔줘|전화연결)/.test(msg) ||
      /챗봇\s*(싫|말고|아닌|그만)/.test(msg) ||
      /(답답|불만|화나|짜증|이해.*못|못.*알|대답이.*이상)/.test(msg)) {
    return { intent: "agent_transfer", confidence: 0.95, entities: {} };
  }
  
  // 인사
  if (/^(안녕|하이|헬로|hi|hello|반갑|좋은\s*(아침|저녁))/.test(msg)) {
    return { intent: "greeting", confidence: 0.95, entities: {} };
  }

  // 배송 상태 조회 (가장 빈번)
  if (/(배송|배달).*(상태|현황|조회|확인|어디|언제|도착)/.test(msg) ||
      /(주문).*(어디|언제|도착)/.test(msg) ||
      /배송중|배송완료|출고|송장/.test(msg)) {
    return { intent: "delivery_status", confidence: 0.9, entities: {} };
  }

  // 주문 내역
  if (/(주문).*(내역|조회|확인|현황|목록)/.test(msg) ||
      /최근\s*주문|주문\s*했|주문\s*한/.test(msg)) {
    return { intent: "order_inquiry", confidence: 0.85, entities: {} };
  }

  // 소음 문의
  if (/(소음|소리|시끄|조용|잡음|진동)/.test(msg)) {
    return { intent: "noise_complaint", confidence: 0.9, entities: {} };
  }

  // LED/표시등 문의
  if (/(빨간\s*불|빨간불|led|표시등|빨간색|초록|노란|불빛|램프)/.test(msg)) {
    return { intent: "led_inquiry", confidence: 0.9, entities: {} };
  }

  // 필터 관련
  if (/(필터).*(교체|교환|갈|청소|세척|구매|기간|주기)/.test(msg) ||
      /필터\s*(어디|어떻게|언제)/.test(msg)) {
    return { intent: "filter_inquiry", confidence: 0.9, entities: {} };
  }

  // AS/수리
  if (/(as|수리|고장|불량|a\/s|에이에스|수선|점검)/.test(msg)) {
    return { intent: "as_inquiry", confidence: 0.9, entities: {} };
  }

  // 교환/환불
  if (/(교환|환불|반품|취소|돌려|바꿔)/.test(msg)) {
    return { intent: "exchange_refund", confidence: 0.9, entities: {} };
  }

  // 사용법
  if (/(사용법|사용\s*방법|어떻게\s*써|작동|버튼|모드|충전)/.test(msg)) {
    return { intent: "product_usage", confidence: 0.85, entities: {} };
  }

  // 제품 정보/스펙
  if (/(스펙|사양|성능|효과|크기|무게|배터리|용량)/.test(msg) ||
      /(미니쉴드|제품).*(정보|알려|뭐|소개)/.test(msg)) {
    return { intent: "product_info", confidence: 0.85, entities: {} };
  }

  // 쿠폰
  if (/(쿠폰|할인|적립|포인트)/.test(msg)) {
    return { intent: "coupon_inquiry", confidence: 0.85, entities: {} };
  }

  // 문의 내역
  if (/(문의|티켓|상담).*(내역|현황|확인)/.test(msg)) {
    return { intent: "ticket_inquiry", confidence: 0.85, entities: {} };
  }

  // 일반 질문
  if (/(담배|냄새|탈취|차량|차|컵홀더|거실|방)/.test(msg)) {
    return { intent: "general", confidence: 0.7, entities: {} };
  }

  return { intent: "unknown", confidence: 0.5, entities: {} };
}

// ============================================================================
// 전화번호로 고객 찾기 (MallUser, Customer, Order에서 검색)
// ============================================================================

export async function findCustomerByPhone(phone: string): Promise<CustomerInfo | null> {
  const normalizedPhone = phone.replace(/[-\s]/g, "");
  const formattedPhone = formatPhoneNumber(phone);
  // 하이픈 포함 형식
  const phoneWithHyphen = normalizedPhone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3");
  
  try {
    // 0. MallUser 테이블에서 검색 (몰 회원)
    const mallUser = await prisma.mallUser.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { phone: formattedPhone },
          { phone: phoneWithHyphen },
          { phone: { contains: normalizedPhone.slice(-8) } },
        ]
      },
      select: { id: true, name: true, phone: true, email: true }
    });

    if (mallUser) {
      // MallUser가 있으면 Customer 테이블에서 찾거나 생성
      let customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { phone: { contains: normalizedPhone.slice(-8) } },
            { email: mallUser.email },
          ]
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: mallUser.name,
            email: mallUser.email,
            phone: mallUser.phone || phone,
            status: "ACTIVE",
          },
        });
      }

      return {
        customerId: customer.id,
        customerName: mallUser.name,
        phone: mallUser.phone || phone,
      };
    }
    
    // 1. Customer 테이블에서 검색
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { phone: phone },
          { phone: formattedPhone },
          { phone: { contains: normalizedPhone.slice(-8) } },
        ]
      },
      select: { id: true, name: true, phone: true }
    });

    if (customer) {
      return {
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone || phone,
      };
    }

    // 2. Customer에 없으면 Order 테이블의 contactPhone에서 검색
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { contactPhone: normalizedPhone },
          { contactPhone: phone },
          { contactPhone: formattedPhone },
          { contactPhone: { contains: normalizedPhone.slice(-8) } },
          { recipientMobile: normalizedPhone },
          { recipientMobile: phone },
          { recipientMobile: formattedPhone },
        ]
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true }
        }
      },
      orderBy: { orderDate: "desc" }
    });

    if (order) {
      // 주문에 연결된 고객 정보가 있으면 사용
      if (order.customer) {
        return {
          customerId: order.customer.id,
          customerName: order.ordererName || order.customer.name,
          phone: order.contactPhone || order.customer.phone || phone,
        };
      }
      // 고객 정보 없이 주문만 있는 경우 (주문자 이름 사용)
      return {
        customerId: order.customerId,
        customerName: order.ordererName || "고객",
        phone: order.contactPhone || phone,
      };
    }

    return null;
  } catch (error) {
    console.error("[Chatbot] Find customer error:", error);
    return null;
  }
}

// 전화번호 포맷팅 (010-xxxx-xxxx 형식으로)
function formatPhoneNumber(phone: string): string {
  const numbers = phone.replace(/[^0-9]/g, "");
  if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }
  if (numbers.length === 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  }
  return phone;
}

// ============================================================================
// 배송 상태 조회 (Order + MallOrder 통합)
// ============================================================================

async function getDeliveryStatus(customerId: string, phone?: string): Promise<string> {
  try {
    // 1. 기존 Order 테이블에서 조회
    const orders = await prisma.order.findMany({
      where: { customerId },
      orderBy: { orderDate: "desc" },
      take: 5,
      select: {
        orderNumber: true,
        orderDate: true,
        productInfo: true,
        status: true,
        courier: true,
        trackingNumber: true,
        totalAmount: true,
      }
    });

    // 2. MallOrder 테이블에서도 조회 (전화번호로)
    let mallOrders: any[] = [];
    if (phone) {
      const normalizedPhone = phone.replace(/[-\s]/g, "");
      const phoneWithHyphen = normalizedPhone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3");
      
      // MallUser 찾기
      const mallUser = await prisma.mallUser.findFirst({
        where: {
          OR: [
            { phone: { contains: normalizedPhone.slice(-8) } },
            { phone: phoneWithHyphen },
          ]
        },
        select: { id: true }
      });
      
      if (mallUser) {
        mallOrders = await prisma.mallOrder.findMany({
          where: { userId: mallUser.id },
          orderBy: { createdAt: "desc" },
          take: 5,
        });
      }
    }

    if (orders.length === 0 && mallOrders.length === 0) {
      return "📭 조회된 주문 내역이 없습니다.\n\n아직 주문하신 상품이 없으신가요?";
    }

    let response = "📦 **주문/배송 현황**\n\n";

    // 기존 Order 표시
    for (const order of orders) {
      const statusEmoji = getStatusEmoji(order.status);
      const statusText = getStatusText(order.status);
      const orderDate = formatDate(order.orderDate);
      
      response += `━━━━━━━━━━━━━━━━━━\n`;
      response += `📋 주문번호: ${order.orderNumber || '확인중'}\n`;
      response += `📅 주문일: ${orderDate}\n`;
      response += `🛍️ 상품: ${order.productInfo || '상품정보'}\n`;
      response += `${statusEmoji} 상태: **${statusText}**\n`;
      
      if (order.courier && order.trackingNumber) {
        response += `🚚 택배: ${order.courier}\n`;
        response += `📝 송장번호: ${order.trackingNumber}\n`;
      }
      
      if (order.totalAmount) {
        response += `💰 금액: ${Number(order.totalAmount).toLocaleString()}원\n`;
      }
      response += `\n`;
    }

    // MallOrder 표시
    for (const order of mallOrders) {
      const statusEmoji = getMallStatusEmoji(order.status);
      const statusText = getMallStatusText(order.status);
      const orderDate = formatDate(order.createdAt);
      
      // items 파싱
      let productName = "상품";
      try {
        const items = JSON.parse(order.items || "[]");
        if (items.length > 0) {
          productName = items[0].productName || items[0].name || "상품";
          if (items.length > 1) {
            productName += ` 외 ${items.length - 1}건`;
          }
        }
      } catch {}
      
      response += `━━━━━━━━━━━━━━━━━━\n`;
      response += `📋 주문번호: ${order.orderNumber}\n`;
      response += `📅 주문일: ${orderDate}\n`;
      response += `🛍️ 상품: ${productName}\n`;
      response += `${statusEmoji} 상태: **${statusText}**\n`;
      
      if (order.courier && order.trackingNumber) {
        response += `🚚 택배: ${order.courier}\n`;
        response += `📝 송장번호: ${order.trackingNumber}\n`;
      }
      
      response += `💰 금액: ${Number(order.totalAmount).toLocaleString()}원\n`;
      response += `\n`;
    }

    // 배송중인 주문에 대한 안내 추가
    const shippedOrder = orders.find(o => o.status === "SHIPPED");
    if (shippedOrder) {
      response += `\n💡 **배송 조회 팁**: 택배사 웹사이트나 앱에서 송장번호로 실시간 위치를 확인하실 수 있습니다.`;
    }

    return response;
  } catch (error) {
    console.error("[Chatbot] Delivery status error:", error);
    return "❌ 배송 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
}

function getStatusEmoji(status: string): string {
  const map: Record<string, string> = {
    PENDING: "⏳",
    PROCESSING: "📦",
    SHIPPED: "🚚",
    DELIVERED: "📬",
    COMPLETED: "✅",
    CANCELLED: "❌",
  };
  return map[status] || "📋";
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    PENDING: "주문 접수됨",
    PROCESSING: "상품 준비중",
    SHIPPED: "배송중",
    DELIVERED: "배송 완료",
    COMPLETED: "구매 확정",
    CANCELLED: "주문 취소됨",
  };
  return map[status] || status;
}

// MallOrder 상태용 이모지/텍스트
function getMallStatusEmoji(status: string): string {
  const map: Record<string, string> = {
    PENDING: "⏳",
    PAID: "💳",
    PREPARING: "📦",
    SHIPPING: "🚚",
    DELIVERED: "📬",
    CANCELLED: "❌",
    REFUNDED: "↩️",
  };
  return map[status] || "📋";
}

function getMallStatusText(status: string): string {
  const map: Record<string, string> = {
    PENDING: "결제 대기",
    PAID: "결제 완료",
    PREPARING: "상품 준비중",
    SHIPPING: "배송중",
    DELIVERED: "배송 완료",
    CANCELLED: "주문 취소됨",
    REFUNDED: "환불 완료",
  };
  return map[status] || status;
}

function formatDate(date: Date): string {
  const d = new Date(date);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// ============================================================================
// 주문번호로 조회
// ============================================================================

async function getOrderByNumber(orderNumber: string): Promise<string> {
  try {
    // 주문번호로 직접 조회
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: orderNumber },
          { orderNumber: { contains: orderNumber } },
          // 하이픈 제거하고 검색
          { orderNumber: orderNumber.replace(/-/g, "") },
          { orderNumber: { contains: orderNumber.replace(/-/g, "") } },
        ]
      },
      select: {
        id: true,
        orderNumber: true,
        orderDate: true,
        status: true,
        productInfo: true,
        totalAmount: true,
        courier: true,
        trackingNumber: true,
        recipientName: true,
        customer: {
          select: {
            name: true,
          }
        }
      }
    });

    if (!order) {
      return `📭 **주문번호 "${orderNumber}"를 찾을 수 없습니다.**

다음을 확인해 주세요:
1️⃣ 주문번호가 정확한지 확인해 주세요
2️⃣ 주문 완료 문자/이메일의 주문번호와 비교해 주세요

📞 그래도 조회가 안 되시면 고객센터로 문의해 주세요.`;
    }

    const statusEmoji = getStatusEmoji(order.status);
    const statusText = getStatusText(order.status);
    const orderDate = formatDate(order.orderDate);

    let response = `📦 **주문 조회 결과**\n\n`;
    response += `━━━━━━━━━━━━━━━━━━\n`;
    response += `📋 주문번호: **${order.orderNumber || orderNumber}**\n`;
    response += `📅 주문일: ${orderDate}\n`;
    response += `👤 주문자: ${order.recipientName || order.customer?.name || '확인중'}\n`;
    response += `🛍️ 상품: ${order.productInfo || '상품정보'}\n`;
    response += `${statusEmoji} 상태: **${statusText}**\n`;

    if (order.courier && order.trackingNumber) {
      response += `\n🚚 **배송 정보**\n`;
      response += `택배사: ${order.courier}\n`;
      response += `송장번호: ${order.trackingNumber}\n`;
    }

    if (order.totalAmount) {
      response += `\n💰 금액: ${Number(order.totalAmount).toLocaleString()}원\n`;
    }

    // 상태별 안내 메시지
    if (order.status === "PENDING") {
      response += `\n⏳ 결제 확인 후 상품 준비가 시작됩니다.`;
    } else if (order.status === "PROCESSING") {
      response += `\n📦 상품 준비 중입니다. 곧 출고될 예정입니다.`;
    } else if (order.status === "SHIPPED") {
      response += `\n💡 택배사 홈페이지에서 송장번호로 실시간 위치를 확인하실 수 있습니다.`;
    } else if (order.status === "DELIVERED") {
      response += `\n✅ 배송이 완료되었습니다. 상품에 문제가 있으시면 말씀해 주세요!`;
    }

    return response;
  } catch (error) {
    console.error("[Chatbot] Order by number error:", error);
    return "❌ 주문 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
}

// ============================================================================
// 주문 내역 조회
// ============================================================================

async function getOrderHistory(customerId: string, phone?: string): Promise<string> {
  try {
    // 1. 기존 Order 조회
    const orders = await prisma.order.findMany({
      where: { customerId },
      orderBy: { orderDate: "desc" },
      take: 10,
      select: {
        orderNumber: true,
        orderDate: true,
        productInfo: true,
        status: true,
        totalAmount: true,
        orderSource: true,
      }
    });

    // 2. MallOrder도 조회
    let mallOrders: any[] = [];
    if (phone) {
      const normalizedPhone = phone.replace(/[-\s]/g, "");
      const phoneWithHyphen = normalizedPhone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3");
      
      const mallUser = await prisma.mallUser.findFirst({
        where: {
          OR: [
            { phone: { contains: normalizedPhone.slice(-8) } },
            { phone: phoneWithHyphen },
          ]
        },
        select: { id: true }
      });
      
      if (mallUser) {
        mallOrders = await prisma.mallOrder.findMany({
          where: { userId: mallUser.id },
          orderBy: { createdAt: "desc" },
          take: 10,
        });
      }
    }

    if (orders.length === 0 && mallOrders.length === 0) {
      return "📭 주문 내역이 없습니다.\n\n첫 주문을 기다리고 있어요! 🛒";
    }

    let response = "🛍️ **최근 주문 내역**\n\n";

    // 기존 Order 표시
    for (const order of orders) {
      const statusEmoji = getStatusEmoji(order.status);
      const statusText = getStatusText(order.status);
      const orderDate = formatDate(order.orderDate);
      
      response += `• ${orderDate} | ${order.productInfo?.slice(0, 20) || '상품'}...\n`;
      response += `  ${statusEmoji} ${statusText} | ${Number(order.totalAmount || 0).toLocaleString()}원\n\n`;
    }

    // MallOrder 표시
    for (const order of mallOrders) {
      const statusEmoji = getMallStatusEmoji(order.status);
      const statusText = getMallStatusText(order.status);
      const orderDate = formatDate(order.createdAt);
      
      // items 파싱
      let productName = "상품";
      try {
        const items = JSON.parse(order.items || "[]");
        if (items.length > 0) {
          productName = items[0].productName || items[0].name || "상품";
          if (items.length > 1) {
            productName += ` 외 ${items.length - 1}건`;
          }
        }
      } catch {}
      
      response += `• ${orderDate} | ${productName.slice(0, 20)}...\n`;
      response += `  ${statusEmoji} ${statusText} | ${Number(order.totalAmount).toLocaleString()}원\n\n`;
    }

    return response;
  } catch (error) {
    console.error("[Chatbot] Order history error:", error);
    return "❌ 주문 내역 조회 중 오류가 발생했습니다.";
  }
}

// ============================================================================
// 쿠폰 조회
// ============================================================================

async function getCoupons(customerId: string): Promise<string> {
  try {
    // 사용 가능한 쿠폰 조회
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        validUntil: { gte: new Date() },
      },
      take: 10,
    });

    // 사용한 쿠폰 ID 목록
    const usedCoupons = await prisma.couponUsage.findMany({
      where: { customerId },
      select: { couponId: true }
    });
    const usedIds = new Set(usedCoupons.map(u => u.couponId));

    const availableCoupons = coupons.filter(c => !usedIds.has(c.id));

    if (availableCoupons.length === 0) {
      return "🎫 현재 사용 가능한 쿠폰이 없습니다.\n\n새로운 쿠폰이 발급되면 알려드릴게요!";
    }

    let response = "🎫 **사용 가능한 쿠폰**\n\n";

    for (const coupon of availableCoupons) {
      const discount = coupon.discountType === "PERCENT" 
        ? `${coupon.discountValue}% 할인`
        : `${Number(coupon.discountValue).toLocaleString()}원 할인`;
      const validUntil = formatDate(coupon.validUntil);
      
      response += `━━━━━━━━━━━━━━━━━━\n`;
      response += `🏷️ **${coupon.name}**\n`;
      response += `💰 ${discount}\n`;
      response += `📝 코드: \`${coupon.code}\`\n`;
      response += `⏰ 유효기간: ~${validUntil}\n\n`;
    }

    return response;
  } catch (error) {
    console.error("[Chatbot] Coupon error:", error);
    return "❌ 쿠폰 조회 중 오류가 발생했습니다.";
  }
}

// ============================================================================
// 문의 내역 조회
// ============================================================================

async function getTicketHistory(customerId: string): Promise<string> {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        subject: true,
        status: true,
        category: true,
        createdAt: true,
      }
    });

    if (tickets.length === 0) {
      return "📭 문의 내역이 없습니다.\n\n궁금한 점이 있으시면 언제든 문의해주세요!";
    }

    let response = "📩 **문의 내역**\n\n";

    const ticketStatusText: Record<string, string> = {
      OPEN: "📩 접수됨",
      IN_PROGRESS: "💬 답변 준비중",
      RESOLVED: "✅ 해결됨",
      CLOSED: "🔒 종료",
    };

    for (const ticket of tickets) {
      const statusText = ticketStatusText[ticket.status] || ticket.status;
      const createdDate = formatDate(ticket.createdAt);
      
      response += `• ${createdDate} | ${ticket.subject}\n`;
      response += `  ${statusText}\n\n`;
    }

    return response;
  } catch (error) {
    console.error("[Chatbot] Ticket history error:", error);
    return "❌ 문의 내역 조회 중 오류가 발생했습니다.";
  }
}

// ============================================================================
// 제품 지식 기반 응답 (LLM)
// ============================================================================

async function getProductAnswer(userQuery: string): Promise<string> {
  try {
    const response = await chatCompletion([
      {
        role: "system",
        content: `당신은 20vs80 스마트스토어의 친절한 고객 상담사입니다.
미니쉴드 공기청정기에 대한 전문 지식을 바탕으로 고객 질문에 답변합니다.

${PRODUCT_KNOWLEDGE}

## 응답 규칙
1. 항상 존댓말을 사용합니다.
2. 이모지를 적절히 사용하여 친근하게 답변합니다.
3. 정확한 정보만 제공하고, 모르는 것은 고객센터 연락을 안내합니다.
4. 답변은 간결하고 읽기 쉽게 작성합니다.
5. 필요시 단계별로 안내합니다.`
      },
      { role: "user", content: userQuery }
    ], { temperature: 0.3, maxTokens: 800 });

    return response.content;
  } catch (error) {
    console.error("[Chatbot] Product answer error:", error);
    return "죄송합니다. 답변 생성 중 오류가 발생했습니다.\n\n고객센터로 문의해주시면 자세히 안내해드리겠습니다. 📞";
  }
}

// ============================================================================
// 시나리오별 정적 응답
// ============================================================================

const STATIC_RESPONSES: Record<string, string> = {
  greeting: `안녕하세요! 👋 20vs80 미니쉴드 고객센터입니다.

무엇을 도와드릴까요?

💡 **자주 찾는 메뉴**
• "배송 상태" - 주문 배송 현황 확인
• "필터 교체" - 필터 교체 방법 안내
• "빨간불" - LED 표시 문제 해결
• "AS 문의" - 수리/AS 안내

📱 전화번호를 입력하시면 주문 조회가 가능합니다.`,

  as_inquiry: `🔧 **AS/수리 안내**

📌 **무상 AS 기간**: 구매일로부터 1년

📌 **AS 접수 방법**
1. 스마트스토어 문의하기로 증상 설명
2. 불량 증상 사진/영상 첨부
3. 구매 확인 후 AS 진행

📌 **유상 AS 대상**
• 무상 AS 기간(1년) 경과
• 사용자 과실로 인한 손상
• 침수, 낙하 등 외부 충격

📌 **AS 제외 품목**
• 필터 (소모품)
• 외관 기스 (사용감)

📞 자세한 상담이 필요하시면 "상담원 연결"을 입력해주세요.`,

  exchange_refund: `🔄 **교환/반품 안내**

📌 **단순 변심** (7일 이내)
• 배송비 고객 부담 (왕복 약 6,000원)
• 미사용/미개봉 제품만 가능

📌 **제품 불량**
• 무료 교환 또는 환불
• 불량 사진/영상 필요

📌 **반품 불가 사유**
• 사용 흔적이 있는 제품
• 필터 비닐 개봉 제품
• 수령 후 7일 경과

📍 **신청 방법**
스마트스토어 > 주문내역 > 교환/반품 신청
또는 채팅으로 "교환 신청" 또는 "반품 신청" 입력`,

  filter_inquiry: `🔄 **필터 교체 안내**

📌 **교체 주기**: 약 6개월 (사용 환경에 따라 다름)

📌 **교체 알림**: 빨간 LED 깜빡임

📌 **교체 방법**
1️⃣ 전원 끄기 (안전을 위해)
2️⃣ 상단을 시계 반대 방향으로 돌려 분리
3️⃣ 기존 필터 제거
4️⃣ 새 필터 장착 ⚠️ **비닐 포장 반드시 제거!**
5️⃣ 결합 후 전원 버튼 **15초 길게** 눌러 리셋

📌 **프리필터 세척**
• 진공청소기로 먼지 제거 또는
• 미온수 + 중성세제 세탁 → 완전 건조

🛒 필터 구매는 스마트스토어에서 가능합니다!`,

  noise_complaint: `🔇 **소음 관련 안내**

📌 **정상 소음**
• 터보/강풍 모드: 바람 소리 (정상)
• 자동 모드 전환 시: 풍량 변화 소리

📌 **비정상 소음 (불량 의심)**
• 금속 마찰음 (끼익)
• 덜컹덜컹 소리
• 진동이 심한 경우

💡 **확인 방법**
"취침 모드"에서도 기계적 소음이 나면 불량 가능성이 있습니다.

📸 **불량 확인 시**
작동 영상을 촬영하여 문의해 주시면 확인 후 교환 도와드리겠습니다.`,

  led_inquiry: `💡 **LED 표시등 안내**

📌 **색상별 의미**
• 🟢 초록: 공기질 좋음
• 🟡 노랑: 공기질 보통
• 🔴 빨강: 공기질 나쁨 또는 필터 교체 필요

📌 **빨간불이 안 꺼질 때**

1️⃣ **공기질 문제**
   → 창문 열어 환기 후 재확인

2️⃣ **필터 교체 알림** (6개월 경과)
   → 필터 교체 후 전원 버튼 15초 눌러 리셋

3️⃣ **센서 오염**
   → 측면 센서 부분을 면봉으로 가볍게 닦기

위 방법으로도 해결되지 않으면 불량일 수 있으니 문의해 주세요!`,

  agent_transfer_waiting: `🔄 **상담원 연결 요청**

상담원 연결을 요청하셨습니다.

⏳ 현재 대기 번호: {waitingNumber}번
⏰ 예상 대기 시간: 약 {estimatedTime}

상담원이 연결되면 알림을 드리겠습니다.
잠시만 기다려주세요! 🙏

💡 기다리시는 동안 아래 메뉴를 이용하실 수 있습니다:
• "배송 상태" - 주문 배송 현황 확인
• "필터 교체" - 필터 교체 방법 안내`,

  agent_transfer_connected: `✅ **상담원 연결 완료**

담당 상담원이 연결되었습니다!

👤 담당자: {agentName}
🏷️ 상담 번호: {sessionId}

이제부터 상담원과 직접 대화하실 수 있습니다.
편하게 문의해주세요! 😊`,

  agent_transfer_unavailable: `😔 **상담원 연결 불가**

죄송합니다. 현재 상담 가능한 상담원이 없습니다.

⏰ **상담 가능 시간**
• 평일: 09:00 ~ 18:00
• 점심시간: 12:00 ~ 13:00

📝 문의사항을 남겨주시면 상담 가능 시간에 연락드리겠습니다.

또는 아래 메뉴를 통해 정보를 확인해보세요:
• "배송 상태" - 주문 배송 현황 확인
• "AS 문의" - 수리/AS 안내`,
};

// ============================================================================
// 메인 응답 처리 함수
// ============================================================================

export async function processChatMessage(
  message: string,
  customerInfo: CustomerInfo | null,
  sessionId?: string | null
): Promise<ChatbotResponse> {
  const query = message.trim();
  const timestamp = new Date().toISOString();

  if (!query) {
    return {
      success: false,
      message: "메시지를 입력해주세요.",
      timestamp,
    };
  }

  // 전화번호 기반 세션 관리
  let currentSessionId = sessionId || null;
  const phone = customerInfo?.phone || null;
  
  // 세션이 없고 전화번호가 있으면 새 세션 시작
  if (!currentSessionId && phone) {
    const sessionResult = await startChatSession(phone);
    if (sessionResult.success && sessionResult.session) {
      currentSessionId = sessionResult.session.id;
    }
  }

  // 사용자 메시지 저장
  if (currentSessionId) {
    await addChatMessage(currentSessionId, "USER", query);
  }

  // 의도 분류
  const { intent, confidence, entities } = classifyIntent(query);
  console.log(`[Chatbot] Intent: ${intent} (${confidence})`, entities);

  // 응답 생성 헬퍼 함수
  const createResponse = async (msg: string, opts: Partial<ChatbotResponse> = {}): Promise<ChatbotResponse> => {
    // 어시스턴트 응답 저장
    if (currentSessionId) {
      await addChatMessage(currentSessionId, "ASSISTANT", msg, intent);
    }
    
    return {
      success: true,
      message: msg,
      intent,
      sessionId: currentSessionId || undefined,
      timestamp,
      ...opts,
    };
  };

  // 주문번호로 조회 (인증 불필요)
  if (intent === "order_by_number" && entities.orderNumber) {
    const orderResponse = await getOrderByNumber(entities.orderNumber);
    return createResponse(orderResponse);
  }

  // 데이터 조회가 필요한 의도 (인증 필요)
  const dataIntents: IntentType[] = ["delivery_status", "order_inquiry", "coupon_inquiry", "ticket_inquiry"];
  
  if (dataIntents.includes(intent) && !customerInfo) {
    const msg = "📱 전화번호를 먼저 입력해주세요.\n\n전화번호 확인 후 주문 조회, 배송 확인 등을 이용하실 수 있습니다.";
    // 인증 요청 메시지도 저장
    if (currentSessionId) {
      await addChatMessage(currentSessionId, "ASSISTANT", msg, intent);
    }
    return {
      success: false,
      message: msg,
      requiresPhone: true,
      intent,
      sessionId: currentSessionId || undefined,
      timestamp,
    };
  }

  // 의도별 처리
  switch (intent) {
    case "greeting":
      return createResponse(STATIC_RESPONSES.greeting);

    case "delivery_status":
      const deliveryResponse = await getDeliveryStatus(customerInfo!.customerId, customerInfo?.phone);
      return createResponse(deliveryResponse);

    case "order_inquiry":
      const orderResponse = await getOrderHistory(customerInfo!.customerId, customerInfo?.phone);
      return createResponse(orderResponse);

    case "coupon_inquiry":
      const couponResponse = await getCoupons(customerInfo!.customerId);
      return createResponse(couponResponse);

    case "ticket_inquiry":
      const ticketResponse = await getTicketHistory(customerInfo!.customerId);
      return createResponse(ticketResponse);

    case "as_inquiry":
      return createResponse(STATIC_RESPONSES.as_inquiry);

    case "exchange_refund":
      return createResponse(STATIC_RESPONSES.exchange_refund);

    case "filter_inquiry":
      return createResponse(STATIC_RESPONSES.filter_inquiry);

    case "noise_complaint":
      return createResponse(STATIC_RESPONSES.noise_complaint);

    case "led_inquiry":
      return createResponse(STATIC_RESPONSES.led_inquiry);

    case "agent_transfer":
      // 상담원 연결 요청 처리
      const escalationResult = await requestAgentTransfer(currentSessionId, customerInfo, query);
      return escalationResult;

    case "product_info":
    case "product_usage":
    case "general":
    case "unknown":
    default:
      // 먼저 FAQ 데이터베이스에서 검색
      const faqAnswer = await searchFAQDatabase(query);
      if (faqAnswer) {
        return createResponse(faqAnswer);
      }
      
      // FAQ에서 못 찾으면 LLM 기반 제품 지식 응답
      const productAnswer = await getProductAnswer(query);
      return createResponse(productAnswer);
  }
}

// ============================================================================
// 상담원 연결 요청 처리
// ============================================================================

async function requestAgentTransfer(
  sessionId: string | null,
  customerInfo: CustomerInfo | null,
  originalQuery: string
): Promise<ChatbotResponse> {
  const timestamp = new Date().toISOString();

  try {
    // 1. 현재 근무 중인 상담원 확인 (CS_AGENT 역할, 온라인 상태)
    const onlineAgents = await prisma.user.findMany({
      where: {
        role: "CS_AGENT",
        isOnline: true,
      },
    });

    // 상담 가능한 상담원이 없으면
    if (onlineAgents.length === 0) {
      const unavailableMsg = STATIC_RESPONSES.agent_transfer_unavailable;
      
      // 세션에 메시지 저장
      if (sessionId) {
        await addChatMessage(sessionId, "ASSISTANT", unavailableMsg, "agent_transfer");
      }
      
      return {
        success: true,
        message: unavailableMsg,
        intent: "agent_transfer",
        sessionId: sessionId || undefined,
        timestamp,
        escalated: false,
      };
    }

    // 2. 세션이 없으면 생성
    let currentSessionId = sessionId;
    if (!currentSessionId && customerInfo?.phone) {
      const sessionResult = await startChatSession(customerInfo.phone);
      if (sessionResult.success && sessionResult.session) {
        currentSessionId = sessionResult.session.id;
      }
    }

    if (!currentSessionId) {
      return {
        success: false,
        message: "📱 상담원 연결을 위해 전화번호를 먼저 입력해주세요.",
        intent: "agent_transfer",
        requiresPhone: true,
        timestamp,
        escalated: false,
      };
    }

    // 3. 현재 대기 중인 세션 수 확인 (대기 번호 계산)
    const waitingSessions = await prisma.chatSession.findMany({
      where: {
        isEscalated: true,
        assignedToId: null,
        status: { in: ["ACTIVE", "ESCALATED"] },
      },
    });

    const waitingNumber = waitingSessions.length + 1;
    const estimatedTime = `${Math.max(5, waitingNumber * 3)}분`; // 1명당 약 3분 예상

    // 4. 세션 상태를 ESCALATED로 업데이트하고 이관 요청 기록
    await prisma.chatSession.update({
      where: { id: currentSessionId },
      data: {
        status: "ESCALATED",
        isEscalated: true,
        escalatedAt: new Date(),
        escalateReason: originalQuery,
        priority: 0, // 일반 우선순위
      },
    });

    // 5. 응답 메시지 생성
    const waitingMsg = STATIC_RESPONSES.agent_transfer_waiting
      .replace("{waitingNumber}", String(waitingNumber))
      .replace("{estimatedTime}", estimatedTime);

    // 메시지 저장
    await addChatMessage(currentSessionId, "ASSISTANT", waitingMsg, "agent_transfer");

    // 6. 이관 사유도 시스템 메시지로 기록
    await addChatMessage(
      currentSessionId,
      "SYSTEM",
      `[상담원 이관 요청] 사유: "${originalQuery}"`,
      "agent_transfer"
    );

    return {
      success: true,
      message: waitingMsg,
      intent: "agent_transfer",
      sessionId: currentSessionId,
      timestamp,
      escalated: true,
      waitingNumber,
      estimatedWaitTime: estimatedTime,
    };
  } catch (error) {
    console.error("[Chatbot] Agent transfer error:", error);
    
    return {
      success: false,
      message: "죄송합니다. 상담원 연결 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.",
      intent: "agent_transfer",
      sessionId: sessionId || undefined,
      timestamp,
      escalated: false,
    };
  }
}

// ============================================================================
// 상담원 연결 완료 알림 (상담원이 배정될 때 호출)
// ============================================================================

export async function notifyAgentConnected(
  sessionId: string,
  agentName: string
): Promise<ChatbotResponse> {
  const timestamp = new Date().toISOString();

  try {
    const connectedMsg = STATIC_RESPONSES.agent_transfer_connected
      .replace("{agentName}", agentName)
      .replace("{sessionId}", sessionId.slice(-8).toUpperCase());

    // 메시지 저장
    await addChatMessage(sessionId, "SYSTEM", connectedMsg, "agent_connected");

    return {
      success: true,
      message: connectedMsg,
      intent: "agent_connected",
      sessionId,
      timestamp,
    };
  } catch (error) {
    console.error("[Chatbot] Notify agent connected error:", error);
    return {
      success: false,
      message: "알림 전송 중 오류가 발생했습니다.",
      timestamp,
    };
  }
}

// ============================================================================
// 상담 세션 종료 함수
// ============================================================================

export async function closeChatSession(
  sessionId: string,
  summary?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await endChatSession(sessionId, summary);
    if (result.success) {
      return { success: true, message: "상담 세션이 종료되었습니다." };
    }
    return { success: false, message: result.error || "세션 종료 실패" };
  } catch (error) {
    console.error("[Chatbot] Close session error:", error);
    return { success: false, message: "세션 종료 중 오류가 발생했습니다." };
  }
}

// ============================================================================
// FAQ 데이터베이스 검색
// ============================================================================

async function searchFAQDatabase(query: string): Promise<string | null> {
  try {
    const normalizedQuery = query.toLowerCase().trim();
    const keywords = normalizedQuery.split(/\s+/).filter(k => k.length >= 2);
    
    // 모든 활성 FAQ 가져오기
    const allFaqs = await prisma.fAQ.findMany({
      where: { isActive: true },
    });

    if (allFaqs.length === 0) return null;

    // 점수 기반 매칭
    type FAQItem = typeof allFaqs[number];
    type ScoredFAQ = { faq: FAQItem; score: number; matchedKeywords: number };
    
    const scored: ScoredFAQ[] = allFaqs.map((f): ScoredFAQ => {
      let score = 0;
      let matchedKeywords = 0;
      const questionLower = f.question.toLowerCase();
      const answerLower = f.answer.toLowerCase();
      const fullText = questionLower + " " + answerLower;
      
      // 1. 전체 쿼리가 질문에 포함되면 최고 점수
      if (questionLower.includes(normalizedQuery)) {
        score += 100;
      }
      
      // 2. 전체 쿼리가 답변에 포함되면 높은 점수
      if (answerLower.includes(normalizedQuery)) {
        score += 50;
      }
      
      // 3. 키워드별 점수 계산
      for (const keyword of keywords) {
        if (fullText.includes(keyword)) {
          matchedKeywords++;
          
          // 질문에 키워드가 있으면 더 높은 점수
          if (questionLower.includes(keyword)) {
            score += 20;
          }
          // 답변에만 있으면 낮은 점수
          else if (answerLower.includes(keyword)) {
            score += 5;
          }
        }
      }
      
      // 4. 모든 키워드가 매칭되면 보너스
      if (keywords.length > 0 && matchedKeywords === keywords.length) {
        score += 30;
      }
      
      return { faq: f, score, matchedKeywords };
    });

    // 점수순 정렬 후 최고 점수 FAQ 반환
    const bestMatches = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => {
        // 먼저 점수로 정렬
        if (b.score !== a.score) return b.score - a.score;
        // 점수가 같으면 매칭된 키워드 수로 정렬
        return b.matchedKeywords - a.matchedKeywords;
      });

    if (bestMatches.length > 0 && bestMatches[0].score >= 10) {
      const best = bestMatches[0].faq;
      return formatFAQResponse(best.question, best.answer, best.category);
    }

    return null;
  } catch (error) {
    console.error("[Chatbot] FAQ search error:", error);
    return null;
  }
}

function formatFAQResponse(question: string, answer: string, category: string): string {
  return `📚 **[${category}]**

❓ **Q.** ${question}

💬 **A.** ${answer}

---
💡 더 궁금한 점이 있으시면 말씀해주세요!`;
}

// ============================================================================
// 예시 질문 목록
// ============================================================================

export async function getExampleQuestions(): Promise<string[]> {
  return [
    "배송 상태 확인",
    "필터 교체 방법",
    "빨간불이 안 꺼져요",
    "소음이 너무 커요",
    "AS 문의",
    "교환/반품 방법",
    "담배 냄새 제거 되나요?",
    "차 컵홀더에 들어가나요?",
  ];
}
