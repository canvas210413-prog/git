import { getForecastData } from "@/app/actions/forecast";
import { ForecastCharts } from "@/components/sales/forecast-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, ShoppingCart, DollarSign } from "lucide-react";

export default async function ForecastPage() {
  const { revenueData, pipelineData, metrics } = await getForecastData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">매출 예측 및 파이프라인</h1>
        <p className="text-muted-foreground">
          AI 기반 매출 예측과 구매 여정별 파이프라인 분석을 제공합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">예상 월 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.predictedMonthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              지난달 대비 <span className="text-green-500">+{metrics.growthRate}%</span> 성장 예상
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">파이프라인 전환율</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pipelineConversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              조회 대비 구매 전환율
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 주문 금액 (AOV)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              고객당 평균 결제 금액
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 잠재 고객</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipelineData[1].count.toLocaleString()}명
            </div>
            <p className="text-xs text-muted-foreground">
              현재 장바구니 보유 고객
            </p>
          </CardContent>
        </Card>
      </div>

      <ForecastCharts revenueData={revenueData} pipelineData={pipelineData} />
    </div>
  );
}