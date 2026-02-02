import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 메시지 수신자 목록 (사용자 목록) 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    // 현재 사용자를 제외한 모든 활성 사용자 조회
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true,
        ...(search && {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedPartner: true,
      },
      orderBy: [
        { name: "asc" }
      ],
      take: 100, // 제한을 늘려서 더 많은 사용자 표시
    });

    // 역할별로 정렬 (관리자가 상위에 오도록)
    const roleOrder: Record<string, number> = {
      'SUPER_ADMIN': 1,
      'ADMIN': 2,
      'MANAGER': 3,
      'PARTNER': 4,
      'USER': 5,
      'VIEWER': 6
    };

    const sortedUsers = users.sort((a, b) => {
      const roleA = roleOrder[a.role] || 99;
      const roleB = roleOrder[b.role] || 99;
      if (roleA !== roleB) return roleA - roleB;
      return (a.name || '').localeCompare(b.name || '', 'ko-KR');
    });

    return NextResponse.json(sortedUsers, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
