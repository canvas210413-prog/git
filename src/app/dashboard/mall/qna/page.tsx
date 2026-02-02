"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Search,
  MoreHorizontal,
  Eye,
  Loader2,
  MessageCircle,
  Clock,
  CheckCircle,
  RefreshCw,
  Reply,
  AlertCircle,
} from "lucide-react";

interface MallQnA {
  id: string;
  userId: number | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  authorName: string;
  authorEmail: string | null;
  category: string;
  subject: string;
  content: string;
  isPrivate: boolean;
  status: string;
  answer: string | null;
  answeredAt: string | null;
  answeredBy: string | null;
  createdAt: string;
  updatedAt: string;
}

const QNA_STATUSES = [
  { value: "PENDING", label: "답변대기", color: "bg-yellow-500" },
  { value: "ANSWERED", label: "답변완료", color: "bg-green-500" },
  { value: "CLOSED", label: "종료", color: "bg-gray-500" },
];

const QNA_CATEGORIES = [
  "상품문의",
  "배송문의",
  "교환/반품",
  "결제문의",
  "기타문의",
];

export default function MallQnaPage() {
  const [qnas, setQnas] = useState<MallQnA[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedQna, setSelectedQna] = useState<MallQnA | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAnswerOpen, setIsAnswerOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  // Q&A 목록 조회
  const fetchQnas = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      
      const response = await fetch(`/api/mall/admin/qna?${params}`);
      if (response.ok) {
        const data = await response.json();
        setQnas(data.qnas || []);
      }
    } catch (error) {
      console.error("Failed to fetch qnas:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchQnas();
  }, [fetchQnas]);

  // 답변 저장
  const handleAnswerSave = async () => {
    if (!selectedQna || !answer.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/mall/admin/qna/${selectedQna.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: answer.trim(),
          status: "ANSWERED",
          answeredBy: "관리자", // 실제로는 로그인한 관리자 이름
        }),
      });

      if (response.ok) {
        fetchQnas();
        setIsAnswerOpen(false);
        setAnswer("");
        setSelectedQna(null);
      }
    } catch (error) {
      console.error("Failed to save answer:", error);
    } finally {
      setSaving(false);
    }
  };

  // 상태 변경
  const handleStatusChange = async (qnaId: string, status: string) => {
    try {
      const response = await fetch(`/api/mall/admin/qna/${qnaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchQnas();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // 상세 보기
  const handleViewDetail = (qna: MallQnA) => {
    setSelectedQna(qna);
    setIsDetailOpen(true);
  };

  // 답변 모달 열기
  const handleOpenAnswer = (qna: MallQnA) => {
    setSelectedQna(qna);
    setAnswer(qna.answer || "");
    setIsAnswerOpen(true);
  };

  // 날짜 포맷
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 상태 배지
  const getStatusBadge = (status: string) => {
    const statusInfo = QNA_STATUSES.find(s => s.value === status);
    return (
      <Badge className={`${statusInfo?.color || "bg-gray-500"} text-white`}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  // 통계
  const stats = {
    total: qnas.length,
    pending: qnas.filter(q => q.status === "PENDING").length,
    answered: qnas.filter(q => q.status === "ANSWERED").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Q&A 관리</h1>
          <p className="text-muted-foreground">쇼핑몰 고객 문의를 관리합니다.</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">전체 문의</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">답변대기</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">답변완료</p>
                <p className="text-2xl font-bold text-green-600">{stats.answered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="제목, 작성자로 검색..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                {QNA_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {QNA_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchQnas}>
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Q&A 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>문의 목록</CardTitle>
          <CardDescription>총 {qnas.length}개의 문의</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : qnas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4" />
              <p>문의가 없습니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>작성자</TableHead>
                  <TableHead>작성일</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qnas.map((qna) => (
                  <TableRow key={qna.id} className={qna.status === "PENDING" ? "bg-yellow-50" : ""}>
                    <TableCell className="text-center">
                      {getStatusBadge(qna.status)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{qna.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {qna.isPrivate && (
                          <Badge variant="secondary" className="text-xs">비공개</Badge>
                        )}
                        <span className="font-medium line-clamp-1">{qna.subject}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{qna.authorName}</div>
                        <div className="text-xs text-muted-foreground">
                          {qna.user?.email || qna.authorEmail || "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(qna.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetail(qna)}>
                            <Eye className="h-4 w-4 mr-2" />
                            상세보기
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenAnswer(qna)}>
                            <Reply className="h-4 w-4 mr-2" />
                            답변작성
                          </DropdownMenuItem>
                          {qna.status !== "CLOSED" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(qna.id, "CLOSED")}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              종료처리
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Q&A 상세 모달 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>문의 상세</DialogTitle>
            <DialogDescription>
              {selectedQna && formatDate(selectedQna.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedQna && (
            <div className="space-y-4">
              {/* 문의 정보 */}
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedQna.status)}
                <Badge variant="outline">{selectedQna.category}</Badge>
                {selectedQna.isPrivate && (
                  <Badge variant="secondary">비공개</Badge>
                )}
              </div>

              {/* 작성자 정보 */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="font-medium">{selectedQna.authorName}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedQna.user?.email || selectedQna.authorEmail || "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 문의 내용 */}
              <div>
                <h4 className="font-semibold mb-2">문의 내용</h4>
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2">{selectedQna.subject}</h5>
                  <p className="text-sm whitespace-pre-wrap">{selectedQna.content}</p>
                </div>
              </div>

              {/* 답변 */}
              {selectedQna.answer && (
                <div>
                  <h4 className="font-semibold mb-2">답변</h4>
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                      <Reply className="h-4 w-4" />
                      <span>{selectedQna.answeredBy || "관리자"}</span>
                      <span>•</span>
                      <span>{selectedQna.answeredAt ? formatDate(selectedQna.answeredAt) : "-"}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{selectedQna.answer}</p>
                  </div>
                </div>
              )}

              {/* 답변 버튼 */}
              {selectedQna.status !== "CLOSED" && (
                <Button className="w-full" onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenAnswer(selectedQna);
                }}>
                  <Reply className="h-4 w-4 mr-2" />
                  {selectedQna.answer ? "답변 수정" : "답변 작성"}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 답변 작성 모달 */}
      <Dialog open={isAnswerOpen} onOpenChange={setIsAnswerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>답변 작성</DialogTitle>
            <DialogDescription>
              {selectedQna?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 문의 내용 요약 */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{selectedQna?.category}</Badge>
                <span className="font-medium">{selectedQna?.authorName}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {selectedQna?.content}
              </p>
            </div>

            {/* 답변 입력 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">답변 내용</label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="답변을 입력해주세요..."
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnswerOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAnswerSave} disabled={saving || !answer.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              답변 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
