"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  HeadphonesIcon,
  Package,
  Megaphone,
  Star,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Lightbulb,
  AlertCircle,
  Rocket,
  Shield,
  RefreshCw,
  Download,
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Brain,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Bot,
  FileDown,
} from "lucide-react";
import { downloadInsightReportPdf, type InsightReportData as PdfReportData } from "@/lib/pdf-generator-with-korean";
import {
  getInsightReportData,
  generateLLMInsight,
  InsightReportData,
  LLMInsight,
} from "@/app/actions/insight-report";

// 차트 컴포넌트 (간단한 바 차트)
function MiniBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-20 truncate">{item.label}</span>
          <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
            <div 
              className={`h-full ${color} transition-all duration-500`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium w-16 text-right">{item.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// 성장률 표시 컴포넌트
function GrowthIndicator({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const isPositive = value >= 0;
  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
      {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
      {isPositive ? "+" : ""}{value.toFixed(1)}{suffix}
    </span>
  );
}

export default function InsightReportPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(true);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [reportData, setReportData] = useState<InsightReportData | null>(null);
  const [llmInsight, setLlmInsight] = useState<LLMInsight | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const reportRef = useRef<HTMLDivElement>(null);

  // 데이터 로드
  const loadReportData = async () => {
    setLoading(true);
    try {
      const data = await getInsightReportData(period);
      setReportData(data);
    } catch (error) {
      console.error("리포트 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // LLM 인사이트 생성
  const generateInsight = async () => {
    if (!reportData) return;
    setGeneratingInsight(true);
    try {
      const insight = await generateLLMInsight(reportData);
      setLlmInsight(insight);
    } catch (error) {
      console.error("인사이트 생성 실패:", error);
    } finally {
      setGeneratingInsight(false);
    }
  };

  // PDF 내보내기 - 한글 폰트 지원
  const exportToPdf = async () => {
    if (!reportData) {
      alert('리포트 데이터가 없습니다.');
      return;
    }
    setExportingPdf(true);
    
    try {
      // 기간 텍스트 생성
      const periodText = period === 'weekly' ? '주간' : period === 'monthly' ? '월간' : '연간';
      const now = new Date();
      
      // 안전하게 데이터 접근
      const totalRevenue = reportData.sales?.totalRevenue || 0;
      const orderCount = reportData.sales?.orderCount || 0;
      const customerCount = reportData.customers?.activeCustomers || reportData.customers?.totalCustomers || 0;
      const growthRate = reportData.sales?.growthRate || 0;
      const satisfactionRate = reportData.support?.satisfactionRate || 0;
      const marketingRoi = reportData.marketing?.roi || 0;
      const avgOrderValue = reportData.sales?.avgOrderValue || 0;
      const newCustomers = reportData.customers?.newCustomers || 0;
      const topCategory = reportData.sales?.topChannels?.[0]?.name || '제품';
      
      // PDF 리포트 데이터 생성
      const pdfData: PdfReportData = {
        period: `${periodText} 리포트 - ${now.getFullYear()}년 ${now.getMonth() + 1}월`,
        generatedAt: now.toLocaleString('ko-KR'),
        executiveSummary: llmInsight?.summary || 
          `이번 ${periodText} 총 매출 ${(totalRevenue / 100000000).toFixed(1)}억원을 달성했습니다. ` +
          `주문 ${orderCount.toLocaleString()}건, 고객 ${customerCount.toLocaleString()}명이 참여했으며, ` +
          `전기 대비 ${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}% 성장했습니다.`,
        metrics: {
          revenue: totalRevenue,
          orders: orderCount,
          customers: customerCount,
          growth: growthRate,
          satisfaction: Math.round(satisfactionRate),
          roi: Math.round(marketingRoi),
        },
        salesAnalysis: llmInsight?.salesInsights?.[0] ||
          `매출 분석 결과, 총 ${(totalRevenue / 100000000).toFixed(1)}억원의 매출을 기록했습니다. ` +
          `평균 주문 금액은 ${Math.round(avgOrderValue / 10000)}만원이며, ` +
          `상위 채널에서 ${topCategory}이 가장 좋은 실적을 보였습니다.`,
        customerAnalysis: llmInsight?.customerInsights?.[0] ||
          `고객 분석 결과, 총 ${customerCount.toLocaleString()}명의 활성 고객이 있습니다. ` +
          `신규 고객 ${newCustomers.toLocaleString()}명이 유입되었으며, ` +
          `고객 만족도는 ${satisfactionRate.toFixed(1)}%입니다.`,
        keyInsights: llmInsight?.keyHighlights || [
          `총 매출 ${(totalRevenue / 100000000).toFixed(1)}억원 달성`,
          `전기 대비 ${growthRate.toFixed(1)}% 성장`,
          `고객 만족도 ${satisfactionRate.toFixed(1)}% 유지`,
          `마케팅 ROI ${marketingRoi.toFixed(1)}% 달성`,
        ],
        recommendations: llmInsight?.recommendations || [
          '상위 카테고리 제품 프로모션 강화',
          '재구매 고객 대상 로열티 프로그램 운영',
          '고객 피드백 기반 서비스 개선',
          '마케팅 채널 다양화 검토',
        ],
        conclusion: llmInsight?.summary ||
          `이번 ${periodText} 전반적으로 양호한 성과를 거두었습니다. ` +
          `지속적인 성장을 위해 고객 경험 개선과 마케팅 효율화에 집중할 필요가 있습니다.`,
      };
      
      // PDF 생성 및 다운로드 (한글 폰트 지원)
      await downloadInsightReportPdf(pdfData);
      
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert(`PDF 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setExportingPdf(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">데이터를 분석하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p>데이터를 불러올 수 없습니다.</p>
        <Button onClick={loadReportData} className="mt-4">다시 시도</Button>
      </div>
    );
  }

  const { sales, customers, support, marketing, inventory } = reportData;

  return (
    <div className="space-y-6">
      {/* 헤더 - PDF에서 제외 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            LLM 기반 인사이트 리포트
          </h1>
          <p className="text-muted-foreground mt-1">
            AI가 분석한 종합 비즈니스 인텔리전스 및 KPI 리포트
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <Select value={period} onValueChange={(v) => setPeriod(v as "weekly" | "monthly" | "yearly")}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">주간 리포트</SelectItem>
              <SelectItem value="monthly">월간 리포트</SelectItem>
              <SelectItem value="yearly">연간 리포트</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadReportData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button 
            variant="outline" 
            onClick={exportToPdf}
            disabled={exportingPdf || !reportData}
          >
            {exportingPdf ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                PDF 생성 중...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                PDF 내보내기
              </>
            )}
          </Button>
        </div>
      </div>

      {/* PDF 캡처 영역 */}
      <div ref={reportRef} className="space-y-6 bg-white p-4">
        {/* 기간 정보 배너 */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FileText className="h-8 w-8" />
                <div>
                  <p className="text-lg font-semibold">{reportData.periodLabel}</p>
                  <p className="text-sm text-white/80">
                    생성일시: {new Date(reportData.generatedAt).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                className="bg-white text-purple-600 hover:bg-white/90 print:hidden"
                onClick={generateInsight}
                disabled={generatingInsight}
              >
                {generatingInsight ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI 인사이트 생성
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI 인사이트 섹션 */}
        {llmInsight && (
          <Card className="border-2 border-purple-200 bg-purple-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-purple-600" />
              <Sparkles className="h-5 w-5 text-yellow-500" />
              AI 분석 인사이트
            </CardTitle>
            <CardDescription>
              Ollama LLM이 분석한 비즈니스 인사이트입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 요약 */}
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                종합 요약
              </h4>
              <p className="text-muted-foreground leading-relaxed">{llmInsight.summary}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* 핵심 발견사항 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    핵심 발견사항
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {llmInsight.keyFindings.map((finding, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* 권장사항 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    실행 권장사항
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {llmInsight.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* 리스크 */}
              <Card className="border-red-200 bg-red-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    주의 리스크
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {llmInsight.risks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* 기회 */}
              <Card className="border-green-200 bg-green-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-green-500" />
                    성장 기회
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {llmInsight.opportunities.map((opp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI 대시보드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* 매출 KPI */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                총 매출
              </span>
              <GrowthIndicator value={sales.growthRate} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{sales.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              주문 {sales.orderCount}건 / 평균 ₩{Math.round(sales.avgOrderValue).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* 고객 KPI */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                활성 고객
              </span>
              <GrowthIndicator value={customers.customerGrowthRate} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.activeCustomers}명</div>
            <p className="text-xs text-muted-foreground mt-1">
              신규 {customers.newCustomers}명 / VIP {customers.vipCustomers}명
            </p>
          </CardContent>
        </Card>

        {/* 지원 KPI */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <HeadphonesIcon className="h-4 w-4 text-orange-500" />
                티켓 해결률
              </span>
              <Badge variant={support.resolutionRate >= 80 ? "default" : "destructive"}>
                {support.resolutionRate.toFixed(0)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{support.resolvedTickets}/{support.totalTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              평균 처리: {support.avgResolutionTime.toFixed(1)}시간
            </p>
          </CardContent>
        </Card>

        {/* 마케팅 KPI */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-purple-500" />
                캠페인
              </span>
              <Badge variant="secondary">{marketing.activeCampaigns}개 활성</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ROI {marketing.campaignROI.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              쿠폰 할인: ₩{marketing.totalDiscount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* 재고 KPI */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4 text-red-500" />
                재고 현황
              </span>
              {inventory.outOfStockProducts > 0 && (
                <Badge variant="destructive">{inventory.outOfStockProducts} 품절</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.totalProducts}개</div>
            <p className="text-xs text-muted-foreground mt-1">
              재고 부족: {inventory.lowStockProducts}개
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 상세 분석 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            종합
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            매출
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            고객
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <HeadphonesIcon className="h-4 w-4" />
            고객지원
          </TabsTrigger>
          <TabsTrigger value="marketing" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            마케팅
          </TabsTrigger>
        </TabsList>

        {/* 종합 탭 */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 매출 요약 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  매출 요약
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">총 매출</span>
                  <span className="font-bold">₩{sales.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">주문 건수</span>
                  <span className="font-bold">{sales.orderCount}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">평균 주문 금액</span>
                  <span className="font-bold">₩{Math.round(sales.avgOrderValue).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">전기 대비</span>
                  <GrowthIndicator value={sales.growthRate} />
                </div>
              </CardContent>
            </Card>

            {/* 고객 요약 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  고객 요약
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">전체 고객</span>
                  <span className="font-bold">{customers.totalCustomers}명</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">활성 고객</span>
                  <span className="font-bold">{customers.activeCustomers}명</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">신규 가입</span>
                  <span className="font-bold">{customers.newCustomers}명</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-red-600">이탈 위험</span>
                  <span className="font-bold text-red-600">{customers.churnRisk}명</span>
                </div>
              </CardContent>
            </Card>

            {/* 지원 요약 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HeadphonesIcon className="h-5 w-5 text-orange-600" />
                  고객지원 요약
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">총 티켓</span>
                  <span className="font-bold">{support.totalTickets}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">해결률</span>
                  <span className="font-bold">{support.resolutionRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">평균 처리시간</span>
                  <span className="font-bold">{support.avgResolutionTime.toFixed(1)}시간</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">챗봇 상담</span>
                  <span className="font-bold">{support.chatSessions}건</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 채널별 매출 */}
          {sales.topChannels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">채널별 매출</CardTitle>
              </CardHeader>
              <CardContent>
                <MiniBarChart 
                  data={sales.topChannels.map(c => ({ label: c.name, value: c.revenue }))}
                  color="bg-blue-500"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 매출 탭 */}
        <TabsContent value="sales" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">매출 지표</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">₩{(sales.totalRevenue / 10000).toFixed(0)}만</p>
                    <p className="text-sm text-muted-foreground">총 매출</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{sales.orderCount}</p>
                    <p className="text-sm text-muted-foreground">주문 건수</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">₩{Math.round(sales.avgOrderValue / 1000)}천</p>
                    <p className="text-sm text-muted-foreground">평균 주문금액</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      {sales.growthRate >= 0 ? (
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-red-600" />
                      )}
                      <p className={`text-3xl font-bold ${sales.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(sales.growthRate).toFixed(1)}%
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">성장률</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">채널별 실적</CardTitle>
              </CardHeader>
              <CardContent>
                {sales.topChannels.length > 0 ? (
                  <div className="space-y-3">
                    {sales.topChannels.map((channel, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 flex items-center justify-center rounded-full">
                            {idx + 1}
                          </Badge>
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₩{channel.revenue.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{channel.count}건</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">데이터가 없습니다.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 일별 추이 */}
          {sales.dailyTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">일별 매출 추이</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-end gap-1">
                  {sales.dailyTrend.slice(-14).map((day, idx) => {
                    const maxRevenue = Math.max(...sales.dailyTrend.map(d => d.revenue), 1);
                    const height = (day.revenue / maxRevenue) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                          title={`${day.date}: ₩${day.revenue.toLocaleString()}`}
                        />
                        <span className="text-[10px] text-muted-foreground mt-1 rotate-45">
                          {day.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 고객 탭 */}
        <TabsContent value="customers" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">고객 현황</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{customers.totalCustomers}</p>
                    <p className="text-sm text-muted-foreground">전체 고객</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{customers.activeCustomers}</p>
                    <p className="text-sm text-muted-foreground">활성 고객</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">{customers.vipCustomers}</p>
                    <p className="text-sm text-muted-foreground">VIP 고객</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-3xl font-bold text-red-600">{customers.churnRisk}</p>
                    <p className="text-sm text-muted-foreground">이탈 위험</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">등급별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                {customers.gradeDistribution.length > 0 ? (
                  <MiniBarChart 
                    data={customers.gradeDistribution.map(g => ({ label: g.grade, value: g.count }))}
                    color="bg-green-500"
                  />
                ) : (
                  <p className="text-center text-muted-foreground py-8">데이터가 없습니다.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top 고객 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 10 고객</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">순위</th>
                      <th className="text-left py-2">고객명</th>
                      <th className="text-left py-2">이메일</th>
                      <th className="text-right py-2">총 구매액</th>
                      <th className="text-right py-2">주문 수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.topCustomers.map((customer, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2">
                          <Badge variant={idx < 3 ? "default" : "outline"}>{idx + 1}</Badge>
                        </td>
                        <td className="py-2 font-medium">{customer.name}</td>
                        <td className="py-2 text-muted-foreground">{customer.email}</td>
                        <td className="py-2 text-right font-bold">₩{customer.totalPurchase.toLocaleString()}</td>
                        <td className="py-2 text-right">{customer.orderCount}건</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 고객지원 탭 */}
        <TabsContent value="support" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">티켓 현황</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>해결률</span>
                  <span className="font-bold">{support.resolutionRate.toFixed(1)}%</span>
                </div>
                <Progress value={support.resolutionRate} className="h-3" />
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-xl font-bold">{support.totalTickets}</p>
                    <p className="text-xs text-muted-foreground">전체</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded">
                    <p className="text-xl font-bold text-orange-600">{support.openTickets}</p>
                    <p className="text-xs text-muted-foreground">미해결</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <p className="text-xl font-bold text-green-600">{support.resolvedTickets}</p>
                    <p className="text-xs text-muted-foreground">해결</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">처리 시간 & 챗봇</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">{support.avgResolutionTime.toFixed(1)}시간</p>
                  <p className="text-sm text-muted-foreground">평균 처리 시간</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <p className="text-xl font-bold text-purple-600">{support.chatSessions}</p>
                    <p className="text-xs text-muted-foreground">챗봇 상담</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <p className="text-xl font-bold text-red-600">{support.escalatedChats}</p>
                    <p className="text-xs text-muted-foreground">상담원 이관</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* 우선순위 분포 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">우선순위별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                {support.priorityDistribution.length > 0 ? (
                  <MiniBarChart 
                    data={support.priorityDistribution.map(p => ({ label: p.priority, value: p.count }))}
                    color="bg-orange-500"
                  />
                ) : (
                  <p className="text-center text-muted-foreground py-8">데이터가 없습니다.</p>
                )}
              </CardContent>
            </Card>

            {/* 카테고리 분포 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">카테고리별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                {support.categoryDistribution.length > 0 ? (
                  <MiniBarChart 
                    data={support.categoryDistribution.map(c => ({ label: c.category, value: c.count }))}
                    color="bg-purple-500"
                  />
                ) : (
                  <p className="text-center text-muted-foreground py-8">데이터가 없습니다.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 마케팅 탭 */}
        <TabsContent value="marketing" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">캠페인 & 쿠폰</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">{marketing.activeCampaigns}</p>
                    <p className="text-sm text-muted-foreground">활성 캠페인</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{marketing.totalCoupons}</p>
                    <p className="text-sm text-muted-foreground">등록 쿠폰</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{marketing.usedCoupons}</p>
                    <p className="text-sm text-muted-foreground">사용된 쿠폰</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-3xl font-bold text-orange-600">₩{(marketing.totalDiscount / 10000).toFixed(0)}만</p>
                    <p className="text-sm text-muted-foreground">총 할인액</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">리뷰 분석</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-4 p-4 bg-yellow-50 rounded-lg">
                  <Star className="h-10 w-10 text-yellow-500 fill-yellow-500" />
                  <div className="text-center">
                    <p className="text-4xl font-bold text-yellow-600">{marketing.avgRating.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">{marketing.reviewCount}개 리뷰</p>
                  </div>
                </div>
                
                {marketing.sentimentDistribution.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">감성 분석</p>
                    {marketing.sentimentDistribution.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Badge 
                          variant={s.sentiment === "Positive" ? "default" : s.sentiment === "Negative" ? "destructive" : "secondary"}
                          className="w-20 justify-center"
                        >
                          {s.sentiment}
                        </Badge>
                        <Progress value={(s.count / marketing.reviewCount) * 100} className="flex-1 h-2" />
                        <span className="text-sm w-12 text-right">{s.count}건</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div> {/* PDF 캡처 영역 끝 */}
    </div>
  );
}
