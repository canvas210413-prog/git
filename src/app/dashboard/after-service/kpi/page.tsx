"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  CheckCircle2,
  Clock,
  Star,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  Users,
  Filter,
  Calendar,
  Package,
  Sparkles,
  ArrowRight,
  Target,
  Zap,
  BarChart3,
  PieChart,
  RefreshCw,
  Wrench,
} from "lucide-react";
import Link from "next/link";

interface KPIData {
  summary: {
    totalCount: number;
    completedCount: number;
    inProgressCount: number;
    receivedCount: number;
    asCount: number;
    exchangeCount: number;
    resolutionRate: number;
    avgProcessingTime: number;
    avgResponseTime: number;
  };
  costs: {
    totalCost: number;
    avgCost: number;
    estimatedTotalCost: number;
  };
  distributions: {
    company: Record<string, number>;
    product: Record<string, number>;
    priority: Record<string, number>;
    status: Record<string, number>;
    assignee: Record<string, number>;
  };
  trends: {
    daily: Array<{ date: string; count: number }>;
  };
  dateRange: {
    start: string;
    end: string;
  };
}

const priorityLabels: Record<string, string> = {
  HIGH: "긴급",
  NORMAL: "보통",
  LOW: "낮음",
};

const statusLabels: Record<string, string> = {
  RECEIVED: "접수",
  IN_PROGRESS: "처리",
  AS: "AS",
  EXCHANGE: "교환",
};

export default function ASKPIPage() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30"); // "7", "30", "90", "365", "all"
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  // 기간 선택 변경 처리
  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const end = new Date();
    let start = new Date();
    
    if (range === "all") {
      start = new Date("2020-01-01"); // 전체 기간 (충분한 과거 날짜)
    } else {
      start.setDate(end.getDate() - parseInt(range));
    }
    
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const fetchKPI = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange !== "all") {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }
      const response = await fetch(
        `/api/after-service/kpi?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setKpiData(data);
      }
    } catch (error) {
      console.error("KPI 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPI();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">KPI 데이터 로딩 중...</div>
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">KPI 데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  const { summary, costs, distributions, trends } = kpiData;

  // null 체크를 위한 안전 처리
  const safeCosts = {
    totalCost: costs?.totalCost ?? 0,
    avgCost: costs?.avgCost ?? 0,
    estimatedTotalCost: costs?.estimatedTotalCost ?? 0,
  };

  // 목표 대비 달성률 계산
  const targetResolutionRate = 90; // 목표 해결률
  const targetAvgProcessingTime = 24; // 목표 평균 처리 시간 (시간)

  const resolutionProgress = Math.min((summary.resolutionRate / targetResolutionRate) * 100, 100);
  const processingTimeProgress = summary.avgProcessingTime > 0 
    ? Math.min((targetAvgProcessingTime / summary.avgProcessingTime) * 100, 100) 
    : 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            AS KPI 대시보드
          </h1>
          <p className="text-muted-foreground mt-1">
            {new Date(kpiData.dateRange.start).toLocaleDateString('ko-KR')} ~{" "}
            {new Date(kpiData.dateRange.end).toLocaleDateString('ko-KR')} 기준
          </p>
        </div>
        <div className="flex gap-2 items-end flex-wrap">
          {/* 빠른 기간 선택 버튼 */}
          <div className="flex gap-1">
            {[
              { value: "7", label: "7일" },
              { value: "30", label: "30일" },
              { value: "90", label: "90일" },
              { value: "365", label: "1년" },
              { value: "all", label: "전체" },
            ].map((option) => (
              <Button
                key={option.value}
                variant={dateRange === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleDateRangeChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <Label htmlFor="startDate" className="text-xs">시작일</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateRange("custom");
              }}
              className="w-36"
            />
          </div>
          <div>
            <Label htmlFor="endDate" className="text-xs">종료일</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateRange("custom");
              }}
              className="w-36"
            />
          </div>
          <Button onClick={fetchKPI} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            조회
          </Button>
          <Link href="/dashboard/after-service/insights">
            <Button variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI 인사이트
            </Button>
          </Link>
        </div>
      </div>

      {/* 핵심 성과 지표 - 목표 대비 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">해결률</CardTitle>
              <Badge variant={summary.resolutionRate >= targetResolutionRate ? "default" : "secondary"}>
                목표 {targetResolutionRate}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{summary.resolutionRate}</span>
              <span className="text-xl text-muted-foreground">%</span>
              {summary.resolutionRate >= targetResolutionRate ? (
                <TrendingUp className="h-5 w-5 text-green-500 ml-2" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500 ml-2" />
              )}
            </div>
            <Progress value={resolutionProgress} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {summary.completedCount}건 완료 / {summary.totalCount}건 접수
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">평균 처리 시간</CardTitle>
              <Badge variant={summary.avgProcessingTime <= targetAvgProcessingTime ? "default" : "secondary"}>
                목표 {targetAvgProcessingTime}h
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{summary.avgProcessingTime}</span>
              <span className="text-xl text-muted-foreground">시간</span>
              {summary.avgProcessingTime <= targetAvgProcessingTime ? (
                <TrendingUp className="h-5 w-5 text-green-500 ml-2" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500 ml-2" />
              )}
            </div>
            <Progress value={processingTimeProgress} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              응답 시간: {summary.avgResponseTime}시간
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 전체 현황 요약 */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Activity className="h-5 w-5" />
            전체 AS 현황
          </CardTitle>
          <CardDescription>총 접수 건수 및 처리 상태</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-white/60 dark:bg-gray-900/60 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">총 접수</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{summary.totalCount}</p>
            </div>
            <div className="text-center p-4 bg-white/60 dark:bg-gray-900/60 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">접수 대기</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{summary.receivedCount}</p>
            </div>
            <div className="text-center p-4 bg-white/60 dark:bg-gray-900/60 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">진행 중</p>
              <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{summary.inProgressCount}</p>
            </div>
            <div className="text-center p-4 bg-white/60 dark:bg-gray-900/60 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">완료</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.completedCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 처리 유형 분류 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-purple-50 dark:bg-purple-950 border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Wrench className="h-5 w-5" />
              AS 처리
            </CardTitle>
            <CardDescription>수리/점검 건수</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-purple-700 dark:text-purple-300">{summary.asCount}</span>
              <span className="text-xl text-muted-foreground">건</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Progress value={(summary.asCount / summary.totalCount) * 100} className="flex-1 h-2" />
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {summary.totalCount > 0 ? ((summary.asCount / summary.totalCount) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-950 border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <Package className="h-5 w-5" />
              교환 처리
            </CardTitle>
            <CardDescription>제품 교환 건수</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-orange-700 dark:text-orange-300">{summary.exchangeCount}</span>
              <span className="text-xl text-muted-foreground">건</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Progress value={(summary.exchangeCount / summary.totalCount) * 100} className="flex-1 h-2" />
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {summary.totalCount > 0 ? ((summary.exchangeCount / summary.totalCount) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 비용 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            비용 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">총 비용</p>
              <p className="text-2xl font-bold">{safeCosts.totalCost.toLocaleString()}원</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">건당 평균</p>
              <p className="text-2xl font-bold">{safeCosts.avgCost.toLocaleString()}원</p>
            </div>
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">추정 비용</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{safeCosts.estimatedTotalCost.toLocaleString()}원</p>
              <p className="text-xs text-muted-foreground">
                {safeCosts.totalCost > 0 ? ((safeCosts.estimatedTotalCost / safeCosts.totalCost) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 일별 추이 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            일별 접수 추이
          </CardTitle>
          <CardDescription>최근 7일간 AS 접수 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-48">
            {trends.daily.map((day, index) => {
              const maxCount = Math.max(...trends.daily.map((d) => d.count), 1);
              const height = (day.count / maxCount) * 100;
              const isToday = index === trends.daily.length - 1;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div className="text-sm font-medium mb-2">{day.count}건</div>
                  <div className="w-full bg-muted rounded-t-lg relative" style={{ height: '160px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-lg transition-all ${isToday ? 'bg-primary' : 'bg-primary/60'}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(day.date).getMonth() + 1}/{new Date(day.date).getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 분포 차트 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 업체별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              업체별 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(distributions.company)
                .sort(([, a], [, b]) => b - a)
                .map(([company, count]) => {
                  const percentage = summary.totalCount > 0 ? ((count / summary.totalCount) * 100).toFixed(1) : 0;
                  return (
                    <div key={company} className="flex items-center gap-3">
                      <div className="w-24 text-sm font-medium truncate">{company}</div>
                      <div className="flex-1">
                        <Progress value={Number(percentage)} className="h-6" />
                      </div>
                      <div className="w-20 text-right text-sm">
                        <span className="font-medium">{count}</span>
                        <span className="text-muted-foreground ml-1">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* 제품별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              제품별 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(distributions.product)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([product, count]) => {
                  const percentage = summary.totalCount > 0 ? ((count / summary.totalCount) * 100).toFixed(1) : 0;
                  return (
                    <div key={product} className="flex items-center gap-3">
                      <div className="w-32 text-sm font-medium truncate">{product}</div>
                      <div className="flex-1">
                        <Progress value={Number(percentage)} className="h-6" />
                      </div>
                      <div className="w-20 text-right text-sm">
                        <span className="font-medium">{count}</span>
                        <span className="text-muted-foreground ml-1">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* 상태별 파이프라인 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              처리 파이프라인
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {[
                { key: 'RECEIVED', label: '접수', color: 'bg-blue-500', icon: Package },
                { key: 'IN_PROGRESS', label: '진행', color: 'bg-yellow-500', icon: Clock },
                { key: 'COMPLETED', label: '완료', color: 'bg-green-500', icon: CheckCircle2 },
              ].map((stage, index) => {
                const count = distributions.status[stage.key] || 0;
                const Icon = stage.icon;
                return (
                  <div key={stage.key} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-16 h-16 rounded-full ${stage.color} flex items-center justify-center text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium mt-2">{stage.label}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    {index < 2 && (
                      <ArrowRight className="h-6 w-6 text-muted-foreground mx-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 우선순위별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              우선순위 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'HIGH', label: '긴급', color: 'bg-red-100 text-red-700 border-red-200' },
                { key: 'NORMAL', label: '보통', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                { key: 'LOW', label: '낮음', color: 'bg-gray-100 text-gray-700 border-gray-200' },
              ].map((priority) => {
                const count = distributions.priority[priority.key] || 0;
                return (
                  <div key={priority.key} className={`p-4 rounded-lg border-2 ${priority.color} text-center`}>
                    <p className="text-sm font-medium">{priority.label}</p>
                    <p className="text-3xl font-bold">{count}</p>
                    <p className="text-xs opacity-70">
                      {summary.totalCount > 0 ? ((count / summary.totalCount) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 담당자별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              담당자별 처리 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(distributions.assignee)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([assignee, count], index) => (
                  <div key={assignee} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-blue-400'}`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{assignee}</p>
                      <Progress value={(count / summary.totalCount) * 100} className="h-2 mt-1" />
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{count}건</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI 인사이트 바로가기 */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sparkles className="h-12 w-12" />
              <div>
                <h3 className="text-xl font-bold">AI 인사이트 분석</h3>
                <p className="text-white/80">LLM이 AS 데이터를 분석하여 인사이트와 개선 제안을 제공합니다.</p>
              </div>
            </div>
            <Link href="/dashboard/after-service/insights">
              <Button variant="secondary" className="gap-2">
                분석 시작
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
