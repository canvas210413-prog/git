import { NextResponse } from "next/server";
import { getStockLogs } from "@/app/actions/inventory";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const partId = searchParams.get("partId");
    const limit = parseInt(searchParams.get("limit") || "100");

    const logs = await getStockLogs(partId || undefined, limit);

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("재고 로그 조회 오류:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
