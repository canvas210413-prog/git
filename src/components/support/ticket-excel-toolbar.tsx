"use client";

import { ExcelToolbar } from "@/components/common/excel-toolbar";
import { ticketColumns } from "@/lib/excel-utils";
import { importTickets, TicketImportData } from "@/app/actions/excel-import";

interface Ticket {
  id: string;
  title: string;
  customer?: { name: string; email: string };
  category: string;
  priority: string;
  status: string;
  assignee?: string | null;
  createdAt: Date;
  description?: string;
}

interface TicketExcelToolbarProps {
  tickets: Ticket[];
}

export function TicketExcelToolbar({ tickets }: TicketExcelToolbarProps) {
  // 내보내기용 데이터 변환
  const exportData = tickets.map(t => ({
    id: t.id,
    title: t.title,
    customerName: t.customer?.name || "",
    category: t.category,
    priority: t.priority,
    status: t.status,
    assignee: t.assignee || "",
    createdAt: new Date(t.createdAt).toLocaleString("ko-KR"),
  }));

  // Import 핸들러
  const handleImport = async (data: TicketImportData[]) => {
    return await importTickets(data);
  };

  // 유효성 검사
  const validateRow = (row: Record<string, unknown>) => {
    if (!row.title || String(row.title).trim() === "") {
      return { valid: false, error: "제목은 필수입니다." };
    }
    if (!row.customerEmail || String(row.customerEmail).trim() === "") {
      return { valid: false, error: "고객 이메일은 필수입니다." };
    }
    return { valid: true };
  };

  // Import용 컬럼 (customerEmail 추가)
  const importColumns = [
    { header: '제목', key: 'title', width: 30 },
    { header: '고객이메일', key: 'customerEmail', width: 25 },
    { header: '카테고리', key: 'category', width: 12 },
    { header: '우선순위', key: 'priority', width: 10 },
    { header: '상태', key: 'status', width: 10 },
    { header: '설명', key: 'description', width: 40 },
  ];

  // 샘플 데이터
  const sampleData = [
    {
      title: "상품 문의입니다",
      customerEmail: "hong@example.com",
      category: "INQUIRY",
      priority: "MEDIUM",
      status: "OPEN",
      description: "상품 관련 문의 내용",
    },
  ];

  return (
    <ExcelToolbar
      data={exportData}
      columns={ticketColumns}
      entityName="티켓"
      onImport={handleImport}
      validateRow={validateRow}
      sampleData={sampleData}
    />
  );
}
