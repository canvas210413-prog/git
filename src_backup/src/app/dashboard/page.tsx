import { getDashboardKPIs, getRecentActivities } from "@/app/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  Section,
  ErrorState,
} from "@/components/common";
import { StatCard, StatGrid } from "@/components/common/stat-card";
import { formatNumber, formatPercent } from "@/lib/utils";
import { ORDER_STATUS_LABELS, TICKET_STATUS_LABELS } from "@/lib/constants";
import type { DashboardKPIs, RecentActivity } from "@/types";

// ============================================================================
// Sub-components
// ============================================================================

interface RecentOrdersProps {
  orders: RecentActivity["orders"];
}

function RecentOrders({ orders }: RecentOrdersProps) {
  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        최근 주문이 없습니다
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {orders.slice(0, 5).map((order) => (
        <div key={order.id} className="flex items-center justify-between text-sm">
          <div>
            <p className="font-medium">{order.customer.name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("ko-KR")}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">{formatNumber(order.totalAmount)}</p>
            <Badge 
              variant={order.status === "COMPLETED" ? "outline" : "default"} 
              className="text-xs"
            >
              {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

interface RecentTicketsProps {
  tickets: RecentActivity["tickets"];
}

function RecentTickets({ tickets }: RecentTicketsProps) {
  if (tickets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        최근 티켓이 없습니다
      </p>
    );
  }

  const getTicketVariant = (status: string) => {
    if (status === "RESOLVED") return "outline";
    if (status === "OPEN") return "destructive";
    return "default";
  };

  return (
    <div className="space-y-3">
      {tickets.slice(0, 5).map((ticket) => (
        <div key={ticket.id} className="flex items-center justify-between text-sm">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{ticket.subject}</p>
            <p className="text-xs text-muted-foreground">
              {ticket.customer.name}
            </p>
          </div>
          <Badge variant={getTicketVariant(ticket.status)} className="text-xs ml-2">
            {TICKET_STATUS_LABELS[ticket.status as keyof typeof TICKET_STATUS_LABELS] || ticket.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}

interface QuickLinksCardProps {}

function QuickLinksCard({}: QuickLinksCardProps) {
  const links = [
    { href: "/dashboard/customers", label: "고객" },
    { href: "/dashboard/orders", label: "주문" },
    { href: "/dashboard/inventory", label: "재고" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">빠른 이동</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2 flex-wrap">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Button variant="outline" size="sm">{link.label}</Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default async function DashboardPage() {
  let kpis: DashboardKPIs | null = null;
  let activities: RecentActivity | null = null;

  try {
    [kpis, activities] = await Promise.all([
      getDashboardKPIs(),
      getRecentActivities(),
    ]);
  } catch (error) {
    console.error("Dashboard error:", error);
  }

  if (!kpis) {
    return (
      <ErrorState
        title="데이터를 불러올 수 없습니다"
        message="잠시 후 다시 시도해주세요."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="대시보드"
        description="비즈니스 핵심 지표와 실시간 현황을 한눈에 확인하세요."
      />

      {/* 매출 지표 */}
      <Section title="매출 성과">
        <StatGrid columns={4}>
          <StatCard
            title="총 매출"
            value={formatNumber(kpis.revenue.total)}
            description="누적 매출액"
            icon="dollar-sign"
          />
          <StatCard
            title="이번 달 매출"
            value={formatNumber(kpis.revenue.currentMonth)}
            trend={{
              value: kpis.revenue.growth,
              label: "전월 대비",
            }}
            icon="dollar-sign"
          />
          <StatCard
            title="평균 주문액"
            value={formatNumber(kpis.orders.averageValue)}
            description="건당 평균 금액"
            icon="shopping-cart"
          />
          <StatCard
            title="총 주문"
            value={formatNumber(kpis.orders.total)}
            description={`완료: ${kpis.orders.completed} | 대기: ${kpis.orders.pending}`}
            icon="shopping-cart"
          />
        </StatGrid>
      </Section>

      {/* 고객 지표 */}
      <Section title="고객 현황">
        <StatGrid columns={4}>
          <StatCard
            title="전체 고객"
            value={formatNumber(kpis.customers.total)}
            description={`활성: ${kpis.customers.active}`}
            icon="users"
          />
          <StatCard
            title="신규 고객"
            value={formatNumber(kpis.customers.new)}
            description="이번 달 가입"
            icon="users"
            variant="info"
          />
          <StatCard
            title="재구매율"
            value={formatPercent(kpis.customers.repeatRate)}
            description="2회 이상 구매 고객 비율"
            icon="trending-up"
            variant="success"
          />
          <StatCard
            title="이탈률"
            value={formatPercent(kpis.customers.churnRate)}
            description="30일 비활동 고객"
            icon="alert-circle"
            variant="danger"
          />
        </StatGrid>
      </Section>

      {/* 운영 효율 */}
      <Section title="운영 효율">
        <StatGrid columns={4}>
          <StatCard
            title="CS 티켓"
            value={formatNumber(kpis.support.tickets.total)}
            description={`미해결: ${kpis.support.tickets.open + kpis.support.tickets.inProgress}`}
            icon="alert-circle"
          />
          <StatCard
            title="해결률"
            value={formatPercent(kpis.support.resolutionRate)}
            description="티켓 해결 비율"
            icon="trending-up"
            variant="success"
          />
          <StatCard
            title="재고 현황"
            value={formatNumber(kpis.inventory.totalStock)}
            description="총 재고 수량"
            icon="package"
          />
          <StatCard
            title="재고 부족"
            value={formatNumber(kpis.inventory.lowStockItems)}
            description="즉시 확인 필요"
            icon="alert-circle"
            variant="danger"
          />
        </StatGrid>
      </Section>

      {/* 마케팅 성과 */}
      <Section title="마케팅 성과">
        <StatGrid columns={3}>
          <StatCard
            title="전체 리드"
            value={formatNumber(kpis.leads.total)}
            description={`성공: ${kpis.leads.won}`}
            icon="target"
          />
          <StatCard
            title="리드 전환율"
            value={formatPercent(kpis.leads.conversionRate)}
            description="리드 → 성약 비율"
            icon="trending-up"
            variant="success"
          />
          <QuickLinksCard />
        </StatGrid>
      </Section>

      {/* 최근 활동 */}
      {activities && (
        <Section title="최근 활동">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">최근 주문</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentOrders orders={activities.orders} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">최근 CS 티켓</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentTickets tickets={activities.tickets} />
              </CardContent>
            </Card>
          </div>
        </Section>
      )}
    </div>
  );
}
