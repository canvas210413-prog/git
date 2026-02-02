"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BarChart3,
  Brain,
  Search,
  Star,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Tag,
  MessageSquare,
  Loader2,
  RefreshCw,
  Sparkles,
  PieChart,
  FileText,
  Zap,
  CalendarIcon,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Target,
  Award,
  Clock,
  Building2,
  Download,
  Printer,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  getReviewTickets,
  analyzeAllReviews,
  generateReviewInsights,
  ReviewData,
  AnalysisResult,
  AnalysisStats,
} from "@/app/actions/review-analysis";

// 감정 색상
const sentimentColors: Record<string, string> = {
  positive: "bg-green-100 text-green-800 border-green-200",
  negative: "bg-red-100 text-red-800 border-red-200",
  neutral: "bg-gray-100 text-gray-800 border-gray-200",
};

const sentimentIcons: Record<string, React.ReactNode> = {
  positive: <ThumbsUp className="h-3 w-3" />,
  negative: <ThumbsDown className="h-3 w-3" />,
  neutral: <Minus className="h-3 w-3" />,
};

const sentimentLabels: Record<string, string> = {
  positive: "긍정",
  negative: "부정",
  neutral: "중립",
};

// 카테고리 색상
const categoryColors: Record<string, string> = {
  "효과만족": "bg-blue-100 text-blue-800",
  "비염개선": "bg-purple-100 text-purple-800",
  "냄새제거": "bg-teal-100 text-teal-800",
  "소음": "bg-orange-100 text-orange-800",
  "디자인": "bg-pink-100 text-pink-800",
  "가격": "bg-yellow-100 text-yellow-800",
  "배송": "bg-indigo-100 text-indigo-800",
  "제품품질": "bg-emerald-100 text-emerald-800",
  "기타": "bg-gray-100 text-gray-800",
};

export default function ReviewAnalysisPage() {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSentiment, setFilterSentiment] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // 기간 선택 상태
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [datePreset, setDatePreset] = useState<string>("all");

  // 기간 프리셋 적용
  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    switch (preset) {
      case "today":
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        setStartDate(todayStart);
        setEndDate(today);
        break;
      case "week":
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        setStartDate(weekAgo);
        setEndDate(today);
        break;
      case "month":
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        monthAgo.setHours(0, 0, 0, 0);
        setStartDate(monthAgo);
        setEndDate(today);
        break;
      case "3months":
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        threeMonthsAgo.setHours(0, 0, 0, 0);
        setStartDate(threeMonthsAgo);
        setEndDate(today);
        break;
      case "all":
      default:
        setStartDate(undefined);
        setEndDate(undefined);
        break;
    }
  };

  // 기간으로 리뷰 조회
  const loadReviews = async () => {
    setLoading(true);
    setAnalysisResults([]);
    setStats(null);
    setInsights("");
    try {
      const data = await getReviewTickets(startDate, endDate);
      setReviews(data);
    } catch (error) {
      console.error("리뷰 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 기간 변경시 자동 조회
  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // LLM 분석 실행
  const handleAnalyze = async () => {
    if (reviews.length === 0) {
      alert("분석할 리뷰가 없습니다. 기간을 다시 선택해주세요.");
      return;
    }

    setAnalyzing(true);
    setAnalysisProgress(0);

    // 진행률 시뮬레이션
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => Math.min(prev + 5, 90));
    }, 500);

    try {
      const result = await analyzeAllReviews(startDate, endDate);
      if (result.success && result.results && result.stats) {
        setAnalysisResults(result.results);
        setStats(result.stats);
        setAnalysisProgress(100);
      } else {
        alert(result.error || "분석 실패");
      }
    } catch (error) {
      console.error("분석 오류:", error);
      alert("분석 중 오류가 발생했습니다.");
    } finally {
      clearInterval(progressInterval);
      setAnalyzing(false);
    }
  };

  // 인사이트 생성
  const handleGenerateInsights = async () => {
    setGeneratingInsights(true);
    try {
      const result = await generateReviewInsights(reviews);
      if (result.success && result.insights) {
        setInsights(result.insights);
      } else {
        alert(result.error || "인사이트 생성 실패");
      }
    } catch (error) {
      console.error("인사이트 생성 오류:", error);
    } finally {
      setGeneratingInsights(false);
    }
  };

  // 마크다운 텍스트를 React 요소로 변환 (개선된 버전)
  const parseMarkdownText = (text: string): React.ReactNode => {
    if (!text) return null;
    
    // 여러 패턴을 순차적으로 처리
    const segments: React.ReactNode[] = [];
    let remainingText = text;
    let keyCounter = 0;

    // 1. **볼드** 패턴 처리 (가장 우선)
    const boldPattern = /\*\*([^*]+)\*\*/g;
    const parts = remainingText.split(boldPattern);
    
    parts.forEach((part, i) => {
      if (i % 2 === 1) {
        // 홀수 인덱스 = 볼드 텍스트
        segments.push(
          <span key={`bold-${keyCounter++}`} className="font-bold text-gray-900 bg-gradient-to-r from-blue-50 to-indigo-50 px-1.5 py-0.5 rounded">
            {part}
          </span>
        );
      } else {
        // 짝수 인덱스 = 일반 텍스트
        // 2. "인용문" 처리
        const quotePattern = /"([^"]+)"/g;
        const quoteParts = part.split(quotePattern);
        
        quoteParts.forEach((qPart, j) => {
          if (j % 2 === 1) {
            // 홀수 = 인용문
            segments.push(
              <span key={`quote-${keyCounter++}`} className="text-blue-600 italic bg-blue-50/60 px-1.5 py-0.5 rounded font-medium">
                "{qPart}"
              </span>
            );
          } else if (qPart) {
            // 3. `코드` 패턴 처리
            const codePattern = /`([^`]+)`/g;
            const codeParts = qPart.split(codePattern);
            
            codeParts.forEach((cPart, k) => {
              if (k % 2 === 1) {
                // 홀수 = 코드
                segments.push(
                  <code key={`code-${keyCounter++}`} className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-sm font-mono border border-gray-200">
                    {cPart}
                  </code>
                );
              } else if (cPart) {
                segments.push(<span key={`text-${keyCounter++}`}>{cPart}</span>);
              }
            });
          }
        });
      }
    });

    return <>{segments}</>;
  };

  // 인사이트 리포트 렌더링 (마크다운 -> 엔터프라이즈 스타일)
  const renderInsightReport = (content: string) => {
    const sections = content.split(/(?=##\s)/).filter(Boolean);
    
    // 섹션 아이콘 및 색상 매핑
    const getSectionStyle = (title: string) => {
      if (title.includes("전체 요약") || title.includes("요약")) {
        return {
          icon: <BarChart3 className="h-6 w-6" />,
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-l-blue-500",
          iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500 text-white",
          titleColor: "text-blue-900",
          badgeColor: "bg-blue-100 text-blue-700",
        };
      }
      if (title.includes("긍정") || title.includes("좋은") || title.includes("강점") || title.includes("TOP")) {
        return {
          icon: <CheckCircle2 className="h-6 w-6" />,
          gradient: "from-emerald-500 to-green-500",
          bgColor: "bg-gradient-to-br from-emerald-50 to-green-50",
          borderColor: "border-l-emerald-500",
          iconBg: "bg-gradient-to-br from-emerald-500 to-green-500 text-white",
          titleColor: "text-emerald-900",
          badgeColor: "bg-emerald-100 text-emerald-700",
        };
      }
      if (title.includes("개선") || title.includes("부정") || title.includes("문제") || title.includes("주의")) {
        return {
          icon: <AlertTriangle className="h-6 w-6" />,
          gradient: "from-amber-500 to-orange-500",
          bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
          borderColor: "border-l-amber-500",
          iconBg: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
          titleColor: "text-amber-900",
          badgeColor: "bg-amber-100 text-amber-700",
        };
      }
      if (title.includes("마케팅") || title.includes("활용") || title.includes("포인트")) {
        return {
          icon: <TrendingUp className="h-6 w-6" />,
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-l-purple-500",
          iconBg: "bg-gradient-to-br from-purple-500 to-pink-500 text-white",
          titleColor: "text-purple-900",
          badgeColor: "bg-purple-100 text-purple-700",
        };
      }
      if (title.includes("추천") || title.includes("액션") || title.includes("제안")) {
        return {
          icon: <Target className="h-6 w-6" />,
          gradient: "from-rose-500 to-red-500",
          bgColor: "bg-gradient-to-br from-rose-50 to-red-50",
          borderColor: "border-l-rose-500",
          iconBg: "bg-gradient-to-br from-rose-500 to-red-500 text-white",
          titleColor: "text-rose-900",
          badgeColor: "bg-rose-100 text-rose-700",
        };
      }
      return {
        icon: <Lightbulb className="h-6 w-6" />,
        gradient: "from-slate-500 to-gray-500",
        bgColor: "bg-gradient-to-br from-slate-50 to-gray-50",
        borderColor: "border-l-slate-500",
        iconBg: "bg-gradient-to-br from-slate-500 to-gray-500 text-white",
        titleColor: "text-slate-900",
        badgeColor: "bg-slate-100 text-slate-700",
      };
    };

    // 텍스트 내 리스트 아이템 파싱
    const parseContent = (text: string, style: ReturnType<typeof getSectionStyle>) => {
      const lines = text.split("\n").filter(Boolean);
      const elements: React.ReactNode[] = [];
      let currentListItems: { text: string; isNumbered: boolean; number?: number }[] = [];
      let listCounter = 0;
      let inTable = false;
      let tableRows: string[][] = [];
      let tableHeaders: string[] = [];

      const flushList = () => {
        if (currentListItems.length > 0) {
          elements.push(
            <div key={elements.length} className="mt-5 space-y-3">
              {currentListItems.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex items-start gap-4 p-5 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:scale-[1.01]"
                >
                  {item.isNumbered ? (
                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${style.gradient} text-white flex items-center justify-center font-bold text-base shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      {item.number}
                    </div>
                  ) : (
                    <div className="flex-shrink-0 pt-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${style.gradient} shadow-sm group-hover:scale-125 transition-transform duration-300`} />
                    </div>
                  )}
                  <div className="flex-1 text-gray-700 leading-relaxed text-base">
                    {parseMarkdownText(item.text)}
                  </div>
                </div>
              ))}
            </div>
          );
          currentListItems = [];
          listCounter = 0;
        }
      };

      const flushTable = () => {
        if (tableRows.length > 0 && tableHeaders.length > 0) {
          elements.push(
            <div key={elements.length} className="mt-6 mb-6 overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow-xl ring-1 ring-black/5 rounded-2xl border border-gray-200/60">
                  <table className="min-w-full divide-y divide-gray-300 bg-white">
                    <thead className={`bg-gradient-to-r ${style.gradient}`}>
                      <tr>
                        {tableHeaders.map((header, idx) => (
                          <th
                            key={idx}
                            className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider"
                          >
                            {header.trim()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {tableRows.map((row, rowIdx) => (
                        <tr 
                          key={rowIdx}
                          className="hover:bg-gray-50/80 transition-colors duration-200"
                        >
                          {row.map((cell, cellIdx) => (
                            <td
                              key={cellIdx}
                              className="px-6 py-4 text-sm text-gray-800 font-medium"
                            >
                              <div className="flex items-center">
                                {parseMarkdownText(cell.trim())}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
          tableRows = [];
          tableHeaders = [];
          inTable = false;
        }
      };

      lines.forEach((line, idx) => {
        const trimmedLine = line.trim();
        
        // 마크다운 표 감지
        if (trimmedLine.startsWith("|") && trimmedLine.endsWith("|")) {
          const cells = trimmedLine
            .split("|")
            .slice(1, -1)
            .map(cell => cell.trim());
          
          // 구분선 (|---|---|) 확인
          if (trimmedLine.includes("---")) {
            inTable = true;
            return;
          }
          
          // 헤더 행
          if (!inTable && tableHeaders.length === 0) {
            tableHeaders = cells;
            return;
          }
          
          // 데이터 행
          if (inTable) {
            tableRows.push(cells);
            return;
          }
        } else {
          // 표가 끝남
          flushTable();
        }
        
        // 숫자 리스트 (1. 2. 3.)
        const numberedMatch = trimmedLine.match(/^\d+\.\s*(.+)$/);
        if (numberedMatch) {
          flushTable();
          listCounter++;
          currentListItems.push({ 
            text: numberedMatch[1], 
            isNumbered: true, 
            number: listCounter 
          });
          return;
        }
        
        // 불릿 리스트 (- 또는 *)
        const bulletMatch = trimmedLine.match(/^[-*]\s*(.+)$/);
        if (bulletMatch) {
          flushTable();
          currentListItems.push({ 
            text: bulletMatch[1], 
            isNumbered: false 
          });
          return;
        }

        // 일반 텍스트
        flushList();
        if (trimmedLine && !trimmedLine.startsWith("#")) {
          // 키워드: 값 형태 감지
          const keyValueMatch = trimmedLine.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
          if (keyValueMatch) {
            elements.push(
              <div key={idx} className="mt-5 p-5 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-start gap-4">
                  <Badge className={`${style.badgeColor} font-semibold px-4 py-1.5 text-sm shadow-sm`}>
                    {keyValueMatch[1]}
                  </Badge>
                  <p className="text-gray-700 leading-relaxed flex-1 pt-0.5 font-medium">
                    {parseMarkdownText(keyValueMatch[2])}
                  </p>
                </div>
              </div>
            );
          } else {
            elements.push(
              <p key={idx} className="text-gray-700 leading-relaxed mt-4 pl-2 text-base font-normal">
                {parseMarkdownText(trimmedLine)}
              </p>
            );
          }
        }
      });

      flushList();
      flushTable();
      return elements;
    };

    return sections.map((section, index) => {
      const lines = section.trim().split("\n");
      const titleLine = lines[0].replace(/^##\s*/, "").trim();
      const sectionContent = lines.slice(1).join("\n");
      const style = getSectionStyle(titleLine);

      // 이모지 제거
      const cleanTitle = titleLine.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "").trim();

      return (
        <div
          key={index}
          className={`group relative p-8 ${style.bgColor} border border-gray-200/60 hover:border-gray-300/80 transition-all duration-300 hover:shadow-xl rounded-2xl overflow-hidden`}
        >
          {/* 배경 그라데이션 효과 */}
          <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/50 via-white/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className={`absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr ${style.gradient} opacity-5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2`} />
          
          {/* 왼쪽 강조 바 */}
          <div className={`absolute left-0 top-8 bottom-8 w-1 bg-gradient-to-b ${style.gradient} rounded-r-full shadow-lg`} />
          
          <div className="relative flex items-start gap-5">
            {/* 아이콘 */}
            <div className={`relative p-4 rounded-2xl ${style.iconBg} flex-shrink-0 shadow-xl shadow-black/10 group-hover:scale-110 transition-transform duration-300`}>
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm" />
              <div className="relative">
                {style.icon}
              </div>
            </div>
            
            {/* 콘텐츠 */}
            <div className="flex-1 min-w-0 space-y-5">
              {/* 타이틀 */}
              <div className="flex items-center gap-3">
                <h3 className={`text-2xl font-bold ${style.titleColor} tracking-tight`}>
                  {cleanTitle}
                </h3>
                <div className={`h-0.5 flex-1 bg-gradient-to-r ${style.gradient} opacity-30 rounded-full`} />
                <Badge className={`${style.badgeColor} font-semibold px-3 py-1 shadow-sm`}>
                  섹션 {index + 1}
                </Badge>
              </div>
              
              {/* 섹션 내용 */}
              <div className="space-y-4 text-base leading-relaxed">
                {parseContent(sectionContent, style)}
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  // 필터링된 결과
  const getFilteredResults = () => {
    let filtered = analysisResults;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        const review = reviews.find((rv) => rv.id === r.reviewId);
        return (
          review?.subject.toLowerCase().includes(query) ||
          r.keywords.some((k) => k.toLowerCase().includes(query))
        );
      });
    }

    if (filterSentiment !== "all") {
      filtered = filtered.filter((r) => r.sentiment === filterSentiment);
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((r) => r.category === filterCategory);
    }

    return filtered;
  };

  // 검색어로 리뷰 필터링 (분석 전)
  const getFilteredReviews = () => {
    let filtered = reviews;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.subject.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query)
      );
    }
    return filtered;
  };

  // 별점 표시
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredResults = getFilteredResults();
  const filteredReviews = getFilteredReviews();

  // 기간 표시 텍스트
  const getDateRangeText = () => {
    if (!startDate && !endDate) return "전체 기간";
    if (startDate && endDate) {
      return `${format(startDate, "yyyy.MM.dd", { locale: ko })} ~ ${format(endDate, "yyyy.MM.dd", { locale: ko })}`;
    }
    if (startDate) return `${format(startDate, "yyyy.MM.dd", { locale: ko })} ~`;
    if (endDate) return `~ ${format(endDate, "yyyy.MM.dd", { locale: ko })}`;
    return "";
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            LLM 리뷰 분석
          </h1>
          <p className="text-muted-foreground mt-1">
            AI를 활용하여 고객 리뷰를 자동으로 분류하고 인사이트를 도출합니다.
          </p>
        </div>
      </div>

      {/* 기간 선택 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            분석 기간 설정
          </CardTitle>
          <CardDescription>
            분석하고자 하는 리뷰의 기간을 선택하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* 프리셋 버튼 */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={datePreset === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => applyDatePreset("all")}
              >
                전체
              </Button>
              <Button
                variant={datePreset === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => applyDatePreset("today")}
              >
                오늘
              </Button>
              <Button
                variant={datePreset === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => applyDatePreset("week")}
              >
                최근 1주일
              </Button>
              <Button
                variant={datePreset === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => applyDatePreset("month")}
              >
                최근 1개월
              </Button>
              <Button
                variant={datePreset === "3months" ? "default" : "outline"}
                size="sm"
                onClick={() => applyDatePreset("3months")}
              >
                최근 3개월
              </Button>
            </div>

            {/* 구분선 */}
            <div className="hidden md:block h-8 w-px bg-border" />

            {/* 커스텀 기간 선택 */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[140px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "yyyy.MM.dd") : "시작일"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setDatePreset("custom");
                    }}
                    locale={ko}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">~</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[140px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "yyyy.MM.dd") : "종료일"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setDatePreset("custom");
                    }}
                    locale={ko}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 조회/분석 버튼 */}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={loadReviews} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                조회
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || reviews.length === 0}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    AI 분석
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 선택된 기간 및 리뷰 수 표시 */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            <Badge variant="secondary" className="px-3 py-1">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {getDateRangeText()}
            </Badge>
            <span className="text-muted-foreground">
              총 <strong className="text-foreground">{reviews.length}</strong>건의 리뷰
            </span>
            {analysisResults.length > 0 && (
              <Badge className="bg-green-100 text-green-800">
                분석 완료: {analysisResults.length}건
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 분석 진행률 */}
      {analyzing && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">AI 분석 진행 중...</span>
                  <span className="text-sm text-muted-foreground">{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 통계 요약 카드 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                총 리뷰
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReviews}건</div>
              <p className="text-xs text-muted-foreground">
                분석: {stats.analyzedReviews}건
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                평균 평점
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{stats.averageRating}</span>
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              </div>
              {renderStars(Math.round(stats.averageRating))}
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                긍정 리뷰
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-700">
                  {stats.sentimentDistribution.positive}건
                </span>
              </div>
              <p className="text-xs text-green-600">
                {stats.analyzedReviews > 0
                  ? Math.round((stats.sentimentDistribution.positive / stats.analyzedReviews) * 100)
                  : 0}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                중립 리뷰
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Minus className="h-5 w-5 text-gray-600" />
                <span className="text-2xl font-bold text-gray-700">
                  {stats.sentimentDistribution.neutral}건
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {stats.analyzedReviews > 0
                  ? Math.round((stats.sentimentDistribution.neutral / stats.analyzedReviews) * 100)
                  : 0}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700">
                부정 리뷰
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ThumbsDown className="h-5 w-5 text-red-600" />
                <span className="text-2xl font-bold text-red-700">
                  {stats.sentimentDistribution.negative}건
                </span>
              </div>
              <p className="text-xs text-red-600">
                {stats.analyzedReviews > 0
                  ? Math.round((stats.sentimentDistribution.negative / stats.analyzedReviews) * 100)
                  : 0}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 탭 컨텐츠 */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            리뷰 목록 ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2" disabled={analysisResults.length === 0}>
            <Brain className="h-4 w-4" />
            분석 결과 ({analysisResults.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2" disabled={!stats}>
            <PieChart className="h-4 w-4" />
            카테고리 분석
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex items-center gap-2" disabled={!stats}>
            <Tag className="h-4 w-4" />
            키워드 분석
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI 인사이트
          </TabsTrigger>
        </TabsList>

        {/* 리뷰 목록 탭 (분석 전 원본 리뷰) */}
        <TabsContent value="list" className="space-y-4">
          {/* 검색 필터 */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="리뷰 내용 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 리뷰 테이블 */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-10 text-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                  로딩 중...
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">선택한 기간에 리뷰가 없습니다.</p>
                  <p className="text-sm">다른 기간을 선택해주세요.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">평점</TableHead>
                      <TableHead>제목</TableHead>
                      <TableHead>내용</TableHead>
                      <TableHead className="w-[100px]">작성자</TableHead>
                      <TableHead className="w-[120px]">작성일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.slice(0, 100).map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>{renderStars(review.rating)}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium line-clamp-1">
                            {review.subject.replace("[리뷰]", "").trim()}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {review.description}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm">{review.customerName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 분석 결과 탭 */}
        <TabsContent value="analysis" className="space-y-4">
          {/* 필터 */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="리뷰 내용, 키워드 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterSentiment} onValueChange={setFilterSentiment}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="감정 필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 감정</SelectItem>
                    <SelectItem value="positive">긍정</SelectItem>
                    <SelectItem value="neutral">중립</SelectItem>
                    <SelectItem value="negative">부정</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="카테고리" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 카테고리</SelectItem>
                    {Object.keys(categoryColors).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 분석 결과 테이블 */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">평점</TableHead>
                    <TableHead className="w-[100px]">감정</TableHead>
                    <TableHead className="w-[120px]">카테고리</TableHead>
                    <TableHead>리뷰 요약</TableHead>
                    <TableHead className="w-[200px]">키워드</TableHead>
                    <TableHead className="w-[120px]">작성일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.slice(0, 50).map((result) => {
                    const review = reviews.find((r) => r.id === result.reviewId);
                    if (!review) return null;

                    return (
                      <TableRow key={result.reviewId}>
                        <TableCell>{renderStars(review.rating)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={sentimentColors[result.sentiment]}
                          >
                            {sentimentIcons[result.sentiment]}
                            <span className="ml-1">{sentimentLabels[result.sentiment]}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={categoryColors[result.category] || categoryColors["기타"]}>
                            {result.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm line-clamp-2">{result.summary || review.subject}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {result.keywords.slice(0, 3).map((kw, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 카테고리 분석 탭 */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>카테고리별 분포</CardTitle>
                <CardDescription>리뷰 주제별 분류 결과</CardDescription>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <div className="space-y-3">
                    {Object.entries(stats.categoryDistribution)
                      .sort((a, b) => b[1] - a[1])
                      .map(([category, count]) => {
                        const percentage = Math.round((count / stats.analyzedReviews) * 100);
                        return (
                          <div key={category}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{category}</span>
                              <span className="text-sm text-muted-foreground">
                                {count}건 ({percentage}%)
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="py-10 text-center text-muted-foreground">
                    분석 결과가 없습니다.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>주요 관심사</CardTitle>
                <CardDescription>고객들이 가장 많이 언급한 주제</CardDescription>
              </CardHeader>
              <CardContent>
                {stats && stats.categoryDistribution ? (
                  <div className="space-y-4">
                    {Object.entries(stats.categoryDistribution)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([category, count], index) => (
                        <div key={category} className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <Badge className={categoryColors[category] || categoryColors["기타"]}>
                              {category}
                            </Badge>
                          </div>
                          <span className="font-medium">{count}건</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-muted-foreground">
                    분석 결과가 없습니다.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 키워드 분석 탭 */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>인기 키워드 TOP 10</CardTitle>
              <CardDescription>리뷰에서 자주 등장하는 키워드</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && stats.topKeywords.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {stats.topKeywords.map((item, index) => (
                    <div
                      key={item.keyword}
                      className="flex items-center gap-4 p-3 rounded-lg border"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.keyword}</p>
                        <p className="text-sm text-muted-foreground">{item.count}회 언급</p>
                      </div>
                      <Tag className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  키워드 분석 결과가 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI 인사이트 탭 */}
        <TabsContent value="insights" className="space-y-6">
          {/* 리포트 헤더 카드 */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white border-0 shadow-2xl">
            {/* 배경 패턴 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-300 to-transparent rounded-full blur-3xl" />
            </div>
            
            <CardContent className="relative py-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl backdrop-blur-sm shadow-lg border border-white/20">
                    <Building2 className="h-10 w-10" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-1 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                      AI 인사이트 리포트
                    </h2>
                    <p className="text-white/60 text-sm flex items-center gap-2">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {getDateRangeText()} · 분석 대상 {reviews.length}건의 리뷰
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm shadow-lg"
                    onClick={() => window.print()}
                    disabled={!insights}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    인쇄
                  </Button>
                  <Button
                    onClick={handleGenerateInsights}
                    disabled={generatingInsights || reviews.length === 0}
                    size="lg"
                    className="bg-white text-slate-900 hover:bg-white/90 shadow-xl font-semibold"
                  >
                    {generatingInsights ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        AI 분석 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        AI 인사이트 생성
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {insights && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="group bg-white/10 rounded-xl p-5 backdrop-blur-md hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                      <Clock className="h-4 w-4" />
                      생성 시간
                    </div>
                    <p className="text-xl font-bold group-hover:scale-105 transition-transform">
                      {format(new Date(), "yyyy.MM.dd HH:mm")}
                    </p>
                  </div>
                  <div className="group bg-white/10 rounded-xl p-5 backdrop-blur-md hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                      <MessageSquare className="h-4 w-4" />
                      분석 리뷰
                    </div>
                    <p className="text-xl font-bold group-hover:scale-105 transition-transform">
                      {reviews.length}건
                    </p>
                  </div>
                  <div className="group bg-white/10 rounded-xl p-5 backdrop-blur-md hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                      <Star className="h-4 w-4" />
                      평균 평점
                    </div>
                    <p className="text-xl font-bold group-hover:scale-105 transition-transform">
                      {reviews.length > 0
                        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                        : "-"}
                      점
                    </p>
                  </div>
                  <div className="group bg-white/10 rounded-xl p-5 backdrop-blur-md hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                      <Brain className="h-4 w-4" />
                      분석 엔진
                    </div>
                    <p className="text-xl font-bold group-hover:scale-105 transition-transform">
                      Gemma3 27B
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 리포트 본문 */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
            {insights ? (
              <div className="divide-y divide-gray-200/60">
                {renderInsightReport(insights)}
              </div>
            ) : (
              <div className="py-24 text-center px-6">
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full opacity-20 animate-pulse" />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center shadow-lg">
                    <FileText className="h-12 w-12 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">
                  인사이트 리포트가 없습니다
                </h3>
                <p className="text-gray-600 mb-4 max-w-2xl mx-auto text-base leading-relaxed">
                  AI가 고객 리뷰를 분석하여 <span className="font-semibold text-gray-900">핵심 인사이트</span>, 
                  <span className="font-semibold text-gray-900"> 개선점</span>, 
                  <span className="font-semibold text-gray-900"> 마케팅 포인트</span>를
                  도출합니다. 상단의 "AI 인사이트 생성" 버튼을 클릭하세요.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>


    </div>
  );
}
