import { getSegmentationData } from "@/app/actions/segmentation";
import { SegmentationCharts } from "@/components/customers/segmentation-charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, AlertTriangle, Star, Zap } from "lucide-react";

export default async function SegmentationPage() {
  const { data } = await getSegmentationData();

  // Calculate summary metrics
  const totalCustomers = data.reduce((acc, curr) => acc + curr.value, 0);
  const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);
  const topSegment = data.reduce((prev, current) => (prev.revenue > current.revenue) ? prev : current, data[0]);

  const getSegmentIcon = (name: string) => {
    switch (name) {
      case "VIP": return <Star className="h-5 w-5 text-yellow-500" />;
      case "Enterprise": return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case "At-Risk": return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "Startup": return <Zap className="h-5 w-5 text-purple-500" />;
      default: return <Users className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSegmentDescription = (name: string) => {
    switch (name) {
      case "VIP": return "높은 구매 빈도와 매출을 기록하는 최상위 고객군입니다.";
      case "Enterprise": return "대규모 계약 및 장기 파트너십 가능성이 높은 기업 고객입니다.";
      case "SMB": return "안정적인 매출 기반이 되는 중소규모 고객군입니다.";
      case "Startup": return "성장 잠재력이 높으나 예산이 제한적일 수 있는 초기 기업입니다.";
      case "At-Risk": return "최근 활동이 저조하거나 이탈 징후가 보이는 고객군입니다.";
      default: return "아직 분류되지 않은 고객군입니다.";
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">고객 세분화 (Segmentation)</h2>
        <p className="text-muted-foreground">
          AI 기반으로 분석된 고객 세그먼트 현황과 인사이트를 확인하세요.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 분석 대상 고객</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}명</div>
            <p className="text-xs text-muted-foreground">전체 활성 고객 기준</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">세그먼트 총 매출</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{(totalRevenue / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">최근 12개월 누적</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최고 가치 세그먼트</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topSegment?.name}</div>
            <p className="text-xs text-muted-foreground">
              매출 기여도 {(topSegment?.revenue / totalRevenue * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <SegmentationCharts data={data} />

      {/* Detailed Segment List */}
      <div>
        <h3 className="text-xl font-semibold mb-4">세그먼트 상세 분석</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((segment) => (
            <Card key={segment.name} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSegmentIcon(segment.name)}
                    <CardTitle className="text-lg">{segment.name}</CardTitle>
                  </div>
                  <Badge variant="outline">{segment.value}명</Badge>
                </div>
                <CardDescription className="mt-2">
                  {getSegmentDescription(segment.name)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">총 매출 기여</span>
                    <span className="font-medium">₩{segment.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">고객당 평균 매출</span>
                    <span className="font-medium">₩{(segment.revenue / segment.value).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <Button className="w-full" variant="secondary">
                  {segment.name} 고객 리스트 보기
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
