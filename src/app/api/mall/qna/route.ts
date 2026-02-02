import { NextResponse } from "next/server";
import { getSessionUserFromCookies } from "@/lib/mall-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const questions = await prisma.mallQnA.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    // 사용자 이름 마스킹
    const maskedQuestions = questions.map(q => ({
      ...q,
      user: {
        name: q.user.name.length > 1 
          ? q.user.name[0] + "*".repeat(q.user.name.length - 1)
          : q.user.name,
      },
    }));

    return NextResponse.json({ questions: maskedQuestions });
  } catch (error) {
    console.error("QnA GET error:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUserFromCookies();

    if (!sessionUser) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const { title, content, category, productId } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { message: "제목과 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const userId = parseInt(sessionUser.id);

    const question = await prisma.mallQnA.create({
      data: {
        title,
        content,
        category: category || "general",
        productId,
        userId,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      message: "질문이 등록되었습니다.",
      question: {
        ...question,
        user: {
          name: question.user.name.length > 1 
            ? question.user.name[0] + "*".repeat(question.user.name.length - 1)
            : question.user.name,
        },
      },
    });
  } catch (error) {
    console.error("QnA POST error:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
