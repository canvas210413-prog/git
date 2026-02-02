"use client";

import { ExcelToolbar } from "@/components/common/excel-toolbar";
import { inventoryColumns } from "@/lib/excel-utils";
import { importParts, PartImportData } from "@/app/actions/excel-import";

interface Part {
  id: string;
  name: string;
  partNumber: string;
  category: string | null;
  quantity: number;
  minStock: number;
  unitPrice: number | string | null;
  location: string | null;
  supplier: string | null;
}

interface InventoryExcelToolbarProps {
  parts: Part[];
}

export function InventoryExcelToolbar({ parts }: InventoryExcelToolbarProps) {
  // 내보내기용 데이터 변환
  const exportData = parts.map(p => ({
    name: p.name,
    partNumber: p.partNumber,
    category: p.category || "",
    quantity: p.quantity,
    minStock: p.minStock,
    unitPrice: Number(p.unitPrice || 0),
    location: p.location || "",
    supplier: p.supplier || "",
  }));

  // Import 핸들러
  const handleImport = async (data: PartImportData[]) => {
    return await importParts(data);
  };

  // 유효성 검사
  const validateRow = (row: Record<string, unknown>) => {
    if (!row.name || String(row.name).trim() === "") {
      return { valid: false, error: "부품명은 필수입니다." };
    }
    if (row.quantity === undefined || row.quantity === null || Number(row.quantity) < 0) {
      return { valid: false, error: "수량은 0 이상이어야 합니다." };
    }
    return { valid: true };
  };

  // 샘플 데이터
  const sampleData = [
    {
      name: "필터",
      partNumber: "FILTER-001",
      category: "필터류",
      quantity: 100,
      minStock: 20,
      unitPrice: 5000,
      location: "A-1-01",
      supplier: "필터공급사",
    },
  ];

  return (
    <ExcelToolbar
      data={exportData}
      columns={inventoryColumns}
      entityName="재고"
      onImport={handleImport}
      validateRow={validateRow}
      sampleData={sampleData}
    />
  );
}
