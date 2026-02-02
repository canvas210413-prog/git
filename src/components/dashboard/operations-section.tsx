import { StatCard, StatGrid } from "@/components/common/stat-card";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { DashboardKPIs } from "@/types";

interface OperationsSectionProps {
  support: DashboardKPIs["support"];
  inventory: DashboardKPIs["inventory"];
}

export function OperationsSection({ support, inventory }: OperationsSectionProps) {
  const unresolvedTickets = support.tickets.open + support.tickets.inProgress;

  return (
    <StatGrid columns={4}>
      <StatCard
        title="CS 티켓"
        value={formatNumber(support.tickets.total)}
        description={`미해결: ${unresolvedTickets}`}
        icon="alert-circle"
        variant={unresolvedTickets > 10 ? "danger" : undefined}
      />
      <StatCard
        title="해결률"
        value={formatPercent(support.resolutionRate)}
        description="티켓 해결 비율"
        icon="trending-up"
        variant="success"
      />
      <StatCard
        title="재고 현황"
        value={formatNumber(inventory.totalStock)}
        description="총 재고 수량"
        icon="package"
      />
      <StatCard
        title="재고 부족"
        value={formatNumber(inventory.lowStockItems)}
        description="즉시 확인 필요"
        icon="alert-circle"
        variant={inventory.lowStockItems > 0 ? "danger" : undefined}
      />
    </StatGrid>
  );
}
