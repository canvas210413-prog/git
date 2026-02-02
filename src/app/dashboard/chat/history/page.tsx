"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Search,
  Phone,
  User,
  Calendar,
  Clock,
  Eye,
  Trash2,
  Filter,
  Bot,
  UserCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  getAllChatSessions,
  getChatSessionDetail,
  deleteChatSession,
  getChatStatistics,
  getChatCategories,
  closeChatSession,
  ChatSession,
} from "@/app/actions/chat-history";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
  ESCALATED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "진행중",
  CLOSED: "종료",
  ESCALATED: "에스컬레이션",
};

export default function ChatHistoryPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statistics, setStatistics] = useState<{
    totalSessions: number;
    activeSessions: number;
    closedSessions: number;
    todaySessions: number;
    categoryStats: Record<string, number>;
  } | null>(null);

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionsData, statsData, catsData] = await Promise.all([
        getAllChatSessions(),
        getChatStatistics(),
        getChatCategories(),
      ]);
      setSessions(sessionsData);
      setFilteredSessions(sessionsData);
      setStatistics(statsData);
      setCategories(catsData);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 필터링
  useEffect(() => {
    let result = sessions;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.phone.includes(query) ||
          s.customerName?.toLowerCase().includes(query) ||
          s.summary?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((s) => s.category === selectedCategory);
    }

    if (selectedStatus !== "all") {
      result = result.filter((s) => s.status === selectedStatus);
    }

    setFilteredSessions(result);
  }, [sessions, searchQuery, selectedCategory, selectedStatus]);

  // 상세 보기
  const handleViewDetail = async (sessionId: string) => {
    try {
      const detail = await getChatSessionDetail(sessionId);
      setSelectedSession(detail);
      setIsDetailOpen(true);
    } catch (error) {
      console.error("상세 조회 실패:", error);
    }
  };

  // 삭제
  const handleDelete = async (sessionId: string) => {
    if (!confirm("정말 삭제하시겠습니까? 모든 대화 내용이 삭제됩니다.")) return;

    try {
      await deleteChatSession(sessionId);
      loadData();
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  // 상담 종료
  const handleCloseSession = async (sessionId: string) => {
    if (!confirm("이 상담을 종료 처리하시겠습니까?")) return;

    try {
      await closeChatSession(sessionId, "상담사에 의해 종료됨");
      loadData();
      if (selectedSession?.id === sessionId) {
        setSelectedSession({ ...selectedSession, status: "CLOSED" });
      }
    } catch (error) {
      console.error("상담 종료 실패:", error);
    }
  };

  // 날짜 포맷
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // 상대 시간
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return "방금 전";
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            상담 내역 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            AI 챗봇 상담 내역을 전화번호 기준으로 조회하고 관리합니다.
          </p>
        </div>
        <Button onClick={loadData} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                전체 상담
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalSessions}건</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                오늘 상담
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statistics.todaySessions}건
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                진행중
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.activeSessions}건
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                종료
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">
                {statistics.closedSessions}건
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="전화번호, 고객명, 상담 내용 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="ACTIVE">진행중</SelectItem>
                <SelectItem value="CLOSED">종료</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 상담 목록 */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              로딩 중...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
              {searchQuery || selectedCategory !== "all" || selectedStatus !== "all"
                ? "검색 결과가 없습니다."
                : "저장된 상담 내역이 없습니다. 챗봇으로 상담을 진행하면 여기에 기록됩니다."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">전화번호</TableHead>
                  <TableHead>고객명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>상담일시</TableHead>
                  <TableHead>요약</TableHead>
                  <TableHead className="w-[100px]">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {session.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {session.customerName || session.customer?.name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {session.category ? (
                        <Badge variant="outline">{session.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[session.status]}>
                        {statusLabels[session.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{formatDate(session.startedAt)}</span>
                        <span className="text-xs text-muted-foreground">
                          {getRelativeTime(session.startedAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {session.summary || (session.messages?.[0]?.content ? session.messages[0].content.slice(0, 50) + "..." : "대화 없음")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(session.id)}
                          title="상세 보기"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {session.status === "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleCloseSession(session.id)}
                            title="상담 종료"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(session.id)}
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              상담 상세 내역
            </DialogTitle>
            <DialogDescription>
              {selectedSession && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">
                    <Phone className="h-3 w-3 mr-1" />
                    {selectedSession.phone}
                  </Badge>
                  {selectedSession.customerName && (
                    <Badge variant="outline">
                      <User className="h-3 w-3 mr-1" />
                      {selectedSession.customerName}
                    </Badge>
                  )}
                  {selectedSession.category && (
                    <Badge>{selectedSession.category}</Badge>
                  )}
                  <Badge className={statusColors[selectedSession.status]}>
                    {statusLabels[selectedSession.status]}
                  </Badge>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4">
              {/* 상담 시간 정보 */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  시작: {formatDate(selectedSession.startedAt)}
                </div>
                {selectedSession.endedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    종료: {formatDate(selectedSession.endedAt)}
                  </div>
                )}
              </div>

              {/* 대화 내용 */}
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div className="space-y-4">
                  {selectedSession.messages?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {new Date(message.createdAt).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          <UserCircle className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* 요약 */}
              {selectedSession.summary && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="text-sm font-medium mb-2">상담 요약</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedSession.summary}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedSession?.status === "ACTIVE" && (
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  handleCloseSession(selectedSession.id);
                  setIsDetailOpen(false);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                상담 종료
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
