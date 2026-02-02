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
  CheckCircle, AlertTriangle, XCircle, RefreshCw, 
  FileSearch, Wrench, Database
} from "lucide-react";

export default function DataQualityPage() {
  const [scanning, setScanning] = useState(false);

  const [qualityMetrics] = useState([
    { name: "고객 정보", completeness: 96, accuracy: 98, consistency: 94, issues: 12 },
    { name: "주문 데이터", completeness: 99, accuracy: 97, consistency: 98, issues: 5 },
    { name: "상품 정보", completeness: 92, accuracy: 95, consistency: 89, issues: 28 },
    { name: "리뷰 데이터", completeness: 88, accuracy: 92, consistency: 91, issues: 15 },
  ]);

  const [issues] = useState([
    { id: "1", type: "누락", field: "고객 전화번호", count: 45, severity: "medium" },
    { id: "2", type: "형식 오류", field: "이메일 주소", count: 12, severity: "low" },
    { id: "3", type: "중복", field: "주문번호", count: 3, severity: "high" },
    { id: "4", type: "불일치", field: "상품 가격", count: 8, severity: "high" },
  ]);

  const getScoreColor = (score: number) => {
    if (score >= 95) return "text-green-600";
    if (score >= 85) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high": return <Badge variant="destructive">높음</Badge>;
      case "medium": return <Badge className="bg-yellow-500">보통</Badge>;
      default: return <Badge variant="secondary">낮음</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">데이터 품질 관리</h2>
          <p className="text-muted-foreground">데이터 품질을 모니터링하고 개선합니다</p>
        </div>
        <Button onClick={() => { setScanning(true); setTimeout(() => setScanning(false), 2000); }} disabled={scanning}>
          <FileSearch className={`mr-2 h-4 w-4 ${scanning ? "animate-pulse" : ""}`} />
          품질 검사
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 품질 점수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">94점</div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-green-500" style={{ width: "94%" }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">완전성</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">정확성</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96%</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">발견된 이슈</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">68건</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>데이터 영역별 품질</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>데이터 영역</TableHead>
                <TableHead className="text-center">완전성</TableHead>
                <TableHead className="text-center">정확성</TableHead>
                <TableHead className="text-center">일관성</TableHead>
                <TableHead className="text-center">이슈</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qualityMetrics.map((metric, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{metric.name}</TableCell>
                  <TableCell className={`text-center font-bold ${getScoreColor(metric.completeness)}`}>{metric.completeness}%</TableCell>
                  <TableCell className={`text-center font-bold ${getScoreColor(metric.accuracy)}`}>{metric.accuracy}%</TableCell>
                  <TableCell className={`text-center font-bold ${getScoreColor(metric.consistency)}`}>{metric.consistency}%</TableCell>
                  <TableCell className="text-center">{metric.issues}건</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>발견된 이슈</CardTitle>
          <CardDescription>해결이 필요한 데이터 품질 문제</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>유형</TableHead>
                <TableHead>필드</TableHead>
                <TableHead>건수</TableHead>
                <TableHead>심각도</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>{issue.type}</TableCell>
                  <TableCell className="font-medium">{issue.field}</TableCell>
                  <TableCell>{issue.count}건</TableCell>
                  <TableCell>{getSeverityBadge(issue.severity)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      <Wrench className="mr-1 h-4 w-4" />수정
                    </Button>
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
