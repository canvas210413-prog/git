import { StatCard, StatGrid } from "@/components/common/stat-card";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { DashboardKPIs } from "@/types";

interface RevenueSectionProps {
  data: DashboardKPIs["revenue"] & Pick<DashboardKPIs["orders"], "total" | "completed" | "pending" | "averageValue">;
}

export function RevenueSection({ data }: RevenueSectionProps) {
  return (
    <StatGrid columns={4}>
      <StatCard
        title="총 매출"
        value={formatNumber(data.total)}
        description="누적 매출액"
        icon="dollar-sign"
      />
      <StatCard
        title="이번 달 매출"
        value={formatNumber(data.currentMonth)}
        trend={{
          value: data.growth,
          label: "전월 대비",
        }}
        icon="dollar-sign"
      />
      <StatCard
        title="평균 주문액"
        value={formatNumber(data.averageValue)}
        description="건당 평균 금액"
        icon="shopping-cart"
      />
      <StatCard
        title="총 주문"
        value={formatNumber(data.total)}
        description={`완료: ${data.completed} | 대기: ${data.pending}`}
        icon="shopping-cart"
      />
    </StatGrid>
  );
}
