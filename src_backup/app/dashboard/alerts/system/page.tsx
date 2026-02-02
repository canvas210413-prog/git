"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  AlertCircle, CheckCircle, Clock, Server, Database,
  Wifi, RefreshCw, Settings, XCircle, AlertTriangle
} from "lucide-react";

interface SystemAlert {
  id: string;
  time: string;
  type: "error" | "warning" | "info";
  category: string;
  message: string;
  status: "active" | "resolved";
  affectedService: string;
}

export default function SystemAlertsPage() {
  const [alertEnabled, setAlertEnabled] = useState(true);
  
  const [systemStatus, setSystemStatus] = useState({
    api: "online",
    database: "online",
    payment: "warning",
    notification: "online",
  });

  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: "1",
      time: "2025-12-03 14:32",
      type: "error",
      category: "결제 시스템",
      message: "PG사 응답 지연 (5초 이상)",
      status: "active",
      affectedService: "결제 처리",
    },
    {
      id: "2",
      time: "2025-12-03 13:15",
      type: "warning",
      category: "데이터베이스",
      message: "DB 연결 풀 사용량 80% 초과",
      status: "active",
      affectedService: "전체 서비스",
    },
    {
      id: "3",
      time: "2025-12-03 10:45",
      type: "error",
      category: "API",
      message: "네이버 API 호출 실패 (429 Too Many Requests)",
      status: "resolved",
      affectedService: "리뷰 수집",
    },
    {
      id: "4",
      time: "2025-12-02 22:10",
      type: "warning",
      category: "서버",
      message: "메모리 사용량 85% 도달",
      status: "resolved",
      affectedService: "전체 서비스",
    },
  ]);

  const handleResolve = (id: string) => {
    setAlerts(alerts.map(a => 
      a.id === id ? { ...a, status: "resolved" as const } : a
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "error": return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "error": return <Badge variant="destructive">오류</Badge>;
      case "warning": return <Badge className="bg-yellow-500">경고</Badge>;
      default: return <Badge variant="secondary">정보</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "offline": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">시스템 오류 알림</h2>
          <p className="text-muted-foreground">
            시스템 장애 및 오류를 실시간으로 모니터링합니다
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

      {/* 시스템 상태 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Server className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">API 서버</p>
                <p className="text-sm text-muted-foreground">응답 정상</p>
              </div>
            </div>
            {getStatusIcon(systemStatus.api)}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">데이터베이스</p>
                <p className="text-sm text-muted-foreground">연결 정상</p>
              </div>
            </div>
            {getStatusIcon(systemStatus.database)}
          </CardContent>
        </Card>

        <Card className="border-yellow-300">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Wifi className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="font-medium">결제 시스템</p>
                <p className="text-sm text-yellow-600">응답 지연</p>
              </div>
            </div>
            {getStatusIcon(systemStatus.payment)}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">알림 서비스</p>
                <p className="text-sm text-muted-foreground">정상 작동</p>
              </div>
            </div>
            {getStatusIcon(systemStatus.notification)}
          </CardContent>
        </Card>
      </div>

      {/* 활성 알림 요약 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">오류</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">
              {alerts.filter(a => a.type === "error" && a.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">경고</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">
              {alerts.filter(a => a.type === "warning" && a.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">처리 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {alerts.filter(a => a.status === "resolved").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 알림 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>알림 내역</CardTitle>
          <CardDescription>시스템 오류 및 경고 발생 기록</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>발생 시간</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>메시지</TableHead>
                <TableHead>영향 범위</TableHead>
                <TableHead>상태</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id} className={alert.status === "active" ? "bg-red-50" : ""}>
                  <TableCell>{getTypeIcon(alert.type)}</TableCell>
                  <TableCell className="text-sm">{alert.time}</TableCell>
                  <TableCell>{getTypeBadge(alert.type)}</TableCell>
                  <TableCell>{alert.category}</TableCell>
                  <TableCell className="max-w-xs truncate">{alert.message}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{alert.affectedService}</TableCell>
                  <TableCell>
                    {alert.status === "active" ? (
                      <Badge variant="destructive">활성</Badge>
                    ) : (
                      <Badge variant="secondary">처리됨</Badge>
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
