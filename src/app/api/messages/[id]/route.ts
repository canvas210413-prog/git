import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 메시지 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json(
        { error: "메시지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인 (발신자 또는 수신자만 조회 가능)
    if (message.senderId !== userId && message.receiverId !== userId) {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 수신자가 조회하면 읽음 처리
    if (message.receiverId === userId && !message.isRead) {
      await prisma.message.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      message.isRead = true;
      message.readAt = new Date();
    }

    return NextResponse.json(message, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    );
  }
}

// 메시지 읽음 처리 / 삭제
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { id } = await params;
    const body = await request.json();
    const { action } = body; // "read", "delete"

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json(
        { error: "메시지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (action === "read") {
      // 읽음 처리
      if (message.receiverId !== userId) {
        return NextResponse.json(
          { error: "권한이 없습니다." },
          { status: 403 }
        );
      }

      await prisma.message.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "읽음 처리되었습니다.",
      });
    } else if (action === "delete") {
      // 삭제 처리 (발신자/수신자 각각 삭제)
      const updateData: any = {};

      if (message.senderId === userId) {
        updateData.isDeletedBySender = true;
      }
      if (message.receiverId === userId) {
        updateData.isDeletedByReceiver = true;
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: "권한이 없습니다." },
          { status: 403 }
        );
      }

      await prisma.message.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: "삭제되었습니다.",
      }, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}
