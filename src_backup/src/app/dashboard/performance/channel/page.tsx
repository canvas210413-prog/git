"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  RefreshCw, TrendingUp, TrendingDown, ShoppingCart, 
  DollarSign, Users, BarChart2, Store, Globe, Package,
  ArrowUp, ArrowDown, Minus
} from "lucide-react";

interface ChannelData {
  name: string;
  icon: string;
  color: string;
  orders: number;
  revenue: number;
  customers: number;
  avgOrderValue: number;
  conversionRate: number;
  trend: "up" | "down" | "same";
  trendValue: number;
}

export default function ChannelPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  
  const [channelData, setChannelData] = useState<ChannelData[]>([
    {
      name: "스마트스토어",
      icon: "🛒",
      color: "bg-green-500",
      orders: 1245,
      revenue: 89500000,
      customers: 892,
      avgOrderValue: 71887,
      conversionRate: 3.8,
      trend: "up",
      trendValue: 15.2,
    },
    {
      name: "쿠팡",
      icon: "🚀",
      color: "bg-orange-500",
      orders: 856,
      revenue: 62300000,
      customers: 654,
      avgOrderValue: 72780,
      conversionRate: 4.2,
      trend: "up",
      trendValue: 8.5,
    },
    {
      name: "11번가",
      icon: "🏪",
      color: "bg-red-500",
      orders: 423,
      revenue: 28900000,
      customers: 312,
      avgOrderValue: 68322,
      conversionRate: 2.9,
      trend: "down",
      trendValue: -5.3,
    },
    {
      name: "자사몰",
      icon: "🌐",
      color: "bg-blue-500",
      orders: 312,
      revenue: 35200000,
      customers: 198,
      avgOrderValue: 112821,
      conversionRate: 5.1,
      trend: "up",
      trendValue: 22.4,
    },
    {
      name: "G마켓",
      icon: "🛍️",
      color: "bg-yellow-500",
      orders: 198,
      revenue: 14500000,
      customers: 156,
      avgOrderValue: 73232,
      conversionRate: 2.5,
      trend: "same",
      trendValue: 0.2,
    },
  ]);

  const totalOrders = channelData.reduce((sum, c) => sum + c.orders, 0);
  const totalRevenue = channelData.reduce((sum, c) => sum + c.revenue, 0);
  const totalCustomers = channelData.reduce((sum, c) => sum + c.customers, 0);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, [period]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "down": return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up": return "text-green-500";
      case "down": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">채널별 성과 비교</h2>
          <p className="text-muted-foreground">
            판매 채널별 성과를 비교하고 분석합니다
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">이번 주</SelectItem>
              <SelectItem value="month">이번 달</SelectItem>
              <SelectItem value="quarter">이번 분기</SelectItem>
              <SelectItem value="year">올해</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* 전체 요약 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 주문</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders.toLocaleString()}건</div>
            <p className="text-xs text-muted-foreground mt-1">
              {channelData.length}개 채널 합산
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{(totalRevenue / 100000000).toFixed(1)}억</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-500">+12.3% 전월 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">구매 고객</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers.toLocaleString()}명</div>
            <p className="text-xs text-muted-foreground mt-1">
              중복 제외 순 고객 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 객단가</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₩{Math.round(totalRevenue / totalOrders).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              전체 채널 평균
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 채널별 매출 비율 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>채널별 매출 비율</CardTitle>
          <CardDescription>전체 매출 대비 각 채널의 기여도</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 막대 그래프 */}
            <div className="flex h-8 rounded-full overflow-hidden">
              {channelData.map((channel, index) => (
                <div
                  key={index}
                  className={`${channel.color} transition-all relative group`}
                  style={{ width: `${(channel.revenue / totalRevenue) * 100}%` }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-white font-medium">
                      {Math.round((channel.revenue / totalRevenue) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 범례 */}
            <div className="flex flex-wrap gap-4 justify-center">
              {channelData.map((channel, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${channel.color}`} />
                  <span className="text-sm">{channel.icon} {channel.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({Math.round((channel.revenue / totalRevenue) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 채널별 상세 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            채널별 상세 성과
          </CardTitle>
          <CardDescription>각 채널의 주요 지표를 비교합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>채널</TableHead>
                <TableHead className="text-right">주문 수</TableHead>
                <TableHead className="text-right">매출</TableHead>
                <TableHead className="text-right">고객 수</TableHead>
                <TableHead className="text-right">평균 객단가</TableHead>
                <TableHead className="text-right">전환율</TableHead>
                <TableHead className="text-right">추세</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channelData
                .sort((a, b) => b.revenue - a.revenue)
                .map((channel, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${channel.color}`} />
                        <span className="text-lg">{channel.icon}</span>
                        <span className="font-medium">{channel.name}</span>
                        {index === 0 && (
                          <Badge variant="default" className="ml-2">1위</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {channel.orders.toLocaleString()}건
                      <span className="text-xs text-muted-foreground ml-1">
                        ({Math.round((channel.orders / totalOrders) * 100)}%)
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₩{(channel.revenue / 10000).toLocaleString()}만
                    </TableCell>
                    <TableCell className="text-right">
                      {channel.customers.toLocaleString()}명
                    </TableCell>
                    <TableCell className="text-right">
                      ₩{channel.avgOrderValue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={channel.conversionRate >= 4 ? "default" : "secondary"}>
                        {channel.conversionRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getTrendIcon(channel.trend)}
                        <span className={`text-sm ${getTrendColor(channel.trend)}`}>
                          {channel.trendValue > 0 ? "+" : ""}{channel.trendValue}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 채널별 인사이트 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 성장 채널 */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <TrendingUp className="h-5 w-5" />
              성장 채널
            </CardTitle>
            <CardDescription>전월 대비 성장세를 보이는 채널</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channelData
                .filter(c => c.trend === "up")
                .sort((a, b) => b.trendValue - a.trendValue)
                .map((channel, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{channel.icon}</span>
                      <div>
                        <p className="font-medium">{channel.name}</p>
                        <p className="text-sm text-muted-foreground">
                          매출 ₩{(channel.revenue / 10000).toLocaleString()}만
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      +{channel.trendValue}%
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* 개선 필요 채널 */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <TrendingDown className="h-5 w-5" />
              개선 필요 채널
            </CardTitle>
            <CardDescription>하락세 또는 정체 중인 채널</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channelData
                .filter(c => c.trend === "down" || c.trend === "same")
                .map((channel, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{channel.icon}</span>
                      <div>
                        <p className="font-medium">{channel.name}</p>
                        <p className="text-sm text-muted-foreground">
                          전환율 {channel.conversionRate}%
                        </p>
                      </div>
                    </div>
                    <Badge variant={channel.trend === "down" ? "destructive" : "secondary"}>
                      {channel.trendValue > 0 ? "+" : ""}{channel.trendValue}%
                    </Badge>
                  </div>
                ))}
              {channelData.filter(c => c.trend === "down" || c.trend === "same").length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  모든 채널이 성장세입니다! 🎉
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 추천 액션 */}
      <Card>
        <CardHeader>
          <CardTitle>💡 추천 액션</CardTitle>
          <CardDescription>채널 성과 분석 기반 추천 사항</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🌐 자사몰 강화</h4>
              <p className="text-sm text-muted-foreground">
                가장 높은 객단가(₩112,821)와 전환율(5.1%)을 보이는 자사몰에 
                마케팅 예산을 집중하세요.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🏪 11번가 개선</h4>
              <p className="text-sm text-muted-foreground">
                하락세(-5.3%)인 11번가의 상품 구성과 가격 경쟁력을 
                재검토해보세요.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🛒 스마트스토어 유지</h4>
              <p className="text-sm text-muted-foreground">
                매출 1위 채널의 성장세(+15.2%)를 유지하기 위해 
                리뷰 관리와 프로모션을 지속하세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
