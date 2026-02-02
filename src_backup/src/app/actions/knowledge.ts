"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * 모든 지식 문서 조회
 */
export async function getArticles(category?: string) {
  try {
    const articles = await prisma.knowledgeArticle.findMany({
      where: category ? { category } : undefined,
      orderBy: [
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    return articles;
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    throw error;
  }
}

/**
 * 특정 문서 조회
 */
export async function getArticleById(id: string) {
  try {
    const article = await prisma.knowledgeArticle.findUnique({
      where: { id },
    });

    return article;
  } catch (error) {
    console.error("Failed to fetch article:", error);
    throw error;
  }
}

/**
 * 지식 문서 통계 조회
 */
export async function getArticleStats() {
  try {
    const [total, faq, manual, guide] = await Promise.all([
      prisma.knowledgeArticle.count(),
      prisma.knowledgeArticle.count({ where: { category: "FAQ" } }),
      prisma.knowledgeArticle.count({ where: { category: "제품 매뉴얼" } }),
      prisma.knowledgeArticle.count({ where: { category: "사용 가이드" } }),
    ]);

    return { total, faq, manual, guide };
  } catch (error) {
    console.error("Failed to fetch article stats:", error);
    return { total: 0, faq: 0, manual: 0, guide: 0 };
  }
}

/**
 * 지식 문서 생성
 */
export async function createArticle(data: {
  title: string;
  content: string;
  category: string;
  tags?: string;
  authorId?: string;
}) {
  try {
    const article = await prisma.knowledgeArticle.create({
      data,
    });

    revalidatePath("/dashboard/knowledge");
    return { success: true, article };
  } catch (error) {
    console.error("Failed to create article:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 지식 문서 수정
 */
export async function updateArticle(
  id: string,
  data: {
    title?: string;
    content?: string;
    category?: string;
    tags?: string;
  }
) {
  try {
    const article = await prisma.knowledgeArticle.update({
      where: { id },
      data,
    });

    revalidatePath("/dashboard/knowledge");
    return { success: true, article };
  } catch (error) {
    console.error("Failed to update article:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 지식 문서 삭제
 */
export async function deleteArticle(id: string) {
  try {
    await prisma.knowledgeArticle.delete({
      where: { id },
    });

    revalidatePath("/dashboard/knowledge");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete article:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 키워드로 문서 검색
 */
export async function searchArticles(keyword: string) {
  try {
    const articles = await prisma.knowledgeArticle.findMany({
      where: {
        OR: [
          { title: { contains: keyword } },
          { content: { contains: keyword } },
          { tags: { contains: keyword } },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });

    return articles;
  } catch (error) {
    console.error("Failed to search articles:", error);
    throw error;
  }
}
