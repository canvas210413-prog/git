"use server";

import { prisma } from "@/lib/prisma";

/**
 * AS 접수 ID로 상세 정보를 조회합니다.
 */
export async function getAfterServiceById(id: string) {
  try {
    const afterService = await prisma.afterservice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!afterService) {
      return { success: false, error: "AS 접수 정보를 찾을 수 없습니다." };
    }

    return { success: true, data: afterService };
  } catch (error) {
    console.error("[getAfterServiceById] Error:", error);
    return { success: false, error: "AS 정보 조회 중 오류가 발생했습니다." };
  }
}