"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ============================================================================
// Types
// ============================================================================

export interface EducationMaterial {
  id: string;
  title: string;
  description: string | null;
  category: string;
  type: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  views: number;
  downloads: number;
  isPublished: boolean;
  isPinned: boolean;
  targetPartner: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaterialInput {
  title: string;
  description?: string;
  category: string;
  type: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  duration?: number;
  isPublished?: boolean;
  isPinned?: boolean;
  targetPartner?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    return {
      id: (session.user as any).id,
      name: session.user.name || "Unknown",
      assignedPartner: (session.user as any).assignedPartner,
    };
  } catch (error) {
    console.error("세션 조회 실패:", error);
    return null;
  }
}

// ============================================================================
// Actions
// ============================================================================

/**
 * 교육 자료 목록 조회
 */
export async function getEducationMaterials(
  category?: string,
  type?: string
) {
  try {
    const user = await getCurrentUser();
    
    const whereCondition: any = {
      isPublished: true,
    };
    
    // 협력사 사용자는 본인 협력사 또는 전체 공개 자료만 조회
    if (user?.assignedPartner) {
      whereCondition.OR = [
        { targetPartner: null },
        { targetPartner: user.assignedPartner },
      ];
    }
    
    if (category && category !== "all") {
      whereCondition.category = category;
    }
    
    if (type && type !== "all") {
      whereCondition.type = type;
    }
    
    const materials = await prisma.educationMaterial.findMany({
      where: whereCondition,
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
    });
    
    return {
      success: true,
      data: materials,
    };
  } catch (error) {
    console.error("교육 자료 조회 실패:", error);
    return {
      success: false,
      error: "교육 자료를 가져오는데 실패했습니다.",
    };
  }
}

/**
 * 교육 자료 생성
 */
export async function createEducationMaterial(input: CreateMaterialInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "로그인이 필요합니다.",
      };
    }
    
    const material = await prisma.educationMaterial.create({
      data: {
        ...input,
        createdBy: user.id,
        createdByName: user.name,
      },
    });
    
    return {
      success: true,
      data: material,
    };
  } catch (error) {
    console.error("교육 자료 생성 실패:", error);
    return {
      success: false,
      error: "교육 자료 생성에 실패했습니다.",
    };
  }
}

/**
 * 교육 자료 수정
 */
export async function updateEducationMaterial(
  id: string,
  input: Partial<CreateMaterialInput>
) {
  try {
    const material = await prisma.educationMaterial.update({
      where: { id },
      data: input,
    });
    
    return {
      success: true,
      data: material,
    };
  } catch (error) {
    console.error("교육 자료 수정 실패:", error);
    return {
      success: false,
      error: "교육 자료 수정에 실패했습니다.",
    };
  }
}

/**
 * 교육 자료 삭제
 */
export async function deleteEducationMaterial(id: string) {
  try {
    await prisma.educationMaterial.delete({
      where: { id },
    });
    
    return {
      success: true,
    };
  } catch (error) {
    console.error("교육 자료 삭제 실패:", error);
    return {
      success: false,
      error: "교육 자료 삭제에 실패했습니다.",
    };
  }
}

/**
 * 조회수 증가
 */
export async function incrementViews(id: string) {
  try {
    await prisma.educationMaterial.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error("조회수 증가 실패:", error);
    return { success: false };
  }
}

/**
 * 다운로드 수 증가
 */
export async function incrementDownloads(id: string) {
  try {
    await prisma.educationMaterial.update({
      where: { id },
      data: {
        downloads: {
          increment: 1,
        },
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error("다운로드 수 증가 실패:", error);
    return { success: false };
  }
}

/**
 * 카테고리 목록 조회
 */
export async function getCategories() {
  try {
    const materials = await prisma.educationMaterial.findMany({
      select: { category: true },
      distinct: ["category"],
    });
    
    return {
      success: true,
      data: materials.map(m => m.category),
    };
  } catch (error) {
    console.error("카테고리 조회 실패:", error);
    return {
      success: false,
      error: "카테고리를 가져오는데 실패했습니다.",
    };
  }
}
