"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  Phone,
  User,
  Crown,
  TrendingUp,
  Shield,
  Zap,
  RefreshCw,
  ArrowUpCircle,
  CheckCircle2,
  XCircle,
  Timer,
  Target,
  Bell,
  Settings,
  ChevronRight,
  Flame,
  Activity,
  BarChart3,
  MessageSquare,
  Bot,
  Sparkles,
  Send,
  Edit,
  Check,
  X,
  HelpCircle,
  Store,
  ShoppingBag,
  ExternalLink,
  Eye,
  Calendar,
} from "lucide-react";
import {
  getPrioritizedSessions,
  getPriorityStats,
  updateSessionPriority,
  escalateUrgent,
  getPriorityRules,
  PrioritizedSession,
  PriorityStats,
  PriorityLevel,
} from "@/app/actions/chat-priority";
import { autoAssignSession } from "@/app/actions/chat-assign";
import {
  generateAndSaveAutoResponse,
  approveAutoResponse,
  editAndApproveAutoResponse,
  rejectAutoResponse,
} from "@/app/actions/qna-auto-response";
import { NaverQnACrawlPanel } from "@/components/support/naver-qna-crawl-panel";
import { MallQnACrawlPanel } from "@/components/support/mall-qna-crawl-panel";
import { getNaverQnAList, getMallQnAList, getQnAStats, QnAListItem } from "@/app/actions/qna-list";
import { useRouter } from "next/navigation";

// 우선순위 스타일
const priorityStyles: Record<PriorityLevel, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: React.ReactNode;
}> = {
  CRITICAL: { 
    label: "긴급", 
    color: "text-red-700", 
    bgColor: "bg-red-100 border-red-300",
    icon: <Flame className="h-4 w-4 text-red-600" />
  },
  HIGH: { 
    label: "높음", 
    color: "text-orange-700", 
    bgColor: "bg-orange-100 border-orange-300",
    icon: <AlertTriangle className="h-4 w-4 text-orange-600" />
  },
  MEDIUM: { 
    label: "보통", 
    color: "text-yellow-700", 
    bgColor: "bg-yellow-100 border-yellow-300",
    icon: <AlertCircle className="h-4 w-4 text-yellow-600" />
  },
  LOW: { 
    label: "낮음", 
    color: "text-gray-700", 
    bgColor: "bg-gray-100 border-gray-300",
    icon: <CheckCircle2 className="h-4 w-4 text-gray-500" />
  },
};

// SLA 상태 스타일
const slaStyles: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  on_track: { label: "정상", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  warning: { label: "주의", color: "bg-yellow-100 text-yellow-700", icon: <Clock className="h-3 w-3" /> },
  breached: { label: "초과", color: "bg-red-100 text-red-700", icon: <XCircle className="h-3 w-3" /> },
};

export default function ChatPriorityPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<PrioritizedSession[]>([]);
  const [stats, setStats] = useState<PriorityStats | null>(null);
  const [rules, setRules] = useState<Awaited<ReturnType<typeof getPriorityRules>>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedSession, setSelectedSession] = useState<PrioritizedSession | null>(null);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  
  // LLM 자동 응답 관련 state
  const [showAutoResponseDialog, setShowAutoResponseDialog] = useState(false);
  const [autoResponseSession, setAutoResponseSession] = useState<PrioritizedSession | null>(null);
  const [autoResponse, setAutoResponse] = useState("");
  const [editedResponse, setEditedResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCrawlPanel, setShowCrawlPanel] = useState(false);
  const [showGuideDialog, setShowGuideDialog] = useState(false);
  
  // Q&A 목록 관련 state
  const [naverQnAList, setNaverQnAList] = useState<QnAListItem[]>([]);
  const [mallQnAList, setMallQnAList] = useState<QnAListItem[]>([]);
  const [qnaStats, setQnaStats] = useState<{ naver: { total: number; open: number; resolved: number }; mall: { total: number; open: number; resolved: number }; total: number; totalOpen: number } | null>(null);
  const [qnaTab, setQnaTab] = useState<"all" | "naver" | "mall">("all");
  const [selectedQnA, setSelectedQnA] = useState<QnAListItem | null>(null);
  const [showQnADetailDialog, setShowQnADetailDialog] = useState(false);

  // 데이터 로드
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsData, statsData, rulesData, naverQnA, mallQnA, qnaStatsData] = await Promise.all([
        getPrioritizedSessions(),
        getPriorityStats(),
        getPriorityRules(),
        getNaverQnAList(30),
        getMallQnAList(30),
        getQnAStats(),
      ]);
      setSessions(sessionsData);
      setStats(statsData);
      setRules(rulesData);
      setNaverQnAList(naverQnA);
      setMallQnAList(mallQnA);
      setQnaStats(qnaStatsData);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // 30초마다 자동 새로고침
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // 필터링된 세션
  const filteredSessions = sessions.filter(session => {
    if (selectedTab === "all") return true;
    if (selectedTab === "critical") return session.priority === "CRITICAL";
    if (selectedTab === "high") return session.priority === "HIGH";
    if (selectedTab === "sla") return session.slaStatus === "breached" || session.slaStatus === "warning";
    return true;
  });

  // 긴급 에스컬레이션
  const handleEscalate = async () => {
    if (!selectedSession || !escalateReason.trim()) return;
    
    const result = await escalateUrgent(selectedSession.id, escalateReason);
    if (result.success) {
      setShowEscalateDialog(false);
      setEscalateReason("");
      setSelectedSession(null);
      loadData();
    } else {
      alert(result.message);
    }
  };

  // LLM 자동 응답 생성
  const handleGenerateAutoResponse = async (session: PrioritizedSession) => {
    setAutoResponseSession(session);
    setShowAutoResponseDialog(true);
    setIsGenerating(true);
    setAutoResponse("");
    setEditedResponse("");
    setIsEditing(false);

    const result = await generateAndSaveAutoResponse(session.id);
    if (result.success && result.response) {
      setAutoResponse(result.response);
      setEditedResponse(result.response);
    } else {
      setAutoResponse(`응답 생성 실패: ${result.error}`);
    }
    setIsGenerating(false);
  };

  // 자동 응답 승인
  const handleApproveResponse = async () => {
    if (!autoResponseSession) return;
    
    let result;
    if (isEditing && editedResponse !== autoResponse) {
      result = await editAndApproveAutoResponse(autoResponseSession.id, editedResponse);
    } else {
      result = await approveAutoResponse(autoResponseSession.id);
    }

    if (result.success) {
      setShowAutoResponseDialog(false);
      setAutoResponseSession(null);
      loadData();
    } else {
      alert(result.error || "승인 처리 실패");
    }
  };

  // 자동 응답 거부
  const handleRejectResponse = async () => {
    if (!autoResponseSession) return;
    
    const result = await rejectAutoResponse(autoResponseSession.id);
    if (result.success) {
      setShowAutoResponseDialog(false);
      setAutoResponseSession(null);
    } else {
      alert(result.error || "거부 처리 실패");
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            문의 우선순위 분류
          </h1>
          <p className="text-muted-foreground mt-1">
            AI 기반 자동 우선순위 분류 및 SLA 관리 시스템
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowGuideDialog(true)}
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            가이드 보기
          </Button>
          <Button 
            variant={showCrawlPanel ? "default" : "outline"} 
            onClick={() => setShowCrawlPanel(!showCrawlPanel)}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Q&A 크롤링
          </Button>
          <Button variant="outline" onClick={() => setShowRulesDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            분류 규칙
          </Button>
          <Button onClick={loadData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* Q&A 크롤링 패널 */}
      {showCrawlPanel && (
        <div className="grid gap-4 md:grid-cols-2">
          <NaverQnACrawlPanel onCrawlComplete={loadData} />
          <MallQnACrawlPanel onCrawlComplete={loadData} />
        </div>
      )}

      {/* 실시간 현황 대시보드 */}
      <div className="grid gap-4 md:grid-cols-6">
        {/* 긴급 */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <Flame className="h-4 w-4" />
              긴급 (CRITICAL)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">{stats?.critical || 0}건</div>
            <p className="text-xs text-red-600 mt-1">SLA 5분 이내</p>
          </CardContent>
        </Card>

        {/* 높음 */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              높음 (HIGH)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{stats?.high || 0}건</div>
            <p className="text-xs text-orange-600 mt-1">SLA 15분 이내</p>
          </CardContent>
        </Card>

        {/* 보통 */}
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              보통 (MEDIUM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">{stats?.medium || 0}건</div>
            <p className="text-xs text-yellow-600 mt-1">SLA 30분 이내</p>
          </CardContent>
        </Card>

        {/* SLA 위반 */}
        <Card className="bg-gradient-to-br from-pink-50 to-rose-100 border-pink-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-pink-700 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              SLA 초과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-900">{stats?.slaBreached || 0}건</div>
            <p className="text-xs text-pink-600 mt-1">즉시 대응 필요</p>
          </CardContent>
        </Card>

        {/* 평균 응답시간 */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Timer className="h-4 w-4" />
              평균 응답
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats?.avgResponseTime || 0}분</div>
            <p className="text-xs text-blue-600 mt-1">오늘 평균</p>
          </CardContent>
        </Card>

        {/* 오늘 해결 */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              오늘 해결
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats?.todayResolved || 0}건</div>
            <p className="text-xs text-green-600 mt-1">완료된 상담</p>
          </CardContent>
        </Card>
      </div>

      {/* SLA 준수율 바 */}
      {stats && (stats.critical + stats.high + stats.medium + stats.low) > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              SLA 준수 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress 
                  value={100 - ((stats.slaBreached + stats.slaWarning) / (stats.critical + stats.high + stats.medium + stats.low) * 100)} 
                  className="h-3"
                />
              </div>
              <div className="text-sm font-medium min-w-[80px] text-right">
                {Math.round(100 - ((stats.slaBreached + stats.slaWarning) / (stats.critical + stats.high + stats.medium + stats.low) * 100))}% 준수
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>🟢 정상: {(stats.critical + stats.high + stats.medium + stats.low) - stats.slaBreached - stats.slaWarning}건</span>
              <span>🟡 주의: {stats.slaWarning}건</span>
              <span>🔴 초과: {stats.slaBreached}건</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 탭 필터 */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            전체 ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="critical" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            긴급 ({sessions.filter(s => s.priority === "CRITICAL").length})
          </TabsTrigger>
          <TabsTrigger value="high" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            높음 ({sessions.filter(s => s.priority === "HIGH").length})
          </TabsTrigger>
          <TabsTrigger value="sla" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            SLA 위반 ({sessions.filter(s => s.slaStatus !== "on_track").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          {/* 우선순위별 문의 목록 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                우선순위별 문의 목록
              </CardTitle>
              <CardDescription>
                AI가 자동으로 분류한 문의 우선순위입니다. VIP 고객, 긴급 키워드, 구매 이력 등을 종합 분석합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSessions.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">처리 대기 중인 문의가 없습니다</p>
                  <p className="text-sm mt-1">모든 문의가 처리되었습니다.</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-4 border-2 rounded-lg transition-all hover:shadow-md ${priorityStyles[session.priority].bgColor}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* 헤더: 우선순위 + 고객 정보 */}
                            <div className="flex items-center gap-3 mb-2">
                              {priorityStyles[session.priority].icon}
                              <Badge className={`${priorityStyles[session.priority].color} bg-white/80`}>
                                {priorityStyles[session.priority].label}
                              </Badge>
                              <span className="text-sm font-medium text-muted-foreground">
                                점수: {session.priorityScore}점
                              </span>
                              <Badge className={slaStyles[session.slaStatus].color}>
                                {slaStyles[session.slaStatus].icon}
                                <span className="ml-1">SLA {slaStyles[session.slaStatus].label}</span>
                              </Badge>
                            </div>

                            {/* 고객 정보 */}
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">{session.phone}</span>
                              </div>
                              {session.customerName && (
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>{session.customerName}</span>
                                </div>
                              )}
                              {session.customerGrade && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Crown className="h-3 w-3 text-yellow-500" />
                                  {session.customerGrade}
                                </Badge>
                              )}
                              {session.totalPurchase > 0 && (
                                <span className="text-sm text-muted-foreground">
                                  💰 {(session.totalPurchase / 10000).toFixed(0)}만원 구매
                                </span>
                              )}
                            </div>

                            {/* 마지막 메시지 */}
                            {session.lastMessage && (
                              <div className="flex items-start gap-2 mb-2 bg-white/50 p-2 rounded">
                                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <p className="text-sm line-clamp-2">{session.lastMessage}</p>
                              </div>
                            )}

                            {/* 매칭된 규칙 */}
                            {session.matchedRules.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground">분류 근거:</span>
                                {session.matchedRules.map((rule, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {rule}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* 시간 정보 */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                대기: {session.waitingMinutes}분
                              </span>
                              <span className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                SLA 마감: {session.slaDeadline?.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {/* 액션 버튼 */}
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                              onClick={() => handleGenerateAutoResponse(session)}
                            >
                              <Bot className="h-4 w-4 mr-1" />
                              AI 자동 응답
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedSession(session);
                                setShowEscalateDialog(true);
                              }}
                            >
                              <Zap className="h-4 w-4 mr-1" />
                              긴급 에스컬레이션
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={async () => {
                                const result = await autoAssignSession(session.id);
                                if (result.success) {
                                  loadData();
                                  router.push("/dashboard/chat/assign");
                                }
                              }}
                            >
                              <ArrowUpCircle className="h-4 w-4 mr-1" />
                              상담 시작
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Q&A 질의 목록 섹션 */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                  Q&A 질의 목록
                </CardTitle>
                <CardDescription className="mt-1">
                  네이버 스마트스토어와 자사몰에서 수집된 Q&A 질문 목록입니다.
                </CardDescription>
              </div>
              {qnaStats && (
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{qnaStats.total}</p>
                    <p className="text-xs text-muted-foreground">전체</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{qnaStats.totalOpen}</p>
                    <p className="text-xs text-muted-foreground">답변 대기</p>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Q&A 소스 탭 */}
            <Tabs value={qnaTab} onValueChange={(v) => setQnaTab(v as "all" | "naver" | "mall")} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  전체 ({(naverQnAList.length + mallQnAList.length)})
                </TabsTrigger>
                <TabsTrigger value="naver" className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-green-600" />
                  네이버 ({naverQnAList.length})
                </TabsTrigger>
                <TabsTrigger value="mall" className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-blue-600" />
                  자사몰 ({mallQnAList.length})
                </TabsTrigger>
              </TabsList>

              {/* Q&A 통계 카드 */}
              {qnaStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">네이버 Q&A</p>
                          <p className="text-lg font-bold">{qnaStats.naver.total}건</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-1 text-xs">
                        <span className="text-orange-600">대기 {qnaStats.naver.open}</span>
                        <span className="text-green-600">완료 {qnaStats.naver.resolved}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">자사몰 Q&A</p>
                          <p className="text-lg font-bold">{qnaStats.mall.total}건</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-1 text-xs">
                        <span className="text-orange-600">대기 {qnaStats.mall.open}</span>
                        <span className="text-green-600">완료 {qnaStats.mall.resolved}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-200 bg-orange-50/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">답변 대기</p>
                          <p className="text-lg font-bold text-orange-600">{qnaStats.totalOpen}건</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200 bg-purple-50/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">답변 완료</p>
                          <p className="text-lg font-bold text-purple-600">{qnaStats.total - qnaStats.totalOpen}건</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Q&A 테이블 */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[80px]">소스</TableHead>
                      <TableHead className="w-[80px]">상태</TableHead>
                      <TableHead className="w-[100px]">우선순위</TableHead>
                      <TableHead>제목</TableHead>
                      <TableHead className="w-[120px]">작성자</TableHead>
                      <TableHead className="w-[120px]">등록일</TableHead>
                      <TableHead className="w-[80px]">상세</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const displayList = qnaTab === "all" 
                        ? [...naverQnAList, ...mallQnAList].sort((a, b) => 
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                          )
                        : qnaTab === "naver" 
                          ? naverQnAList 
                          : mallQnAList;

                      if (displayList.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center">
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <MessageSquare className="h-8 w-8" />
                                <p>수집된 Q&A가 없습니다.</p>
                                <p className="text-xs">상단의 Q&A 크롤링 버튼을 클릭하여 데이터를 수집하세요.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return displayList.slice(0, 20).map((qna) => (
                        <TableRow 
                          key={qna.id} 
                          className="hover:bg-muted/30 cursor-pointer"
                          onClick={() => {
                            setSelectedQnA(qna);
                            setShowQnADetailDialog(true);
                          }}
                        >
                          <TableCell>
                            {qna.source === "NAVER" ? (
                              <Badge className="bg-green-100 text-green-700 border-green-300">
                                <Store className="h-3 w-3 mr-1" />
                                네이버
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                                <ShoppingBag className="h-3 w-3 mr-1" />
                                자사몰
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {qna.status === "OPEN" ? (
                              <Badge className="bg-orange-100 text-orange-700">대기</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700">완료</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {qna.priority === "HIGH" || qna.priority === "CRITICAL" ? (
                              <Badge className="bg-red-100 text-red-700">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                높음
                              </Badge>
                            ) : (
                              <Badge variant="outline">보통</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium max-w-[300px] truncate">
                            {qna.subject}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {qna.customer?.name || "익명"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(qna.createdAt).toLocaleDateString('ko-KR')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedQnA(qna);
                                setShowQnADetailDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>

              {/* 더보기 안내 */}
              {(naverQnAList.length + mallQnAList.length) > 20 && (
                <div className="text-center mt-4 text-sm text-muted-foreground">
                  최근 20건만 표시됩니다. 전체 목록은 고객지원 메뉴에서 확인하세요.
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Q&A 상세 다이얼로그 */}
      <Dialog open={showQnADetailDialog} onOpenChange={setShowQnADetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedQnA?.source === "NAVER" ? (
                <Store className="h-5 w-5 text-green-600" />
              ) : (
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              )}
              Q&A 상세 정보
            </DialogTitle>
            <DialogDescription>
              {selectedQnA?.source === "NAVER" ? "네이버 스마트스토어" : "자사몰"} Q&A #{selectedQnA?.qnaId}
            </DialogDescription>
          </DialogHeader>

          {selectedQnA && (
            <div className="space-y-4">
              {/* 상태 및 기본 정보 */}
              <div className="flex items-center gap-3 flex-wrap">
                {selectedQnA.status === "OPEN" ? (
                  <Badge className="bg-orange-100 text-orange-700">답변 대기</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-700">답변 완료</Badge>
                )}
                {selectedQnA.priority === "HIGH" || selectedQnA.priority === "CRITICAL" ? (
                  <Badge className="bg-red-100 text-red-700">높은 우선순위</Badge>
                ) : (
                  <Badge variant="outline">보통 우선순위</Badge>
                )}
                {selectedQnA.category && (
                  <Badge variant="secondary">{selectedQnA.category}</Badge>
                )}
              </div>

              {/* 제목 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">제목</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{selectedQnA.subject}</p>
                </CardContent>
              </Card>

              {/* 문의 내용 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    문의 내용
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm">
                    {selectedQnA.description}
                  </div>
                </CardContent>
              </Card>

              {/* 작성자 정보 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    작성자 정보
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">이름</p>
                      <p className="font-medium">{selectedQnA.customer?.name || "익명"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">이메일</p>
                      <p className="font-medium">{selectedQnA.customer?.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">등록일</p>
                      <p className="font-medium">{new Date(selectedQnA.createdAt).toLocaleString('ko-KR')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Q&A ID</p>
                      <p className="font-medium">#{selectedQnA.qnaId || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowQnADetailDialog(false)}>
              닫기
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={() => {
                if (selectedQnA) {
                  // 티켓 상세 페이지로 이동 (있다면)
                  router.push(`/dashboard/support?ticket=${selectedQnA.id}`);
                }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              티켓에서 보기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 긴급 에스컬레이션 다이얼로그 */}
      <Dialog open={showEscalateDialog} onOpenChange={setShowEscalateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Zap className="h-5 w-5" />
              긴급 에스컬레이션
            </DialogTitle>
            <DialogDescription>
              이 문의를 최우선 처리 대상으로 지정합니다. 담당자에게 즉시 알림이 전송됩니다.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">{selectedSession.phone}</span>
                  {selectedSession.customerName && (
                    <span className="text-muted-foreground">({selectedSession.customerName})</span>
                  )}
                </div>
                {selectedSession.lastMessage && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {selectedSession.lastMessage}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>에스컬레이션 사유</Label>
                <Textarea
                  placeholder="긴급 에스컬레이션 사유를 입력하세요..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEscalateDialog(false)}>
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleEscalate}
              disabled={!escalateReason.trim()}
            >
              <Zap className="h-4 w-4 mr-2" />
              긴급 에스컬레이션
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LLM 자동 응답 다이얼로그 */}
      <Dialog open={showAutoResponseDialog} onOpenChange={setShowAutoResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              <Sparkles className="h-4 w-4 text-yellow-500" />
              AI 자동 응답 생성
            </DialogTitle>
            <DialogDescription>
              LLM이 고객 문의에 대한 응답을 자동으로 생성합니다. 검토 후 승인하거나 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {autoResponseSession && (
            <div className="space-y-4">
              {/* 고객 문의 정보 */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    고객 문의
                    <Badge className={priorityStyles[autoResponseSession.priority].bgColor}>
                      {priorityStyles[autoResponseSession.priority].label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-2 text-sm">
                    <span className="font-medium">{autoResponseSession.phone}</span>
                    {autoResponseSession.customerName && (
                      <span className="text-muted-foreground">({autoResponseSession.customerName})</span>
                    )}
                    {autoResponseSession.customerGrade && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Crown className="h-3 w-3 text-yellow-500" />
                        {autoResponseSession.customerGrade}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm bg-white p-3 rounded border">
                    {autoResponseSession.lastMessage || "메시지 내용이 없습니다."}
                  </p>
                </CardContent>
              </Card>

              {/* AI 응답 */}
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="h-4 w-4 text-purple-600" />
                      AI 생성 응답
                    </CardTitle>
                    {!isGenerating && autoResponse && !autoResponse.startsWith("응답 생성 실패") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {isEditing ? "편집 취소" : "수정하기"}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isGenerating ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-purple-600 mr-2" />
                      <span className="text-muted-foreground">AI가 응답을 생성하고 있습니다...</span>
                    </div>
                  ) : isEditing ? (
                    <Textarea
                      value={editedResponse}
                      onChange={(e) => setEditedResponse(e.target.value)}
                      className="min-h-[150px] bg-white"
                      placeholder="응답을 수정하세요..."
                    />
                  ) : (
                    <div className="bg-white p-3 rounded border min-h-[100px] whitespace-pre-wrap">
                      {autoResponse || "응답이 생성되지 않았습니다."}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 안내 문구 */}
              <div className="text-xs text-muted-foreground bg-yellow-50 p-3 rounded border border-yellow-200">
                <p className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <strong>주의:</strong> AI가 생성한 응답은 검토 후 승인해야 고객에게 전송됩니다.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={handleRejectResponse}
              disabled={isGenerating}
            >
              <X className="h-4 w-4 mr-2" />
              거부
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowAutoResponseDialog(false)}
            >
              나중에
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={handleApproveResponse}
              disabled={isGenerating || autoResponse.startsWith("응답 생성 실패")}
            >
              <Check className="h-4 w-4 mr-2" />
              {isEditing ? "수정 후 승인" : "승인 및 전송"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 분류 규칙 다이얼로그 */}
      <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              우선순위 분류 규칙
            </DialogTitle>
            <DialogDescription>
              AI가 문의를 분류할 때 사용하는 규칙입니다. 조건에 따라 자동으로 우선순위가 지정됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {rules.map((rule, idx) => (
              <Card key={idx} className={`border-l-4 ${
                rule.priority === "CRITICAL" ? "border-l-red-500" :
                rule.priority === "HIGH" ? "border-l-orange-500" :
                rule.priority === "MEDIUM" ? "border-l-yellow-500" : "border-l-gray-400"
              }`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {priorityStyles[rule.priority].icon}
                      {rule.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={priorityStyles[rule.priority].bgColor}>
                        {priorityStyles[rule.priority].label}
                      </Badge>
                      <Badge variant="outline">SLA {rule.slaMinutes}분</Badge>
                    </div>
                  </div>
                  <CardDescription>{rule.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Switch checked={rule.isActive} disabled />
                      <span>활성화</span>
                    </div>
                    {rule.autoEscalate && (
                      <Badge variant="secondary">
                        {rule.escalateAfterMinutes}분 후 자동 에스컬레이션
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRulesDialog(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 📖 사용 가이드 다이얼로그 */}
      <Dialog open={showGuideDialog} onOpenChange={setShowGuideDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <HelpCircle className="h-6 w-6 text-blue-500" />
              문의 우선순위 분류 시스템 가이드
            </DialogTitle>
            <DialogDescription>
              초보자도 쉽게 따라할 수 있는 단계별 사용 안내입니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 개요 */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  시스템 개요
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>이 시스템은 고객 문의를 <strong>AI가 자동으로 분석</strong>하여 우선순위를 분류하고, 
                SLA(서비스 수준 협약) 시간 내에 응대할 수 있도록 도와줍니다.</p>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <div className="flex items-center gap-2 p-2 bg-red-100 rounded">
                    <Flame className="h-4 w-4 text-red-600" />
                    <span className="text-xs">긴급: 즉시 처리</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-orange-100 rounded">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-xs">높음: 30분 내</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-yellow-100 rounded">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-xs">보통: 2시간 내</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                    <CheckCircle2 className="h-4 w-4 text-gray-600" />
                    <span className="text-xs">낮음: 24시간 내</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 1: 문의 수집 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">1</span>
                  문의 데이터 수집하기
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p><strong>Q&A 크롤링</strong> 버튼을 클릭하면 외부 플랫폼에서 고객 문의를 자동으로 수집할 수 있습니다.</p>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <p className="font-medium">📌 수집 방법:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li><strong>네이버 스토어 Q&A</strong>: 스토어 URL을 입력하면 자동 수집</li>
                    <li><strong>쇼핑몰 Q&A</strong>: 자체 쇼핑몰의 문의 데이터 동기화</li>
                    <li><strong>챗봇 문의</strong>: AI 챗봇으로 유입된 고객 상담 자동 연동</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: 우선순위 확인 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">2</span>
                  우선순위 대시보드 확인하기
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p>수집된 문의는 AI가 자동으로 분석하여 우선순위를 지정합니다.</p>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <p className="font-medium">📌 대시보드 읽는 법:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• <strong>상단 카드</strong>: 각 우선순위별 대기 문의 수 확인</li>
                    <li>• <strong>SLA 초과/주의</strong>: 응대 시간 초과 위험이 있는 문의</li>
                    <li>• <strong>탭 필터</strong>: 전체/긴급/높음/SLA 위반 별로 필터링</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: 문의 처리 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">3</span>
                  문의 처리하기
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p>각 문의 항목에서 다양한 처리 작업을 수행할 수 있습니다.</p>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <p className="font-medium">📌 처리 옵션:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• <strong className="text-purple-600">🤖 AI 응답 생성</strong>: AI가 자동으로 답변 초안을 생성</li>
                    <li>• <strong className="text-orange-600">⚡ 에스컬레이션</strong>: 담당자에게 긴급 전달</li>
                    <li>• <strong className="text-blue-600">👤 담당자 배정</strong>: 특정 상담사에게 할당</li>
                    <li>• <strong className="text-green-600">✓ 완료 처리</strong>: 응답 후 처리 완료</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Step 4: AI 자동 응답 */}
            <Card className="border-purple-200 bg-purple-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center">4</span>
                  AI 자동 응답 활용하기 (추천)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p><strong>Sparkles 아이콘(✨)</strong>을 클릭하면 AI가 문의 내용을 분석하여 자동으로 답변을 생성합니다.</p>
                <div className="bg-white p-3 rounded-lg space-y-2 border">
                  <p className="font-medium">📌 AI 응답 워크플로우:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>문의 내용 AI 분석 (자동)</li>
                    <li>지식 베이스 검색하여 최적 답변 생성</li>
                    <li>생성된 답변 검토 (필요시 수정)</li>
                    <li><strong className="text-green-600">[승인 및 전송]</strong> 클릭하여 고객에게 전달</li>
                  </ol>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Tip: 답변이 마음에 들지 않으면 [거부]를 클릭하고 직접 답변을 작성하세요.
                </p>
              </CardContent>
            </Card>

            {/* Step 5: 분류 규칙 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">5</span>
                  분류 규칙 확인/설정
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p><strong>분류 규칙</strong> 버튼을 클릭하면 AI가 문의를 분류하는 기준을 확인할 수 있습니다.</p>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <p className="font-medium">📌 분류 기준 예시:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• 🚨 <strong>긴급</strong>: &quot;불량&quot;, &quot;파손&quot;, &quot;환불&quot; 키워드 포함</li>
                    <li>• ⚠️ <strong>높음</strong>: &quot;언제&quot;, &quot;빨리&quot;, 24시간 이상 대기</li>
                    <li>• 📋 <strong>보통</strong>: 일반 제품 문의, 배송 확인</li>
                    <li>• 📝 <strong>낮음</strong>: 단순 정보 요청, 감사 메시지</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowGuideDialog(false)}>
              이해했습니다!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
