import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { AnalyzeButton } from "@/components/customers/analyze-button";
import { PageHeader, EmptyState, ErrorState } from "@/components/common";
import { StatusBadge } from "@/components/common/status-badge";
import { STATUS_LABELS, SEGMENT_LABELS } from "@/lib/constants";

// ============================================================================
// Types
// ============================================================================

interface CustomerData {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: string;
  segment: string | null;
  createdAt: Date;
}

// ============================================================================
// Sub-components
// ============================================================================

interface CustomerRowProps {
  customer: CustomerData;
}

function CustomerRow({ customer }: CustomerRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{customer.name}</TableCell>
      <TableCell>{customer.email}</TableCell>
      <TableCell>{customer.company || "-"}</TableCell>
      <TableCell>
        <StatusBadge 
          status={customer.status} 
          labels={STATUS_LABELS} 
        />
      </TableCell>
      <TableCell>
        <AnalyzeButton
          customerId={customer.id}
          currentSegment={customer.segment}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/customers/${customer.id}`}>상세보기</Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface CustomerTableProps {
  customers: CustomerData[];
}

function CustomerTable({ customers }: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <EmptyState
        title="등록된 고객이 없습니다"
        description="새 고객을 추가하여 시작하세요."
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>이메일</TableHead>
            <TableHead>회사</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>세그먼트 (AI)</TableHead>
            <TableHead className="text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <CustomerRow key={customer.id} customer={customer} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default async function CustomersPage() {
  let customers: CustomerData[] = [];
  let error: Error | null = null;

  try {
    customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.error("Failed to fetch customers:", e);
    error = e as Error;
  }

  if (error) {
    return (
      <ErrorState
        title="고객 정보를 불러올 수 없습니다"
        message="데이터베이스 연결을 확인해주세요."
        details={String(error)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="고객 관리"
        description="고객 정보를 관리하고 상세 내역을 조회합니다."
      >
        <AddCustomerDialog />
      </PageHeader>

      <CustomerTable customers={customers} />
    </div>
  );
}
