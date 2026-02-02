"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================================
// FAQ 관리 서버 액션
// ============================================================================

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  orderNum: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FAQInput {
  category: string;
  question: string;
  answer: string;
  orderNum?: number;
  isActive?: boolean;
}

// 카테고리 목록
// 카테고리 목록
const FAQ_CATEGORIES_LIST = [
  "제품일반",
  "성능/효과",
  "필터관리",
  "배터리",
  "소음/작동",
  "사용법",
  "배송/주문",
  "교환/반품",
  "트러블슈팅",
  "기타문의",
  "고객경험",
];

export async function getFAQCategories(): Promise<string[]> {
  return FAQ_CATEGORIES_LIST;
}

/**
 * 모든 FAQ 조회
 */
export async function getAllFAQs(): Promise<FAQ[]> {
  const faqs = await prisma.fAQ.findMany({
    orderBy: [{ category: "asc" }, { orderNum: "asc" }],
  });
  return faqs;
}

/**
 * 카테고리별 FAQ 조회
 */
export async function getFAQsByCategory(category: string): Promise<FAQ[]> {
  const faqs = await prisma.fAQ.findMany({
    where: { category, isActive: true },
    orderBy: { orderNum: "asc" },
  });
  return faqs;
}

/**
 * 활성화된 FAQ만 조회
 */
export async function getActiveFAQs(): Promise<FAQ[]> {
  const faqs = await prisma.fAQ.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { orderNum: "asc" }],
  });
  return faqs;
}

/**
 * FAQ 검색 (질문/답변에서 검색)
 */
export async function searchFAQs(query: string): Promise<FAQ[]> {
  const faqs = await prisma.fAQ.findMany({
    where: {
      isActive: true,
      OR: [
        { question: { contains: query } },
        { answer: { contains: query } },
      ],
    },
    orderBy: [{ category: "asc" }, { orderNum: "asc" }],
  });
  return faqs;
}

/**
 * FAQ 생성
 */
export async function createFAQ(data: FAQInput): Promise<FAQ> {
  // 해당 카테고리의 마지막 orderNum 조회
  const lastFaq = await prisma.fAQ.findFirst({
    where: { category: data.category },
    orderBy: { orderNum: "desc" },
  });

  const faq = await prisma.fAQ.create({
    data: {
      category: data.category,
      question: data.question,
      answer: data.answer,
      orderNum: data.orderNum ?? (lastFaq?.orderNum ?? 0) + 1,
      isActive: data.isActive ?? true,
    },
  });

  revalidatePath("/dashboard/partners/education");
  return faq;
}

/**
 * FAQ 수정
 */
export async function updateFAQ(id: string, data: Partial<FAQInput>): Promise<FAQ> {
  const faq = await prisma.fAQ.update({
    where: { id },
    data: {
      ...(data.category && { category: data.category }),
      ...(data.question && { question: data.question }),
      ...(data.answer && { answer: data.answer }),
      ...(data.orderNum !== undefined && { orderNum: data.orderNum }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  revalidatePath("/dashboard/partners/education");
  return faq;
}

/**
 * FAQ 삭제
 */
export async function deleteFAQ(id: string): Promise<void> {
  await prisma.fAQ.delete({
    where: { id },
  });

  revalidatePath("/dashboard/partners/education");
}

/**
 * FAQ 활성화/비활성화 토글
 */
export async function toggleFAQActive(id: string): Promise<FAQ> {
  const faq = await prisma.fAQ.findUnique({ where: { id } });
  if (!faq) throw new Error("FAQ not found");

  const updated = await prisma.fAQ.update({
    where: { id },
    data: { isActive: !faq.isActive },
  });

  revalidatePath("/dashboard/partners/education");
  return updated;
}

/**
 * 카테고리별 FAQ 개수 조회
 */
export async function getFAQCountByCategory(): Promise<Record<string, number>> {
  const counts = await prisma.fAQ.groupBy({
    by: ["category"],
    _count: { id: true },
    where: { isActive: true },
  });

  const result: Record<string, number> = {};
  for (const item of counts) {
    result[item.category] = item._count.id;
  }
  return result;
}

/**
 * 챗봇용: 질문에 맞는 FAQ 찾기
 */
export async function findMatchingFAQ(query: string): Promise<FAQ | null> {
  // 먼저 정확한 질문 매칭 시도
  let faq = await prisma.fAQ.findFirst({
    where: {
      isActive: true,
      question: { contains: query },
    },
  });

  if (faq) return faq;

  // 키워드 기반 검색
  const keywords = query.split(/\s+/).filter(k => k.length >= 2);
  
  for (const keyword of keywords) {
    faq = await prisma.fAQ.findFirst({
      where: {
        isActive: true,
        OR: [
          { question: { contains: keyword } },
          { answer: { contains: keyword } },
        ],
      },
    });
    if (faq) return faq;
  }

  return null;
}

/**
 * 챗봇용: 여러 FAQ 검색 (유사도 순)
 */
export async function findMatchingFAQs(query: string, limit: number = 3): Promise<FAQ[]> {
  const keywords = query.split(/\s+/).filter(k => k.length >= 2);
  const allFaqs = await prisma.fAQ.findMany({
    where: { isActive: true },
  });

  // 간단한 키워드 매칭 점수 계산
  const scored = allFaqs.map((faq: FAQ) => {
    let score = 0;
    const text = (faq.question + " " + faq.answer).toLowerCase();
    
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += keyword.length; // 긴 키워드일수록 가중치
        if (faq.question.toLowerCase().includes(keyword.toLowerCase())) {
          score += 5; // 질문에 포함되면 추가 점수
        }
      }
    }
    
    return { faq, score };
  });

  return scored
    .filter((s: { faq: FAQ; score: number }) => s.score > 0)
    .sort((a: { faq: FAQ; score: number }, b: { faq: FAQ; score: number }) => b.score - a.score)
    .slice(0, limit)
    .map((s: { faq: FAQ; score: number }) => s.faq);
}
