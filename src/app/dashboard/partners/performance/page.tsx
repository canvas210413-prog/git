import { getPartnerPerformanceData, getPartners, getPartnerStats } from '@/app/actions/partners';
import { PerformanceCharts } from '@/components/partners/performance-charts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingUp, Users, Award, Target, Percent } from "lucide-react";

export default async function PartnerPerformancePage() {
  let performanceData: any[] = [];
  let partners: any[] = [];
  let stats = { totalPartners: 0, activePartners: 0, totalSales: 0, totalCommission: 0 };
  let error = null;

  try {
    [performanceData, partners, stats] = await Promise.all([
      getPartnerPerformanceData(),
      getPartners(),
      getPartnerStats(),
    ]);
  } catch (e) {
    console.error("Error loading performance data:", e);
    error = e;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 파트너별 보상 계산
  const partnerRewards = partners.map((partner: any) => {
    const latestPerformance = partner.performances?.[0];
    const sales = latestPerformance ? Number(latestPerformance.salesAmount) : 0;
    const commission = latestPerformance ? Number(latestPerformance.commission) : 0;
    
    // 등급 계산
    let tier = 'Bronze';
    let rewardRate = 5;
    
    if (sales >= 100000000) {
      tier = 'Platinum';
      rewardRate = 15;
    } else if (sales >= 50000000) {
      tier = 'Gold';
      rewardRate = 10;
    } else if (sales >= 20000000) {
      tier = 'Silver';
      rewardRate = 7;
    }

    const estimatedReward = sales * (rewardRate / 100);

    return {
      id: partner.id,
      name: partner.name,
      company: partner.company,
      type: partner.type,
      status: partner.status,
      sales,
      commission,
      tier,
      rewardRate,
      estimatedReward,
    };
  }).sort((a: any, b: any) => b.sales - a.sales);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return <Badge className="bg-purple-100 text-purple-800">Platinum</Badge>;
      case "Gold":
        return <Badge className="bg-yellow-100 text-yellow-800">Gold</Badge>;
      case "Silver":
        return <Badge className="bg-gray-200 text-gray-800">Silver</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800">Bronze</Badge>;
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">데이터를 불러올 수 없습니다.</h2>
        <p className="text-muted-foreground mt-2">데이터베이스 연결을 확인해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">성과 및 보상</h1>
        <p className="text-muted-foreground">
          전체 파트너의 매출, 수수료 및 보상 현황을 분석합니다.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 파트너</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePartners}</div>
            <p className="text-xs text-muted-foreground">전체 {stats.totalPartners}명 중</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
            <p className="text-xs text-muted-foreground">파트너 전체 매출</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">지급 수수료</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalCommission)}</div>
            <p className="text-xs text-muted-foreground">누적 지급액</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 수수료율</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSales > 0 ? ((stats.totalCommission / stats.totalSales) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">매출 대비 수수료</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <PerformanceCharts data={performanceData} />

      {/* Partner Rewards Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            파트너별 성과 및 보상
          </CardTitle>
          <CardDescription>
            각 파트너의 등급, 매출, 수수료 및 예상 보상을 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partnerRewards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>파트너 성과 데이터가 없습니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>순위</TableHead>
                  <TableHead>파트너명</TableHead>
                  <TableHead>회사</TableHead>
                  <TableHead>등급</TableHead>
                  <TableHead className="text-right">매출</TableHead>
                  <TableHead className="text-right">수수료율</TableHead>
                  <TableHead className="text-right">지급 수수료</TableHead>
                  <TableHead className="text-right">예상 보상</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partnerRewards.map((partner: any, index: number) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      {index < 3 ? (
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {index + 1}위
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>{partner.company || "-"}</TableCell>
                    <TableCell>{getTierBadge(partner.tier)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(partner.sales)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{partner.rewardRate}%</Badge>
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(partner.commission)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(partner.estimatedReward)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

