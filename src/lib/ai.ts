import OpenAI from "openai";

// ============================================================================
// LLM Configuration - Ollama with gpt-oss:20b
// ============================================================================

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:27b";

// Initialize Ollama client (OpenAI-compatible API)
const ollama = new OpenAI({
  baseURL: OLLAMA_BASE_URL,
  apiKey: "ollama", // Ollama doesn't require API key, but OpenAI client needs one
  timeout: 120000, // 2분 타임아웃
  maxRetries: 2,
});

// Optional: Keep OpenAI as fallback
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ============================================================================
// Helper: Get LLM Client
// ============================================================================

function getLLMClient() {
  // Prefer Ollama, fallback to OpenAI if configured
  return { client: ollama, model: OLLAMA_MODEL, provider: "ollama" };
}

// ============================================================================
// Core LLM Function - Chat Completion
// ============================================================================

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }
): Promise<LLMResponse> {
  const { client, model, provider } = getLLMClient();
  
  try {
    const completion = await client.chat.completions.create({
      messages,
      model,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      // Note: Ollama may not support response_format, handle JSON parsing manually
    });

    const content = completion.choices[0]?.message?.content || "";
    
    return {
      content,
      provider,
      model,
    };
  } catch (error) {
    console.error(`LLM Error (${provider}):`, error);
    throw error;
  }
}

// ============================================================================
// Customer Segmentation AI
// ============================================================================

export async function analyzeCustomerSegmentAI(customerData: any): Promise<string> {
  const systemPrompt = `당신은 CRM 전문가입니다. 고객 데이터를 분석하여 다음 세그먼트 중 하나를 할당하세요:
- 'Enterprise': 대기업 또는 대규모 계약 고객
- 'SMB': 중소기업 고객
- 'Individual': 개인 고객
- 'VIP': 높은 구매 빈도 또는 매출 상위 고객
- 'At-Risk': 이탈 위험이 있는 고객 (비활성, 불만 등)

세그먼트 이름만 반환하세요.`;

  try {
    const response = await chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(customerData, null, 2) },
    ], { temperature: 0.3 });

    // Extract segment from response
    const content = response.content.trim();
    const validSegments = ["Enterprise", "SMB", "Individual", "VIP", "At-Risk"];
    
    for (const seg of validSegments) {
      if (content.includes(seg)) {
        return seg;
      }
    }
    
    return content || "Unknown";
  } catch (error) {
    console.error("Customer Segment AI Error:", error);
    // Fallback to rule-based
    return analyzeCustomerSegmentFallback(customerData);
  }
}

function analyzeCustomerSegmentFallback(customerData: any): string {
  const company = customerData.company?.toLowerCase() || "";
  const email = customerData.email?.toLowerCase() || "";

  if (company.includes("tech") || company.includes("inc") || company.includes("corp")) {
    return "Enterprise";
  } else if (email.includes("gmail") || email.includes("yahoo")) {
    return "Individual";
  } else if (customerData.status === "INACTIVE") {
    return "At-Risk";
  } else {
    return "SMB";
  }
}

// ============================================================================
// CRM Search with AI (Natural Language → Query)
// ============================================================================

export interface SearchIntent {
  type: "customer" | "lead" | "order" | "general";
  filters?: Record<string, any>;
  explanation: string;
}

export async function searchCRMWithAI(query: string): Promise<SearchIntent | null> {
  const systemPrompt = `당신은 CRM 검색 어시스턴트입니다. 사용자의 자연어 검색어를 구조화된 검색 의도로 변환하세요.

반드시 다음 JSON 형식으로 응답하세요:
{
  "type": "customer" | "lead" | "order",
  "filters": { Prisma where 절 형식 },
  "explanation": "검색 의도 설명"
}

예시:
- "활성 고객 찾기" → {"type": "customer", "filters": {"status": "ACTIVE"}, "explanation": "활성 상태의 고객을 검색합니다."}
- "Acme 회사 고객" → {"type": "customer", "filters": {"company": {"contains": "Acme"}}, "explanation": "Acme 회사 고객을 검색합니다."}
- "신규 리드" → {"type": "lead", "filters": {"status": "NEW"}, "explanation": "새로운 리드를 검색합니다."}
- "대기 중인 주문" → {"type": "order", "filters": {"status": "PENDING"}, "explanation": "대기 중인 주문을 검색합니다."}`;

  try {
    const response = await chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ], { temperature: 0.2 });

    // Parse JSON from response
    const content = response.content.trim();
    
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as SearchIntent;
    }
    
    // If no JSON found, return general intent
    return {
      type: "general",
      explanation: content,
    };
  } catch (error) {
    console.error("Search AI Error:", error);
    
    // Fallback to simple pattern matching
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes("고객") || lowerQuery.includes("customer")) {
      return {
        type: "customer",
        filters: { status: "ACTIVE" },
        explanation: "고객 검색 (기본 필터)",
      };
    }
    if (lowerQuery.includes("리드") || lowerQuery.includes("lead")) {
      return {
        type: "lead",
        filters: {},
        explanation: "리드 검색",
      };
    }
    if (lowerQuery.includes("주문") || lowerQuery.includes("order")) {
      return {
        type: "order",
        filters: {},
        explanation: "주문 검색",
      };
    }
    
    return {
      type: "general",
      explanation: "검색 결과를 찾을 수 없습니다.",
    };
  }
}

// ============================================================================
// Review Sentiment Analysis
// ============================================================================

export interface ReviewAnalysis {
  sentiment: "Positive" | "Neutral" | "Negative";
  topics: string;
  summary?: string;
}

export async function analyzeReviewAI(content: string): Promise<ReviewAnalysis> {
  const systemPrompt = `당신은 고객 리뷰 분석 전문가입니다. 리뷰를 분석하여 다음 JSON 형식으로 응답하세요:

{
  "sentiment": "Positive" | "Neutral" | "Negative",
  "topics": "쉼표로 구분된 주요 토픽 (최대 3개, 예: 배송, 품질, 가격)",
  "summary": "리뷰 요약 (1문장)"
}

토픽 예시: 배송, 품질, 가격, 디자인, 소음, 내구성, 서비스, 포장`;

  try {
    const response = await chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content },
    ], { temperature: 0.3 });

    // Parse JSON from response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        sentiment: result.sentiment || "Neutral",
        topics: result.topics || "General",
        summary: result.summary,
      };
    }
    
    throw new Error("Invalid JSON response");
  } catch (error) {
    console.error("Review Analysis Error:", error);
    return analyzeReviewFallback(content);
  }
}

function analyzeReviewFallback(content: string): ReviewAnalysis {
  const lower = content.toLowerCase();
  let sentiment: "Positive" | "Neutral" | "Negative" = "Neutral";
  
  if (lower.includes("좋") || lower.includes("만족") || lower.includes("추천") || lower.includes("굿") || lower.includes("최고")) {
    sentiment = "Positive";
  } else if (lower.includes("별로") || lower.includes("실망") || lower.includes("안좋") || lower.includes("느림") || lower.includes("불만")) {
    sentiment = "Negative";
  }

  const topicsList: string[] = [];
  if (lower.includes("배송")) topicsList.push("배송");
  if (lower.includes("디자인") || lower.includes("예쁘")) topicsList.push("디자인");
  if (lower.includes("소음") || lower.includes("조용")) topicsList.push("소음");
  if (lower.includes("가격") || lower.includes("비싸") || lower.includes("저렴")) topicsList.push("가격");
  if (lower.includes("품질")) topicsList.push("품질");
  
  return {
    sentiment,
    topics: topicsList.length > 0 ? topicsList.join(", ") : "General",
  };
}

// ============================================================================
// CS Ticket Auto-Response Generation
// ============================================================================

export interface TicketResponse {
  suggestedReply: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  sentiment: "Positive" | "Neutral" | "Negative";
}

export async function generateTicketResponse(
  subject: string,
  description: string,
  customerName?: string
): Promise<TicketResponse> {
  const systemPrompt = `당신은 전문적인 고객 서비스 담당자입니다. 고객 문의를 분석하고 친절하고 전문적인 답변을 작성하세요.

다음 JSON 형식으로 응답하세요:
{
  "suggestedReply": "고객에게 보낼 답변 (존댓말 사용, 친절하게)",
  "category": "배송문의 | 제품문의 | 교환/반품 | 결제문의 | 기술지원 | 불만/클레임 | 기타",
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "sentiment": "Positive | Neutral | Negative"
}

우선순위 기준:
- URGENT: 긴급 불만, 법적 언급, 환불 요청
- HIGH: 불만 표시, 빠른 해결 요구
- MEDIUM: 일반 문의
- LOW: 단순 정보 요청`;

  try {
    const response = await chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: `제목: ${subject}\n내용: ${description}\n고객명: ${customerName || "고객"}` },
    ], { temperature: 0.5 });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as TicketResponse;
    }
    
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Ticket Response Generation Error:", error);
    return {
      suggestedReply: `안녕하세요, ${customerName || "고객"}님.\n\n문의해 주셔서 감사합니다. 해당 건에 대해 확인 후 빠르게 답변 드리겠습니다.\n\n감사합니다.`,
      category: "기타",
      priority: "MEDIUM",
      sentiment: "Neutral",
    };
  }
}

// ============================================================================
// Marketing Message Generation
// ============================================================================

export interface MarketingMessage {
  subject: string;
  body: string;
  callToAction: string;
}

export async function generateMarketingMessage(
  segment: string,
  campaignType: string,
  productInfo?: string
): Promise<MarketingMessage> {
  const systemPrompt = `당신은 마케팅 카피라이터입니다. 타겟 세그먼트에 맞는 효과적인 마케팅 메시지를 작성하세요.

다음 JSON 형식으로 응답하세요:
{
  "subject": "이메일/SMS 제목 (20자 이내, 눈길을 끄는)",
  "body": "본문 메시지 (100자 이내, 가치 제안 포함)",
  "callToAction": "행동 유도 문구 (예: 지금 확인하기, 쿠폰 받기)"
}

세그먼트별 특성:
- VIP: 프리미엄 혜택, 독점 경험 강조
- Enterprise: 비용 절감, 효율성 강조
- SMB: 가성비, 실용성 강조
- Individual: 개인 혜택, 트렌드 강조
- At-Risk: 재구매 혜택, 보상 강조`;

  try {
    const response = await chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: `세그먼트: ${segment}\n캠페인 유형: ${campaignType}\n${productInfo ? `제품 정보: ${productInfo}` : ""}` },
    ], { temperature: 0.7 });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as MarketingMessage;
    }
    
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Marketing Message Generation Error:", error);
    return {
      subject: "특별 혜택을 확인하세요!",
      body: "회원님을 위한 특별한 혜택이 준비되어 있습니다.",
      callToAction: "지금 확인하기",
    };
  }
}

// ============================================================================
// Sales Forecast Insight Generation
// ============================================================================

export interface ForecastInsight {
  summary: string;
  keyFactors: string[];
  recommendations: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export async function generateForecastInsight(
  currentRevenue: number,
  predictedRevenue: number,
  growthRate: number,
  topProducts: string[]
): Promise<ForecastInsight> {
  const systemPrompt = `당신은 비즈니스 분석가입니다. 매출 데이터를 분석하고 인사이트를 제공하세요.

다음 JSON 형식으로 응답하세요:
{
  "summary": "매출 전망 요약 (2-3문장)",
  "keyFactors": ["성장/하락 요인 1", "요인 2", "요인 3"],
  "recommendations": ["추천 액션 1", "추천 액션 2"],
  "riskLevel": "LOW | MEDIUM | HIGH"
}`;

  try {
    const response = await chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: `현재 월 매출: ${currentRevenue.toLocaleString()}원
예상 매출: ${predictedRevenue.toLocaleString()}원
성장률: ${growthRate}%
인기 상품: ${topProducts.join(", ")}` },
    ], { temperature: 0.5 });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ForecastInsight;
    }
    
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Forecast Insight Generation Error:", error);
    return {
      summary: growthRate > 0 
        ? `매출이 ${growthRate}% 성장할 것으로 예상됩니다.`
        : `매출이 ${Math.abs(growthRate)}% 감소할 것으로 예상됩니다. 주의가 필요합니다.`,
      keyFactors: ["시장 트렌드", "계절 요인"],
      recommendations: ["인기 상품 재고 확보", "마케팅 캠페인 강화"],
      riskLevel: growthRate < 0 ? "HIGH" : growthRate < 5 ? "MEDIUM" : "LOW",
    };
  }
}

// ============================================================================
// Knowledge Base Search (RAG-like)
// ============================================================================

export async function searchKnowledgeWithAI(
  query: string,
  articles: { title: string; content: string; category: string }[]
): Promise<{ answer: string; sources: string[] }> {
  const systemPrompt = `당신은 지식 기반 검색 어시스턴트입니다. 주어진 문서들을 참고하여 사용자 질문에 답변하세요.

답변 형식:
1. 질문에 대한 직접적인 답변을 제공하세요.
2. 관련 문서가 있으면 참고 문서 제목을 언급하세요.
3. 관련 정보가 없으면 "관련 문서를 찾을 수 없습니다."라고 답변하세요.`;

  const context = articles.map(a => `[${a.category}] ${a.title}:\n${a.content.substring(0, 500)}`).join("\n\n---\n\n");

  try {
    const response = await chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: `참고 문서:\n${context}\n\n질문: ${query}` },
    ], { temperature: 0.3, maxTokens: 1024 });

    // Extract mentioned article titles as sources
    const sources = articles
      .filter(a => response.content.includes(a.title))
      .map(a => a.title);

    return {
      answer: response.content,
      sources: sources.length > 0 ? sources : ["일반 답변"],
    };
  } catch (error) {
    console.error("Knowledge Search Error:", error);
    return {
      answer: "죄송합니다. 검색 중 오류가 발생했습니다.",
      sources: [],
    };
  }
}

