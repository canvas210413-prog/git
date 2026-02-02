import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";

// 메시지 목록 조회 (받은 메시지함, 보낸 메시지함)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("[Messages API] 인증되지 않은 요청");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "inbox"; // inbox, sent
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    console.log(`[Messages API] 사용자 ${userId}의 ${type} 메시지 조회`);

    let whereClause: any = {};

    if (type === "inbox") {
      // 받은 메시지함
      whereClause = {
        receiverId: userId,
        isDeletedByReceiver: false,
      };
    } else if (type === "sent") {
      // 보낸 메시지함
      whereClause = {
        senderId: userId,
        isDeletedBySender: false,
      };
    }

    const [messages, total, unreadCount] = await Promise.all([
      prisma.message.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: whereClause }),
      prisma.message.count({
        where: {
          receiverId: userId,
          isRead: false,
          isDeletedByReceiver: false,
        },
      }),
    ]);

    console.log(`[Messages API] 결과: 전체 ${total}건, 읽지 않음 ${unreadCount}건, 반환 ${messages.length}건`);

    return NextResponse.json(
      {
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        unreadCount,
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// 메시지 보내기
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const userName = (session.user as { name?: string }).name || "Unknown";
    const userEmail = (session.user as { email?: string }).email;

    const body = await request.json();
    const { receiverId, subject, content, priority } = body;

    if (!receiverId || !subject || !content) {
      return NextResponse.json(
        { error: "수신자, 제목, 내용은 필수입니다." },
        { status: 400 }
      );
    }

    // 수신자 정보 조회
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, email: true },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: "수신자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const message = await prisma.message.create({
      data: {
        id: createId(),
        senderId: userId,
        senderName: userName,
        senderEmail: userEmail,
        receiverId: receiver.id,
        receiverName: receiver.name || "Unknown",
        receiverEmail: receiver.email,
        subject,
        content,
        priority: priority || "NORMAL",
      },
    });

    return NextResponse.json({
      success: true,
      message: "메시지가 전송되었습니다.",
      data: message,    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// 전체 메시지 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "inbox"; // inbox, sent

    let updateData: any = {};
    let whereClause: any = {};

    if (type === "inbox") {
      // 받은 메시지함의 모든 메시지 삭제 처리
      whereClause = {
        receiverId: userId,
        isDeletedByReceiver: false,
      };
      updateData = { isDeletedByReceiver: true };
    } else if (type === "sent") {
      // 보낸 메시지함의 모든 메시지 삭제 처리
      whereClause = {
        senderId: userId,
        isDeletedBySender: false,
      };
      updateData = { isDeletedBySender: true };
    }

    const result = await prisma.message.updateMany({
      where: whereClause,
      data: updateData,
    });

    console.log(`[Messages API] ${type} 전체 삭제: ${result.count}건 삭제됨`);

    return NextResponse.json({
      success: true,
      message: `${result.count}건의 메시지가 삭제되었습니다.`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Error deleting all messages:", error);
    return NextResponse.json(
      { error: "Failed to delete all messages" },
      { status: 500 }
    );
  }
}
