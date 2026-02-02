import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSalesOverview, getRecentOrders, getTopProducts, getMonthlySalesTrend, getSalesStatsByChannel } from "@/app/actions/sales";
import { DollarSign, ShoppingCart, TrendingUp, CreditCard, Activity, BarChart3 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SalesCharts } from "@/components/sales/sales-charts";

export default async function SalesStatusPage() {
  let overview, recentOrders, topProducts, monthlyTrend, channelStats;
  let error: Error | null = null;

  try {
    overview = await getSalesOverview();
    recentOrders = await getRecentOrders();
    topProducts = await getTopProducts();
    monthlyTrend = await getMonthlySalesTrend();
    channelStats = await getSalesStatsByChannel();
  } catch (e) {
    console.error("Error loading sales data:", e);
    error = e instanceof Error ? e : new Error(String(e));
  }

  if (error || !overview || !recentOrders || !topProducts) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">데이터를 불러올 수 없습니다.</h2>
        <p className="text-muted-foreground mt-2">데이터베이스 연결을 확인해주세요.</p>
        {error && (
          <pre className="mt-4 p-4 bg-slate-100 rounded text-left text-xs overflow-auto max-w-lg mx-auto">
            {String(error)}
          </pre>
        )}
      </div>
    );
  }

  const marginRate = overview.totalRevenue > 0 ? (overview.totalMargin / overview.totalRevenue) * 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">판매 현황 대시보드</h2>
        <p className="text-muted-foreground">실시간 매출, 수익성, 채널별 성과를 한눈에 파악하세요.</p>
      </div>

      <div className="flex space-x-2">
        <Link href="/dashboard/sales">
          <Button variant="default">개요</Button>
        </Link>
        <Link href="/dashboard/sales/report">
          <Button variant="outline">매출 상세 현황</Button>
        </Link>
        <Link href="/dashboard/sales/channel-stats">
          <Button variant="outline">채널별 분석</Button>
        </Link>
        <Link href="/dashboard/sales/period-stats">
          <Button variant="outline">기간별 성과</Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출 (당월)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(overview.totalRevenue || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">순이익 (당월)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{(overview.totalMargin || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">마진율</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{marginRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">주문 건수</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(overview.orderCount || 0).toLocaleString()}건</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">객단가</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(Math.round(overview.avgOrderValue || 0)).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">마진율</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marginRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <SalesCharts monthlyTrend={monthlyTrend || []} channelStats={channelStats || []} />

      {/* Recent Orders & Top Products */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>최근 주문 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>주문 ID</TableHead>
                  <TableHead>고객</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.customer?.name || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground">{order.customer?.email || ''}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.status === "COMPLETED" ? "default" : "secondary"}>
                        {order.status === "COMPLETED" ? "완료" : "대기중"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{(Number(order.totalAmount) || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>인기 상품 TOP 5</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {topProducts.map((product: any, index: number) => (
                <div className="flex items-center" key={index}>
                  <div className="ml-4 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">{product.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.sales || 0}개 판매됨
                    </p>
                  </div>
                  <div className="ml-auto font-medium">{(product.revenue || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}