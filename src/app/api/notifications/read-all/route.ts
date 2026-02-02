import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 모든 알림 읽음 처리
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { assignedPartner?: string | null };
    const userPartner = user.assignedPartner || null;
    const isHeadquarters = !userPartner;

    const whereClause = isHeadquarters
      ? { targetType: "HEADQUARTERS" }
      : { targetPartner: userPartner };

    await prisma.notification.updateMany({
      where: {
        ...whereClause,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}
