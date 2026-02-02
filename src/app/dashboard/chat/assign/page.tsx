"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Headphones,
  Clock,
  MessageSquare,
  CheckCircle2,
  Phone,
  Send,
  RefreshCw,
  Timer,
  ChevronRight,
  PlayCircle,
  Trash2,
  List,
  User,
  Calendar,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getEscalatedSessions,
  autoAssignSession,
  completeSession,
  getSessionMessages,
  sendAgentMessage,
  getQueueStats,
  deleteAllSessions,
  getAllSessions,
  EscalatedSession,
} from "@/app/actions/chat-assign";

// 우선순위 스타일
const priorityStyles: Record<number, { label: string; color: string }> = {
  0: { label: "일반", color: "bg-gray-100 text-gray-700" },
  1: { label: "높음", color: "bg-orange-100 text-orange-700" },
  2: { label: "긴급", color: "bg-red-100 text-red-700" },
};

export default function ChatAssignPage() {
  const [sessions, setSessions] = useState<EscalatedSession[]>([]);
  const [allSessionsList, setAllSessionsList] = useState<EscalatedSession[]>([]);
  const [stats, setStats] = useState({ 
    waiting: 0, 
    assigned: 0, 
    completedToday: 0, 
    avgWaitTime: 0,
    avgConsultTime: 0,
    totalWaitTime: 0,
    totalConsultTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<EscalatedSession | null>(null);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: string; senderType: string; content: string; createdAt: Date }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // 데이터 로드
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsData, statsData] = await Promise.all([
        getEscalatedSessions(),
        getQueueStats(),
      ]);
      setSessions(sessionsData);
      setStats(statsData);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // 10초마다 자동 새로고침
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // 상담 시작 (자동 할당)
  const handleAutoAssign = async (sessionId: string) => {
    const result = await autoAssignSession(sessionId);
    if (result.success) {
      loadData();
    } else {
      alert(result.message);
    }
  };

  // 상담 완료
  const handleComplete = async (sessionId: string) => {
    const result = await completeSession(sessionId);
    if (result.success) {
      loadData();
      setShowChatDialog(false);
    } else {
      alert(result.message);
    }
  };

  // 채팅창 열기
  const openChatDialog = async (session: EscalatedSession) => {
    setSelectedSession(session);
    const messages = await getSessionMessages(session.id);
    setChatMessages(messages);
    setShowChatDialog(true);
  };

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;
    
    setSendingMessage(true);
    try {
      const result = await sendAgentMessage(selectedSession.id, newMessage, "current-agent-id");
      if (result.success) {
        setNewMessage("");
        const messages = await getSessionMessages(selectedSession.id);
        setChatMessages(messages);
      }
    } catch (error) {
      console.error("메시지 전송 실패:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  // 대기 세션 (미할당)
  const waitingSessions = sessions.filter((s) => (s.status === "ESCALATED" || s.status === "WAITING_AGENT") && !s.assignedToId);
  // 진행중 세션 (할당됨)
  const activeSessions = sessions.filter((s) => s.status === "ASSIGNED");
  // 오늘 완료된 세션
  const todayCompletedSessions = sessions.filter((s) => {
    if (s.status !== "CLOSED") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDate = s.escalatedAt ? new Date(s.escalatedAt) : null;
    return sessionDate && sessionDate >= today;
  });

  // 세션 카드 컴포넌트
  const SessionCard = ({ session, type }: { session: EscalatedSession; type: 'waiting' | 'active' | 'completed' }) => (
    <div className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-base">{session.phone}</span>
        </div>
        <Badge className={priorityStyles[session.priority].color}>
          {priorityStyles[session.priority].label}
        </Badge>
      </div>
      
      {session.customerName && (
        <p className="text-sm text-muted-foreground mb-2">👤 {session.customerName}</p>
      )}
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Clock className="h-3 w-3" />
        <span>
          {session.escalatedAt 
            ? new Date(session.escalatedAt).toLocaleString('ko-KR', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              }) 
            : '-'}
        </span>
        {type === 'waiting' && (
          <>
            <span className="mx-1">•</span>
            <Timer className="h-3 w-3 text-orange-500" />
            <span className="text-orange-600 font-medium">{session.waitingTime}분 대기</span>
          </>
        )}
      </div>

      {session.escalateReason && (
        <p className="text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded line-clamp-2">
          💬 {session.escalateReason}
        </p>
      )}

      {type === 'waiting' && (
        <Button 
          size="sm" 
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => handleAutoAssign(session.id)}
        >
          <PlayCircle className="h-4 w-4 mr-2" />
          상담 시작
        </Button>
      )}

      {type === 'active' && (
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            👤 {session.assignedToName || "상담중"}
          </Badge>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openChatDialog(session)}>
              <MessageSquare className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              className="h-7 px-3 bg-green-500 hover:bg-green-600 text-white"
              onClick={() => handleComplete(session.id)}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              완료
            </Button>
          </div>
        </div>
      )}

      {type === 'completed' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>대기: {session.waitingTime}분</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Timer className="h-3 w-3" />
              <span>상담: {session.consultTime}분</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-600 font-medium">상담 완료</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {session.endedAt 
                ? new Date(session.endedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                : '-'}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Headphones className="h-8 w-8 text-primary" />
            상담 예약 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            고객 상담 예약을 프로세스 흐름에 따라 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={async () => {
              const allData = await getAllSessions();
              setAllSessionsList(allData);
              setShowHistoryDialog(true);
            }}
          >
            <List className="h-4 w-4 mr-2" />
            상담예약처리현황
          </Button>
          <Button 
            variant="destructive" 
            onClick={async () => {
              if (confirm("모든 상담 세션을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) {
                const result = await deleteAllSessions();
                if (result.success) {
                  alert(`${result.deletedCount}개의 세션이 삭제되었습니다.`);
                  loadData();
                } else {
                  alert(result.message || "삭제 실패");
                }
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            전체 삭제
          </Button>
          <Button onClick={loadData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              예약 대기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">{stats.waiting}건</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              상담 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.assigned}건</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              오늘 완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats.completedToday}건</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <Timer className="h-4 w-4" />
              평균 대기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{stats.avgWaitTime}분</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              평균 상담
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{stats.avgConsultTime}분</div>
          </CardContent>
        </Card>
      </div>

      {/* 프로세스 플로우 안내 */}
      <div className="flex items-center justify-center gap-4 py-4 bg-gradient-to-r from-yellow-50 via-blue-50 to-green-50 rounded-lg border">
        <div className="flex items-center gap-2 text-yellow-700">
          <Clock className="h-5 w-5" />
          <span className="font-medium">예약 대기</span>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
        <div className="flex items-center gap-2 text-blue-700">
          <PlayCircle className="h-5 w-5" />
          <span className="font-medium">상담 중</span>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">완료</span>
        </div>
      </div>

      {/* 칸반 보드 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* 예약 대기 컬럼 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <h3 className="font-semibold text-yellow-700">예약 대기</h3>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                {waitingSessions.length}
              </Badge>
            </div>
          </div>
          <ScrollArea className="h-[500px] pr-2">
            <div className="space-y-3">
              {waitingSessions.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-yellow-200 rounded-lg bg-yellow-50/50">
                  <Clock className="h-10 w-10 mx-auto mb-2 text-yellow-300" />
                  <p className="text-sm text-yellow-600">대기 중인 예약 없음</p>
                </div>
              ) : (
                waitingSessions.map((session) => (
                  <SessionCard key={session.id} session={session} type="waiting" />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 상담 중 컬럼 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <h3 className="font-semibold text-blue-700">상담 중</h3>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                {activeSessions.length}
              </Badge>
            </div>
          </div>
          <ScrollArea className="h-[500px] pr-2">
            <div className="space-y-3">
              {activeSessions.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/50">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 text-blue-300" />
                  <p className="text-sm text-blue-600">진행 중인 상담 없음</p>
                </div>
              ) : (
                activeSessions.map((session) => (
                  <SessionCard key={session.id} session={session} type="active" />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 오늘 완료 컬럼 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <h3 className="font-semibold text-green-700">오늘 완료</h3>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                {stats.completedToday}
              </Badge>
            </div>
          </div>
          <ScrollArea className="h-[500px] pr-2">
            <div className="space-y-3">
              {todayCompletedSessions.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-green-200 rounded-lg bg-green-50/50">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-300" />
                  <p className="text-sm text-green-600">오늘 완료된 상담 없음</p>
                </div>
              ) : (
                todayCompletedSessions.map((session) => (
                  <SessionCard key={session.id} session={session} type="completed" />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* 채팅 다이얼로그 */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              실시간 상담
              {selectedSession && (
                <Badge variant="secondary" className="ml-2">
                  {selectedSession.phone}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedSession?.customerName || "미인증 고객"}님과의 상담
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] border rounded-lg p-4">
            <div className="space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.senderType === "USER"
                      ? "justify-start"
                      : msg.senderType === "AGENT"
                      ? "justify-end"
                      : "justify-center"
                  }`}
                >
                  {msg.senderType === "SYSTEM" ? (
                    <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl ${
                        msg.senderType === "USER"
                          ? "bg-gray-100 text-gray-900 rounded-bl-md"
                          : msg.senderType === "AGENT"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-blue-100 text-blue-900 rounded-br-md"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex items-center gap-2">
            <Input
              placeholder="메시지를 입력하세요..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage} disabled={sendingMessage || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => selectedSession && handleComplete(selectedSession.id)}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              상담 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 상담예약처리현황 다이얼로그 */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              상담 예약 처리 현황
            </DialogTitle>
            <DialogDescription>
              전체 상담 내역을 확인합니다. (총 {allSessionsList.length}건)
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">상태</TableHead>
                  <TableHead>고객명</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>예약요청</TableHead>
                  <TableHead>상담시작</TableHead>
                  <TableHead>완료시간</TableHead>
                  <TableHead className="text-center">대기(분)</TableHead>
                  <TableHead className="text-center">상담(분)</TableHead>
                  <TableHead>사유</TableHead>
                  <TableHead>우선순위</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSessionsList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                      상담 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  allSessionsList.map((session) => {
                    const statusBadge = {
                      ESCALATED: { label: "대기", color: "bg-yellow-100 text-yellow-700" },
                      WAITING_AGENT: { label: "대기", color: "bg-yellow-100 text-yellow-700" },
                      ASSIGNED: { label: "상담중", color: "bg-blue-100 text-blue-700" },
                      CLOSED: { label: "완료", color: "bg-green-100 text-green-700" },
                    }[session.status] || { label: session.status, color: "bg-gray-100 text-gray-700" };
                    
                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {session.customerName || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {session.phone}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {session.escalatedAt 
                            ? new Date(session.escalatedAt).toLocaleString('ko-KR', { 
                                month: 'numeric', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              }) 
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {session.assignedAt 
                            ? new Date(session.assignedAt).toLocaleString('ko-KR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              }) 
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {session.endedAt 
                            ? new Date(session.endedAt).toLocaleString('ko-KR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              }) 
                            : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-medium ${session.waitingTime > 10 ? 'text-red-600' : session.waitingTime > 5 ? 'text-orange-600' : 'text-green-600'}`}>
                            {session.waitingTime}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-blue-600">
                            {session.consultTime}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
                          {session.escalateReason || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityStyles[session.priority]?.color || "bg-gray-100"}>
                            {priorityStyles[session.priority]?.label || "일반"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* KPI 요약 */}
          {allSessionsList.length > 0 && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                KPI 요약
              </h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                  <div className="text-muted-foreground">총 상담</div>
                  <div className="text-2xl font-bold text-slate-900">{allSessionsList.length}건</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-muted-foreground">완료율</div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((allSessionsList.filter(s => s.status === "CLOSED").length / allSessionsList.length) * 100)}%
                  </div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-muted-foreground">평균 대기</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(allSessionsList.reduce((acc, s) => acc + s.waitingTime, 0) / allSessionsList.length || 0)}분
                  </div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-muted-foreground">평균 상담</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(allSessionsList.filter(s => s.consultTime > 0).reduce((acc, s) => acc + s.consultTime, 0) / (allSessionsList.filter(s => s.consultTime > 0).length || 1))}분
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
