"use client";

import { useState } from "react";
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
  Database, RefreshCw, CheckCircle, Link, Users,
  ShoppingCart, FileText, ArrowRight, Zap
} from "lucide-react";

export default function DataIntegrationPage() {
  const [syncing, setSyncing] = useState(false);

  const [dataSources] = useState([
    { name: "스마트스토어", type: "주문/고객", records: 12450, lastSync: "2025-12-03 14:30", status: "connected" },
    { name: "쿠팡", type: "주문/고객", records: 8920, lastSync: "2025-12-03 14:25", status: "connected" },
    { name: "11번가", type: "주문/고객", records: 4250, lastSync: "2025-12-03 13:00", status: "connected" },
    { name: "자사몰", type: "주문/고객/리뷰", records: 3180, lastSync: "2025-12-03 14:35", status: "connected" },
    { name: "카카오톡 채널", type: "상담", records: 2840, lastSync: "2025-12-03 12:00", status: "warning" },
  ]);

  const [stats] = useState({
    totalCustomers: 8920,
    mergedProfiles: 7845,
    duplicatesResolved: 1075,
    dataCompleteness: 94,
  });

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">고객 정보 통합</h2>
          <p className="text-muted-foreground">여러 채널의 고객 데이터를 통합 관리합니다</p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          전체 동기화
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 고객</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers.toLocaleString()}명</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">통합 프로필</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.mergedProfiles.toLocaleString()}명</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">중복 해결</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.duplicatesResolved.toLocaleString()}건</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">데이터 완성도</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dataCompleteness}%</div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-primary" style={{ width: `${stats.dataCompleteness}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>연동된 데이터 소스</CardTitle>
          <CardDescription>각 채널별 데이터 연동 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>소스</TableHead>
                <TableHead>데이터 유형</TableHead>
                <TableHead>레코드 수</TableHead>
                <TableHead>마지막 동기화</TableHead>
                <TableHead>상태</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataSources.map((source, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell>{source.type}</TableCell>
                  <TableCell>{source.records.toLocaleString()}</TableCell>
                  <TableCell>{source.lastSync}</TableCell>
                  <TableCell>
                    {source.status === "connected" ? (
                      <Badge className="bg-green-500">연결됨</Badge>
                    ) : (
                      <Badge className="bg-yellow-500">확인 필요</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">동기화</Button>
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
