import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 알림 목록 조회
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { assignedPartner?: string | null };
    const userPartner = user.assignedPartner || null;
    const isHeadquarters = !userPartner;

    console.log(`\n[Notifications API] 알림 조회 요청`);
    console.log(`  사용자: ${(session.user as any).name || 'Unknown'}`);
    console.log(`  이메일: ${(session.user as any).email || 'Unknown'}`);
    console.log(`  협력사: ${userPartner || '본사'}`);
    console.log(`  본사 여부: ${isHeadquarters}`);

    // 조건: 본사는 targetType이 HEADQUARTERS인 알림, 협력사는 자신의 targetPartner인 알림
    const whereClause = isHeadquarters
      ? { targetType: "HEADQUARTERS" }
      : { targetPartner: userPartner };

    console.log(`  조회 조건:`, JSON.stringify(whereClause, null, 2));

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 50, // 최근 50개만
    });

    const unreadCount = await prisma.notification.count({
      where: {
        ...whereClause,
        isRead: false,
      },
    });

    console.log(`  조회 결과: 총 ${notifications.length}개, 읽지 않음 ${unreadCount}개\n`);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
