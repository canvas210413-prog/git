import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - 권한 목록 조회
export async function GET(request: NextRequest) {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ category: "asc" }, { resource: "asc" }, { action: "asc" }],
    });

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("권한 조회 실패:", error);
    return NextResponse.json({ message: "권한 조회 실패" }, { status: 500 });
  }
}
