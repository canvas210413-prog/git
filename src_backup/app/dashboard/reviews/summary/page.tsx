"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Download
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Review {
  id: string;
  source: string;
  author: string;
  content: string;
  rating: number;
  date: string;
  sentiment: string | null;
  topics: string | null;
  option: string | null;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  sentimentDistribution: Record<string, number>;
  topTopics: { topic: string; count: number; sentiment: string }[];
  monthlyTrend: { month: string; count: number; avgRating: number }[];
  recentKeywords: { keyword: string; count: number; sentiment: string }[];
}

// 키워드 추출 및 분석
const extractKeywords = (content: string): string[] => {
  const positiveWords = ["좋아요", "만족", "추천", "최고", "훌륭", "굿", "좋습니다", "잘", "빠른", "친절", "깔끔", "예쁜", "편리", "감사"];
  const negativeWords = ["불만", "별로", "실망", "후회", "최악", "느린", "불량", "싸구려", "소음", "불편", "나쁜"];
  const neutralWords = ["보통", "무난", "그냥", "평범"];
  
  const allWords = [...positiveWords, ...negativeWords, ...neutralWords];
  return allWords.filter(word => content.includes(word));
};

// 감성 분석 (간단 버전)
const analyzeSentiment = (content: string, rating: number): string => {
  if (rating >= 4) return "Positive";
  if (rating <= 2) return "Negative";
  
  const positiveCount = ["좋", "만족", "추천", "최고", "굿", "잘", "빠른", "친절"].filter(w => content.includes(w)).length;
  const negativeCount = ["불만", "별로", "실망", "나쁜", "불량", "느린"].filter(w => content.includes(w)).length;
  
  if (positiveCount > negativeCount) return "Positive";
  if (negativeCount > positiveCount) return "Negative";
  return "Neutral";
};

// 주요 토픽 추출
const extractTopics = (content: string): string[] => {
  const topicKeywords: Record<string, string[]> = {
    "품질": ["품질", "퀄리티", "마감", "튼튼", "견고", "내구성"],
    "배송": ["배송", "도착", "빠른", "느린", "배달"],
    "가격": ["가격", "가성비", "비싼", "저렴", "할인", "쿠폰"],
    "디자인": ["디자인", "색상", "예쁜", "이쁜", "모양", "깔끔"],
    "사용감": ["사용", "편리", "불편", "사용감", "착용감"],
    "소음": ["소음", "시끄러운", "조용", "소리"],
    "크기": ["크기", "사이즈", "큰", "작은", "딱맞"],
    "고객서비스": ["고객센터", "응대", "친절", "답변", "문의"],
  };
  
  const detected: string[] = [];
  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(k => content.includes(k))) {
      detected.push(topic);
    }
  });
  
  return detected;
};

export default function ReviewSummaryPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  // 리뷰 데이터 가져오기 및 분석
  const fetchAndAnalyzeReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reviews");
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
        analyzeReviews(data);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  // 리뷰 분석
  const analyzeReviews = (reviewData: Review[]) => {
    // 기간 필터링
    let filteredData = reviewData;
    if (period !== "all") {
      const now = new Date();
      const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
      const cutoff = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      filteredData = reviewData.filter(r => new Date(r.date) >= cutoff);
    }

    // 기본 통계
    const totalReviews = filteredData.length;
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
      const sentiment = r.sentiment || analyzeSentiment(r.content, r.rating);
      sentimentDistribution[sentiment] = (sentimentDistribution[sentiment] || 0) + 1;
    });

    // 토픽 분석
    const topicCounts: Record<string, { count: number; positive: number; negative: number }> = {};
    filteredData.forEach(r => {
      const topics = r.topics ? r.topics.split(",").map(t => t.trim()) : extractTopics(r.content);
      const sentiment = r.sentiment || analyzeSentiment(r.content, r.rating);
      
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
        sentiment: data.positive > data.negative ? "Positive" : data.negative > data.positive ? "Negative" : "Neutral"
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

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

    // 주요 키워드
    const keywordCounts: Record<string, { count: number; sentiment: string }> = {};
    filteredData.forEach(r => {
      const keywords = extractKeywords(r.content);
      const sentiment = r.sentiment || analyzeSentiment(r.content, r.rating);
      
      keywords.forEach(keyword => {
        if (!keywordCounts[keyword]) {
          keywordCounts[keyword] = { count: 0, sentiment };
        }
        keywordCounts[keyword].count++;
      });
    });

    const recentKeywords = Object.entries(keywordCounts)
      .map(([keyword, data]) => ({ keyword, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    setStats({
      totalReviews,
      averageRating,
      ratingDistribution,
      sentimentDistribution,
      topTopics,
      monthlyTrend,
      recentKeywords,
    });
  };

  useEffect(() => {
    fetchAndAnalyzeReviews();
  }, []);

  useEffect(() => {
    if (reviews.length > 0) {
      analyzeReviews(reviews);
    }
  }, [period]);

  const renderStars = (rating: number, size: string = "h-4 w-4") => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "Positive": return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case "Negative": return <ThumbsDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "Positive": return "bg-green-100 text-green-800";
      case "Negative": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // 리포트 다운로드
  const downloadReport = () => {
    if (!stats) return;
    
    const report = `
리뷰 요약 리포트
================

생성일: ${new Date().toLocaleDateString("ko-KR")}
분석 기간: ${period === "all" ? "전체" : period === "7d" ? "최근 7일" : period === "30d" ? "최근 30일" : period === "90d" ? "최근 90일" : "최근 1년"}

[기본 통계]
- 총 리뷰 수: ${stats.totalReviews}건
- 평균 평점: ${stats.averageRating.toFixed(1)}점

[평점 분포]
- 5점: ${stats.ratingDistribution[5]}건 (${((stats.ratingDistribution[5] / stats.totalReviews) * 100).toFixed(1)}%)
- 4점: ${stats.ratingDistribution[4]}건 (${((stats.ratingDistribution[4] / stats.totalReviews) * 100).toFixed(1)}%)
- 3점: ${stats.ratingDistribution[3]}건 (${((stats.ratingDistribution[3] / stats.totalReviews) * 100).toFixed(1)}%)
- 2점: ${stats.ratingDistribution[2]}건 (${((stats.ratingDistribution[2] / stats.totalReviews) * 100).toFixed(1)}%)
- 1점: ${stats.ratingDistribution[1]}건 (${((stats.ratingDistribution[1] / stats.totalReviews) * 100).toFixed(1)}%)

[감성 분석]
- 긍정: ${stats.sentimentDistribution.Positive}건 (${((stats.sentimentDistribution.Positive / stats.totalReviews) * 100).toFixed(1)}%)
- 중립: ${stats.sentimentDistribution.Neutral}건 (${((stats.sentimentDistribution.Neutral / stats.totalReviews) * 100).toFixed(1)}%)
- 부정: ${stats.sentimentDistribution.Negative}건 (${((stats.sentimentDistribution.Negative / stats.totalReviews) * 100).toFixed(1)}%)

[주요 토픽]
${stats.topTopics.map((t, i) => `${i + 1}. ${t.topic}: ${t.count}건 (${t.sentiment === "Positive" ? "긍정" : t.sentiment === "Negative" ? "부정" : "중립"})`).join("\n")}

[자주 언급된 키워드]
${stats.recentKeywords.map((k, i) => `${i + 1}. ${k.keyword}: ${k.count}회`).join("\n")}

[개선 권고사항]
${stats.sentimentDistribution.Negative > stats.totalReviews * 0.2 
  ? "- 부정 리뷰 비율이 20%를 초과합니다. 품질 개선이 필요합니다.\n" 
  : ""}
${stats.topTopics.filter(t => t.sentiment === "Negative").length > 0 
  ? `- 다음 분야에서 부정적 피드백이 많습니다: ${stats.topTopics.filter(t => t.sentiment === "Negative").map(t => t.topic).join(", ")}\n` 
  : ""}
${stats.averageRating < 4.0 
  ? "- 평균 평점이 4.0 미만입니다. 전반적인 서비스 품질 점검이 필요합니다.\n" 
  : ""}
    `.trim();

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `review-report-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">리뷰 요약 리포트</h2>
          <p className="text-muted-foreground">
            수집된 리뷰를 분석하여 인사이트를 제공합니다.
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
          <Button onClick={fetchAndAnalyzeReviews} disabled={loading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
          <Button variant="outline" onClick={downloadReport} disabled={!stats}>
            <Download className="mr-2 h-4 w-4" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : stats ? (
        <>
          {/* 주요 지표 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 리뷰</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReviews}</div>
                <p className="text-xs text-muted-foreground">
                  분석된 리뷰 수
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">평균 평점</CardTitle>
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</span>
                  <div className="flex">{renderStars(stats.averageRating, "h-3 w-3")}</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.averageRating >= 4.5 ? "매우 우수" : stats.averageRating >= 4.0 ? "우수" : stats.averageRating >= 3.5 ? "양호" : "개선 필요"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">긍정 비율</CardTitle>
                <ThumbsUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalReviews > 0 
                    ? ((stats.sentimentDistribution.Positive / stats.totalReviews) * 100).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.sentimentDistribution.Positive}건의 긍정 리뷰
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">부정 비율</CardTitle>
                <ThumbsDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.totalReviews > 0 
                    ? ((stats.sentimentDistribution.Negative / stats.totalReviews) * 100).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.sentimentDistribution.Negative}건의 부정 리뷰
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 평점 분포 및 감성 분석 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  평점 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = stats.ratingDistribution[rating] || 0;
                    const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-16">
                          <span className="text-sm font-medium">{rating}점</span>
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${rating >= 4 ? "bg-green-500" : rating === 3 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-20 text-right">
                          {count}건 ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  감성 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Positive", "Neutral", "Negative"].map((sentiment) => {
                    const count = stats.sentimentDistribution[sentiment] || 0;
                    const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                    const label = sentiment === "Positive" ? "긍정" : sentiment === "Negative" ? "부정" : "중립";
                    return (
                      <div key={sentiment} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-20">
                          {getSentimentIcon(sentiment)}
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${sentiment === "Positive" ? "bg-green-500" : sentiment === "Negative" ? "bg-red-500" : "bg-gray-400"}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-20 text-right">
                          {count}건 ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 감성 요약 */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">감성 분석 요약</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.sentimentDistribution.Positive > stats.sentimentDistribution.Negative * 2 
                      ? "고객들의 전반적인 반응이 매우 긍정적입니다. 현재의 서비스 품질을 유지하세요."
                      : stats.sentimentDistribution.Positive > stats.sentimentDistribution.Negative
                      ? "긍정적인 리뷰가 더 많지만, 부정적인 피드백에도 주의를 기울이세요."
                      : "부정적인 리뷰 비율이 높습니다. 품질 개선 및 고객 응대에 집중해주세요."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 주요 토픽 및 키워드 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  주요 토픽
                </CardTitle>
                <CardDescription>리뷰에서 자주 언급되는 주제</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.topTopics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">분석된 토픽이 없습니다.</p>
                  ) : (
                    stats.topTopics.map((topic, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-normal">
                            #{index + 1}
                          </Badge>
                          <span className="font-medium">{topic.topic}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSentimentColor(topic.sentiment)}>
                            {topic.sentiment === "Positive" ? "긍정" : topic.sentiment === "Negative" ? "부정" : "중립"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{topic.count}건</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  주요 키워드
                </CardTitle>
                <CardDescription>리뷰에서 자주 사용된 표현</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stats.recentKeywords.length === 0 ? (
                    <p className="text-sm text-muted-foreground">분석된 키워드가 없습니다.</p>
                  ) : (
                    stats.recentKeywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className={`${
                          keyword.sentiment === "Positive" 
                            ? "bg-green-50 border-green-200 text-green-700" 
                            : keyword.sentiment === "Negative"
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        {keyword.keyword} ({keyword.count})
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 월별 트렌드 */}
          {stats.monthlyTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  월별 트렌드
                </CardTitle>
                <CardDescription>시간에 따른 리뷰 추이</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-2">
                    {stats.monthlyTrend.map((month, index) => (
                      <div key={index} className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">{month.month}</p>
                        <p className="text-lg font-bold">{month.count}건</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{month.avgRating.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI 인사이트 및 권고사항 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                AI 인사이트 및 권고사항
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="strengths">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      강점 분석
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      {stats.topTopics.filter(t => t.sentiment === "Positive").length > 0 ? (
                        <>
                          <p>다음 분야에서 긍정적인 피드백을 받고 있습니다:</p>
                          <ul className="list-disc list-inside ml-2 text-muted-foreground">
                            {stats.topTopics.filter(t => t.sentiment === "Positive").map((t, i) => (
                              <li key={i}>{t.topic} ({t.count}건의 긍정 리뷰)</li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p className="text-muted-foreground">분석할 수 있는 강점 데이터가 충분하지 않습니다.</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="improvements">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-orange-500" />
                      개선 필요 분야
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      {stats.topTopics.filter(t => t.sentiment === "Negative").length > 0 ? (
                        <>
                          <p>다음 분야에서 개선이 필요합니다:</p>
                          <ul className="list-disc list-inside ml-2 text-muted-foreground">
                            {stats.topTopics.filter(t => t.sentiment === "Negative").map((t, i) => (
                              <li key={i}>{t.topic} ({t.count}건의 부정 리뷰)</li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p className="text-muted-foreground text-green-600">특별히 개선이 필요한 분야가 감지되지 않았습니다.</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="recommendations">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-blue-500" />
                      권고사항
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <ul className="list-disc list-inside ml-2 text-muted-foreground space-y-1">
                        {stats.averageRating < 4.0 && (
                          <li>평균 평점이 4.0 미만입니다. 전반적인 품질 개선에 집중하세요.</li>
                        )}
                        {stats.sentimentDistribution.Negative > stats.totalReviews * 0.15 && (
                          <li>부정 리뷰 비율이 15%를 초과합니다. 불만 사항에 적극적으로 대응하세요.</li>
                        )}
                        {stats.ratingDistribution[1] + stats.ratingDistribution[2] > stats.totalReviews * 0.1 && (
                          <li>1-2점 리뷰가 10%를 초과합니다. 심각한 불만 요인을 파악하세요.</li>
                        )}
                        <li>긍정적인 리뷰 작성 고객에게 감사 메시지나 혜택을 제공하세요.</li>
                        <li>부정적인 리뷰에는 신속하고 정중하게 응대하여 신뢰를 회복하세요.</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">리뷰 데이터가 없습니다.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
