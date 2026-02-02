"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PieChart, Users, HelpCircle, BarChart2, ArrowRight,
  TrendingUp, Activity
} from "lucide-react";
import Link from "next/link";

export default function PerformancePage() {
  const menuItems = [
    {
      title: "실시간 KPI 대시보드",
      description: "핵심 성과 지표를 실시간으로 모니터링합니다",
      icon: <PieChart className="h-8 w-8" />,
      href: "/dashboard/performance/kpi",
      color: "bg-blue-100 text-blue-600",
      stats: "8개 주요 KPI",
    },
    {
      title: "고객 현황 분석",
      description: "고객 세그먼트별 현황과 트렌드를 분석합니다",
      icon: <Users className="h-8 w-8" />,
      href: "/dashboard/customers",
      color: "bg-purple-100 text-purple-600",
      stats: "5개 세그먼트",
    },
    {
      title: "문의 현황 분석",
      description: "고객 문의 처리 현황과 성과를 분석합니다",
      icon: <HelpCircle className="h-8 w-8" />,
      href: "/dashboard/performance/inquiry",
      color: "bg-green-100 text-green-600",
      stats: "실시간 현황",
    },
    {
      title: "채널별 성과 비교",
      description: "판매 채널별 성과를 비교하고 분석합니다",
      icon: <BarChart2 className="h-8 w-8" />,
      href: "/dashboard/performance/channel",
      color: "bg-orange-100 text-orange-600",
      stats: "5개 채널",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">성과 관리</h2>
        <p className="text-muted-foreground">
          비즈니스 성과를 다양한 관점에서 분석하고 모니터링합니다
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 매출</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩2,450만</div>
            <p className="text-xs text-green-500">+12.5% 전일 대비</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 주문</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156건</div>
            <p className="text-xs text-blue-500">+8.2% 전일 대비</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">미처리 문의</CardTitle>
            <HelpCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23건</div>
            <p className="text-xs text-yellow-500">빠른 처리 필요</p>
          </CardContent>
        </Card>
      </div>

      {/* 메뉴 카드 */}
      <div className="grid gap-6 md:grid-cols-2">
        {menuItems.map((item, index) => (
          <Link key={index} href={item.href}>
            <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${item.color}`}>
                    {item.icon}
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.stats}</span>
                  <Button variant="ghost" size="sm">
                    자세히 보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
