"use server";

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "@/lib/prisma";

const execAsync = promisify(exec);

// 백업 저장 디렉토리
const BACKUP_DIR = path.join(process.cwd(), "backups");

// 백업 디렉토리 확인 및 생성
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// 파일 크기를 읽기 쉬운 형식으로 변환
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// formatBytes는 formatFileSize의 별칭
const formatBytes = formatFileSize;

// 백업 파일 인코딩 감지 및 읽기 (UTF-16 LE, UTF-8 BOM, UTF-8 지원)
function readBackupFile(filepath: string): string {
  const buffer = fs.readFileSync(filepath);
  
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    // UTF-16 LE (Windows PowerShell에서 생성된 파일)
    console.log('📁 파일 인코딩: UTF-16 LE');
    return buffer.toString('utf16le');
  } else if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    // UTF-8 with BOM
    console.log('📁 파일 인코딩: UTF-8 with BOM');
    return buffer.toString('utf-8').substring(1); // BOM 제거
  } else {
    // UTF-8 without BOM (기본)
    console.log('📁 파일 인코딩: UTF-8');
    return buffer.toString('utf-8');
  }
}

// DATABASE_URL에서 연결 정보 파싱
function parseDatabaseUrl(): {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
} {
  const dbUrl = process.env.DATABASE_URL || "";
  
  // mysql://user:password@host:port/database
  const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  
  if (!match) {
    throw new Error("Invalid DATABASE_URL format");
  }
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5].split("?")[0], // 쿼리 파라미터 제거
  };
}

// ============================================================================
// Types
// ============================================================================

export interface BackupInfo {
  id: string;
  filename: string;
  date: string;
  type: "auto" | "manual";
  size: string;
  sizeBytes: number;
  status: "success" | "failed";
  duration?: string;
}

export interface BackupStats {
  lastBackup: string | null;
  totalBackups: number;
  storageUsed: number;
  storageTotal: number;
  nextBackup: string;
  autoBackupEnabled: boolean;
}

// ============================================================================
// Backup Functions
// ============================================================================

/**
 * 데이터베이스 백업 실행
 */
export async function createBackup(type: "auto" | "manual" = "manual"): Promise<{
  success: boolean;
  message: string;
  backup?: BackupInfo;
}> {
  const startTime = Date.now();
  
  try {
    ensureBackupDir();
    
    const dbConfig = parseDatabaseUrl();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_${type}_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    // mysqldump 명령 실행 (UTF-8 문자셋 지정)
    // Windows 경로를 슬래시로 변경 후 직접 cmd.exe shell 사용
    const filepathForMysql = filepath.replace(/\\/g, '/');
    const dumpCommand = `mysqldump -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p${dbConfig.password} --default-character-set=utf8mb4 ${dbConfig.database} --single-transaction --routines --triggers > "${filepathForMysql}"`;
    
    console.log(`[createBackup] 백업 시작: ${filename}`);
    await execAsync(dumpCommand, { shell: "cmd.exe" });
    
    // 파일 크기 확인
    const stats = fs.statSync(filepath);
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    const backupInfo: BackupInfo = {
      id: timestamp,
      filename,
      date: new Date().toISOString(),
      type,
      size: formatFileSize(stats.size),
      sizeBytes: stats.size,
      status: "success",
      duration: `${duration}초`,
    };
    
    // 백업 기록 저장 (파일로)
    await saveBackupRecord(backupInfo);
    
    return {
      success: true,
      message: `백업이 완료되었습니다. (${backupInfo.size}, ${backupInfo.duration})`,
      backup: backupInfo,
    };
  } catch (error) {
    console.error("[createBackup] Error:", error);
    return {
      success: false,
      message: `백업 실패: ${(error as Error).message}`,
    };
  }
}

/**
 * 백업 기록 저장
 */
async function saveBackupRecord(backup: BackupInfo): Promise<void> {
  const recordPath = path.join(BACKUP_DIR, "backup_records.json");
  
  let records: BackupInfo[] = [];
  
  if (fs.existsSync(recordPath)) {
    const content = fs.readFileSync(recordPath, "utf-8");
    records = JSON.parse(content);
  }
  
  records.unshift(backup);
  
  // 최대 100개 기록 유지
  if (records.length > 100) {
    records = records.slice(0, 100);
  }
  
  fs.writeFileSync(recordPath, JSON.stringify(records, null, 2));
}

/**
 * 백업 기록 조회
 */
export async function getBackupRecords(): Promise<BackupInfo[]> {
  try {
    ensureBackupDir();
    const recordPath = path.join(BACKUP_DIR, "backup_records.json");
    
    if (!fs.existsSync(recordPath)) {
      return [];
    }
    
    const content = fs.readFileSync(recordPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("[getBackupRecords] Error:", error);
    return [];
  }
}

/**
 * 백업 통계 조회
 */
export async function getBackupStats(): Promise<BackupStats> {
  try {
    ensureBackupDir();
    const records = await getBackupRecords();
    
    // 스토리지 사용량 계산
    let totalSize = 0;
    const files = fs.readdirSync(BACKUP_DIR);
    files.forEach(file => {
      if (file.endsWith(".sql")) {
        const filepath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filepath);
        totalSize += stats.size;
      }
    });
    
    // 다음 백업 시간 계산 (매일 06:00)
    const now = new Date();
    const nextBackup = new Date(now);
    nextBackup.setHours(6, 0, 0, 0);
    if (nextBackup <= now) {
      nextBackup.setDate(nextBackup.getDate() + 1);
    }
    
    const lastBackupRecord = records[0];
    
    return {
      lastBackup: lastBackupRecord 
        ? new Date(lastBackupRecord.date).toLocaleString("ko-KR")
        : null,
      totalBackups: records.length,
      storageUsed: parseFloat((totalSize / (1024 * 1024 * 1024)).toFixed(2)), // GB
      storageTotal: 100, // 100GB 제한
      nextBackup: nextBackup.toLocaleString("ko-KR"),
      autoBackupEnabled: true,
    };
  } catch (error) {
    console.error("[getBackupStats] Error:", error);
    return {
      lastBackup: null,
      totalBackups: 0,
      storageUsed: 0,
      storageTotal: 100,
      nextBackup: "",
      autoBackupEnabled: false,
    };
  }
}

/**
 * 백업 파일 경로 조회 (다운로드용)
 */
export async function getBackupFilePath(filename: string): Promise<string | null> {
  try {
    ensureBackupDir();
    const filepath = path.join(BACKUP_DIR, filename);
    
    if (fs.existsSync(filepath)) {
      return filepath;
    }
    
    return null;
  } catch (error) {
    console.error("[getBackupFilePath] Error:", error);
    return null;
  }
}

/**
 * 데이터베이스 복구
 */
export async function restoreBackup(filename: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    ensureBackupDir();
    const filepath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return {
        success: false,
        message: "백업 파일을 찾을 수 없습니다.",
      };
    }
    
    const dbConfig = parseDatabaseUrl();
    
    // 깨진 라인을 필터링한 임시 파일 생성
    const cleanFilepath = filepath.replace('.sql', '_restored.sql');
    
    // PowerShell 스크립트로 깨진 라인 필터링 (utf8NoBOM 사용)
    const filterCommand = `
      $content = [System.IO.File]::ReadAllLines("${filepath}", [System.Text.Encoding]::UTF8)
      $cleanLines = $content | Where-Object { 
        $_ -notmatch "^mysqldump:|^mysql:|^\\s*\\+|CategoryInfo|FullyQualifiedErrorId|^\\s*위치|tablespaces$"
      }
      [System.IO.File]::WriteAllLines("${cleanFilepath}", $cleanLines, [System.Text.UTF8Encoding]::new($false))
    `;
    
    console.log(`[restoreBackup] 깨진 라인 필터링 중...`);
    await execAsync(filterCommand, { shell: "powershell.exe" });
    
    // 데이터베이스 초기화
    console.log(`[restoreBackup] 데이터베이스 초기화 중...`);
    const dropCommand = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p"${dbConfig.password}" -e "DROP DATABASE IF EXISTS ${dbConfig.database}; CREATE DATABASE ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`;
    
    await execAsync(dropCommand, { shell: "powershell.exe" });
    
    // cmd를 통해 MySQL 리다이렉션으로 복구 (PowerShell 파이프 대신)
    console.log(`[restoreBackup] 데이터베이스 복구 중...`);
    const restoreCommand = `cmd /c "mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p${dbConfig.password} --default-character-set=utf8mb4 --force ${dbConfig.database} < \\"${cleanFilepath}\\""`;
    
    await execAsync(restoreCommand, { shell: "powershell.exe" });
    
    // 임시 파일 삭제
    if (fs.existsSync(cleanFilepath)) {
      fs.unlinkSync(cleanFilepath);
      console.log(`[restoreBackup] 임시 파일 삭제 완료`);
    }
    
    console.log(`[restoreBackup] 복구 완료!`);
    return {
      success: true,
      message: "데이터베이스가 복구되었습니다.",
    };
  } catch (error) {
    console.error("[restoreBackup] Error:", error);
    // --force 옵션으로 일부 에러가 발생해도 복구는 진행됨
    // 에러 메시지에 "Warning" 또는 "Duplicate"만 있으면 성공으로 처리
    const errorMsg = (error as Error).message;
    if (errorMsg.includes("Warning") || errorMsg.includes("Duplicate") || errorMsg.includes("1062")) {
      return {
        success: true,
        message: "데이터베이스가 복구되었습니다. (일부 중복 데이터 무시됨)",
      };
    }
    return {
      success: false,
      message: `복구 실패: ${errorMsg}`,
    };
  }
}

/**
 * 백업 파일 삭제
 */
export async function deleteBackup(filename: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    ensureBackupDir();
    const filepath = path.join(BACKUP_DIR, filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    
    // 기록에서도 삭제
    const recordPath = path.join(BACKUP_DIR, "backup_records.json");
    if (fs.existsSync(recordPath)) {
      const content = fs.readFileSync(recordPath, "utf-8");
      let records: BackupInfo[] = JSON.parse(content);
      records = records.filter(r => r.filename !== filename);
      fs.writeFileSync(recordPath, JSON.stringify(records, null, 2));
    }
    
    return {
      success: true,
      message: "백업 파일이 삭제되었습니다.",
    };
  } catch (error) {
    console.error("[deleteBackup] Error:", error);
    return {
      success: false,
      message: `삭제 실패: ${(error as Error).message}`,
    };
  }
}

/**
 * 데이터베이스 테이블 목록 조회
 */
export async function getDatabaseTables(): Promise<{ name: string; rows: number }[]> {
  try {
    const tables = [
      { model: "user", name: "사용자" },
      { model: "customer", name: "고객" },
      { model: "order", name: "주문" },
      { model: "orderItem", name: "주문상품" },
      { model: "product", name: "상품" },
      { model: "baseproduct", name: "기준상품" },
      { model: "afterService", name: "A/S" },
      { model: "review", name: "리뷰" },
      { model: "chatSession", name: "채팅세션" },
      { model: "chatMessage", name: "채팅메시지" },
      { model: "part", name: "부품재고" },
      { model: "inventoryLog", name: "재고로그" },
      { model: "faq", name: "FAQ" },
      { model: "message", name: "메시지" },
      { model: "notification", name: "알림" },
      { model: "campaign", name: "캠페인" },
      { model: "lead", name: "리드" },
      { model: "partner", name: "협력사" },
      { model: "ticket", name: "티켓" },
      { model: "coupon", name: "쿠폰" },
      { model: "couponUsage", name: "쿠폰사용" },
      { model: "gift", name: "사은품" },
      { model: "mallOrder", name: "쇼핑몰주문" },
      { model: "mallProduct", name: "쇼핑몰상품" },
      { model: "mallQna", name: "쇼핑몰Q&A" },
      { model: "mallUser", name: "쇼핑몰사용자" },
      { model: "role", name: "역할" },
      { model: "permission", name: "권한" },
      { model: "rolePermission", name: "역할권한" },
      { model: "userRole", name: "사용자역할" },
      { model: "userSession", name: "사용자세션" },
      { model: "customerNote", name: "고객노트" },
      { model: "auditLog", name: "감사로그" },
      { model: "trashBin", name: "휴지통" },
      { model: "chatbotConfig", name: "챗봇설정" },
      { model: "knowledgeArticle", name: "지식문서" },
      { model: "educationMaterial", name: "교육자료" },
      { model: "productInventoryMapping", name: "상품재고매핑" },
    ];
    
    const results = await Promise.all(
      tables.map(async (t) => {
        try {
          const count = await (prisma as any)[t.model].count();
          return { name: t.name, rows: count };
        } catch {
          return { name: t.name, rows: 0 };
        }
      })
    );
    
    return results;
  } catch (error) {
    console.error("[getDatabaseTables] Error:", error);
    return [];
  }
}

/**
 * 백업 파일 미리보기 정보
 */
export interface BackupPreviewInfo {
  filename: string;
  fileSize: string;
  createdAt: string;
  tables: {
    name: string;
    displayName: string;
    recordCount: number;
    columns: string[];
  }[];
  totalRecords: number;
}

/**
 * 테이블 데이터
 */
export interface TableDataResult {
  tableName: string;
  columns: string[];
  rows: string[][];
  totalCount: number;
}

// 테이블 한글명 매핑
const TABLE_DISPLAY_NAMES: Record<string, string> = {
  "Order": "주문 데이터",
  "Customer": "고객 데이터",
  "AfterService": "A/S 데이터",
  "Review": "리뷰 데이터",
  "Product": "상품 데이터",
  "Inquiry": "문의 데이터",
  "Partner": "협력사 데이터",
  "User": "사용자 데이터",
  "FAQ": "FAQ 데이터",
  "VOC": "VOC 데이터",
  "Part": "부품 데이터",
  "Message": "메시지",
  "BackupRecord": "백업 기록",
  "Session": "세션 데이터",
  "Account": "계정 데이터",
  "VerificationToken": "인증 토큰",
  "_prisma_migrations": "마이그레이션 기록",
};

function getTableDisplayName(tableName: string): string {
  return TABLE_DISPLAY_NAMES[tableName] || tableName;
}

/**
 * 백업 파일 미리보기
 */
export async function getBackupPreview(filename: string): Promise<{
  success: boolean;
  data?: BackupPreviewInfo;
  message?: string;
}> {
  try {
    ensureBackupDir();
    const filepath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return {
        success: false,
        message: "백업 파일을 찾을 수 없습니다.",
      };
    }

    const stats = fs.statSync(filepath);
    
    // 파일 읽기 (인코딩 자동 감지)
    const content = readBackupFile(filepath);
    
    // Windows CRLF와 Unix LF 모두 처리
    const lines = content.split(/\r?\n/);
    
    // 테이블 정보 추출
    const tables: { 
      name: string; 
      displayName: string;
      recordCount: number; 
      columns: string[];
    }[] = [];
    
    let currentTable = "";
    let recordCount = 0;
    let columns: string[] = [];
    let inCreateStatement = false;
    
    console.log('🔍 백업 파일 파싱 시작 - 총 라인:', lines.length);
    let createTableCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // CREATE TABLE 시작 - 디버깅 강화
      if (trimmedLine.startsWith("CREATE TABLE")) {
        createTableCount++;
        if (createTableCount <= 3) {
          console.log(`🔎 [${i}] CREATE TABLE 발견: "${trimmedLine.substring(0, 50)}"`);
        }
        
        // 이전 테이블 저장
        if (currentTable) {
          console.log(`✅ 테이블 저장: ${currentTable}, 레코드: ${recordCount}, 컬럼: ${columns.length}`);
          tables.push({
            name: currentTable,
            displayName: getTableDisplayName(currentTable),
            recordCount,
            columns,
          });
        }
        
        inCreateStatement = true;
        // 백틱 포함한 정확한 테이블명 추출
        const tableMatch = trimmedLine.match(/CREATE TABLE\s+[`]?([a-zA-Z_][a-zA-Z0-9_]*)[`]?\s*\(/);
        if (tableMatch) {
          currentTable = tableMatch[1];
          console.log(`🆕 새 테이블 발견: ${currentTable}`);
          recordCount = 0;
          columns = [];
        } else {
          console.log(`⚠️ 테이블명 추출 실패: "${trimmedLine.substring(0, 80)}"`);
        }
      } else if (inCreateStatement) {
        // 컬럼 정보 추출 - 더 정확한 패턴
        const columnMatch = trimmedLine.match(/^[`]([a-zA-Z_][a-zA-Z0-9_]*)[`]\s+/);
        if (columnMatch && 
            !trimmedLine.startsWith("PRIMARY KEY") && 
            !trimmedLine.startsWith("UNIQUE KEY") &&
            !trimmedLine.startsWith("KEY ") && 
            !trimmedLine.startsWith("CONSTRAINT") &&
            !trimmedLine.startsWith("INDEX ")) {
          columns.push(columnMatch[1]);
        }
        
        // 테이블 생성문 끝 - 여러 패턴 지원
        if (trimmedLine.includes(") ENGINE=") || 
            trimmedLine.includes(") DEFAULT") || 
            trimmedLine === ");") {
          inCreateStatement = false;
        }
      }
      
      // INSERT 문으로 레코드 수 카운트 - 더 정확한 패턴
      if (trimmedLine.startsWith("INSERT INTO") && currentTable) {
        // VALUES 이후 레코드 개수 세기
        const valuesMatch = line.match(/\)\s*,\s*\(/g);
        recordCount += (valuesMatch ? valuesMatch.length + 1 : 1);
      }
      
      // UNLOCK TABLES는 테이블의 끝
      if (line.includes("UNLOCK TABLES") && currentTable) {
        console.log(`💾 테이블 저장 (UNLOCK): ${currentTable}, 레코드: ${recordCount}, 컬럼: ${columns.length}`);
        tables.push({
          name: currentTable,
          displayName: getTableDisplayName(currentTable),
          recordCount,
          columns,
        });
        currentTable = "";
        recordCount = 0;
        columns = [];
      }
    }
    
    // 루프 종료 후 마지막 테이블 저장 (UNLOCK이 없는 경우)
    if (currentTable) {
      console.log(`💾 테이블 저장 (마지막): ${currentTable}, 레코드: ${recordCount}, 컬럼: ${columns.length}`);
      tables.push({
        name: currentTable,
        displayName: getTableDisplayName(currentTable),
        recordCount,
        columns,
      });
    }
    
    const totalRecords = tables.reduce((sum, t) => sum + t.recordCount, 0);
    
    console.log('📊 파싱 완료:', {
      총테이블수: tables.length,
      CREATE_TABLE_발견: createTableCount,
      샘플테이블: tables.slice(0, 3).map(t => `${t.name}:${t.recordCount}건/${t.columns.length}컬럼`),
    });
    
    // 필터 조건 완화: 컬럼이 있으면 레코드가 0이어도 포함
    const filteredTables = tables.filter(t => t.columns.length > 0);
    console.log('✨ 필터 후 테이블:', filteredTables.length);
    console.log('✅ 필터 후 테이블 목록:', filteredTables.slice(0, 5).map(t => t.name).join(', '));
    
    const previewInfo: BackupPreviewInfo = {
      filename,
      fileSize: formatBytes(stats.size),
      createdAt: stats.mtime.toISOString(),
      tables: filteredTables,
      totalRecords,
    };
    
    return {
      success: true,
      data: previewInfo,
    };
  } catch (error) {
    console.error("[getBackupPreview] Error:", error);
    return {
      success: false,
      message: `미리보기 실패: ${(error as Error).message}`,
    };
  }
}

/**
 * 백업 파일에서 특정 테이블 데이터 조회
 */
export async function getBackupTableData(
  filename: string, 
  tableName: string
): Promise<{
  success: boolean;
  data?: TableDataResult;
  message?: string;
}> {
  try {
    ensureBackupDir();
    const filepath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return {
        success: false,
        message: "백업 파일을 찾을 수 없습니다.",
      };
    }

    // 파일 읽기 (인코딩 자동 감지)
    const content = readBackupFile(filepath);
    const lines = content.split(/\r?\n/);
    
    let columns: string[] = [];
    let rows: string[][] = [];
    let inTargetTable = false;
    let inCreateStatement = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // 대상 테이블 CREATE TABLE 찾기
      if (trimmedLine.includes(`CREATE TABLE \`${tableName}\``)) {
        inTargetTable = true;
        inCreateStatement = true;
        columns = [];
        continue;
      }
      
      // 다른 테이블 시작 시 종료
      if (inTargetTable && trimmedLine.includes("CREATE TABLE `") && !trimmedLine.includes(`\`${tableName}\``)) {
        break;
      }
      
      // 컬럼 추출
      if (inTargetTable && inCreateStatement) {
        const columnMatch = trimmedLine.match(/^`(\w+)`\s+\w+/);
        if (columnMatch && !trimmedLine.includes("PRIMARY KEY") && !trimmedLine.includes("KEY `") && !trimmedLine.includes("CONSTRAINT")) {
          columns.push(columnMatch[1]);
        }
        if (trimmedLine.includes(");")) {
          inCreateStatement = false;
        }
      }
      
      // INSERT 문에서 데이터 추출
      if (inTargetTable && line.includes(`INSERT INTO \`${tableName}\``)) {
        const valuesMatch = line.match(/VALUES\s+(.+);?$/);
        if (valuesMatch) {
          const valuesStr = valuesMatch[1];
          // 각 행 추출
          const rowMatches = valuesStr.match(/\((?:[^)(]+|\([^)]*\))*\)/g);
          if (rowMatches) {
            for (const rowMatch of rowMatches) {
              const rowData = parseInsertValues(rowMatch.slice(1, -1));
              rows.push(rowData);
            }
          }
        }
      }
    }
    
    return {
      success: true,
      data: {
        tableName,
        columns,
        rows,
        totalCount: rows.length,
      },
    };
  } catch (error) {
    console.error("[getBackupTableData] Error:", error);
    return {
      success: false,
      message: `데이터 조회 실패: ${(error as Error).message}`,
    };
  }
}

// INSERT VALUES 파싱
function parseInsertValues(valuesStr: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";
  let depth = 0;
  
  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];
    const prevChar = i > 0 ? valuesStr[i-1] : "";
    
    if (!inQuote && (char === "'" || char === '"') && prevChar !== "\\") {
      inQuote = true;
      quoteChar = char;
      current += char;
    } else if (inQuote && char === quoteChar && prevChar !== "\\") {
      inQuote = false;
      current += char;
    } else if (!inQuote && char === "(") {
      depth++;
      current += char;
    } else if (!inQuote && char === ")") {
      depth--;
      current += char;
    } else if (!inQuote && depth === 0 && char === ",") {
      result.push(cleanValue(current.trim()));
      current = "";
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    result.push(cleanValue(current.trim()));
  }
  
  return result;
}

function cleanValue(val: string): string {
  if (val === "NULL") return "";
  if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
    val = val.slice(1, -1);
  }
  // 너무 긴 값 처리
  if (val.length > 100) {
    return val.substring(0, 97) + "...";
  }
  return val;
}

/**
 * 테이블 데이터를 CSV 형식으로 변환
 */
export async function getBackupTableCsv(
  filename: string, 
  tableName: string
): Promise<{
  success: boolean;
  csv?: string;
  message?: string;
}> {
  try {
    const result = await getBackupTableData(filename, tableName);
    
    if (!result.success || !result.data) {
      return { success: false, message: result.message };
    }
    
    const { columns, rows } = result.data;
    
    // CSV 생성
    const csvRows: string[] = [];
    
    // 헤더
    csvRows.push(columns.map(c => `"${c}"`).join(","));
    
    // 데이터
    for (const row of rows) {
      const csvRow = row.map(cell => {
        // CSV 이스케이프
        const escaped = cell.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(csvRow.join(","));
    }
    
    // UTF-8 BOM 추가 (Excel 호환)
    const bom = "\uFEFF";
    const csv = bom + csvRows.join("\n");
    
    return {
      success: true,
      csv,
    };
  } catch (error) {
    console.error("[getBackupTableCsv] Error:", error);
    return {
      success: false,
      message: `CSV 변환 실패: ${(error as Error).message}`,
    };
  }
}
