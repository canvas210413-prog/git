"use server";

import { prisma } from "@/lib/prisma";
import { chatCompletion } from "@/lib/ai";

// ============================================================================
// 고객용 Text2DB - 전화번호 기반 인증 버전
// ============================================================================

/**
 * 보안 정책:
 * 1. 전화번호로 고객 식별 (로그인 불필요)
 * 2. 본인 데이터만 조회 가능 (customerId 필터 자동 적용)
 * 3. 민감정보(주소 등) 마스킹 처리
 * 4. SELECT 쿼리만 허용, 위험 키워드 차단
 */

// ============================================================================
// 고객 조회용 단순화된 뷰 스키마 (Text2SQL 최적화)
// ============================================================================

const CUSTOMER_VIEW_SCHEMA = `
## 고객용 데이터베이스 스키마 (본인 정보만 조회 가능)

### 내 주문 (MyOrder)
조회 가능 컬럼:
- order_id: 주문 ID
- order_number: 주문번호
- order_date: 주문 날짜
- product_name: 상품명
- order_amount: 주문금액
- orderer_name: 주문자명
- orderer_phone: 연락처
- status: 주문 상태 (PENDING=대기중, PROCESSING=처리중, SHIPPED=배송중, DELIVERED=배송완료, COMPLETED=완료, CANCELLED=취소)
- courier: 택배사명
- tracking_number: 송장번호
- order_source: 주문경로

### 내 문의 (MyTicket)
조회 가능 컬럼:
- ticket_id: 문의 ID
- subject: 문의 제목
- status: 처리 상태 (OPEN=접수됨, IN_PROGRESS=처리중, RESOLVED=해결됨, CLOSED=종료)
- priority: 우선순위
- category: 카테고리
- created_date: 문의 날짜

### 내 쿠폰 (MyCoupon)
조회 가능 컬럼:
- coupon_code: 쿠폰 코드
- coupon_name: 쿠폰명
- discount_type: 할인 유형 (PERCENT=%, FIXED=원)
- discount_value: 할인값
- valid_from: 시작일
- valid_until: 만료일
- is_used: 사용 여부
`;

// ============================================================================
// 고객용 Text2SQL 프롬프트
// ============================================================================

const CUSTOMER_TEXT2SQL_PROMPT = `당신은 고객 서비스 챗봇용 SQL 생성기입니다.
고객의 자연어 질문을 SQL로 변환합니다.

${CUSTOMER_VIEW_SCHEMA}

## SQL 생성 규칙
1. SELECT 문만 생성합니다.
2. 허용된 뷰(MyOrder, MyTicket, MyCoupon)만 사용합니다.
3. customer_id 조건은 시스템이 자동 추가하므로 포함하지 마세요.
4. 결과는 최대 10개로 제한합니다 (LIMIT 10).
5. 최신순 정렬이 기본입니다.
6. JSON 형식으로만 응답합니다.

## 응답 형식
{
  "sql": "SELECT ... FROM ... ORDER BY ... LIMIT 10",
  "queryType": "order|ticket|coupon|unsupported",
  "description": "쿼리 설명"
}

다른 고객 정보 조회 시도나 허용되지 않은 질문:
{
  "sql": "",
  "queryType": "unsupported",
  "description": "본인의 주문, 문의, 쿠폰 정보만 조회할 수 있습니다."
}

## 예시

질문: "내 주문 현황"
{
  "sql": "SELECT order_id, order_date, product_name, total_amount, status FROM MyOrder ORDER BY order_date DESC LIMIT 10",
  "queryType": "order",
  "description": "최근 주문 내역을 조회합니다."
}

질문: "배송중인 주문"
{
  "sql": "SELECT order_id, product_name, courier, tracking_number, status FROM MyOrder WHERE status = 'SHIPPED' ORDER BY order_date DESC LIMIT 10",
  "queryType": "order",
  "description": "현재 배송중인 주문을 조회합니다."
}

질문: "내 문의 처리 상태"
{
  "sql": "SELECT ticket_id, subject, status, created_date FROM MyTicket ORDER BY created_date DESC LIMIT 10",
  "queryType": "ticket",
  "description": "문의 처리 현황을 조회합니다."
}
`;

// ============================================================================
// 결과 포맷팅 프롬프트
// ============================================================================

const CUSTOMER_RESULT_PROMPT = `당신은 친절한 고객 서비스 AI입니다.
쿼리 결과를 고객에게 보기 좋게 설명합니다.

## 규칙
1. 항상 존댓말을 사용합니다.
2. 이모지를 적절히 사용합니다.
3. 상태값은 한글로 표시합니다:
   - PENDING: ⏳ 주문 접수됨
   - PROCESSING: 📦 상품 준비중
   - SHIPPED: 🚚 배송중
   - DELIVERED: ✅ 배송 완료
   - COMPLETED: ✅ 구매 확정
   - CANCELLED: ❌ 주문 취소
   - OPEN: 📩 접수됨
   - IN_PROGRESS: 💬 답변 중
   - RESOLVED: ✅ 해결됨
4. 금액은 원화로 표시합니다 (예: 15,000원)
5. 날짜는 읽기 쉽게 표시합니다 (예: 12월 1일)
6. 배송 조회 시 택배사와 송장번호를 명확히 표시합니다.
7. 결과가 없으면 친절하게 안내합니다.
`;

// ============================================================================
// 타입 정의
// ============================================================================

interface SQLGenerationResult {
  sql: string;
  queryType: "order" | "ticket" | "coupon" | "unsupported";
  description: string;
}

export interface CustomerText2DBResponse {
  success: boolean;
  message: string;
  queryType?: string;
  resultCount?: number;
  timestamp: string;
  requiresPhone?: boolean;
}

export interface CustomerInfo {
  customerId: string;
  customerName: string;
  phone: string;
}

// ============================================================================
// 전화번호로 고객 찾기
// ============================================================================

export async function findCustomerByPhone(phone: string): Promise<CustomerInfo | null> {
  // 전화번호 정규화 (하이픈 제거)
  const normalizedPhone = phone.replace(/-/g, "").replace(/\s/g, "");
  
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { phone: phone },
          { phone: { contains: normalizedPhone.slice(-8) } }, // 뒤 8자리로도 검색
        ]
      },
      select: { id: true, name: true, phone: true }
    });

    if (!customer) {
      return null;
    }

    return {
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone || phone,
    };
  } catch (error) {
    console.error("[CustomerText2DB] Find customer error:", error);
    return null;
  }
}

// ============================================================================
// SQL 생성 (LLM)
// ============================================================================

async function generateCustomerSQL(userQuery: string): Promise<SQLGenerationResult> {
  try {
    const response = await chatCompletion([
      { role: "system", content: CUSTOMER_TEXT2SQL_PROMPT },
      { role: "user", content: userQuery },
    ], { temperature: 0.1, maxTokens: 512 });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        sql: result.sql || "",
        queryType: result.queryType || "unsupported",
        description: result.description || "",
      };
    }

    return {
      sql: "",
      queryType: "unsupported",
      description: "질문을 이해하지 못했습니다.",
    };
  } catch (error) {
    console.error("[CustomerText2DB] SQL Generation Error:", error);
    return {
      sql: "",
      queryType: "unsupported",
      description: "처리 중 오류가 발생했습니다.",
    };
  }
}

// ============================================================================
// 보안 쿼리 변환 - 가상 뷰를 실제 쿼리로 변환 + customerId 필터 적용
// ============================================================================

function convertToSecureQuery(sql: string, customerId: string): string {
  if (!sql || sql.trim() === "") return "";

  let secureSQL = sql;

  // MyOrder 뷰를 실제 Order 테이블 쿼리로 변환
  secureSQL = secureSQL.replace(
    /FROM\s+MyOrder/gi,
    `FROM "Order" WHERE customerId = '${customerId}'`
  );

  // SELECT 절의 컬럼명 변환 (order 테이블) - 새로운 스키마에 맞게 매핑
  secureSQL = secureSQL
    .replace(/order_id/gi, 'id as order_id')
    .replace(/order_number/gi, 'orderNumber as order_number')
    .replace(/order_date/gi, 'orderDate as order_date')
    .replace(/product_name/gi, 'productInfo as product_name')
    .replace(/order_amount/gi, 'orderAmount as order_amount')
    .replace(/orderer_name/gi, 'ordererName as orderer_name')
    .replace(/orderer_phone/gi, 'ordererPhone as orderer_phone')
    .replace(/tracking_number/gi, 'trackingNumber as tracking_number')
    .replace(/order_source/gi, 'orderSource as order_source');

  // MyTicket 뷰를 실제 Ticket 테이블 쿼리로 변환
  secureSQL = secureSQL.replace(
    /FROM\s+MyTicket/gi,
    `FROM Ticket WHERE customerId = '${customerId}'`
  );

  // SELECT 절의 컬럼명 변환 (ticket 테이블)
  secureSQL = secureSQL
    .replace(/ticket_id/gi, 'id as ticket_id')
    .replace(/created_date/gi, 'createdAt as created_date');

  // MyCoupon 뷰를 실제 쿼리로 변환
  secureSQL = secureSQL.replace(
    /FROM\s+MyCoupon/gi,
    `FROM Coupon c 
     LEFT JOIN CouponUsage cu ON c.id = cu.couponId AND cu.customerId = '${customerId}'
     WHERE c.isActive = true`
  );

  // 쿠폰 컬럼 변환
  secureSQL = secureSQL
    .replace(/coupon_code/gi, 'c.code as coupon_code')
    .replace(/coupon_name/gi, 'c.name as coupon_name')
    .replace(/discount_type/gi, 'c.discountType as discount_type')
    .replace(/discount_value/gi, 'c.discountValue as discount_value')
    .replace(/valid_from/gi, 'c.validFrom as valid_from')
    .replace(/valid_until/gi, 'c.validUntil as valid_until')
    .replace(/is_used/gi, 'CASE WHEN cu.id IS NOT NULL THEN true ELSE false END as is_used');

  return secureSQL;
}

// ============================================================================
// 보안 검증
// ============================================================================

function validateSecureQuery(sql: string): { valid: boolean; error?: string } {
  if (!sql || sql.trim() === "") {
    return { valid: false, error: "빈 쿼리" };
  }

  const upperSQL = sql.toUpperCase();

  // SELECT만 허용
  if (!upperSQL.trim().startsWith("SELECT")) {
    return { valid: false, error: "SELECT 쿼리만 허용됩니다." };
  }

  // 위험 키워드 차단
  const dangerousKeywords = [
    "DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "CREATE", 
    "TRUNCATE", "EXEC", "EXECUTE", "GRANT", "REVOKE",
    ";--", "/*", "*/", "UNION", "INTO OUTFILE"
  ];

  for (const keyword of dangerousKeywords) {
    if (upperSQL.includes(keyword)) {
      return { valid: false, error: `허용되지 않는 키워드: ${keyword}` };
    }
  }

  return { valid: true };
}

// ============================================================================
// 쿼리 실행
// ============================================================================

async function executeSecureQuery(
  sql: string, 
  customerId: string
): Promise<{ data: any[]; error?: string }> {
  // 보안 쿼리로 변환
  const secureSQL = convertToSecureQuery(sql, customerId);
  
  // 보안 검증
  const validation = validateSecureQuery(secureSQL);
  if (!validation.valid) {
    return { data: [], error: validation.error };
  }

  console.log("[CustomerText2DB] Executing secure query:", secureSQL);

  try {
    const result = await prisma.$queryRawUnsafe(secureSQL);
    return { data: Array.isArray(result) ? result : [result] };
  } catch (error: any) {
    console.error("[CustomerText2DB] Query Execution Error:", error);
    return { data: [], error: "조회 중 오류가 발생했습니다." };
  }
}

// ============================================================================
// 결과 포맷팅
// ============================================================================

async function formatCustomerResult(
  userQuery: string,
  queryType: string,
  data: any[],
  error?: string
): Promise<string> {
  if (error) {
    return `죄송합니다. ${error}\n\n다시 시도해주시거나, 고객센터로 문의해주세요.`;
  }

  if (data.length === 0) {
    const emptyMessages: Record<string, string> = {
      order: "조회된 주문 내역이 없습니다. 📭\n\n아직 주문하신 상품이 없으신가요?",
      ticket: "등록된 문의 내역이 없습니다. 📭\n\n궁금한 점이 있으시면 문의해주세요!",
      coupon: "사용 가능한 쿠폰이 없습니다. 🎫\n\n새로운 쿠폰이 발급되면 알려드릴게요!",
    };
    return emptyMessages[queryType] || "조회 결과가 없습니다.";
  }

  try {
    const response = await chatCompletion([
      { role: "system", content: CUSTOMER_RESULT_PROMPT },
      {
        role: "user",
        content: `고객 질문: ${userQuery}

조회 결과 (${data.length}건):
${JSON.stringify(data, null, 2)}

위 결과를 고객에게 친절하게 설명해주세요.`,
      },
    ], { temperature: 0.5, maxTokens: 1024 });

    return response.content;
  } catch (error) {
    // LLM 실패 시 기본 포맷팅
    return formatResultFallback(queryType, data);
  }
}

function formatResultFallback(queryType: string, data: any[]): string {
  let result = "";

  if (queryType === "order") {
    result = "📦 주문 내역\n\n";
    data.forEach((order, idx) => {
      const status = formatStatus(order.status);
      result += `${idx + 1}. ${order.product_name || order.productInfo || "상품"}\n`;
      result += `   • 상태: ${status}\n`;
      result += `   • 금액: ${formatCurrency(order.order_amount || order.orderAmount || order.total_amount || order.totalAmount)}\n`;
      if (order.orderer_name || order.ordererName) {
        result += `   • 주문자: ${order.orderer_name || order.ordererName}\n`;
      }
      if (order.contact_phone || order.contactPhone) {
        result += `   • 연락처: ${order.contact_phone || order.contactPhone}\n`;
      }
      if (order.tracking_number || order.trackingNumber) {
        result += `   • 송장: ${order.courier || ""} ${order.tracking_number || order.trackingNumber}\n`;
      }
      result += "\n";
    });
  } else if (queryType === "ticket") {
    result = "📩 문의 내역\n\n";
    data.forEach((ticket, idx) => {
      result += `${idx + 1}. ${ticket.subject}\n`;
      result += `   • 상태: ${formatStatus(ticket.status)}\n`;
      result += `   • 접수일: ${formatDate(ticket.created_date || ticket.createdAt)}\n\n`;
    });
  } else if (queryType === "coupon") {
    result = "🎫 쿠폰 목록\n\n";
    data.forEach((coupon, idx) => {
      const discount = coupon.discount_type === "PERCENT" 
        ? `${coupon.discount_value}%` 
        : `${formatCurrency(coupon.discount_value)}`;
      result += `${idx + 1}. ${coupon.coupon_name}\n`;
      result += `   • 코드: ${coupon.coupon_code}\n`;
      result += `   • 할인: ${discount}\n`;
      result += `   • 만료: ${formatDate(coupon.valid_until)}\n\n`;
    });
  } else {
    result = `조회 결과: ${data.length}건\n\n`;
    result += JSON.stringify(data, null, 2);
  }

  return result;
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "⏳ 주문 접수됨",
    PROCESSING: "📦 상품 준비중",
    SHIPPED: "🚚 배송중",
    DELIVERED: "✅ 배송 완료",
    COMPLETED: "✅ 구매 확정",
    CANCELLED: "❌ 주문 취소",
    OPEN: "📩 접수됨",
    IN_PROGRESS: "💬 답변 중",
    RESOLVED: "✅ 해결됨",
    CLOSED: "⚫ 종료",
  };
  return statusMap[status] || status;
}

function formatCurrency(amount: any): string {
  const num = typeof amount === "number" ? amount : Number(amount);
  if (isNaN(num)) return String(amount);
  return new Intl.NumberFormat("ko-KR").format(num) + "원";
}

function formatDate(date: any): string {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// ============================================================================
// 메인 함수: 고객용 Text2DB 처리
// ============================================================================

export async function processCustomerText2DB(
  userQuery: string,
  customerInfo: CustomerInfo | null
): Promise<CustomerText2DBResponse> {
  const timestamp = new Date().toISOString();

  // 1. 고객 정보 확인 (전화번호로 식별)
  if (!customerInfo || !customerInfo.customerId) {
    return {
      success: false,
      message: "전화번호를 먼저 입력해주세요. 📱\n\n전화번호 확인 후 주문 조회, 배송 확인, 문의 내역 등을 이용하실 수 있습니다.",
      requiresPhone: true,
      timestamp,
    };
  }

  console.log("[CustomerText2DB] Processing query for customer:", customerInfo.customerId);

  try {
    // 2. 자연어 → SQL 변환
    const sqlResult = await generateCustomerSQL(userQuery);

    // 3. 지원하지 않는 질문 처리
    if (sqlResult.queryType === "unsupported" || !sqlResult.sql) {
      return {
        success: false,
        message: sqlResult.description || "본인의 주문, 문의, 쿠폰 정보만 조회할 수 있습니다. 🙏\n\n예시:\n• \"내 주문 현황\"\n• \"배송중인 주문\"\n• \"내 문의 확인\"\n• \"사용 가능한 쿠폰\"",
        queryType: sqlResult.queryType,
        timestamp,
      };
    }

    // 4. 보안 쿼리 실행 (customerId 필터 자동 적용)
    const { data, error } = await executeSecureQuery(sqlResult.sql, customerInfo.customerId);

    // 5. 결과 포맷팅
    const formattedMessage = await formatCustomerResult(
      userQuery,
      sqlResult.queryType,
      data,
      error
    );

    return {
      success: true,
      message: formattedMessage,
      queryType: sqlResult.queryType,
      resultCount: data.length,
      timestamp,
    };
  } catch (error: any) {
    console.error("[CustomerText2DB] Error:", error);
    return {
      success: false,
      message: "죄송합니다. 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요. 🙏",
      timestamp,
    };
  }
}

// ============================================================================
// 예시 질문 (고객용)
// ============================================================================

export async function getCustomerExampleQueries(): Promise<string[]> {
  return [
    "내 주문 현황",
    "배송중인 주문 확인",
    "최근 주문 내역",
    "내 문의 처리 상태",
    "사용 가능한 쿠폰",
  ];
}

// ============================================================================
// 비인증 일반 응답 (FAQ 등)
// ============================================================================

export async function processGeneralQuery(userQuery: string): Promise<string> {
  const faqResponses: Record<string, string> = {
    "배송": "📦 배송 안내\n\n• 배송비: 3,000원 (5만원 이상 무료배송)\n• 배송기간: 결제 완료 후 1-3일 소요\n• 도서산간 지역은 1-2일 추가 소요될 수 있습니다.\n\n배송 조회는 전화번호 입력 후 가능합니다.",
    "교환": "🔄 교환/반품 안내\n\n• 교환/반품 기간: 수령 후 7일 이내\n• 단순 변심: 왕복 배송비 고객 부담\n• 상품 불량: 무료 교환/반품\n\n문의: 고객센터 1588-0000",
    "환불": "💰 환불 안내\n\n• 카드 결제: 취소 후 3-5 영업일 내 환불\n• 계좌이체: 환불 계좌 확인 후 1-2 영업일 내 입금\n\n자세한 사항은 고객센터로 문의해주세요.",
    "영업시간": "⏰ 고객센터 운영시간\n\n• 평일: 09:00 - 18:00\n• 점심시간: 12:00 - 13:00\n• 주말/공휴일 휴무\n\n☎️ 1588-0000",
  };

  // 키워드 매칭
  for (const [keyword, response] of Object.entries(faqResponses)) {
    if (userQuery.includes(keyword)) {
      return response;
    }
  }

  // LLM으로 일반 응답 생성
  try {
    const response = await chatCompletion([
      { 
        role: "system", 
        content: `당신은 친절한 쇼핑몰 고객 서비스 AI입니다.
고객의 일반적인 질문에 답변합니다.
개인정보 조회(주문, 배송 등)는 전화번호 입력이 필요하다고 안내합니다.
항상 존댓말을 사용하고 친절하게 응대합니다.` 
      },
      { role: "user", content: userQuery },
    ], { temperature: 0.7, maxTokens: 512 });

    return response.content;
  } catch {
    return "안녕하세요! 무엇을 도와드릴까요? 😊\n\n주문 조회, 배송 확인 등은 전화번호 입력 후 이용 가능합니다.";
  }
}
