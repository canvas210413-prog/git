"use server";

import { prisma } from "@/lib/prisma";
import { chatCompletion } from "@/lib/ai";

// ============================================================================
// 데이터베이스 스키마 정보 (LLM에게 제공)
// ============================================================================

const DB_SCHEMA = `
## 데이터베이스 스키마

### Customer (고객)
- id: String (PK)
- name: String (고객명)
- email: String (이메일, unique)
- phone: String? (전화번호)
- company: String? (회사명)
- status: String (상태: ACTIVE, INACTIVE)
- segment: String? (세그먼트: VIP, Enterprise, SMB, Individual, At-Risk)
- createdAt: DateTime
- updatedAt: DateTime

### Order (주문)
- id: String (PK)
- customerId: String (FK -> Customer.id)
- orderDate: DateTime (주문일시)
- totalAmount: Decimal (총 금액)
- status: String (상태: PENDING, PROCESSING, SHIPPED, DELIVERED, COMPLETED, CANCELLED)
- ordererName: String? (주문자명)
- contactPhone: String? (연락처)
- recipientAddr: String? (배송 주소)
- orderNumber: String? (주문번호)
- productInfo: String? (상품 정보)
- courier: String? (택배사)
- trackingNumber: String? (송장번호)
- orderAmount: Decimal? (주문금액)
- createdAt: DateTime
- updatedAt: DateTime

### Product (상품)
- id: String (PK)
- name: String (상품명)
- description: String? (설명)
- price: Decimal (가격)
- sku: String (SKU, unique)
- stock: Int (재고 수량)
- category: String? (카테고리)
- createdAt: DateTime

### Ticket (고객문의/티켓)
- id: String (PK)
- subject: String (제목)
- description: String? (내용)
- status: String (상태: OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- priority: String (우선순위: LOW, MEDIUM, HIGH, URGENT)
- category: String? (카테고리)
- customerId: String? (FK -> Customer.id)
- assignedToId: String? (FK -> User.id)
- createdAt: DateTime
- closedAt: DateTime?

### Lead (리드/잠재고객)
- id: String (PK)
- customerId: String? (FK -> Customer.id)
- title: String (제목)
- description: String? (설명)
- value: Decimal? (예상 금액)
- status: String (상태: NEW, CONTACTED, QUALIFIED, PROPOSAL, WON, LOST)
- createdAt: DateTime

### User (사용자/직원)
- id: String (PK)
- email: String (이메일)
- name: String? (이름)
- role: String (역할: ADMIN, MANAGER, USER)

### Part (부품/재고)
- id: String (PK)
- partNumber: String (부품번호)
- name: String (이름)
- quantity: Int (수량)
- minStock: Int (최소 재고)
- location: String? (위치)
- supplier: String? (공급업체)
- unitPrice: Decimal? (단가)
- category: String? (카테고리)
`;

// ============================================================================
// Text-to-SQL 시스템 프롬프트
// ============================================================================

const TEXT_TO_SQL_PROMPT = `당신은 CRM 시스템의 Text-to-SQL 전문가입니다. 사용자의 자연어 질문을 SQLite SQL 쿼리로 변환합니다.

${DB_SCHEMA}

## 규칙
1. 반드시 유효한 SQLite SQL 쿼리만 생성하세요.
2. SELECT 문만 허용됩니다 (INSERT, UPDATE, DELETE 금지).
3. 테이블명과 컬럼명은 스키마에 정의된 것만 사용하세요.
4. 결과는 최대 20개로 제한하세요 (LIMIT 20).
5. 날짜 비교는 date() 함수를 사용하세요.
6. 문자열 검색은 LIKE '%키워드%' 사용하세요.
7. JOIN이 필요한 경우 적절히 사용하세요.

## 응답 형식
반드시 다음 JSON 형식으로만 응답하세요:
{
  "sql": "SELECT 쿼리",
  "explanation": "이 쿼리가 하는 일 설명 (한국어)",
  "resultType": "order|customer|product|ticket|lead|part|stats|unknown"
}

## 예시

질문: "오늘 주문 보여줘"
응답:
{
  "sql": "SELECT o.*, c.name as customerName FROM \\"Order\\" o LEFT JOIN Customer c ON o.customerId = c.id WHERE date(o.orderDate) = date('now') ORDER BY o.orderDate DESC LIMIT 20",
  "explanation": "오늘 날짜의 주문 목록을 조회합니다.",
  "resultType": "order"
}

질문: "주문번호 ORD-123 상태"
응답:
{
  "sql": "SELECT o.*, c.name as customerName FROM \\"Order\\" o LEFT JOIN Customer c ON o.customerId = c.id WHERE o.orderNumber LIKE '%ORD-123%' OR o.id LIKE '%ORD-123%' LIMIT 5",
  "explanation": "주문번호에 ORD-123이 포함된 주문을 조회합니다.",
  "resultType": "order"
}

질문: "홍길동 고객 정보"
응답:
{
  "sql": "SELECT * FROM Customer WHERE name LIKE '%홍길동%' LIMIT 10",
  "explanation": "이름에 홍길동이 포함된 고객을 조회합니다.",
  "resultType": "customer"
}

질문: "이번 달 총 매출"
응답:
{
  "sql": "SELECT COUNT(*) as orderCount, SUM(totalAmount) as totalRevenue FROM \\"Order\\" WHERE strftime('%Y-%m', orderDate) = strftime('%Y-%m', 'now') AND status != 'CANCELLED'",
  "explanation": "이번 달의 주문 수와 총 매출을 계산합니다.",
  "resultType": "stats"
}

질문: "재고 부족한 상품"
응답:
{
  "sql": "SELECT * FROM Product WHERE stock < 10 ORDER BY stock ASC LIMIT 20",
  "explanation": "재고가 10개 미만인 상품을 조회합니다.",
  "resultType": "product"
}

질문: "미해결 티켓"
응답:
{
  "sql": "SELECT t.*, c.name as customerName FROM Ticket t LEFT JOIN Customer c ON t.customerId = c.id WHERE t.status IN ('OPEN', 'IN_PROGRESS') ORDER BY t.createdAt DESC LIMIT 20",
  "explanation": "아직 해결되지 않은 티켓을 조회합니다.",
  "resultType": "ticket"
}
`;

// ============================================================================
// 결과 포맷팅 시스템 프롬프트
// ============================================================================

const RESULT_FORMAT_PROMPT = `당신은 CRM AI 어시스턴트입니다. SQL 쿼리 결과를 고객에게 친절하게 설명합니다.

## 규칙
1. 항상 존댓말을 사용하세요.
2. 데이터를 보기 좋게 정리해서 보여주세요.
3. 개인정보는 일부 마스킹하세요 (예: 홍길동 → 홍*동, 010-1234-5678 → 010-****-5678)
4. 금액은 원화 형식으로 표시하세요 (예: ₩1,500,000)
5. 날짜는 한국어 형식으로 표시하세요 (예: 2024년 12월 1일)
6. 상태값은 한글과 이모지로 표시하세요:
   - PENDING: ⏳ 대기중
   - PROCESSING: 📦 처리중
   - SHIPPED: 🚚 배송중
   - DELIVERED: ✅ 배송완료
   - COMPLETED: ✅ 완료
   - CANCELLED: ❌ 취소
   - OPEN: 🔴 접수
   - IN_PROGRESS: 🟡 처리중
   - RESOLVED: 🟢 해결
7. 결과가 없으면 친절하게 안내하세요.
8. 결과가 많으면 요약하고 주요 항목만 보여주세요.
`;

// ============================================================================
// Text-to-SQL 변환
// ============================================================================

interface SQLResult {
  sql: string;
  explanation: string;
  resultType: string;
}

async function generateSQL(userQuery: string): Promise<SQLResult> {
  try {
    const response = await chatCompletion([
      { role: "system", content: TEXT_TO_SQL_PROMPT },
      { role: "user", content: userQuery },
    ], { temperature: 0.1, maxTokens: 1024 });

    // JSON 추출
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        sql: result.sql || "",
        explanation: result.explanation || "",
        resultType: result.resultType || "unknown",
      };
    }

    throw new Error("Invalid SQL response format");
  } catch (error) {
    console.error("SQL Generation Error:", error);
    return {
      sql: "",
      explanation: "쿼리 생성에 실패했습니다.",
      resultType: "error",
    };
  }
}

// ============================================================================
// SQL 실행
// ============================================================================

async function executeSQL(sql: string): Promise<{ data: any[]; error?: string }> {
  if (!sql || sql.trim() === "") {
    return { data: [], error: "SQL 쿼리가 비어있습니다." };
  }

  // 보안 검증: SELECT만 허용
  const upperSQL = sql.toUpperCase().trim();
  if (!upperSQL.startsWith("SELECT")) {
    return { data: [], error: "SELECT 쿼리만 실행할 수 있습니다." };
  }

  // 위험한 키워드 차단
  const dangerousKeywords = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "CREATE", "TRUNCATE", ";--"];
  for (const keyword of dangerousKeywords) {
    if (upperSQL.includes(keyword)) {
      return { data: [], error: "허용되지 않는 SQL 명령입니다." };
    }
  }

  try {
    // Prisma raw query 실행
    const result = await prisma.$queryRawUnsafe(sql);
    return { data: Array.isArray(result) ? result : [result] };
  } catch (error: any) {
    console.error("SQL Execution Error:", error);
    return { data: [], error: `쿼리 실행 오류: ${error.message}` };
  }
}

// ============================================================================
// 결과 포맷팅
// ============================================================================

async function formatResult(
  userQuery: string,
  sqlResult: SQLResult,
  data: any[],
  error?: string
): Promise<string> {
  if (error) {
    return `죄송합니다. 조회 중 오류가 발생했습니다.\n\n오류: ${error}`;
  }

  if (data.length === 0) {
    return `"${userQuery}"에 대한 조회 결과가 없습니다.\n\n다른 조건으로 검색해보시겠어요?`;
  }

  try {
    const response = await chatCompletion([
      { role: "system", content: RESULT_FORMAT_PROMPT },
      {
        role: "user",
        content: `사용자 질문: ${userQuery}

쿼리 설명: ${sqlResult.explanation}

조회 결과 (${data.length}건):
${JSON.stringify(data, null, 2)}

위 결과를 사용자에게 친절하게 설명해주세요.`,
      },
    ], { temperature: 0.5, maxTokens: 2048 });

    return response.content;
  } catch (error) {
    // LLM 실패 시 기본 포맷팅
    return formatResultFallback(sqlResult, data);
  }
}

function formatResultFallback(sqlResult: SQLResult, data: any[]): string {
  let result = `📊 조회 결과 (${data.length}건)\n\n`;

  if (sqlResult.resultType === "order") {
    data.slice(0, 5).forEach((order, idx) => {
      result += `${idx + 1}. 주문번호: ${order.orderNumber || order.id?.slice(-8) || "N/A"}\n`;
      result += `   고객: ${maskName(order.customerName || order.ordererName || "알 수 없음")}\n`;
      result += `   금액: ${formatCurrency(order.totalAmount || order.orderAmount)}\n`;
      result += `   상태: ${formatStatus(order.status)}\n\n`;
    });
  } else if (sqlResult.resultType === "customer") {
    data.slice(0, 5).forEach((customer, idx) => {
      result += `${idx + 1}. ${maskName(customer.name)} (${customer.email})\n`;
      result += `   회사: ${customer.company || "개인"} | 상태: ${customer.status}\n\n`;
    });
  } else if (sqlResult.resultType === "stats") {
    const stats = data[0];
    Object.entries(stats).forEach(([key, value]) => {
      result += `• ${key}: ${typeof value === "number" ? formatCurrency(value) : value}\n`;
    });
  } else {
    result += JSON.stringify(data.slice(0, 5), null, 2);
  }

  if (data.length > 5) {
    result += `\n... 외 ${data.length - 5}건 더 있습니다.`;
  }

  return result;
}

function maskName(name: string): string {
  if (!name || name.length < 2) return name || "";
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

function formatCurrency(amount: any): string {
  const num = typeof amount === "number" ? amount : Number(amount);
  if (isNaN(num)) return String(amount);
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(num);
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "⏳ 대기중",
    PROCESSING: "📦 처리중",
    SHIPPED: "🚚 배송중",
    DELIVERED: "✅ 배송완료",
    COMPLETED: "✅ 완료",
    CANCELLED: "❌ 취소",
    OPEN: "🔴 접수",
    IN_PROGRESS: "🟡 처리중",
    RESOLVED: "🟢 해결",
    CLOSED: "⚫ 종료",
  };
  return statusMap[status] || status;
}

// ============================================================================
// 메인 Text2DB 함수
// ============================================================================

export interface Text2DBResponse {
  message: string;
  sql?: string;
  explanation?: string;
  resultCount?: number;
  timestamp: string;
}

export async function processText2DB(userQuery: string): Promise<Text2DBResponse> {
  const timestamp = new Date().toISOString();

  try {
    // 1. 자연어 → SQL 변환
    console.log("[Text2DB] Generating SQL for:", userQuery);
    const sqlResult = await generateSQL(userQuery);

    if (!sqlResult.sql || sqlResult.resultType === "error") {
      return {
        message: "죄송합니다. 질문을 이해하지 못했습니다. 다시 한번 말씀해주시겠어요?\n\n예시:\n• \"오늘 주문 현황\"\n• \"주문번호 12345 조회\"\n• \"홍길동 고객 정보\"",
        timestamp,
      };
    }

    console.log("[Text2DB] Generated SQL:", sqlResult.sql);

    // 2. SQL 실행
    const { data, error } = await executeSQL(sqlResult.sql);
    console.log("[Text2DB] Query result count:", data.length);

    // 3. 결과 포맷팅
    const formattedMessage = await formatResult(userQuery, sqlResult, data, error);

    return {
      message: formattedMessage,
      sql: sqlResult.sql,
      explanation: sqlResult.explanation,
      resultCount: data.length,
      timestamp,
    };
  } catch (error: any) {
    console.error("[Text2DB] Error:", error);
    return {
      message: "죄송합니다. 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      timestamp,
    };
  }
}

// ============================================================================
// 예시 질문 목록
// ============================================================================

export async function getExampleQueries(): Promise<string[]> {
  return [
    "오늘 주문 현황",
    "이번 달 총 매출",
    "홍길동 고객 주문 내역",
    "배송중인 주문 목록",
    "미해결 티켓 보여줘",
    "재고 10개 미만 상품",
    "VIP 고객 목록",
    "최근 등록된 고객 5명",
  ];
}
