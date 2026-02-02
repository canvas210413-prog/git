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
  RefreshCw, MessageSquare, Clock, CheckCircle, AlertTriangle,
  TrendingUp, TrendingDown, Users, HelpCircle, BarChart3,
  ArrowUp, ArrowDown
} from "lucide-react";

interface InquiryStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  satisfactionRate: number;
}

interface InquiryByType {
  type: string;
  count: number;
  percent: number;
  trend: "up" | "down" | "same";
}

interface InquiryByAgent {
  name: string;
  assigned: number;
  resolved: number;
  avgTime: number;
  satisfaction: number;
}

export default function InquiryAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week");
  
  const [stats, setStats] = useState<InquiryStats>({
    total: 156,
    pending: 23,
    inProgress: 18,
    resolved: 115,
    avgResponseTime: 2.5,
    avgResolutionTime: 24.3,
    satisfactionRate: 4.2,
  });

  const [inquiryByType, setInquiryByType] = useState<InquiryByType[]>([
    { type: "배송 문의", count: 45, percent: 29, trend: "up" },
    { type: "상품 문의", count: 38, percent: 24, trend: "same" },
    { type: "교환/반품", count: 32, percent: 21, trend: "down" },
    { type: "결제 문의", count: 22, percent: 14, trend: "up" },
    { type: "기타", count: 19, percent: 12, trend: "same" },
  ]);

  const [inquiryByAgent, setInquiryByAgent] = useState<InquiryByAgent[]>([
    { name: "김상담", assigned: 42, resolved: 38, avgTime: 18.5, satisfaction: 4.5 },
    { name: "이응대", assigned: 38, resolved: 35, avgTime: 22.3, satisfaction: 4.3 },
    { name: "박서비스", assigned: 35, resolved: 28, avgTime: 28.1, satisfaction: 4.1 },
    { name: "최케어", assigned: 28, resolved: 14, avgTime: 32.4, satisfaction: 3.9 },
  ]);

  useEffect(() => {
    // 시뮬레이션: 데이터 로딩
    setTimeout(() => setLoading(false), 500);
  }, [period]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <ArrowUp className="h-4 w-4 text-red-500" />;
      case "down": return <ArrowDown className="h-4 w-4 text-green-500" />;
      default: return <span className="h-4 w-4 text-gray-400">-</span>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "inProgress": return "bg-blue-100 text-blue-800";
      case "resolved": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">문의 현황 분석</h2>
          <p className="text-muted-foreground">
            고객 문의 현황과 처리 성과를 분석합니다
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">오늘</SelectItem>
              <SelectItem value="week">이번 주</SelectItem>
              <SelectItem value="month">이번 달</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 문의</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}건</div>
            <div className="flex items-center gap-2 mt-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-500">+12% 전주 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기 중</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}건</div>
            <div className="text-sm text-muted-foreground mt-1">
              처리 중: {stats.inProgress}건
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 응답 시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}분</div>
            <div className="flex items-center gap-2 mt-1">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-500">-15% 개선됨</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">고객 만족도</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.satisfactionRate}/5.0</div>
            <div className="flex mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star} 
                  className={`text-lg ${star <= Math.round(stats.satisfactionRate) ? "text-yellow-400" : "text-gray-300"}`}
                >
                  ★
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 문의 처리 현황 게이지 */}
      <Card>
        <CardHeader>
          <CardTitle>문의 처리 현황</CardTitle>
          <CardDescription>전체 문의 대비 처리 상태별 비율</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex h-4 rounded-full overflow-hidden bg-secondary">
              <div 
                className="bg-green-500 transition-all"
                style={{ width: `${(stats.resolved / stats.total) * 100}%` }}
              />
              <div 
                className="bg-blue-500 transition-all"
                style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
              />
              <div 
                className="bg-yellow-500 transition-all"
                style={{ width: `${(stats.pending / stats.total) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>처리 완료: {stats.resolved}건 ({Math.round((stats.resolved / stats.total) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>처리 중: {stats.inProgress}건 ({Math.round((stats.inProgress / stats.total) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>대기 중: {stats.pending}건 ({Math.round((stats.pending / stats.total) * 100)}%)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 문의 유형별 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              문의 유형별 분석
            </CardTitle>
            <CardDescription>유형별 문의 건수 및 트렌드</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inquiryByType.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.type}</span>
                      {getTrendIcon(item.trend)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.count}건 ({item.percent}%)
                    </span>
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

        {/* 시간대별 문의 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              시간대별 문의 현황
            </CardTitle>
            <CardDescription>시간대별 문의 접수 패턴</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: "09-12시", count: 42, percent: 27, peak: false },
                { time: "12-15시", count: 58, percent: 37, peak: true },
                { time: "15-18시", count: 35, percent: 22, peak: false },
                { time: "18-21시", count: 21, percent: 14, peak: false },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="w-20 text-sm text-muted-foreground">{item.time}</span>
                  <div className="flex-1 h-6 bg-secondary rounded overflow-hidden relative">
                    <div 
                      className={`h-full ${item.peak ? "bg-red-500" : "bg-blue-500"} transition-all flex items-center justify-end pr-2`}
                      style={{ width: `${item.percent}%` }}
                    >
                      <span className="text-xs text-white font-medium">{item.count}</span>
                    </div>
                  </div>
                  {item.peak && (
                    <Badge variant="destructive" className="text-xs">
                      피크
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 담당자별 처리 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            담당자별 처리 현황
          </CardTitle>
          <CardDescription>상담원별 문의 처리 성과</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>담당자</TableHead>
                <TableHead className="text-right">배정</TableHead>
                <TableHead className="text-right">처리 완료</TableHead>
                <TableHead className="text-right">처리율</TableHead>
                <TableHead className="text-right">평균 처리 시간</TableHead>
                <TableHead className="text-right">만족도</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiryByAgent.map((agent, index) => {
                const resolveRate = Math.round((agent.resolved / agent.assigned) * 100);
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell className="text-right">{agent.assigned}건</TableCell>
                    <TableCell className="text-right">{agent.resolved}건</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={resolveRate >= 80 ? "default" : "secondary"}>
                        {resolveRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{agent.avgTime}분</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-yellow-500">★</span>
                        <span>{agent.satisfaction}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
