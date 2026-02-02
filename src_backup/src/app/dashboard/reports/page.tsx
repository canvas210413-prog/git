import { getReportData } from "@/app/actions/report";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OverviewChart } from "@/components/reports/overview-chart";
import { CategoryPieChart } from "@/components/reports/category-pie-chart";
import { CustomerGrowthChart } from "@/components/reports/customer-growth-chart";
import { DollarSign, Users, Activity, Clock } from "lucide-react";

export default async function ReportsPage() {
  const data = await getReportData();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">보고서 및 대시보드</h2>
        <p className="text-muted-foreground">고객 이탈률, CLV, 서비스 처리 시간 등 주요 성과 지표(KPI)를 시각화하여 제공합니다.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출 (YTD)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{data.kpi.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">올해 누적 매출</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 거래 규모</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{data.kpi.avgDealSize.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">건당 평균 매출</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">고객 유지율</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpi.customerRetention}%</div>
            <p className="text-xs text-muted-foreground">지난달 대비 +2.1%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 티켓 처리 시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpi.ticketResolutionTime}시간</div>
            <p className="text-xs text-muted-foreground">목표(4시간) 달성</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>월별 매출 추이</CardTitle>
            <CardDescription>최근 6개월간의 매출 성장세를 보여줍니다.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart data={data.monthlyRevenue} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>고객 세그먼트 분포</CardTitle>
            <CardDescription>고객 유형별 비율입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={data.categorySales} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>고객 성장 지표</CardTitle>
            <CardDescription>전체 활성 고객 수와 신규 유입 고객 수의 추이입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerGrowthChart data={data.customerGrowth} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}