"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Calendar, TrendingUp, AlertCircle, BarChart3, ArrowRight, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

interface InsightData {
  insight: string;
  stats: {
    총AS건수: number;
    완료건수: number;
    진행중건수: number;
    접수대기: number;
    증상별분포: Record<string, number>;
    우선순위분포: Record<string, number>;
    필터교체건수: number;
    평균비용: number;
    고객만족도: string;
  };
  dateRange: {
    start: string;
    end: string;
  };
  analyzedCount: number;
}

export default function ASInsightsPage() {
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [asCount, setAsCount] = useState(0);
  const [dateRange, setDateRange] = useState<string>("30");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  // 기간 선택 핸들러
  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const today = new Date();
    const end = today.toISOString().split("T")[0];
    setEndDate(end);

    if (range === "all") {
      setStartDate("2020-01-01");
    } else if (range === "custom") {
      // 커스텀 모드에서는 기존 값 유지
    } else {
      const days = parseInt(range);
      const start = new Date();
      start.setDate(start.getDate() - days);
      setStartDate(start.toISOString().split("T")[0]);
    }
  };

  // AS 데이터 개수 조회
  useEffect(() => {
    const fetchAsCount = async () => {
      try {
        const response = await fetch('/api/after-service');
        if (response.ok) {
          const data = await response.json();
          setAsCount(data.length);
        }
      } catch (error) {
        console.error('AS 데이터 조회 오류:', error);
      }
    };
    fetchAsCount();
  }, []);

  const generateInsight = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/after-service/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ startDate, endDate }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setInsightData(data);
        // LLM 연결 실패 경고
        if (data.llmError) {
          console.warn("LLM 서버 연결 실패 - 기본 통계만 표시됩니다.");
        }
      } else {
        alert(`인사이트 생성에 실패했습니다: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error("인사이트 생성 오류:", error);
      alert("인사이트 생성 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-yellow-500" />
            AS LLM 인사이트
          </h1>
          <p className="text-muted-foreground mt-1">
            AI가 분석한 AS 데이터 인사이트와 개선 제안
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/after-service">
            <Button variant="outline" className="gap-2">
              AS 관리
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard/after-service/kpi">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              KPI 대시보드
            </Button>
          </Link>
        </div>
      </div>

      {/* 현재 AS 현황 요약 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">현재 등록된 AS</p>
                <p className="text-3xl font-bold text-primary">{asCount}건</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-sm text-muted-foreground">
                분석 기간: <span className="font-medium text-foreground">{startDate}</span> ~ <span className="font-medium text-foreground">{endDate}</span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              실시간 데이터 기반
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 분석 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            인사이트 생성
          </CardTitle>
          <CardDescription>
            날짜 범위를 선택하고 AI 분석을 시작하세요. AS 접수 및 관리 데이터를 기반으로 분석합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 기간 선택 버튼 */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={dateRange === "7" ? "default" : "outline"}
              size="sm"
              onClick={() => handleDateRangeChange("7")}
            >
              7일
            </Button>
            <Button
              variant={dateRange === "30" ? "default" : "outline"}
              size="sm"
              onClick={() => handleDateRangeChange("30")}
            >
              30일
            </Button>
            <Button
              variant={dateRange === "90" ? "default" : "outline"}
              size="sm"
              onClick={() => handleDateRangeChange("90")}
            >
              90일
            </Button>
            <Button
              variant={dateRange === "365" ? "default" : "outline"}
              size="sm"
              onClick={() => handleDateRangeChange("365")}
            >
              1년
            </Button>
            <Button
              variant={dateRange === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleDateRangeChange("all")}
            >
              전체
            </Button>
            <Button
              variant={dateRange === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange("custom")}
            >
              직접 선택
            </Button>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateRange("custom");
                }}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">종료일</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateRange("custom");
                }}
              />
            </div>
            <Button onClick={generateInsight} disabled={loading} className="px-8">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  인사이트 생성
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 통계 요약 */}
      {insightData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">분석 기간</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {new Date(insightData.dateRange.start).toLocaleDateString('ko-KR')} ~{" "}
                {new Date(insightData.dateRange.end).toLocaleDateString('ko-KR')}
              </div>
              <p className="text-xs text-muted-foreground">
                {insightData.analyzedCount}건 분석 완료
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">처리 현황</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {insightData.stats.완료건수} / {insightData.stats.총AS건수}건
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress 
                  value={insightData.stats.총AS건수 > 0 ? (insightData.stats.완료건수 / insightData.stats.총AS건수) * 100 : 0} 
                  className="h-2 flex-1" 
                />
                <span className="text-xs text-muted-foreground">
                  {insightData.stats.총AS건수 > 0 ? ((insightData.stats.완료건수 / insightData.stats.총AS건수) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 비용</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {insightData.stats.평균비용.toLocaleString()}원
              </div>
              <p className="text-xs text-muted-foreground">건당 평균 비용</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">대기 건수</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{insightData.stats.접수대기}건</div>
              <p className="text-xs text-muted-foreground">
                진행중: {insightData.stats.진행중건수}건
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* LLM 인사이트 */}
      {insightData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              AI 분석 인사이트
            </CardTitle>
            <CardDescription>
              LLM이 분석한 AS 데이터 인사이트와 개선 제안
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1 my-3">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1 my-3">{children}</ol>
                  ),
                  li: ({ children }) => <li className="ml-4">{children}</li>,
                  p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
                  hr: () => <hr className="my-6 border-t border-gray-300" />,
                  strong: ({ children }) => (
                    <strong className="font-bold text-primary">{children}</strong>
                  ),
                }}
              >
                {insightData.insight}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 안내 메시지 */}
      {!insightData && !loading && (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-16 w-16 text-yellow-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI 인사이트를 생성하세요</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              날짜 범위를 선택하고 &quot;인사이트 생성&quot; 버튼을 클릭하면,
              AI가 AS 접수 및 관리 데이터를 분석하여 실질적인 인사이트와 개선 제안을 제공합니다.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                증상 패턴 분석
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                운영 효율성 진단
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                개선 제안
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 로딩 중 */}
      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 mt-4">AI가 데이터를 분석하고 있습니다</h3>
            <p className="text-muted-foreground text-center max-w-md">
              AS 접수 및 관리 데이터를 수집하고 패턴을 분석 중입니다.<br />
              잠시만 기다려주세요...
            </p>
          </CardContent>
        </Card>
      )}

      {/* 하단 네비게이션 */}
      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          AS 접수 및 관리 데이터를 기반으로 LLM이 분석합니다.
        </p>
        <div className="flex gap-2">
          <Link href="/dashboard/after-service">
            <Button variant="ghost" size="sm">
              AS 관리로 이동
            </Button>
          </Link>
          <Link href="/dashboard/after-service/kpi">
            <Button variant="ghost" size="sm">
              KPI 대시보드
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
