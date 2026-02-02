import { StatCard, StatGrid } from "@/components/common/stat-card";
import { formatNumber, formatPercent } from "@/lib/utils";
import { QuickLinksCard } from "./quick-links-card";
import type { DashboardKPIs } from "@/types";

interface MarketingSectionProps {
  data: DashboardKPIs["leads"];
}

export function MarketingSection({ data }: MarketingSectionProps) {
  return (
    <StatGrid columns={3}>
      <StatCard
        title="전체 리드"
        value={formatNumber(data.total)}
        description={`성공: ${data.won}`}
        icon="target"
      />
      <StatCard
        title="리드 전환율"
        value={formatPercent(data.conversionRate)}
        description="리드 → 성약 비율"
        icon="trending-up"
        variant="success"
      />
      <QuickLinksCard />
    </StatGrid>
  );
}
