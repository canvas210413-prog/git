import { NextRequest, NextResponse } from "next/server";
import { createBackup } from "@/app/actions/backup";

// 자동 백업 트리거 API
// cron job이나 외부 스케줄러에서 호출
export async function POST(request: NextRequest) {
  try {
    // API 키 검증 (선택적)
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.BACKUP_API_KEY;
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json().catch(() => ({}));
    const type = body.type === "auto" ? "auto" : "manual";
    
    const result = await createBackup(type);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        backup: result.backup,
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[backup/trigger] Error:", error);
    return NextResponse.json(
      { error: "Backup trigger failed" },
      { status: 500 }
    );
  }
}
