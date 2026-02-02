"use server";

import { prisma } from "@/lib/prisma";
import { chatCompletion } from "@/lib/ai";
import { revalidatePath } from "next/cache";

// ============================================================================
// 리뷰 분석 서버 액션
// ============================================================================

export interface ReviewData {
  id: string;
  subject: string;
  description: string;
  rating: number;
  customerName: string;
  createdAt: Date;
  category?: string;
  sentiment?: string;
  keywords?: string[];
  summary?: string;
}

export interface AnalysisResult {
  reviewId: string;
  sentiment: "positive" | "negative" | "neutral";
  category: string;
  keywords: string[];
  summary: string;
  concerns: string[];
  suggestions: string[];
}

export interface AnalysisStats {
  totalReviews: number;
  analyzedReviews: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  categoryDistribution: Record<string, number>;
  topKeywords: { keyword: string; count: number }[];
  averageRating: number;
}

/**
 * 리뷰 목록 가져오기 (Review 테이블 + Ticket 테이블의 네이버 리뷰, 기간 필터 지원)
 */
export async function getReviewTickets(
  startDate?: Date,
  endDate?: Date
): Promise<ReviewData[]> {
  const whereClause: {
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  // 기간 필터 적용
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt.gte = startDate;
    }
    if (endDate) {
      // endDate를 해당 일의 마지막 시간으로 설정
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.createdAt.lte = endOfDay;
    }
  }

  // 1. Review 테이블에서 쇼핑몰 리뷰 (MALL) 가져오기
  const reviews = await prisma.review.findMany({
    where: {
      ...whereClause,
      source: 'MALL', // 쇼핑몰 리뷰만
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Ticket 테이블에서 네이버 리뷰 가져오기 (고객리뷰관리 네이버 탭의 데이터)
  const ticketWhereClause: {
    description: { startsWith: string };
    createdAt?: { gte?: Date; lte?: Date };
  } = {
    description: { startsWith: '[네이버 리뷰 -' },
  };

  if (startDate || endDate) {
    ticketWhereClause.createdAt = {};
    if (startDate) {
      ticketWhereClause.createdAt.gte = startDate;
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      ticketWhereClause.createdAt.lte = endOfDay;
    }
  }

  const naverTickets = await prisma.ticket.findMany({
    where: ticketWhereClause,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  // Review 테이블의 쇼핑몰 리뷰를 ReviewData 형식으로 변환
  const reviewData: ReviewData[] = reviews.map((review) => {
    return {
      id: review.id,
      subject: `[쇼핑몰] ${review.rating}점 - ${review.authorName}`,
      description: review.content,
      rating: review.rating,
      customerName: review.authorName || '',
      createdAt: review.createdAt,
      category: review.sentiment || undefined,
      sentiment: review.sentiment || undefined,
      keywords: [],
    };
  });

  // Ticket 테이블의 네이버 리뷰를 ReviewData 형식으로 변환
  const ticketData: ReviewData[] = naverTickets.map((ticket) => {
    // 평점 추출: [리뷰] 5점 형식
    const ratingMatch = ticket.subject.match(/\[리뷰\]\s*(\d)점/);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;
    
    // 내용에서 메타 정보 제거
    let content = ticket.description;
    // [네이버 리뷰 - 날짜] 제거
    content = content.replace(/\[네이버 리뷰 - [^\]]+\]\s*/g, '');
    // 평점: 5점, 옵션: ... 등 메타 정보 제거
    content = content.replace(/평점:\s*\d점\s*/g, '');
    content = content.replace(/옵션:\s*[^\n]+\s*/g, '');
    content = content.replace(/내용:\s*/g, '');
    content = content.trim();

    return {
      id: ticket.id,
      subject: `[네이버] ${rating}점 - ${ticket.customer.name}`,
      description: content,
      rating: rating,
      customerName: ticket.customer.name,
      createdAt: ticket.createdAt,
      category: undefined,
      sentiment: undefined,
      keywords: [],
    };
  });

  // 두 데이터 합치고 날짜순 정렬
  const allData = [...reviewData, ...ticketData];
  allData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return allData;
}

/**
 * 단일 리뷰 LLM 분석
 */
export async function analyzeReview(review: ReviewData): Promise<AnalysisResult> {
  const prompt = `다음 고객 리뷰를 분석해주세요. JSON 형식으로 응답해주세요.

리뷰 내용:
"${review.subject}"
"${review.description}"
별점: ${review.rating}점

다음 형식으로 응답해주세요 (JSON만 반환):
{
  "sentiment": "positive" | "negative" | "neutral",
  "category": "제품품질" | "효과만족" | "가격" | "배송" | "디자인" | "소음" | "냄새제거" | "비염개선" | "기타",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "summary": "리뷰 요약 (한 문장)",
  "concerns": ["불만사항1", "불만사항2"],
  "suggestions": ["개선제안1", "개선제안2"]
}`;

  try {
    const response = await chatCompletion([
      { role: "system", content: "당신은 고객 리뷰 분석 전문가입니다. 리뷰를 분석하여 감정, 카테고리, 키워드를 추출합니다. JSON 형식으로만 응답하세요." },
      { role: "user", content: prompt },
    ]);

    // JSON 파싱 시도 - response.content에서 추출 (LLMResponse 객체)
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        reviewId: review.id,
        sentiment: parsed.sentiment || "neutral",
        category: parsed.category || "기타",
        keywords: parsed.keywords || [],
        summary: parsed.summary || "",
        concerns: parsed.concerns || [],
        suggestions: parsed.suggestions || [],
      };
    }

    // 파싱 실패 시 기본값
    return {
      reviewId: review.id,
      sentiment: review.rating >= 4 ? "positive" : review.rating <= 2 ? "negative" : "neutral",
      category: "기타",
      keywords: [],
      summary: review.subject,
      concerns: [],
      suggestions: [],
    };
  } catch (error) {
    console.error("리뷰 분석 오류:", error);
    return {
      reviewId: review.id,
      sentiment: review.rating >= 4 ? "positive" : review.rating <= 2 ? "negative" : "neutral",
      category: "기타",
      keywords: [],
      summary: review.subject,
      concerns: [],
      suggestions: [],
    };
  }
}

/**
 * 여러 리뷰 일괄 분석 (분석 결과를 DB에 저장)
 */
export async function analyzeMultipleReviews(
  reviews: ReviewData[],
  batchSize: number = 5
): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];

  // 배치 처리
  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((r) => analyzeReview(r)));
    results.push(...batchResults);
    
    // 분석 결과를 Review 테이블에 저장
    for (const result of batchResults) {
      try {
        await prisma.review.update({
          where: { id: result.reviewId },
          data: {
            sentiment: result.sentiment === "positive" ? "Positive" : result.sentiment === "negative" ? "Negative" : "Neutral",
            topics: result.keywords.join(', '),
          },
        });
      } catch (error) {
        console.error(`Failed to update review ${result.reviewId}:`, error);
      }
    }
  }

  return results;
}

/**
 * 전체 리뷰 통합 분석 (LLM 사용, 기간 필터 지원)
 */
export async function analyzeAllReviews(
  startDate?: Date,
  endDate?: Date
): Promise<{
  success: boolean;
  results?: AnalysisResult[];
  stats?: AnalysisStats;
  error?: string;
}> {
  try {
    const reviews = await getReviewTickets(startDate, endDate);

    if (reviews.length === 0) {
      return { success: false, error: "선택한 기간에 분석할 리뷰가 없습니다." };
    }

    // 최대 50개까지만 분석 (API 비용/시간 절약)
    const reviewsToAnalyze = reviews.slice(0, 50);
    const results = await analyzeMultipleReviews(reviewsToAnalyze);

    // 통계 계산
    const stats = calculateStats(reviews, results);

    return { success: true, results, stats };
  } catch (error) {
    console.error("전체 리뷰 분석 오류:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 통계 계산
 */
function calculateStats(reviews: ReviewData[], results: AnalysisResult[]): AnalysisStats {
  const sentimentDistribution = { positive: 0, negative: 0, neutral: 0 };
  const categoryDistribution: Record<string, number> = {};
  const keywordCounts: Record<string, number> = {};

  for (const result of results) {
    // 감정 분포
    sentimentDistribution[result.sentiment]++;

    // 카테고리 분포
    categoryDistribution[result.category] = (categoryDistribution[result.category] || 0) + 1;

    // 키워드 카운트
    for (const keyword of result.keywords) {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    }
  }

  // 상위 키워드 추출
  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }));

  // 평균 평점
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return {
    totalReviews: reviews.length,
    analyzedReviews: results.length,
    sentimentDistribution,
    categoryDistribution,
    topKeywords,
    averageRating: Math.round(averageRating * 10) / 10,
  };
}

/**
 * 리뷰 인사이트 생성 (LLM)
 */
export async function generateReviewInsights(reviews: ReviewData[]): Promise<{
  success: boolean;
  insights?: string;
  error?: string;
}> {
  if (reviews.length === 0) {
    return { success: false, error: "분석할 리뷰가 없습니다." };
  }

  // 리뷰 요약 텍스트 생성
  const reviewSummary = reviews.slice(0, 30).map((r, i) => 
    `${i + 1}. [${r.rating}점] ${r.customerName}: ${r.description.substring(0, 100)}...`
  ).join("\n");

  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const positiveCount = reviews.filter(r => r.rating >= 4).length;
  const negativeCount = reviews.filter(r => r.rating <= 2).length;
  const neutralCount = reviews.filter(r => r.rating === 3).length;
  
  // 별점별 분포 계산
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: ((reviews.filter(r => r.rating === rating).length / reviews.length) * 100).toFixed(1)
  }));

  // 키워드 추출 (간단한 빈도 분석)
  const allWords = reviews
    .map(r => r.description)
    .join(' ')
    .split(/\s+/)
    .filter(word => word.length >= 2);
  
  const wordFreq: Record<string, number> = {};
  allWords.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  const prompt = `당신은 글로벌 컨설팅 펌(McKinsey, BCG, Bain) 수준의 데이터 분석가입니다. 
다음 고객 리뷰 데이터를 깊이있게 분석하고, 실행 가능한(actionable) 인사이트를 도출하세요.

**절대 규칙: 모든 응답은 100% 한국어로만 작성하세요. 영어 단어나 문장이 포함되어서는 안 됩니다.**

# 📊 데이터 개요
- **총 리뷰 수**: ${reviews.length}건
- **평균 별점**: ${avgRating}/5.0점
- **긍정 리뷰**: ${positiveCount}건 (4-5점, ${((positiveCount/reviews.length)*100).toFixed(1)}%)
- **중립 리뷰**: ${neutralCount}건 (3점, ${((neutralCount/reviews.length)*100).toFixed(1)}%)
- **부정 리뷰**: ${negativeCount}건 (1-2점, ${((negativeCount/reviews.length)*100).toFixed(1)}%)

# 🔍 별점 분포
${ratingDistribution.map(r => `- ${r.rating}점: ${r.count}건 (${r.percentage}%)`).join('\n')}

# 💬 주요 언급 키워드 TOP 10
${topKeywords.map((k, i) => `${i+1}. "${k.word}" - ${k.count}회`).join('\n')}

# 📝 샘플 리뷰 (최대 30건)
${reviewSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

위 데이터를 기반으로 다음 형식의 전문 분석 리포트를 작성하세요. 
**필수 요구사항:**
1. **모든 섹션을 빠짐없이 완성하세요** (중간에 끊거나 생략 금지)
2. **모든 내용은 한국어로만 작성** (영어 단어 사용 금지, 괄호 안 영어도 금지)
3. **구체적인 숫자와 데이터 기반 분석** (추상적 표현 금지)
4. **실제 리뷰에서 인용** (지어내지 말고 제공된 리뷰에서 발췌)
5. **표 형식 정확히 지킬 것** (| 컬럼1 | 컬럼2 | 형식)

## 📊 경영진 요약

(4-5문장으로 핵심 요약. 반드시 다음 내용 포함:)
- 전체 만족도 점수와 NPS 수치
- 긍정 요인 2가지와 부정 요인 2가지
- 핵심 차별화 포인트 1가지
- 즉시 실행해야 할 조치 1가지

## 🎯 핵심 발견사항

### 1. 고객 만족도 현황

| 지표 | 수치 | 해석 |
|------|------|------|
| 전체 만족도 | ${avgRating}/5.0점 | 업계 평균 3.8점 대비 평가 및 시사점 |
| 추정 NPS | (긍정리뷰-부정리뷰)/전체×100 계산 | 추천 의향 수준 해석 |
| 재구매 의향 | 리뷰에서 "재구매" 언급 비율 추정 | 고객 충성도 분석 |

### 2. 주요 강점 분석

**1위: (구체적 강점명 - 예: 빠른 배송)**
- 언급 빈도: X건 (전체의 Y%)
- 대표 고객 의견: "실제 리뷰에서 발췌한 문장"
- 사업 영향: 전환율 상승 또는 재구매율 증가 등 구체적 임팩트

**2위: (두 번째 강점)**
- 언급 빈도: X건 (Y%)
- 대표 고객 의견: "실제 발췌"
- 사업 영향: 구체적 효과

**3위: (세 번째 강점)**
- 언급 빈도: X건 (Y%)
- 대표 고객 의견: "실제 발췌"
- 사업 영향: 구체적 효과

### 3. 개선 기회 분석

| 우선순위 | 개선 항목 | 심각도 | 언급 빈도 | 예상 손실 | 권장 조치 |
|---------|---------|--------|----------|----------|----------|
| 최우선 | 구체적 문제점 | ⚠️ 높음 | X건(Y%) | 매출 영향 Z% | 구체적 해결책 |
| 우선 | 두 번째 문제 | ⚡ 중간 | X건(Y%) | 평판 영향 | 해결 방안 |
| 보통 | 세 번째 문제 | ℹ️ 낮음 | X건(Y%) | 소폭 영향 | 개선 방향 |

**상세 분석:**

**[최우선 이슈]**에 대해 고객들은 "실제 리뷰 인용"과 같이 불만을 표현했습니다. 이는 (구체적 비즈니스 손실)를 유발하며, (해결하지 않을 경우 발생할 리스크)가 예상됩니다.

**[우선 이슈]**는 (문제 상황 설명). 고객 리뷰 중 "실제 인용"이라는 의견이 있었으며, (개선 시 기대 효과).

**[보통 이슈]**는 (현황 설명). (장기적 관점의 개선 방향).

## 💡 고객 세그먼트 분석

| 세그먼트명 | 추정 비율 | 주요 특징 | 핵심 관심사 | 만족 요인 | 불만 요인 |
|----------|---------|---------|-----------|---------|---------|
| (세그먼트1 - 예: 건강 중심 고객) | X% | 비염, 알레르기 관심 | 공기질 개선 | 효과 만족 | 배송 지연 |
| (세그먼트2) | Y% | 가성비 중시 | 가격 대비 성능 | 저렴한 가격 | 품질 우려 |
| (세그먼트3) | Z% | 편의성 중시 | 빠른 배송 | 신속 배송 | 포장 손상 |

**세부 분석:**

**(세그먼트1)**: 전체의 X%를 차지하며, "실제 리뷰 인용"과 같이 (특징 설명). 이들은 (마케팅 전략 제안).

**(세그먼트2)**: Y%로 추정되며, (특징 및 전략).

**(세그먼트3)**: Z%이며, (특징 및 접근 방안).

## 🚀 전략적 제언

### 즉시 실행 과제 (0~3개월)

**과제 1: (구체적 과제명)** - 🔴 최우선

- **목표**: (측정 가능한 목표 - 예: NPS 5점 상승, 배송 만족도 90% 달성)
- **실행 방안**:
  1. (구체적 실행 단계 1)
  2. (구체적 실행 단계 2)  
  3. (구체적 실행 단계 3)
- **예상 효과**: 매출 X% 증가, 고객 만족도 Y점 상승
- **필요 자원**: 인력 X명, 예산 Y만원, 기간 Z주

**과제 2: (두 번째 과제)** - 🟠 우선

- **목표**: (구체적 목표)
- **실행 방안**:
  1. (단계별 실행)
  2. (세부 방안)
- **예상 효과**: (정량적 효과)
- **필요 자원**: (구체적 자원)

**과제 3: (세 번째 과제)** - 🟡 중요

- (동일 형식으로 완성)

### 중기 전략 (3~6개월)

1. **(전략 1)**: (상세 설명 및 기대 효과)
2. **(전략 2)**: (상세 설명)
3. **(전략 3)**: (상세 설명)

## 📈 마케팅 활용 전략

### 즉시 활용 가능 고객 후기

**후기 1**: "(실제 5점 리뷰 전문 발췌)" - ⭐⭐⭐⭐⭐ (고객 이름)
- 활용 채널: 상세 페이지, 블로그, 인스타그램
- 핵심 메시지: (이 후기가 강조하는 가치)

**후기 2**: "(실제 리뷰 발췌)" - ⭐⭐⭐⭐⭐
- 활용 채널: (채널 목록)
- 핵심 메시지: (가치 설명)

**후기 3**: "(실제 리뷰 발췌)" - ⭐⭐⭐⭐⭐
- (동일 형식)

### 콘텐츠 제작 아이디어

1. **(콘텐츠 주제 1)**: 리뷰에서 언급된 (키워드) 기반 블로그 콘텐츠
2. **(콘텐츠 주제 2)**: 고객 사용 후기 영상 시리즈
3. **(콘텐츠 주제 3)**: (아이디어 설명)

## 📊 경쟁 우위 요소

리뷰 분석 결과, 다음 3가지가 경쟁사 대비 차별화 포인트입니다:

1. **(차별화 요소 1)**: (데이터 기반 설명)
2. **(차별화 요소 2)**: (근거 제시)
3. **(차별화 요소 3)**: (강점 분석)

## ⚠️ 지속 모니터링 항목

| 항목 | 현재 수준 | 목표 | 모니터링 주기 | 담당 부서 |
|-----|---------|-----|-------------|----------|
| (모니터링 항목1) | (현재 지표) | (목표치) | 주간/월간 | (부서명) |
| (항목2) | (수치) | (목표) | (주기) | (담당) |
| (항목3) | (수치) | (목표) | (주기) | (담당) |

## 🎯 다음 달 우선 실행 과제

**1순위: (과제명)** - 완료 기한: (날짜)
- (구체적 실행 내용)

**2순위: (과제명)** - 완료 기한: (날짜)
- (구체적 실행 내용)

**3순위: (과제명)** - 완료 기한: (날짜)
- (구체적 실행 내용)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**반드시 지켜야 할 규칙:**
- 모든 섹션 완성 (생략 금지) - 마지막 섹션까지 반드시 작성
- 100% 한국어 사용 (영어 금지)
- 표는 정확한 마크다운 형식 (| 헤더 | 헤더 | 다음 줄에 |---|---|)
- 실제 리뷰에서 인용 (지어내기 금지)
- 구체적 숫자와 데이터 포함
- 각 섹션 끝에 구분선(-- 또는 ---)을 넣지 마세요
- 응답이 끊기지 않도록 모든 내용을 한 번에 완성하세요`;

  try {
    const response = await chatCompletion([
      { 
        role: "system", 
        content: "당신은 McKinsey, BCG 수준의 전략 컨설턴트이자 데이터 사이언티스트입니다. 리뷰 데이터에서 실행 가능한 비즈니스 인사이트를 도출하는 전문가입니다.\n\n**중요 규칙:**\n1. 마크다운 표는 정확히: | 헤더1 | 헤더2 |\n|-------|-------|\n| 데이터1 | 데이터2 |\n\n2. 섹션 끝에 구분선(-- 또는 ---)을 절대 사용하지 마세요\n3. 모든 섹션을 끝까지 완성하세요 (중간에 멈추지 말 것)\n4. 섹션은 ## 제목으로만 구분\n5. 모든 내용은 한국어로만 작성\n6. 구체적인 데이터와 숫자 기반 분석\n7. 응답 길이 제한 없이 완전한 리포트를 작성하세요" 
      },
      { role: "user", content: prompt },
    ], { maxTokens: 6000 });

    return { success: true, insights: response.content };
  } catch (error) {
    console.error("인사이트 생성 오류:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 부정 리뷰 필터링
 */
export async function getNegativeReviews(): Promise<ReviewData[]> {
  const reviews = await getReviewTickets();
  return reviews.filter((r) => r.rating <= 3);
}

/**
 * 키워드로 리뷰 검색
 */
export async function searchReviewsByKeyword(keyword: string): Promise<ReviewData[]> {
  const reviews = await getReviewTickets();
  const lowercaseKeyword = keyword.toLowerCase();
  
  return reviews.filter(
    (r) =>
      r.subject.toLowerCase().includes(lowercaseKeyword) ||
      r.description.toLowerCase().includes(lowercaseKeyword)
  );
}
