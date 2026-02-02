import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const BACKUP_DIR = path.join(process.cwd(), "backups");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    
    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }
    
    // 보안: 경로 조작 방지
    const safeFilename = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safeFilename);
    
    if (!fs.existsSync(filepath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
    
    // 파일 읽기 (UTF-8)
    const fileBuffer = fs.readFileSync(filepath);
    
    // 다운로드 응답 (UTF-8 인코딩 명시)
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(safeFilename)}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[backup/download] Error:", error);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
}
