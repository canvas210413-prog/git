import { getBehaviorAnalysisData } from "@/app/actions/behavior-analysis";
import { BehaviorCharts } from "@/components/customers/behavior-charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, MousePointerClick, ShoppingCart, Clock, AlertCircle, Search } from "lucide-react";

export default async function BehaviorAnalysisPage() {
  const { activityTrend, conversionFunnel, categoryInterests, recentBehaviors } = await getBehaviorAnalysisData();

  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">고객 행동 분석 (Behavior Analysis)</h2>
        <p className="text-muted-foreground">
          고객의 웹사이트 방문, 클릭, 구매 여정 등 행동 데이터를 분석하여 인사이트를 제공합니다.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 체류 시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4분 32초</div>
            <p className="text-xs text-green-500 flex items-center">
              <Activity className="h-3 w-3 mr-1" /> 전주 대비 +12%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">장바구니 포기율</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68.5%</div>
            <p className="text-xs text-red-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" /> 주의 필요
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">클릭률 (CTR)</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground">업계 평균 2.8%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최다 검색어</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">무선 이어폰</div>
            <p className="text-xs text-muted-foreground">지난 24시간 기준</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <BehaviorCharts 
        activityTrend={activityTrend} 
        conversionFunnel={conversionFunnel} 
        categoryInterests={categoryInterests} 
      />

      {/* Recent Live Behaviors */}
      <Card>
        <CardHeader>
          <CardTitle>실시간 고객 행동 모니터링</CardTitle>
          <CardDescription>최근 감지된 주요 고객 행동 및 이탈 신호입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBehaviors.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    item.risk === 'High' ? 'bg-red-100 text-red-600' : 
                    item.risk === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {item.risk === 'High' ? <AlertCircle className="h-5 w-5" /> : 
                     item.risk === 'Medium' ? <Search className="h-5 w-5" /> : 
                     <MousePointerClick className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium">{item.user} - {item.action}</p>
                    <p className="text-sm text-muted-foreground">대상: {item.target}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={item.risk === 'High' ? 'destructive' : 'outline'}>
                    Risk: {item.risk}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
