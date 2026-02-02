import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// 파일 업로드 제한
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_FILE_TYPES = {
  // 비디오
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "video/x-msvideo": ".avi",
  "video/avi": ".avi",
  "video/x-ms-wmv": ".wmv",
  "video/x-flv": ".flv",
  "video/3gpp": ".3gp",
  "video/x-matroska": ".mkv",
  // 이미지
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "image/bmp": ".bmp",
  // 문서
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/zip": ".zip",
  "application/x-rar-compressed": ".rar",
};

// 지원 파일 형식 가이드
const FILE_TYPE_GUIDE = {
  비디오: "MP4, AVI, MOV, WMV, WebM, FLV, MKV, 3GP",
  이미지: "JPG, PNG, GIF, WebP, SVG, BMP",
  문서: "PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV",
  압축: "ZIP, RAR",
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "파일이 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 업로드 가능합니다.` },
        { status: 400 }
      );
    }

    // 파일 타입 및 확장자 추출
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isAllowedByMimeType = ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES];
    const isAllowedByExtension = fileExt && Object.values(ALLOWED_FILE_TYPES).some(ext => ext === `.${fileExt}`);
    
    if (!isAllowedByMimeType && !isAllowedByExtension) {
      return NextResponse.json(
        { 
          error: `지원하지 않는 파일 형식입니다.\n\n지원 형식:\n${Object.entries(FILE_TYPE_GUIDE).map(([k, v]) => `• ${k}: ${v}`).join('\n')}`,
          supportedFormats: FILE_TYPE_GUIDE
        },
        { status: 400 }
      );
    }

    // 업로드 디렉토리 생성
    const uploadDir = path.join(process.cwd(), "public", "uploads", "education");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 고유한 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const ext = ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES] || `.${fileExt}`;
    const fileName = `${timestamp}-${randomString}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL 반환
    const fileUrl = `/uploads/education/${fileName}`;

    return NextResponse.json({
      success: true,
      data: {
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      },
    });
  } catch (error) {
    console.error("파일 업로드 실패:", error);
    return NextResponse.json(
      { error: "파일 업로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
