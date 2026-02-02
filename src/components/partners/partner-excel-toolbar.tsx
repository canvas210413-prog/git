"use client";

import { ExcelToolbar } from "@/components/common/excel-toolbar";
import { partnerColumns } from "@/lib/excel-utils";
import { importPartners, PartnerImportData } from "@/app/actions/excel-import";

interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  type: string;
  tier: string | null;
  status: string;
}

interface PartnerExcelToolbarProps {
  partners: Partner[];
}

export function PartnerExcelToolbar({ partners }: PartnerExcelToolbarProps) {
  // 내보내기용 데이터 변환
  const exportData = partners.map(p => ({
    companyName: p.company || p.name,
    contactName: p.name,
    email: p.email,
    phone: p.phone || "",
    type: p.type,
    tier: p.tier || "BRONZE",
    status: p.status,
  }));

  // Import 핸들러
  const handleImport = async (data: PartnerImportData[]) => {
    return await importPartners(data);
  };

  // 유효성 검사
  const validateRow = (row: Record<string, unknown>) => {
    if (!row.companyName || String(row.companyName).trim() === "") {
      return { valid: false, error: "회사명은 필수입니다." };
    }
    if (!row.email || String(row.email).trim() === "") {
      return { valid: false, error: "이메일은 필수입니다." };
    }
    return { valid: true };
  };

  // 샘플 데이터
  const sampleData = [
    {
      companyName: "파트너회사",
      contactName: "김담당",
      email: "partner@example.com",
      phone: "02-1234-5678",
      type: "RESELLER",
      tier: "GOLD",
      status: "ACTIVE",
    },
  ];

  return (
    <ExcelToolbar
      data={exportData}
      columns={partnerColumns}
      entityName="파트너"
      onImport={handleImport}
      validateRow={validateRow}
      sampleData={sampleData}
    />
  );
}
