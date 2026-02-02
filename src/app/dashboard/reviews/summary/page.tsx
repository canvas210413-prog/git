"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Star,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  RefreshCcw,
  ThumbsUp,
  ThumbsDown,
  Minus,
  BarChart3,
  PieChart,
  Calendar,
  Tag,
  FileText,
  Download,
  ShoppingBag,
  Store,
  Activity,
  Target,
  Award,
  Zap,
  Eye,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Heart
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Review {
  id: string;
  source: string;
  authorName: string;
  content: string;
  rating: number;
  date: string;
  sentiment?: string | null;
  topics?: string | null;
  option?: string | null;
}

interface TicketReview {
  id: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
  customer: { id: string; name: string; };
}

interface ReviewStats {
  totalReviews: number;
  mallReviews: number;
  naverReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  sentimentDistribution: Record<string, number>;
  topTopics: { topic: string; count: number; sentiment: string; percentage: number }[];
  monthlyTrend: { month: string; count: number; avgRating: number }[];
  recentKeywords: { keyword: string; count: number; sentiment: string }[];
  topPositiveKeywords: { keyword: string; count: number }[];
  topNegativeKeywords: { keyword: string; count: number }[];
  sourceComparison: { source: string; count: number; avgRating: number; positiveRate: number }[];
}

// 키워드 분류
const positiveKeywords = [
  "좋아요", "만족", "추천", "최고", "훌륭", "굿", "좋습니다", "잘", "빠른", "친절",
  "깔끔", "예쁜", "편리", "감사", "훌륭해요", "대박", "강추", "완벽", "짱", "최상"
];

const negativeKeywords = [
  "불만", "별로", "실망", "후회", "최악", "느린", "불량", "싸구려", "소음", "불편",
  "나쁜", "하자", "고장", "파손", "교환", "환불", "비싸", "사기"
];

// 주요 토픽 추출
const topicKeywords: Record<string, string[]> = {
  "품질": ["품질", "퀄리티", "마감", "튼튼", "견고", "내구성", "좋은", "훌륭"],
  "배송": ["배송", "도착", "빠른", "느린", "배달", "택배", "포장"],
  "가격": ["가격", "가성비", "비싼", "저렴", "할인", "쿠폰", "세일"],
  "디자인": ["디자인", "색상", "예쁜", "이쁜", "모양", "깔끔", "스타일"],
  "사용감": ["사용", "편리", "불편", "사용감", "착용감", "편안"],
  "소음/성능": ["소음", "시끄러운", "조용", "소리", "성능", "효과"],
  "크기": ["크기", "사이즈", "큰", "작은", "딱맞", "맞춤"],
  "고객서비스": ["고객센터", "응대", "친절", "답변", "문의", "서비스"],
};

export default function ReviewSummaryPage() {
  const [mallReviews, setMallReviews] = useState<Review[]>([]);
  const [naverTickets, setNaverTickets] = useState<TicketReview[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  // 데이터 가져오기
  const fetchReviews = async () => {
    setLoading(true);
    try {
      // 쇼핑몰 리뷰
      const mallResponse = await fetch("/api/reviews");
      let mallData: Review[] = [];
      if (mallResponse.ok) {
        mallData = await mallResponse.json();
        setMallReviews(mallData);
      }

      // 네이버 리뷰 (Ticket에서)
      const ticketResponse = await fetch("/api/support/tickets");
      let naverData: TicketReview[] = [];
      if (ticketResponse.ok) {
        const ticketData = await ticketResponse.json();
        naverData = ticketData.filter((t: any) => t.description?.includes("[네이버 리뷰 -"));
        setNaverTickets(naverData);
      }

      // 통합 데이터 생성
      const combined = [
        ...mallData.map(r => ({
          id: r.id,
          source: "쇼핑몰",
          author: r.authorName,
          content: r.content,
          rating: r.rating,
          date: r.date,
        })),
        ...naverData.map(t => {
          const ratingMatch = t.subject.match(/\[리뷰\]\s*(\d)점/);
          const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;
          let content = t.description
            .replace(/\[네이버 리뷰 - [^\]]+\]\s*/g, '')
            .replace(/평점:\s*\d점\s*/g, '')
            .replace(/옵션:\s*[^\n]+\s*/g, '')
            .replace(/내용:\s*/g, '')
            .trim();
          return {
            id: t.id,
            source: "네이버",
            author: t.customer.name,
            content,
            rating,
            date: t.createdAt,
          };
        })
      ];

      setAllReviews(combined);
      analyzeReviews(combined);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  // 감성 분석
  const analyzeSentiment = (content: string, rating: number): string => {
    if (rating >= 4) return "Positive";
    if (rating <= 2) return "Negative";
    
    const posCount = positiveKeywords.filter(w => content.includes(w)).length;
    const negCount = negativeKeywords.filter(w => content.includes(w)).length;
    
    if (posCount > negCount) return "Positive";
    if (negCount > posCount) return "Negative";
    return "Neutral";
  };

  // 토픽 추출
  const extractTopics = (content: string): string[] => {
    const detected: string[] = [];
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(k => content.includes(k))) {
        detected.push(topic);
      }
    });
    return detected;
  };

  // 리뷰 분석
  const analyzeReviews = (reviewData: any[]) => {
    // 기간 필터링
    let filteredData = reviewData;
    if (period !== "all") {
      const now = new Date();
      const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
      const cutoff = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      filteredData = reviewData.filter(r => new Date(r.date) >= cutoff);
    }

    const totalReviews = filteredData.length;
    const mallReviews = filteredData.filter(r => r.source === "쇼핑몰").length;
    const naverReviews = filteredData.filter(r => r.source === "네이버").length;
    const averageRating = totalReviews > 0 
      ? filteredData.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0;

    // 평점 분포
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredData.forEach(r => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

    // 감성 분포
    const sentimentDistribution: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0 };
    filteredData.forEach(r => {
      const sentiment = analyzeSentiment(r.content, r.rating);
      sentimentDistribution[sentiment] = (sentimentDistribution[sentiment] || 0) + 1;
    });

    // 토픽 분석
    const topicCounts: Record<string, { count: number; positive: number; negative: number }> = {};
    filteredData.forEach(r => {
      const topics = extractTopics(r.content);
      const sentiment = analyzeSentiment(r.content, r.rating);
      
      topics.forEach(topic => {
        if (!topicCounts[topic]) {
          topicCounts[topic] = { count: 0, positive: 0, negative: 0 };
        }
        topicCounts[topic].count++;
        if (sentiment === "Positive") topicCounts[topic].positive++;
        if (sentiment === "Negative") topicCounts[topic].negative++;
      });
    });

    const topTopics = Object.entries(topicCounts)
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        sentiment: data.positive > data.negative ? "Positive" : data.negative > data.positive ? "Negative" : "Neutral",
        percentage: totalReviews > 0 ? (data.count / totalReviews) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 월별 트렌드
    const monthlyData: Record<string, { count: number; totalRating: number }> = {};
    filteredData.forEach(r => {
      const month = new Date(r.date).toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, totalRating: 0 };
      }
      monthlyData[month].count++;
      monthlyData[month].totalRating += r.rating;
    });

    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        count: data.count,
        avgRating: data.totalRating / data.count
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    // 키워드 분석
    const posKeywordCounts: Record<string, number> = {};
    const negKeywordCounts: Record<string, number> = {};
    
    filteredData.forEach(r => {
      positiveKeywords.forEach(kw => {
        if (r.content.includes(kw)) {
          posKeywordCounts[kw] = (posKeywordCounts[kw] || 0) + 1;
        }
      });
      negativeKeywords.forEach(kw => {
        if (r.content.includes(kw)) {
          negKeywordCounts[kw] = (negKeywordCounts[kw] || 0) + 1;
        }
      });
    });

    const topPositiveKeywords = Object.entries(posKeywordCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topNegativeKeywords = Object.entries(negKeywordCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentKeywords = [...topPositiveKeywords, ...topNegativeKeywords]
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .map(k => ({
        ...k,
        sentiment: positiveKeywords.includes(k.keyword) ? "Positive" : "Negative"
      }));

    // 채널별 비교
    const sourceComparison = [
      {
        source: "쇼핑몰",
        count: mallReviews,
        avgRating: filteredData.filter(r => r.source === "쇼핑몰").length > 0
          ? filteredData.filter(r => r.source === "쇼핑몰").reduce((sum, r) => sum + r.rating, 0) / mallReviews
          : 0,
        positiveRate: mallReviews > 0
          ? (filteredData.filter(r => r.source === "쇼핑몰" && analyzeSentiment(r.content, r.rating) === "Positive").length / mallReviews) * 100
          : 0
      },
      {
        source: "네이버",
        count: naverReviews,
        avgRating: filteredData.filter(r => r.source === "네이버").length > 0
          ? filteredData.filter(r => r.source === "네이버").reduce((sum, r) => sum + r.rating, 0) / naverReviews
          : 0,
        positiveRate: naverReviews > 0
          ? (filteredData.filter(r => r.source === "네이버" && analyzeSentiment(r.content, r.rating) === "Positive").length / naverReviews) * 100
          : 0
      }
    ];

    setStats({
      totalReviews,
      mallReviews,
      naverReviews,
      averageRating,
      ratingDistribution,
      sentimentDistribution,
      topTopics,
      monthlyTrend,
      recentKeywords,
      topPositiveKeywords,
      topNegativeKeywords,
      sourceComparison,
    });
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (allReviews.length > 0) {
      analyzeReviews(allReviews);
    }
  }, [period]);

  const renderStars = (rating: number) => (
    <div className="flex">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  );

  const getSentimentConfig = (sentiment: string) => {
    const configs: Record<string, any> = {
      Positive: { icon: <ThumbsUp className="h-4 w-4" />, color: "text-green-500", bg: "bg-green-100", label: "긍정" },
      Negative: { icon: <ThumbsDown className="h-4 w-4" />, color: "text-red-500", bg: "bg-red-100", label: "부정" },
      Neutral: { icon: <Minus className="h-4 w-4" />, color: "text-gray-500", bg: "bg-gray-100", label: "중립" },
    };
    return configs[sentiment] || configs.Neutral;
  };

  const downloadReport = () => {
    if (!stats) return;
    
    const report = `
═══════════════════════════════════════════════════════════════
                    📊 리뷰 인사이트 리포트
═══════════════════════════════════════════════════════════════

📅 생성일: ${new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
📆 분석 기간: ${period === "all" ? "전체 기간" : period === "7d" ? "최근 7일" : period === "30d" ? "최근 30일" : period === "90d" ? "최근 90일" : "최근 1년"}

───────────────────────────────────────────────────────────────
                        📈 핵심 지표
───────────────────────────────────────────────────────────────
  총 리뷰 수: ${stats.totalReviews}건
  ├─ 쇼핑몰: ${stats.mallReviews}건
  └─ 네이버: ${stats.naverReviews}건
  
  평균 평점: ★ ${stats.averageRating.toFixed(1)}점 / 5점
  
  고객 만족도: ${((stats.sentimentDistribution.Positive / stats.totalReviews) * 100).toFixed(1)}%

───────────────────────────────────────────────────────────────
                        ⭐ 평점 분포
───────────────────────────────────────────────────────────────
  ★★★★★ 5점: ${'█'.repeat(Math.round((stats.ratingDistribution[5] / stats.totalReviews) * 20))} ${stats.ratingDistribution[5]}건 (${((stats.ratingDistribution[5] / stats.totalReviews) * 100).toFixed(1)}%)
  ★★★★☆ 4점: ${'█'.repeat(Math.round((stats.ratingDistribution[4] / stats.totalReviews) * 20))} ${stats.ratingDistribution[4]}건 (${((stats.ratingDistribution[4] / stats.totalReviews) * 100).toFixed(1)}%)
  ★★★☆☆ 3점: ${'█'.repeat(Math.round((stats.ratingDistribution[3] / stats.totalReviews) * 20))} ${stats.ratingDistribution[3]}건 (${((stats.ratingDistribution[3] / stats.totalReviews) * 100).toFixed(1)}%)
  ★★☆☆☆ 2점: ${'█'.repeat(Math.round((stats.ratingDistribution[2] / stats.totalReviews) * 20))} ${stats.ratingDistribution[2]}건 (${((stats.ratingDistribution[2] / stats.totalReviews) * 100).toFixed(1)}%)
  ★☆☆☆☆ 1점: ${'█'.repeat(Math.round((stats.ratingDistribution[1] / stats.totalReviews) * 20))} ${stats.ratingDistribution[1]}건 (${((stats.ratingDistribution[1] / stats.totalReviews) * 100).toFixed(1)}%)

───────────────────────────────────────────────────────────────
                        💬 감성 분석
───────────────────────────────────────────────────────────────
  😊 긍정: ${stats.sentimentDistribution.Positive}건 (${((stats.sentimentDistribution.Positive / stats.totalReviews) * 100).toFixed(1)}%)
  😐 중립: ${stats.sentimentDistribution.Neutral}건 (${((stats.sentimentDistribution.Neutral / stats.totalReviews) * 100).toFixed(1)}%)
  😞 부정: ${stats.sentimentDistribution.Negative}건 (${((stats.sentimentDistribution.Negative / stats.totalReviews) * 100).toFixed(1)}%)

───────────────────────────────────────────────────────────────
                        📊 주요 토픽
───────────────────────────────────────────────────────────────
${stats.topTopics.map((t, i) => `  ${i + 1}. ${t.topic}: ${t.count}건 (${t.percentage.toFixed(1)}%) - ${t.sentiment === "Positive" ? "😊 긍정" : t.sentiment === "Negative" ? "😞 부정" : "😐 중립"}`).join("\n")}

───────────────────────────────────────────────────────────────
                      ✅ 긍정 키워드 TOP 5
───────────────────────────────────────────────────────────────
${stats.topPositiveKeywords.slice(0, 5).map((k, i) => `  ${i + 1}. "${k.keyword}" - ${k.count}회 언급`).join("\n")}

───────────────────────────────────────────────────────────────
                      ⚠️ 부정 키워드 TOP 5
───────────────────────────────────────────────────────────────
${stats.topNegativeKeywords.slice(0, 5).map((k, i) => `  ${i + 1}. "${k.keyword}" - ${k.count}회 언급`).join("\n")}

───────────────────────────────────────────────────────────────
                      🔍 개선 권고사항
───────────────────────────────────────────────────────────────
${stats.sentimentDistribution.Negative > stats.totalReviews * 0.2 
  ? "⚠️ 부정 리뷰 비율이 20%를 초과합니다. 품질 개선이 시급합니다.\n" 
  : "✅ 부정 리뷰 비율이 양호합니다.\n"}
${stats.topTopics.filter(t => t.sentiment === "Negative").length > 0 
  ? `⚠️ 개선 필요 분야: ${stats.topTopics.filter(t => t.sentiment === "Negative").map(t => t.topic).join(", ")}\n` 
  : ""}
${stats.averageRating < 4.0 
  ? "⚠️ 평균 평점이 4.0 미만입니다. 전반적인 서비스 품질 점검이 필요합니다.\n" 
  : "✅ 평균 평점이 우수합니다.\n"}

═══════════════════════════════════════════════════════════════
                  Generated by CRM Intelligence System
═══════════════════════════════════════════════════════════════
    `.trim();

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `review-insight-report-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatMonth = (month: string) => {
    const [year, m] = month.split("-");
    return `${m}월`;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📊 리뷰 인사이트 대시보드
          </h2>
          <p className="text-muted-foreground mt-1">
            쇼핑몰과 네이버 리뷰를 통합 분석하여 비즈니스 인사이트를 제공합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="기간" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 기간</SelectItem>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
              <SelectItem value="90d">최근 90일</SelectItem>
              <SelectItem value="1y">최근 1년</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchReviews} disabled={loading} variant="outline">
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
          <Button variant="default" onClick={downloadReport} disabled={!stats} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90">
            <Download className="mr-2 h-4 w-4" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCcw className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-muted-foreground">리뷰 데이터를 분석 중입니다...</p>
          </div>
        </div>
      ) : stats && stats.totalReviews === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">분석할 리뷰가 없습니다</h3>
            <p className="text-muted-foreground">고객리뷰관리에서 리뷰를 먼저 수집해주세요.</p>
          </CardContent>
        </Card>
      ) : stats ? (
        <>
          {/* 핵심 지표 카드 */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">총 리뷰</CardTitle>
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">{stats.totalReviews}</div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <ShoppingBag className="h-3 w-3 mr-1" />{stats.mallReviews}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Store className="h-3 w-3 mr-1" />{stats.naverReviews}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-800">평균 평점</CardTitle>
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-amber-700">{stats.averageRating.toFixed(1)}</span>
                  <span className="text-amber-600">/ 5</span>
                </div>
                <div className="mt-2">{renderStars(stats.averageRating)}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-emerald-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-800">고객 만족도</CardTitle>
                <Heart className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-700">
                  {stats.totalReviews > 0 
                    ? ((stats.sentimentDistribution.Positive / stats.totalReviews) * 100).toFixed(0) 
                    : 0}%
                </div>
                <p className="text-xs text-emerald-600 mt-2">
                  긍정 리뷰 {stats.sentimentDistribution.Positive}건
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-rose-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-rose-800">불만 비율</CardTitle>
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-rose-700">
                  {stats.totalReviews > 0 
                    ? ((stats.sentimentDistribution.Negative / stats.totalReviews) * 100).toFixed(0) 
                    : 0}%
                </div>
                <p className="text-xs text-rose-600 mt-2">
                  부정 리뷰 {stats.sentimentDistribution.Negative}건
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-violet-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-violet-800">품질 점수</CardTitle>
                <Award className="h-5 w-5 text-violet-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-violet-700">
                  {stats.averageRating >= 4.5 ? "A+" : stats.averageRating >= 4.0 ? "A" : stats.averageRating >= 3.5 ? "B+" : stats.averageRating >= 3.0 ? "B" : "C"}
                </div>
                <p className="text-xs text-violet-600 mt-2">
                  {stats.averageRating >= 4.5 ? "최우수" : stats.averageRating >= 4.0 ? "우수" : stats.averageRating >= 3.5 ? "양호" : "개선필요"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 메인 콘텐츠 그리드 */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 왼쪽 2칸 - 차트 영역 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 평점 분포 & 감성 분포 */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      평점 분포
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[5, 4, 3, 2, 1].map(rating => (
                      <div key={rating} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-16">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{rating}점</span>
                        </div>
                        <div className="flex-1">
                          <Progress 
                            value={stats.totalReviews > 0 ? (stats.ratingDistribution[rating] / stats.totalReviews) * 100 : 0} 
                            className={`h-3 ${rating >= 4 ? '[&>div]:bg-green-500' : rating === 3 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'}`}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-16 text-right">
                          {stats.ratingDistribution[rating]}건
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-purple-500" />
                      감성 분석
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(stats.sentimentDistribution).map(([sentiment, count]) => {
                      const config = getSentimentConfig(sentiment);
                      const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                      return (
                        <div key={sentiment} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-full ${config.bg}`}>
                                {config.icon}
                              </div>
                              <span className="font-medium">{config.label}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{count}건 ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className={`h-2 ${sentiment === "Positive" ? "[&>div]:bg-green-500" : sentiment === "Negative" ? "[&>div]:bg-red-500" : "[&>div]:bg-gray-400"}`} />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* 토픽 분석 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    토픽별 분석
                  </CardTitle>
                  <CardDescription>고객이 가장 많이 언급하는 주제와 해당 감성</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.topTopics.map((topic) => {
                      const sentConfig = getSentimentConfig(topic.sentiment);
                      return (
                        <div key={topic.topic} className={`p-4 rounded-lg border-2 ${topic.sentiment === "Positive" ? "border-green-200 bg-green-50" : topic.sentiment === "Negative" ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{topic.topic}</span>
                            {sentConfig.icon}
                          </div>
                          <div className="text-2xl font-bold">{topic.count}</div>
                          <div className="text-xs text-muted-foreground">{topic.percentage.toFixed(1)}% 언급</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* 월별 트렌드 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-cyan-500" />
                    월별 트렌드
                  </CardTitle>
                  <CardDescription>최근 6개월간 리뷰 추이</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.monthlyTrend.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">트렌드 데이터가 없습니다</p>
                  ) : (
                    <div className="flex items-end justify-between gap-4 h-48">
                      {stats.monthlyTrend.map((month, idx) => {
                        const maxCount = Math.max(...stats.monthlyTrend.map(m => m.count));
                        const height = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
                        return (
                          <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                            <div className="text-xs text-muted-foreground">{month.count}건</div>
                            <div className="w-full bg-muted rounded-t-lg relative" style={{ height: `${height}%`, minHeight: '20px' }}>
                              <div className={`absolute inset-0 rounded-t-lg ${month.avgRating >= 4 ? "bg-gradient-to-t from-green-400 to-green-300" : month.avgRating >= 3 ? "bg-gradient-to-t from-yellow-400 to-yellow-300" : "bg-gradient-to-t from-red-400 to-red-300"}`} />
                            </div>
                            <div className="text-sm font-medium">{formatMonth(month.month)}</div>
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {month.avgRating.toFixed(1)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 오른쪽 1칸 - 사이드바 */}
            <div className="space-y-6">
              {/* 채널별 비교 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    채널별 비교
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.sourceComparison.map((source) => (
                    <div key={source.source} className={`p-4 rounded-lg ${source.source === "쇼핑몰" ? "bg-purple-50 border border-purple-200" : "bg-green-50 border border-green-200"}`}>
                      <div className="flex items-center gap-2 mb-3">
                        {source.source === "쇼핑몰" ? <ShoppingBag className="h-5 w-5 text-purple-500" /> : <Store className="h-5 w-5 text-green-500" />}
                        <span className="font-semibold">{source.source}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold">{source.count}</div>
                          <div className="text-xs text-muted-foreground">리뷰수</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{source.avgRating.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">평균평점</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{source.positiveRate.toFixed(0)}%</div>
                          <div className="text-xs text-muted-foreground">만족도</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 긍정 키워드 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ThumbsUp className="h-5 w-5 text-green-500" />
                    긍정 키워드 TOP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {stats.topPositiveKeywords.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">감지된 키워드 없음</p>
                      ) : (
                        stats.topPositiveKeywords.map((kw, idx) => (
                          <div key={kw.keyword} className="flex items-center justify-between p-2 rounded-lg bg-green-50">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-green-200 text-green-700 text-xs flex items-center justify-center font-bold">{idx + 1}</span>
                              <span className="text-sm font-medium">{kw.keyword}</span>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-700">{kw.count}회</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* 부정 키워드 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ThumbsDown className="h-5 w-5 text-red-500" />
                    부정 키워드 TOP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {stats.topNegativeKeywords.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">감지된 키워드 없음</p>
                      ) : (
                        stats.topNegativeKeywords.map((kw, idx) => (
                          <div key={kw.keyword} className="flex items-center justify-between p-2 rounded-lg bg-red-50">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-red-200 text-red-700 text-xs flex items-center justify-center font-bold">{idx + 1}</span>
                              <span className="text-sm font-medium">{kw.keyword}</span>
                            </div>
                            <Badge variant="secondary" className="bg-red-100 text-red-700">{kw.count}회</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* 개선 권고 */}
              <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-500" />
                    개선 권고사항
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.sentimentDistribution.Negative > stats.totalReviews * 0.2 ? (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-red-100">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <p className="text-sm text-red-700">부정 리뷰 비율이 20%를 초과합니다. 품질 개선이 시급합니다.</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-green-100">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <p className="text-sm text-green-700">부정 리뷰 비율이 양호합니다.</p>
                    </div>
                  )}
                  {stats.topTopics.filter(t => t.sentiment === "Negative").length > 0 && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-yellow-100">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <p className="text-sm text-yellow-700">
                        개선 필요: {stats.topTopics.filter(t => t.sentiment === "Negative").map(t => t.topic).join(", ")}
                      </p>
                    </div>
                  )}
                  {stats.averageRating < 4.0 ? (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-orange-100">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                      <p className="text-sm text-orange-700">평균 평점 4.0 미만. 서비스 품질 점검이 필요합니다.</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-green-100">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <p className="text-sm text-green-700">평균 평점이 우수합니다.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
