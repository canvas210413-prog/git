import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// ============================================================================
// Excel 내보내기 유틸리티
// ============================================================================

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExcelColumn[],
  filename: string,
  sheetName: string = 'Sheet1'
): void {
  // 헤더와 데이터 준비
  const headers = columns.map(col => col.header);
  const rows = data.map(item => 
    columns.map(col => {
      const value = item[col.key];
      // 날짜 처리
      if (value instanceof Date) {
        return value.toLocaleString('ko-KR');
      }
      // null/undefined 처리
      if (value === null || value === undefined) {
        return '';
      }
      return value;
    })
  );

  // 워크시트 생성
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // 컬럼 너비 설정
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  worksheet['!cols'] = colWidths;

  // 워크북 생성
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Excel 파일 생성 및 다운로드
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ============================================================================
// Excel 가져오기 유틸리티
// ============================================================================

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

export async function importFromExcel<T>(
  file: File,
  columns: ExcelColumn[],
  validateRow?: (row: Record<string, unknown>) => { valid: boolean; error?: string }
): Promise<ImportResult<T>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 첫 번째 시트 읽기
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // JSON으로 변환 (헤더 사용)
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
        
        const results: T[] = [];
        const errors: string[] = [];
        
        // 헤더를 key로 매핑
        const headerToKey = new Map<string, string>();
        columns.forEach(col => {
          headerToKey.set(col.header, col.key);
          headerToKey.set(col.key, col.key); // key도 그대로 허용
        });
        
        jsonData.forEach((row, index) => {
          // 헤더를 key로 변환
          const mappedRow: Record<string, unknown> = {};
          Object.entries(row).forEach(([header, value]) => {
            const key = headerToKey.get(header) || header;
            mappedRow[key] = value;
          });
          
          // 유효성 검사
          if (validateRow) {
            const validation = validateRow(mappedRow);
            if (!validation.valid) {
              errors.push(`행 ${index + 2}: ${validation.error}`);
              return;
            }
          }
          
          results.push(mappedRow as T);
        });
        
        resolve({
          success: errors.length === 0,
          data: results,
          errors,
          totalRows: jsonData.length,
          validRows: results.length,
        });
      } catch (error) {
        reject(new Error('Excel 파일을 읽는 중 오류가 발생했습니다.'));
      }
    };
    
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsArrayBuffer(file);
  });
}

// ============================================================================
// 템플릿 다운로드 유틸리티
// ============================================================================

export function downloadTemplate(
  columns: ExcelColumn[],
  filename: string,
  sampleData?: Record<string, unknown>[]
): void {
  const headers = columns.map(col => col.header);
  const rows: unknown[][] = [];
  
  // 샘플 데이터가 있으면 추가
  if (sampleData && sampleData.length > 0) {
    sampleData.forEach(item => {
      rows.push(columns.map(col => item[col.key] || ''));
    });
  }
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // 컬럼 너비 설정
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  worksheet['!cols'] = colWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_template.xlsx`);
}

// ============================================================================
// 각 엔티티별 컬럼 정의
// ============================================================================

export const customerColumns: ExcelColumn[] = [
  { header: '고객명', key: 'name', width: 15 },
  { header: '이메일', key: 'email', width: 25 },
  { header: '전화번호', key: 'phone', width: 15 },
  { header: '회사', key: 'company', width: 20 },
  { header: '등급', key: 'grade', width: 10 },
  { header: '세그먼트', key: 'segment', width: 12 },
  { header: '총구매액', key: 'totalPurchase', width: 15 },
  { header: '가입일', key: 'createdAt', width: 20 },
];

export const orderColumns: ExcelColumn[] = [
  { header: '주문번호', key: 'orderNumber', width: 15 },
  { header: '고객명', key: 'customerName', width: 15 },
  { header: '주문상태', key: 'status', width: 12 },
  { header: '결제상태', key: 'paymentStatus', width: 12 },
  { header: '총금액', key: 'totalAmount', width: 15 },
  { header: '주문일', key: 'orderDate', width: 20 },
  { header: '상품정보', key: 'productInfo', width: 30 },
  { header: '배송주소', key: 'shippingAddress', width: 40 },
];

export const productColumns: ExcelColumn[] = [
  { header: '상품명', key: 'name', width: 25 },
  { header: '카테고리', key: 'category', width: 15 },
  { header: '가격', key: 'price', width: 12 },
  { header: '재고', key: 'stock', width: 10 },
  { header: '상태', key: 'status', width: 10 },
  { header: '설명', key: 'description', width: 40 },
];

export const ticketColumns: ExcelColumn[] = [
  { header: '티켓번호', key: 'id', width: 10 },
  { header: '제목', key: 'title', width: 30 },
  { header: '고객명', key: 'customerName', width: 15 },
  { header: '카테고리', key: 'category', width: 12 },
  { header: '우선순위', key: 'priority', width: 10 },
  { header: '상태', key: 'status', width: 10 },
  { header: '담당자', key: 'assignee', width: 12 },
  { header: '생성일', key: 'createdAt', width: 20 },
];

export const leadColumns: ExcelColumn[] = [
  { header: '이름', key: 'name', width: 15 },
  { header: '이메일', key: 'email', width: 25 },
  { header: '전화번호', key: 'phone', width: 15 },
  { header: '회사', key: 'company', width: 20 },
  { header: '직책', key: 'position', width: 15 },
  { header: '상태', key: 'status', width: 12 },
  { header: '출처', key: 'source', width: 12 },
  { header: '예상가치', key: 'expectedValue', width: 15 },
];

export const partnerColumns: ExcelColumn[] = [
  { header: '회사명', key: 'companyName', width: 20 },
  { header: '담당자', key: 'contactName', width: 15 },
  { header: '이메일', key: 'email', width: 25 },
  { header: '전화번호', key: 'phone', width: 15 },
  { header: '유형', key: 'type', width: 12 },
  { header: '등급', key: 'tier', width: 10 },
  { header: '상태', key: 'status', width: 10 },
];

export const inventoryColumns: ExcelColumn[] = [
  { header: '부품명', key: 'name', width: 25 },
  { header: '부품번호', key: 'partNumber', width: 15 },
  { header: '카테고리', key: 'category', width: 15 },
  { header: '수량', key: 'quantity', width: 10 },
  { header: '최소재고', key: 'minStock', width: 10 },
  { header: '단가', key: 'unitPrice', width: 12 },
  { header: '위치', key: 'location', width: 15 },
  { header: '공급업체', key: 'supplier', width: 20 },
];
