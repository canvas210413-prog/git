import { getOrders, getOrderStats } from "@/app/actions/orders";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddOrderDialog } from "@/components/orders/add-order-dialog-full";
import { OrdersTable } from "@/components/orders/orders-table";
import { PageHeader } from "@/components/common";
import { StatCard, StatGrid } from "@/components/common/stat-card";
import { formatNumber } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
}

// ============================================================================
// Sub-components
// ============================================================================

interface OrderStatsCardsProps {
  stats: OrderStats;
}

function OrderStatsCards({ stats }: OrderStatsCardsProps) {
  return (
    <StatGrid columns={5}>
      <StatCard
        title="전체 주문"
        value={formatNumber(stats.total)}
        icon="package"
      />
      <StatCard
        title="대기"
        value={formatNumber(stats.pending)}
        icon="clock"
      />
      <StatCard
        title="처리중"
        value={formatNumber(stats.processing)}
        icon="package"
        variant="info"
      />
      <StatCard
        title="배송중"
        value={formatNumber(stats.shipped)}
        icon="truck"
        variant="warning"
      />
      <StatCard
        title="배송완료"
        value={formatNumber(stats.delivered)}
        icon="check-circle"
        variant="success"
      />
    </StatGrid>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default async function OrdersPage() {
  const [orders, stats] = await Promise.all([getOrders(), getOrderStats()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="주문 관리"
        description="엑셀처럼 그리드에서 직접 편집, 추가, 삭제가 가능합니다."
      >
        <AddOrderDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> 주문 등록
          </Button>
        </AddOrderDialog>
      </PageHeader>

      {/* 통계 카드 */}
      <OrderStatsCards stats={stats} />

      {/* 인라인 편집 가능한 테이블 */}
      <OrdersTable orders={orders} />
    </div>
  );
}
