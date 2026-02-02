"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Target,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { getCampaigns, getMarketingStats, getCoupons } from "@/app/actions/marketing";

interface CampaignAnalytics {
  id: string;
  name: string;
  type: string;
  status: string;
  budget: number;
  spent: number;
  roi: number;
  startDate: Date;
  endDate: Date;
  // 계산된 지표
  conversionRate: number;
  revenueGenerated: number;
  customersReached: number;
  ordersGenerated: number;
}

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const campaignIdParam = searchParams.get("campaignId");
  
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaignIdParam || "all");
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (campaignIdParam) {
      setSelectedCampaignId(campaignIdParam);
    }
  }, [campaignIdParam]);

  async function loadData() {
    setLoading(true);
    try {
      const [campaignsData, statsData, couponsData] = await Promise.all([
        getCampaigns(),
        getMarketingStats(),
        getCoupons({}),
      ]);
      setCampaigns(campaignsData);
      setStats(statsData);
      setCoupons(couponsData);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setLoading(false);
    }
  }

  // 캠페인별 분석 데이터 생성 (시뮬레이션)
  function getCampaignAnalytics(campaign: any): CampaignAnalytics {
    const budget = Number(campaign.budget) || 0;
    const spent = Number(campaign.spent) || 0;
    const roi = Number(campaign.roi) || 0;
    
    // 시뮬레이션 데이터 (실제로는 DB에서 계산)
    const conversionRate = Math.random() * 10 + 2; // 2-12%
    const customersReached = Math.floor(Math.random() * 500 + 100);
    const ordersGenerated = Math.floor(customersReached * (conversionRate / 100));
    const revenueGenerated = spent > 0 ? spent * (1 + roi / 100) : 0;
    
    return {
      ...campaign,
      budget,
      spent,
      roi,
      conversionRate,
      customersReached,
      ordersGenerated,
      revenueGenerated,
    };
  }

  const analyzedCampaigns = campaigns.map(getCampaignAnalytics);
  const selectedCampaign = selectedCampaignId !== "all" 
    ? analyzedCampaigns.find(c => c.id === selectedCampaignId)
    : null;

  // 전체 통계
  const totalStats = {
    totalBudget: analyzedCampaigns.reduce((sum, c) => sum + c.budget, 0),
    totalSpent: analyzedCampaigns.reduce((sum, c) => sum + c.spent, 0),
    avgRoi: analyzedCampaigns.length > 0 
      ? analyzedCampaigns.reduce((sum, c) => sum + c.roi, 0) / analyzedCampaigns.length 
      : 0,
    totalRevenue: analyzedCampaigns.reduce((sum, c) => sum + c.revenueGenerated, 0),
    totalCustomers: analyzedCampaigns.reduce((sum, c) => sum + c.customersReached, 0),
    totalOrders: analyzedCampaigns.reduce((sum, c) => sum + c.ordersGenerated, 0),
    avgConversion: analyzedCampaigns.length > 0
      ? analyzedCampaigns.reduce((sum, c) => sum + c.conversionRate, 0) / analyzedCampaigns.length
      : 0,
  };

  // 캠페인 유형별 성과
  const performanceByType = {
    REPURCHASE: analyzedCampaigns.filter(c => c.type === "REPURCHASE"),
    EVENT: analyzedCampaigns.filter(c => c.type === "EVENT"),
    WINBACK: analyzedCampaigns.filter(c => c.type === "WINBACK"),
    PROMOTION: analyzedCampaigns.filter(c => c.type === "PROMOTION"),
  };

  function getTypeAvgRoi(type: string) {
    const typeCampaigns = performanceByType[type as keyof typeof performanceByType] || [];
    if (typeCampaigns.length === 0) return 0;
    return typeCampaigns.reduce((sum, c) => sum + c.roi, 0) / typeCampaigns.length;
  }

  return (
    <div className="space-y-6">
      {/* 네비게이션 */}
      <div className="flex space-x-2">
        <Link href="/dashboard/marketing">
          <Button variant="outline">마케팅 개요</Button>
        </Link>
        <Link href="/dashboard/marketing/coupon">
          <Button variant="outline">쿠폰 관리</Button>
        </Link>
        <Link href="/dashboard/marketing/campaign">
          <Button variant="outline">캠페인</Button>
        </Link>
        <Link href="/dashboard/marketing/analytics">
          <Button variant="default">효과분석</Button>
        </Link>
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">캠페인 효과분석</h2>
          <p className="text-muted-foreground">
            캠페인별 ROI, 전환율, 매출 기여도를 분석하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="캠페인 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 캠페인</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
              <SelectItem value="90d">최근 90일</SelectItem>
              <SelectItem value="all">전체 기간</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">분석 데이터 로딩 중...</div>
      ) : (
        <>
          {/* 주요 KPI */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 투자금액</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₩{(selectedCampaign ? selectedCampaign.spent : totalStats.totalSpent).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  예산 대비 {selectedCampaign 
                    ? Math.round((selectedCampaign.spent / selectedCampaign.budget) * 100) 
                    : Math.round((totalStats.totalSpent / totalStats.totalBudget) * 100) || 0}% 집행
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROI (투자수익률)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(selectedCampaign?.roi || totalStats.avgRoi) > 0 ? "text-green-600" : "text-red-600"}`}>
                  {(selectedCampaign ? selectedCampaign.roi : Math.round(totalStats.avgRoi))}%
                </div>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  전월 대비 +5.2%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">전환율</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(selectedCampaign ? selectedCampaign.conversionRate : totalStats.avgConversion).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedCampaign ? selectedCampaign.ordersGenerated : totalStats.totalOrders}건 전환
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">도달 고객</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(selectedCampaign ? selectedCampaign.customersReached : totalStats.totalCustomers).toLocaleString()}명
                </div>
                <p className="text-xs text-muted-foreground">
                  주문 전환: {selectedCampaign ? selectedCampaign.ordersGenerated : totalStats.totalOrders}건
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 캠페인 유형별 성과 비교 */}
          <Card>
            <CardHeader>
              <CardTitle>캠페인 유형별 성과</CardTitle>
              <CardDescription>각 캠페인 유형의 평균 ROI 비교</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">재구매 알림</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(getTypeAvgRoi("REPURCHASE"))}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {performanceByType.REPURCHASE.length}개 캠페인
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">이벤트 안내</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(getTypeAvgRoi("EVENT"))}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {performanceByType.EVENT.length}개 캠페인
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">이탈고객 재유입</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(getTypeAvgRoi("WINBACK"))}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {performanceByType.WINBACK.length}개 캠페인
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium">프로모션</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(getTypeAvgRoi("PROMOTION"))}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {performanceByType.PROMOTION.length}개 캠페인
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 캠페인별 상세 분석 */}
          <Card>
            <CardHeader>
              <CardTitle>캠페인별 상세 분석</CardTitle>
              <CardDescription>각 캠페인의 성과 지표를 비교하세요</CardDescription>
            </CardHeader>
            <CardContent>
              {analyzedCampaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>분석할 캠페인이 없습니다.</p>
                  <Link href="/dashboard/marketing/campaign">
                    <Button variant="link">캠페인 만들기</Button>
                  </Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>캠페인</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="text-right">예산</TableHead>
                      <TableHead className="text-right">집행액</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                      <TableHead className="text-right">전환율</TableHead>
                      <TableHead className="text-right">도달 고객</TableHead>
                      <TableHead className="text-right">주문 수</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyzedCampaigns.map((campaign) => (
                      <TableRow key={campaign.id} className={selectedCampaignId === campaign.id ? "bg-muted/50" : ""}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(campaign.startDate).toLocaleDateString()} ~ {new Date(campaign.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {campaign.type === "REPURCHASE" && "재구매"}
                            {campaign.type === "EVENT" && "이벤트"}
                            {campaign.type === "WINBACK" && "재유입"}
                            {campaign.type === "PROMOTION" && "프로모션"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"}>
                            {campaign.status === "ACTIVE" ? "진행중" : 
                             campaign.status === "DRAFT" ? "기획중" : 
                             campaign.status === "COMPLETED" ? "완료" : campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">₩{campaign.budget.toLocaleString()}</TableCell>
                        <TableCell className="text-right">₩{campaign.spent.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <span className={campaign.roi > 0 ? "text-green-600 font-medium" : "text-red-600"}>
                            {campaign.roi > 0 ? "+" : ""}{campaign.roi}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{campaign.conversionRate.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{campaign.customersReached.toLocaleString()}명</TableCell>
                        <TableCell className="text-right">{campaign.ordersGenerated}건</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* 쿠폰 사용 분석 */}
          <Card>
            <CardHeader>
              <CardTitle>쿠폰 사용 현황</CardTitle>
              <CardDescription>쿠폰별 사용률과 할인 금액을 확인하세요</CardDescription>
            </CardHeader>
            <CardContent>
              {coupons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>사용 가능한 쿠폰이 없습니다.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {coupons.slice(0, 6).map((coupon: any) => (
                    <div key={coupon.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{coupon.name}</p>
                          <code className="text-xs bg-muted px-1 rounded">{coupon.code}</code>
                        </div>
                        <Badge variant="secondary">
                          {coupon.discountType === "PERCENT" 
                            ? `${coupon.discountValue}%` 
                            : `${Number(coupon.discountValue).toLocaleString()}원`}
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">사용률</span>
                          <span>{coupon.usageLimit ? Math.round((coupon.usedCount / coupon.usageLimit) * 100) : 0}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${coupon.usageLimit ? Math.min((coupon.usedCount / coupon.usageLimit) * 100, 100) : 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {coupon.usedCount}/{coupon.usageLimit || "∞"} 사용됨
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 인사이트 */}
          <Card>
            <CardHeader>
              <CardTitle>💡 마케팅 인사이트</CardTitle>
              <CardDescription>데이터 기반 추천 사항</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">재구매 캠페인 효과 우수</h4>
                  <p className="text-sm text-blue-700">
                    재구매 알림 캠페인의 ROI가 평균 {Math.round(getTypeAvgRoi("REPURCHASE"))}%로 가장 높습니다. 
                    구매 후 2-4주 시점에 리마인더를 발송하면 전환율이 더 높아질 수 있습니다.
                  </p>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-1">휴면고객 재활성화 필요</h4>
                  <p className="text-sm text-orange-700">
                    30일 이상 구매가 없는 휴면 고객이 증가하고 있습니다. 
                    맞춤 쿠폰과 함께 재유입 캠페인을 진행해보세요.
                  </p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">VIP 세그먼트 집중</h4>
                  <p className="text-sm text-green-700">
                    VIP 고객의 구매 전환율이 일반 고객 대비 3배 높습니다. 
                    VIP 전용 프로모션을 강화하면 매출 증가에 효과적입니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-muted-foreground">로딩 중...</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}
