"use client";

import { useState, useEffect } from "react";
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
  RefreshCw, TrendingUp, TrendingDown, Users, ShoppingCart, 
  DollarSign, Star, Clock, Target, ArrowUp, ArrowDown, Minus,
  Activity, BarChart3, PieChart
} from "lucide-react";
import { getDashboardKPIs } from "@/app/actions/dashboard";

interface KPIData {
  label: string;
  value: string | number;
  change: number;
  changeType: "increase" | "decrease" | "neutral";
  target?: number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
}

export default function KPIDashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadKPIs = async () => {
    setLoading(true);
    try {
      const data = await getDashboardKPIs();
      setKpis(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load KPIs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKPIs();
    // 30초마다 자동 새로고침
    const interval = setInterval(loadKPIs, 30000);
    return () => clearInterval(interval);
  }, []);

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case "increase": return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "decrease": return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeColor = (changeType: string, isPositiveGood: boolean = true) => {
    if (changeType === "neutral") return "text-gray-500";
    if (changeType === "increase") return isPositiveGood ? "text-green-500" : "text-red-500";
    return isPositiveGood ? "text-red-500" : "text-green-500";
  };

  const kpiCards: KPIData[] = kpis ? [
    {
      label: "오늘 매출",
      value: `₩${(kpis.totalRevenue || 0).toLocaleString()}`,
      change: 12.5,
      changeType: "increase",
      target: 10000000,
      icon: <DollarSign className="h-5 w-5" />,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "주문 건수",
      value: kpis.totalOrders || 0,
      change: 8.2,
      changeType: "increase",
      unit: "건",
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "신규 고객",
      value: kpis.newCustomers || 0,
      change: 15.3,
      changeType: "increase",
      unit: "명",
      icon: <Users className="h-5 w-5" />,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "평균 객단가",
      value: `₩${Math.round(kpis.avgOrderValue || 0).toLocaleString()}`,
      change: -2.1,
      changeType: "decrease",
      icon: <Target className="h-5 w-5" />,
      color: "bg-orange-100 text-orange-600",
    },
    {
      label: "고객 만족도",
      value: "4.5",
      change: 0.2,
      changeType: "increase",
      unit: "/ 5.0",
      icon: <Star className="h-5 w-5" />,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      label: "재구매율",
      value: `${kpis.repeatCustomers || 0}%`,
      change: 5.4,
      changeType: "increase",
      icon: <RefreshCw className="h-5 w-5" />,
      color: "bg-cyan-100 text-cyan-600",
    },
    {
      label: "평균 응답 시간",
      value: "2.5",
      change: -15,
      changeType: "decrease",
      unit: "분",
      icon: <Clock className="h-5 w-5" />,
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      label: "전환율",
      value: "3.2%",
      change: 0.5,
      changeType: "increase",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "bg-pink-100 text-pink-600",
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">실시간 KPI 대시보드</h2>
          <p className="text-muted-foreground">
            핵심 성과 지표를 실시간으로 모니터링합니다
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            마지막 업데이트: {lastUpdated.toLocaleTimeString("ko-KR")}
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">오늘</SelectItem>
              <SelectItem value="week">이번 주</SelectItem>
              <SelectItem value="month">이번 달</SelectItem>
              <SelectItem value="quarter">이번 분기</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadKPIs} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* 실시간 상태 표시 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-green-600">실시간 모니터링 중</span>
        </div>
        <Badge variant="outline" className="ml-4">
          <Activity className="mr-1 h-3 w-3" />
          30초 자동 새로고침
        </Badge>
      </div>

      {/* KPI 카드 그리드 */}
      {loading && !kpis ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">KPI 데이터를 불러오는 중...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((kpi, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <div className={`p-2 rounded-full ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{kpi.value}</span>
                  {kpi.unit && <span className="text-sm text-muted-foreground">{kpi.unit}</span>}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {getChangeIcon(kpi.changeType)}
                  <span className={`text-sm font-medium ${getChangeColor(kpi.changeType)}`}>
                    {Math.abs(kpi.change)}%
                  </span>
                  <span className="text-xs text-muted-foreground">전일 대비</span>
                </div>
                {kpi.target && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">목표 대비</span>
                      <span className="font-medium">
                        {Math.round((Number(String(kpi.value).replace(/[₩,]/g, "")) / kpi.target) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ 
                          width: `${Math.min((Number(String(kpi.value).replace(/[₩,]/g, "")) / kpi.target) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 추가 분석 섹션 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 매출 추이 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              시간대별 매출 추이
            </CardTitle>
            <CardDescription>오늘 시간대별 매출 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: "00-06시", value: 120000, percent: 5 },
                { time: "06-12시", value: 580000, percent: 24 },
                { time: "12-18시", value: 920000, percent: 38 },
                { time: "18-24시", value: 780000, percent: 33 },
              ].map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.time}</span>
                    <span className="font-medium">₩{item.value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 채널별 성과 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              채널별 주문 비율
            </CardTitle>
            <CardDescription>판매 채널별 주문 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { channel: "스마트스토어", orders: 45, color: "bg-green-500" },
                { channel: "쿠팡", orders: 28, color: "bg-orange-500" },
                { channel: "11번가", orders: 15, color: "bg-red-500" },
                { channel: "자사몰", orders: 12, color: "bg-blue-500" },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.channel}</span>
                      <span className="font-medium">{item.orders}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden mt-1">
                      <div 
                        className={`h-full ${item.color} transition-all`}
                        style={{ width: `${item.orders}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 목표 달성 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            월간 목표 달성 현황
          </CardTitle>
          <CardDescription>이번 달 목표 대비 달성률</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { label: "매출 목표", current: 45000000, target: 100000000, color: "bg-green-500" },
              { label: "주문 목표", current: 320, target: 500, color: "bg-blue-500" },
              { label: "신규고객", current: 85, target: 150, color: "bg-purple-500" },
              { label: "리뷰 목표", current: 42, target: 100, color: "bg-yellow-500" },
            ].map((item, index) => {
              const percent = Math.round((item.current / item.target) * 100);
              return (
                <div key={index} className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-secondary"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${percent * 2.51} 251`}
                        className={item.color.replace("bg-", "text-")}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">{percent}%</span>
                    </div>
                  </div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.current.toLocaleString()} / {item.target.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
