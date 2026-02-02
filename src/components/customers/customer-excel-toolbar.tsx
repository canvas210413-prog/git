"use client";

import { ExcelToolbar } from "@/components/common/excel-toolbar";
import { customerColumns } from "@/lib/excel-utils";
import { importCustomers, CustomerImportData } from "@/app/actions/excel-import";

interface CustomerExcelToolbarProps {
  customers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    grade: string;
    segment: string | null;
    totalPurchase: number;
    createdAt: Date;
  }>;
}

export function CustomerExcelToolbar({ customers }: CustomerExcelToolbarProps) {
  // 내보내기용 데이터 변환
  const exportData = customers.map(c => ({
    name: c.name,
    email: c.email,
    phone: c.phone || "",
    company: c.company || "",
    grade: c.grade,
    segment: c.segment || "",
    totalPurchase: c.totalPurchase,
    createdAt: c.createdAt.toLocaleString("ko-KR"),
  }));

  // Import 핸들러
  const handleImport = async (data: CustomerImportData[]) => {
    return await importCustomers(data);
  };

  // 유효성 검사
  const validateRow = (row: Record<string, unknown>) => {
    if (!row.name || String(row.name).trim() === "") {
      return { valid: false, error: "고객명은 필수입니다." };
    }
    if (!row.email || String(row.email).trim() === "") {
      return { valid: false, error: "이메일은 필수입니다." };
    }
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(row.email))) {
      return { valid: false, error: "유효한 이메일 형식이 아닙니다." };
    }
    return { valid: true };
  };

  // 샘플 데이터
  const sampleData = [
    {
      name: "홍길동",
      email: "hong@example.com",
      phone: "010-1234-5678",
      company: "테스트회사",
      grade: "GOLD",
      segment: "VIP",
    },
  ];

  return (
    <ExcelToolbar
      data={exportData}
      columns={customerColumns}
      entityName="고객"
      onImport={handleImport}
      validateRow={validateRow}
      sampleData={sampleData}
    />
  );
}
