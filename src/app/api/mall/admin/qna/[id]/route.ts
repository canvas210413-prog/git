import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Q&A 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const qna = await prisma.mallQnA.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!qna) {
      return NextResponse.json(
        { error: "문의를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(qna);
  } catch (error) {
    console.error("Failed to fetch qna:", error);
    return NextResponse.json(
      { error: "문의 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// Q&A 수정 (답변 작성 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { answer, status, answeredBy } = body;

    const updateData: any = {};
    
    if (answer !== undefined) {
      updateData.answer = answer;
      updateData.answeredAt = new Date();
    }
    
    if (status) {
      updateData.status = status;
    }
    
    if (answeredBy) {
      updateData.answeredBy = answeredBy;
    }

    const qna = await prisma.mallQnA.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(qna);
  } catch (error) {
    console.error("Failed to update qna:", error);
    return NextResponse.json(
      { error: "문의 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// Q&A 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.mallQnA.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete qna:", error);
    return NextResponse.json(
      { error: "문의 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
