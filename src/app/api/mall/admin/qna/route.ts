import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Q&A 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { user: { name: { contains: search } } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (category && category !== "all") {
      where.category = category;
    }

    const [qnas, total] = await Promise.all([
      prisma.mallQnA.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { status: "asc" }, // pending 먼저
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.mallQnA.count({ where }),
    ]);

    // 프론트엔드 호환성을 위해 subject, authorName 필드 추가
    const qnasWithCompat = qnas.map((qna) => ({
      ...qna,
      subject: qna.title, // title을 subject로도 제공
      authorName: qna.user?.name || "비회원",
      authorEmail: qna.user?.email || null,
      isPrivate: false, // 기본값
    }));

    return NextResponse.json({
      qnas: qnasWithCompat,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch qnas:", error);
    return NextResponse.json(
      { error: "Q&A 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
