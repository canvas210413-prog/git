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
  HardDrive, Download, Upload, Clock, CheckCircle,
  Calendar, Database, RefreshCw, Shield
} from "lucide-react";

export default function BackupPage() {
  const [autoBackup, setAutoBackup] = useState(true);
  const [backing, setBacking] = useState(false);

  const [backupHistory] = useState([
    { id: "1", date: "2025-12-03 06:00", type: "자동", size: "2.4 GB", status: "success", duration: "12분" },
    { id: "2", date: "2025-12-02 06:00", type: "자동", size: "2.3 GB", status: "success", duration: "11분" },
    { id: "3", date: "2025-12-01 15:30", type: "수동", size: "2.3 GB", status: "success", duration: "10분" },
    { id: "4", date: "2025-12-01 06:00", type: "자동", size: "2.2 GB", status: "success", duration: "11분" },
    { id: "5", date: "2025-11-30 06:00", type: "자동", size: "2.2 GB", status: "success", duration: "12분" },
  ]);

  const [stats] = useState({
    lastBackup: "2025-12-03 06:00",
    totalBackups: 45,
    storageUsed: 48.5,
    storageTotal: 100,
    nextBackup: "2025-12-04 06:00",
  });

  const handleBackup = () => {
    setBacking(true);
    setTimeout(() => setBacking(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">백업 및 복구</h2>
          <p className="text-muted-foreground">데이터 백업 및 복구를 관리합니다</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
            <Label>자동 백업 (매일 06:00)</Label>
          </div>
          <Button onClick={handleBackup} disabled={backing}>
            {backing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <HardDrive className="mr-2 h-4 w-4" />}
            {backing ? "백업 중..." : "지금 백업"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">마지막 백업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{stats.lastBackup}</div>
            <div className="flex items-center gap-1 mt-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">성공</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">다음 백업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{stats.nextBackup}</div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">예정됨</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 백업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBackups}회</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">스토리지 사용량</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{stats.storageUsed} / {stats.storageTotal} GB</div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(stats.storageUsed / stats.storageTotal) * 100}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              백업 항목
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["고객 데이터", "주문 데이터", "상품 데이터", "리뷰 데이터", "설정 데이터"].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <span>{item}</span>
                  <Badge className="bg-green-500">포함</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>빠른 작업</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              최신 백업 다운로드
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              백업 파일 업로드
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Database className="mr-2 h-4 w-4" />
              데이터 복구
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>백업 기록</CardTitle>
          <CardDescription>최근 백업 내역</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>일시</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>크기</TableHead>
                <TableHead>소요 시간</TableHead>
                <TableHead>상태</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backupHistory.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell>{backup.date}</TableCell>
                  <TableCell><Badge variant="outline">{backup.type}</Badge></TableCell>
                  <TableCell>{backup.size}</TableCell>
                  <TableCell>{backup.duration}</TableCell>
                  <TableCell><Badge className="bg-green-500">성공</Badge></TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost"><Download className="h-4 w-4" /></Button>
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
