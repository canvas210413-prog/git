"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  TrendingUp, Bell, Clock, ShoppingCart, AlertTriangle,
  ArrowUp, RefreshCw, Settings, CheckCircle
} from "lucide-react";

interface OrderAlert {
  id: string;
  time: string;
  orderCount: number;
  avgCount: number;
  increaseRate: number;
  status: "active" | "resolved";
  channel: string;
}

export default function OrderAlertsPage() {
  const [loading, setLoading] = useState(false);
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [threshold, setThreshold] = useState("50");
  
  const [currentStats, setCurrentStats] = useState({
    todayOrders: 156,
    hourlyAvg: 12,
    currentHour: 28,
    increaseRate: 133,
  });

  const [alerts, setAlerts] = useState<OrderAlert[]>([
    {
      id: "1",
      time: "2025-12-03 14:00",
      orderCount: 45,
      avgCount: 18,
      increaseRate: 150,
      status: "active",
      channel: "스마트스토어",
    },
    {
      id: "2",
      time: "2025-12-03 11:00",
      orderCount: 38,
      avgCount: 20,
      increaseRate: 90,
      status: "resolved",
      channel: "쿠팡",
    },
    {
      id: "3",
      time: "2025-12-02 15:00",
      orderCount: 52,
      avgCount: 22,
      increaseRate: 136,
      status: "resolved",
      channel: "전체",
    },
  ]);

  const handleResolve = (id: string) => {
    setAlerts(alerts.map(a => 
      a.id === id ? { ...a, status: "resolved" as const } : a
    ));
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">주문 급증 알림</h2>
          <p className="text-muted-foreground">
            주문량이 평소보다 급격히 증가할 때 알림을 받습니다
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={alertEnabled} onCheckedChange={setAlertEnabled} />
            <Label>알림 활성화</Label>
          </div>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            설정
          </Button>
        </div>
      </div>

      {/* 실시간 현황 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 주문</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.todayOrders}건</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">시간당 평균</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.hourlyAvg}건</div>
          </CardContent>
        </Card>

        <Card className="border-orange-300 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">현재 시간</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{currentStats.currentHour}건</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUp className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-600">+{currentStats.increaseRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 알림</CardTitle>
            <Bell className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter(a => a.status === "active").length}건
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>알림 기준 설정</CardTitle>
          <CardDescription>평균 대비 몇 % 이상 증가 시 알림을 받을지 설정합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label>급증 기준</Label>
            <Input
              type="number"
              className="w-24"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
            <span className="text-muted-foreground">% 이상 증가 시 알림</span>
            <Button variant="outline" size="sm">저장</Button>
          </div>
        </CardContent>
      </Card>

      {/* 알림 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>알림 내역</CardTitle>
          <CardDescription>주문 급증 알림 발생 기록</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>발생 시간</TableHead>
                <TableHead>채널</TableHead>
                <TableHead className="text-right">주문 수</TableHead>
                <TableHead className="text-right">평균</TableHead>
                <TableHead className="text-right">증가율</TableHead>
                <TableHead>상태</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>{alert.time}</TableCell>
                  <TableCell>{alert.channel}</TableCell>
                  <TableCell className="text-right font-medium">{alert.orderCount}건</TableCell>
                  <TableCell className="text-right text-muted-foreground">{alert.avgCount}건</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="destructive">+{alert.increaseRate}%</Badge>
                  </TableCell>
                  <TableCell>
                    {alert.status === "active" ? (
                      <Badge variant="destructive">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        활성
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        처리됨
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {alert.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id)}>
                        확인
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
