import { NextRequest, NextResponse } from "next/server";
import { moveAllASToTrash } from "@/app/actions/trash";

/**
 * AS 전체 삭제 (휴지통으로 이동)
 * DELETE /api/after-service/delete-all
 * 모든 AS 데이터를 휴지통으로 이동합니다 (30일 후 영구 삭제)
 */
export async function DELETE(request: NextRequest) {
  try {
    // 모든 AS 데이터를 휴지통으로 이동
    const result = await moveAllASToTrash(undefined, undefined, "전체 삭제");

    if (result.success) {
      return NextResponse.json({
        success: true,
        count: result.data?.movedCount || 0,
        message: `${result.data?.movedCount || 0}건의 AS 데이터가 휴지통으로 이동되었습니다.`,
      });
    } else {
      return NextResponse.json(
        { error: result.error?.message || "휴지통 이동 실패" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("AS 전체 삭제 오류:", error);
    return NextResponse.json(
      { error: "AS 전체 삭제 실패", details: String(error) },
      { status: 500 }
    );
  }
}
