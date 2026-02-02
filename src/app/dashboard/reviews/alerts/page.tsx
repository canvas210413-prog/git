"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  Search,
  RefreshCcw,
  Star,
  Bell,
  Flame,
  CheckCircle,
  Clock,
  Target,
  Activity,
  PieChart,
  BarChart3,
  ShoppingBag,
  Store,
  Shield
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Review {
  id: string;
  source: string;
  authorName: string;
  content: string;
  rating: number;
  date: string;
  isAlerted?: boolean;
  alertStatus?: string;
  alertNote?: string;
  resolvedType?: string | null;
}

interface TicketReview {
  id: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
  customer: { id: string; name: string; };
}

// 불만 키워드 카테고리별 분류
const complaintCategories: Record<string, string[]> = {
  "품질불량": ["불량", "고장", "망가", "깨진", "파손", "하자", "찢어", "터진", "녹슬", "변색"],
  "배송문제": ["늦은", "지연", "안와", "안옴", "배송", "느림", "파손배송", "분실", "오배송"],
  "가격불만": ["비싸", "가격", "비싼", "환불", "반품", "교환", "손해", "사기"],
  "품질기대미달": ["별로", "실망", "후회", "최악", "조잡", "싸구려", "기대이하"],
  "소음/성능": ["소음", "시끄", "약한", "효과없", "안됨", "작동안"],
  "고객응대": ["고객센터", "응대", "무시", "답변없", "연락안", "전화안", "불친절"],
};

// 감정 강도 키워드
const intensityKeywords = {
  high: ["절대", "정말", "너무", "진짜", "완전", "최악", "사기", "분노", "화나"],
  medium: ["좀", "약간", "조금", "별로", "그냥"],
};

export default function ComplaintAlertPage() {
  const [mallReviews, setMallReviews] = useState<Review[]>([]);
  const [naverTickets, setNaverTickets] = useState<TicketReview[]>([]);
  const [allComplaints, setAllComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertNote, setAlertNote] = useState("");
  const [resolvedType, setResolvedType] = useState("");

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const mallResponse = await fetch("/api/reviews");
      if (mallResponse.ok) {
        setMallReviews(await mallResponse.json());
      }
      const ticketResponse = await fetch("/api/support/tickets");
      if (ticketResponse.ok) {
        const ticketData = await ticketResponse.json();
        setNaverTickets(ticketData.filter((t: any) => t.description?.includes("[네이버 리뷰 -")));
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeComplaint = (content: string, rating: number) => {
    const detectedCategories: string[] = [];
    const detectedKeywords: string[] = [];
    
    Object.entries(complaintCategories).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (content.toLowerCase().includes(keyword)) {
          if (!detectedCategories.includes(category)) detectedCategories.push(category);
          if (!detectedKeywords.includes(keyword)) detectedKeywords.push(keyword);
        }
      });
    });

    let intensity = "low";
    let intensityScore = 1;
    if (intensityKeywords.high.some(k => content.includes(k))) {
      intensity = "high"; intensityScore = 3;
    } else if (intensityKeywords.medium.some(k => content.includes(k))) {
      intensity = "medium"; intensityScore = 2;
    }

    let severityScore = (5 - rating) * 2 + detectedCategories.length * 2 + intensityScore;
    let severity: "critical" | "high" | "medium" | "low" = "low";
    if (severityScore >= 12 || rating === 1) severity = "critical";
    else if (severityScore >= 8 || rating === 2) severity = "high";
    else if (severityScore >= 5) severity = "medium";

    return { categories: detectedCategories, keywords: detectedKeywords, intensity, severity, severityScore, isComplaint: rating <= 3 || detectedCategories.length > 0 };
  };

  useEffect(() => {
    const complaints: any[] = [];
    mallReviews.forEach(review => {
      const analysis = analyzeComplaint(review.content, review.rating);
      if (analysis.isComplaint) {
        complaints.push({ id: review.id, source: "쇼핑몰", author: review.authorName, content: review.content, rating: review.rating, date: review.date, ...analysis, status: review.alertStatus || "NEW", note: review.alertNote, resolvedType: review.resolvedType });
      }
    });
    naverTickets.forEach(ticket => {
      const ratingMatch = ticket.subject.match(/\[리뷰\]\s*(\d)점/);
      const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;
      let content = ticket.description.replace(/\[네이버 리뷰 - [^\]]+\]\s*/g, '').replace(/평점:\s*\d점\s*/g, '').replace(/옵션:\s*[^\n]+\s*/g, '').replace(/내용:\s*/g, '').trim();
      const analysis = analyzeComplaint(content, rating);
      if (analysis.isComplaint) {
        complaints.push({ id: ticket.id, source: "네이버", author: ticket.customer.name, content, rating, date: ticket.createdAt, ...analysis, status: ticket.status === "RESOLVED" ? "RESOLVED" : ticket.status === "IN_PROGRESS" ? "IN_PROGRESS" : "NEW" });
      }
    });
    complaints.sort((a, b) => b.severityScore - a.severityScore);
    setAllComplaints(complaints);
  }, [mallReviews, naverTickets]);

  useEffect(() => { fetchReviews(); }, []);

  const filteredComplaints = allComplaints.filter(c => {
    if (searchTerm && !c.author.toLowerCase().includes(searchTerm.toLowerCase()) && !c.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (categoryFilter !== "all" && !c.categories.includes(categoryFilter)) return false;
    if (severityFilter !== "all" && c.severity !== severityFilter) return false;
    return true;
  });

  const stats = {
    total: allComplaints.length, critical: allComplaints.filter(c => c.severity === "critical").length, high: allComplaints.filter(c => c.severity === "high").length, medium: allComplaints.filter(c => c.severity === "medium").length, new: allComplaints.filter(c => c.status === "NEW").length, inProgress: allComplaints.filter(c => c.status === "IN_PROGRESS").length, resolved: allComplaints.filter(c => c.status === "RESOLVED").length, fromMall: allComplaints.filter(c => c.source === "쇼핑몰").length, fromNaver: allComplaints.filter(c => c.source === "네이버").length,
  };

  const categoryStats = Object.keys(complaintCategories).map(cat => ({ name: cat, count: allComplaints.filter(c => c.categories.includes(cat)).length })).sort((a, b) => b.count - a.count);
  const keywordFrequency: Record<string, number> = {};
  allComplaints.forEach(c => c.keywords.forEach((k: string) => { keywordFrequency[k] = (keywordFrequency[k] || 0) + 1; }));
  const topKeywords = Object.entries(keywordFrequency).sort(([, a], [, b]) => b - a).slice(0, 10);

  const getSeverityConfig = (severity: string) => {
    const configs: Record<string, any> = {
      critical: { badge: "bg-red-100 text-red-800 border-red-300", icon: <Flame className="h-4 w-4 text-red-500" />, label: "심각", textColor: "text-red-600" },
      high: { badge: "bg-orange-100 text-orange-800 border-orange-300", icon: <AlertTriangle className="h-4 w-4 text-orange-500" />, label: "높음", textColor: "text-orange-600" },
      medium: { badge: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: <AlertCircle className="h-4 w-4 text-yellow-500" />, label: "보통", textColor: "text-yellow-600" },
    };
    return configs[severity] || { badge: "bg-gray-100 text-gray-800", icon: <Clock className="h-4 w-4 text-gray-500" />, label: "낮음", textColor: "text-gray-600" };
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
  const renderStars = (r: number) => Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-3 w-3 ${i < r ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedComplaint) return;
    try {
      if (selectedComplaint.source === "쇼핑몰") {
        await fetch("/api/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedComplaint.id, alertStatus: newStatus, alertNote, resolvedType: resolvedType || null }) });
      }
      alert("✅ 상태가 업데이트되었습니다.");
      setDialogOpen(false);
      fetchReviews();
    } catch { alert("❌ 상태 업데이트 중 오류가 발생했습니다."); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">🔔 불만 리뷰 인텔리전스</h2>
          <p className="text-muted-foreground mt-1">AI 기반 불만 감지 및 실시간 모니터링 대시보드</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1"><Activity className="h-3 w-3 mr-1" />실시간 모니터링</Badge>
          <Button onClick={fetchReviews} disabled={loading} variant="outline"><RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />새로고침</Button>
        </div>
      </div>

      {stats.critical > 0 && (
        <Alert className="border-red-300 bg-gradient-to-r from-red-50 to-orange-50">
          <Flame className="h-5 w-5 text-red-500" />
          <AlertTitle className="text-red-800 font-bold">⚠️ 긴급 대응 필요!</AlertTitle>
          <AlertDescription className="text-red-700"><span className="font-bold text-xl">{stats.critical}건</span>의 심각한 불만 리뷰가 감지되었습니다.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "심각", count: stats.critical, icon: <Flame className="h-5 w-5 text-red-500" />, color: "red", desc: "즉시 대응 필요" },
              { label: "높음", count: stats.high, icon: <AlertTriangle className="h-5 w-5 text-orange-500" />, color: "orange", desc: "48시간 내 대응" },
              { label: "보통", count: stats.medium, icon: <AlertCircle className="h-5 w-5 text-yellow-500" />, color: "yellow", desc: "주간 리뷰 대상" },
              { label: "해결완료", count: stats.resolved, icon: <CheckCircle className="h-5 w-5 text-green-500" />, color: "green", desc: `처리율 ${stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(0) : 0}%` },
            ].map((item, idx) => (
              <Card key={idx} className={`border-l-4 border-l-${item.color}-500 hover:shadow-lg transition-shadow`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                  {item.icon}
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold text-${item.color}-600`}>{item.count}</div>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  <Progress value={stats.total > 0 ? (item.count / stats.total) * 100 : 0} className={`mt-2 h-1 bg-${item.color}-100`} />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5 text-purple-500" />불만 카테고리 분석</CardTitle>
              <CardDescription>고객 불만의 주요 원인을 카테고리별로 분류합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categoryStats.slice(0, 6).map((cat) => (
                  <div key={cat.name} className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all ${categoryFilter === cat.name ? 'ring-2 ring-purple-500 bg-purple-50' : 'bg-muted/30'}`} onClick={() => setCategoryFilter(categoryFilter === cat.name ? 'all' : cat.name)}>
                    <div className="text-2xl font-bold text-purple-600">{cat.count}</div>
                    <div className="text-sm text-muted-foreground">{cat.name}</div>
                    <Progress value={stats.total > 0 ? (cat.count / stats.total) * 100 : 0} className="mt-2 h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="작성자, 내용으로 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="심각도" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 심각도</SelectItem>
                    <SelectItem value="critical">🔥 심각</SelectItem>
                    <SelectItem value="high">⚠️ 높음</SelectItem>
                    <SelectItem value="medium">📢 보통</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />불만 리뷰 목록</span>
                <Badge variant="secondary">{filteredComplaints.length}건</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredComplaints.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p className="font-medium">불만 리뷰가 없습니다</p>
                      <p className="text-sm">모든 고객이 만족하고 있어요! 🎉</p>
                    </div>
                  ) : (
                    filteredComplaints.map((complaint) => {
                      const severityConfig = getSeverityConfig(complaint.severity);
                      return (
                        <div key={complaint.id} className={`p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer ${complaint.severity === 'critical' ? 'bg-red-50/50 border-red-200' : complaint.severity === 'high' ? 'bg-orange-50/50 border-orange-200' : 'bg-muted/30'}`} onClick={() => { setSelectedComplaint(complaint); setAlertNote(complaint.note || ""); setResolvedType(complaint.resolvedType || ""); setDialogOpen(true); }}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {severityConfig.icon}
                                <Badge className={severityConfig.badge}>{severityConfig.label}</Badge>
                                <Badge variant="outline" className="flex items-center gap-1">{complaint.source === "쇼핑몰" ? <ShoppingBag className="h-3 w-3" /> : <Store className="h-3 w-3" />}{complaint.source}</Badge>
                                <div className="flex items-center">{renderStars(complaint.rating)}</div>
                                <span className="text-sm text-muted-foreground">{complaint.author}</span>
                              </div>
                              <p className="text-sm line-clamp-2 mb-2">{complaint.content}</p>
                              <div className="flex flex-wrap gap-1">
                                {complaint.keywords.slice(0, 5).map((keyword: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs bg-red-100 text-red-700">#{keyword}</Badge>
                                ))}
                                {complaint.categories.map((cat: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">{cat}</Badge>
                                ))}
                              </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">{formatDate(complaint.date)}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />채널별 현황</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-purple-500" /><span className="text-sm">쇼핑몰</span></div><Badge variant="secondary">{stats.fromMall}건</Badge></div>
              <Progress value={stats.total > 0 ? (stats.fromMall / stats.total) * 100 : 0} className="h-2" />
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Store className="h-4 w-4 text-green-500" /><span className="text-sm">네이버</span></div><Badge variant="secondary">{stats.fromNaver}건</Badge></div>
              <Progress value={stats.total > 0 ? (stats.fromNaver / stats.total) * 100 : 0} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-red-500" />주요 불만 키워드 TOP 10</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topKeywords.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">감지된 키워드 없음</p> : topKeywords.map(([keyword, count], idx) => (
                  <div key={keyword} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${idx < 3 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{idx + 1}</span>
                      <span className="text-sm">{keyword}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{count}회</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" />처리 현황</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-red-50"><span className="text-sm flex items-center gap-2"><Bell className="h-4 w-4 text-red-500" />미처리</span><span className="font-bold text-red-600">{stats.new}건</span></div>
              <div className="flex items-center justify-between p-2 rounded bg-blue-50"><span className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" />처리중</span><span className="font-bold text-blue-600">{stats.inProgress}건</span></div>
              <div className="flex items-center justify-between p-2 rounded bg-green-50"><span className="text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />완료</span><span className="font-bold text-green-600">{stats.resolved}건</span></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{selectedComplaint && getSeverityConfig(selectedComplaint.severity).icon}불만 리뷰 상세</DialogTitle>
            <DialogDescription>{selectedComplaint?.source} • {selectedComplaint && formatDate(selectedComplaint.date)}</DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div><span className="text-sm text-muted-foreground">작성자</span><p className="font-medium">{selectedComplaint.author}</p></div>
                <div><span className="text-sm text-muted-foreground">평점</span><div className="flex items-center gap-1">{renderStars(selectedComplaint.rating)}<span className="ml-1 font-medium">{selectedComplaint.rating}점</span></div></div>
                <div><span className="text-sm text-muted-foreground">심각도</span><Badge className={getSeverityConfig(selectedComplaint.severity).badge}>{getSeverityConfig(selectedComplaint.severity).label}</Badge></div>
                <div><span className="text-sm text-muted-foreground">감정 강도</span><Badge variant="outline">{selectedComplaint.intensity}</Badge></div>
              </div>
              <div><Label className="text-sm text-muted-foreground">리뷰 내용</Label><div className="p-4 bg-muted/30 rounded-lg mt-1 text-sm">{selectedComplaint.content}</div></div>
              <div><Label className="text-sm text-muted-foreground">감지된 불만 키워드</Label><div className="flex flex-wrap gap-2 mt-1">{selectedComplaint.keywords.map((k: string, i: number) => <Badge key={i} variant="destructive" className="text-xs">{k}</Badge>)}</div></div>
              <div><Label className="text-sm text-muted-foreground">불만 카테고리</Label><div className="flex flex-wrap gap-2 mt-1">{selectedComplaint.categories.map((c: string, i: number) => <Badge key={i} variant="outline">{c}</Badge>)}</div></div>
              <div><Label htmlFor="alertNote">대응 메모</Label><Textarea id="alertNote" placeholder="고객 대응 내용을 입력하세요..." value={alertNote} onChange={(e) => setAlertNote(e.target.value)} className="mt-1" /></div>
              <div><Label>처리 방법</Label><Select value={resolvedType} onValueChange={setResolvedType}><SelectTrigger className="mt-1"><SelectValue placeholder="처리 방법 선택" /></SelectTrigger><SelectContent><SelectItem value="REFUND">환불 처리</SelectItem><SelectItem value="EXCHANGE">교환 처리</SelectItem><SelectItem value="COMPENSATION">보상 제공</SelectItem><SelectItem value="APOLOGY">사과 및 안내</SelectItem><SelectItem value="IMPROVEMENT">개선 약속</SelectItem><SelectItem value="NO_ACTION">조치 불필요</SelectItem></SelectContent></Select></div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>닫기</Button>
            <Button variant="secondary" onClick={() => handleUpdateStatus("IN_PROGRESS")}><Clock className="mr-2 h-4 w-4" />처리중으로 변경</Button>
            <Button onClick={() => handleUpdateStatus("RESOLVED")} className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-2 h-4 w-4" />해결완료</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
