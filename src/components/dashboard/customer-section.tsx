import { StatCard, StatGrid } from "@/components/common/stat-card";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { DashboardKPIs } from "@/types";

interface CustomerSectionProps {
  data: DashboardKPIs["customers"];
}

export function CustomerSection({ data }: CustomerSectionProps) {
  return (
    <StatGrid columns={4}>
      <StatCard
        title="전체 고객"
        value={formatNumber(data.total)}
        description={`활성: ${data.active}`}
        icon="users"
      />
      <StatCard
        title="신규 고객"
        value={formatNumber(data.new)}
        description="이번 달 가입"
        icon="users"
        variant="info"
      />
      <StatCard
        title="재구매율"
        value={formatPercent(data.repeatRate)}
        description="2회 이상 구매 고객 비율"
        icon="trending-up"
        variant="success"
      />
      <StatCard
        title="이탈률"
        value={formatPercent(data.churnRate)}
        description="30일 비활동 고객"
        icon="alert-circle"
        variant="danger"
      />
    </StatGrid>
  );
}
