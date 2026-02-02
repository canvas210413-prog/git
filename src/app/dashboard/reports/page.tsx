"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  DollarSign,
  Users,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowRight,
  Brain,
  Sparkles,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Zap,
  FileText,
  Calendar,
} from "lucide-react";
import { getInsightReportData, InsightReportData } from "@/app/actions/insight-report";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<InsightReportData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getInsightReportData("monthly");
        setReportData(data);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">보고서 및 대시보드</h2>
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const kpi = reportData ? {
    totalRevenue: reportData.sales.totalRevenue,
    avgDealSize: reportData.sales.avgOrderValue,
    customerRetention: reportData.customers.totalCustomers > 0 
      ? ((reportData.customers.totalCustomers - reportData.customers.churnRisk) / reportData.customers.totalCustomers) * 100 
      : 0,
    ticketResolutionTime: reportData.support.avgResolutionTime,
    revenueGrowth: reportData.sales.growthRate,
    newCustomers: reportData.customers.newCustomers,
    activeCustomers: reportData.customers.activeCustomers,
    totalTickets: reportData.support.totalTickets,
  } : {
    totalRevenue: 0,
    avgDealSize: 0,
    customerRetention: 0,
    ticketResolutionTime: 0,
    revenueGrowth: 0,
    newCustomers: 0,
    activeCustomers: 0,
    totalTickets: 0,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">보고서 및 대시보드</h2>
          <p className="text-muted-foreground">고객 이탈률, CLV, 서비스 처리 시간 등 주요 성과 지표(KPI)를 시각화하여 제공합니다.</p>
        </div>
      </div>

      {/* LLM 인사이트 리포트 배너 */}
      <Card className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white border-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <CardContent className="py-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Brain className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  LLM 기반 인사이트 리포트
                  <Sparkles className="h-6 w-6 text-yellow-300" />
                </h3>
                <p className="text-white/80 mt-1">
                  AI가 분석한 종합 비즈니스 인텔리전스 및 실행 가능한 인사이트를 확인하세요.
                </p>
              </div>
            </div>
            <Link href="/dashboard/reports/insight">
              <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-white/90 gap-2">
                <FileText className="h-5 w-5" />
                인사이트 리포트 보기
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          
          {/* 빠른 통계 미리보기 */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-white/70 text-sm">이번 달 매출</p>
              <p className="text-xl font-bold">₩{kpi.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-white/70 text-sm">활성 고객</p>
              <p className="text-xl font-bold">{kpi.activeCustomers}명</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-white/70 text-sm">신규 고객</p>
              <p className="text-xl font-bold">{kpi.newCustomers}명</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-white/70 text-sm">처리된 티켓</p>
              <p className="text-xl font-bold">{kpi.totalTickets}건</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출 (이번 달)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{kpi.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center mt-1">
              {kpi.revenueGrowth >= 0 ? (
                <span className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{kpi.revenueGrowth.toFixed(1)}% 전월 대비
                </span>
              ) : (
                <span className="text-xs text-red-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {kpi.revenueGrowth.toFixed(1)}% 전월 대비
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 거래 규모</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{Math.round(kpi.avgDealSize).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">건당 평균 매출</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">고객 유지율</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.customerRetention.toFixed(1)}%</div>
            <Progress value={kpi.customerRetention} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 티켓 처리 시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.ticketResolutionTime.toFixed(1)}시간</div>
            <p className="text-xs text-muted-foreground">
              {kpi.ticketResolutionTime <= 4 ? "✅ 목표(4시간) 달성" : "⚠️ 목표(4시간) 미달"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 리포트 유형 선택 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/reports/insight?period=weekly">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                주간 리포트
                <ArrowUpRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>지난 7일간의 비즈니스 성과를 분석합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span>매출, 고객, 지원 현황</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/reports/insight?period=monthly">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-2 border-purple-200 bg-purple-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                월간 리포트
                <Badge className="ml-2">추천</Badge>
                <ArrowUpRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>이번 달의 종합 성과와 트렌드를 분석합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LineChart className="h-4 w-4" />
                <span>AI 인사이트 포함</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/reports/insight?period=yearly">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                연간 리포트
                <ArrowUpRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>올해의 전체적인 비즈니스 성장을 분석합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PieChart className="h-4 w-4" />
                <span>장기 트렌드 분석</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 빠른 인사이트 미리보기 */}
      {reportData && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                매출 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">총 주문 건수</span>
                <span className="font-bold">{reportData.sales.orderCount}건</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">평균 주문 금액</span>
                <span className="font-bold">₩{Math.round(reportData.sales.avgOrderValue).toLocaleString()}</span>
              </div>
              {reportData.sales.topChannels.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">주요 채널</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {reportData.sales.topChannels.slice(0, 3).map((ch, idx) => (
                      <Badge key={idx} variant="secondary">{ch.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                고객 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">전체 고객</span>
                <span className="font-bold">{reportData.customers.totalCustomers}명</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">VIP 고객</span>
                <span className="font-bold text-purple-600">{reportData.customers.vipCustomers}명</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-red-600">이탈 위험</span>
                <span className="font-bold text-red-600">{reportData.customers.churnRisk}명</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}