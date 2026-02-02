"use client";

import { useState } from "react";
import { NaverCrawlPanel } from "@/components/support/naver-crawl-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Inbox, AlertCircle, Clock, CheckCircle, Plus, Star } from "lucide-react";

interface SupportDashboardProps {
  tickets: any[];
  stats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
}

export function SupportDashboard({ tickets, stats }: SupportDashboardProps) {
  const [activeTab, setActiveTab] = useState<"qna" | "review">("qna");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filter tickets based on active tab
  const filteredTickets = tickets.filter((ticket) => {
    if (activeTab === "qna") {
      return ticket.description.includes("[네이버 Q&A -");
    } else {
      return ticket.description.includes("[네이버 리뷰 -");
    }
  });

  // Helper to extract date from description (format: YY.MM.DD.)
  const getNaverDate = (description: string) => {
    const qnaMatch = description.match(/\[네이버 Q&A - (.+?)\]/);
    if (qnaMatch) return qnaMatch[1];
    
    const reviewMatch = description.match(/\[네이버 리뷰 - (.+?)\]/);
    if (reviewMatch) return reviewMatch[1];
    
    return null;
  };

  // Helper to extract rating from subject (format: [리뷰] 5점 - ...)
  const getRating = (subject: string) => {
    const match = subject.match(/\[리뷰\]\s*(\d)점/);
    if (match) return parseInt(match[1]);
    return null;
  };

  // Helper to extract review content from description
  const getReviewContent = (description: string) => {
    // Remove the prefix like [네이버 리뷰 - 25.11.23.]
    const content = description.replace(/\[네이버 리뷰 - .+?\]\s*/, '');
    return content;
  };

  // Helper to format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    // dateStr format: "25.11.23." -> "2025.11.23"
    const cleanDate = dateStr.replace(/\.$/, ''); // Remove trailing dot
    const parts = cleanDate.split('.');
    if (parts.length >= 3) {
      const year = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
      return `${year}.${parts[1].padStart(2, '0')}.${parts[2].padStart(2, '0')}`;
    }
    return dateStr;
  };

  // Render star rating
  const renderStars = (rating: number | null) => {
    if (rating === null) return '-';
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{rating}점</span>
      </div>
    );
  };

  // Handle ticket click to open detail dialog
  const handleTicketClick = (ticket: any) => {
    setSelectedTicket(ticket);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">CS/문의 (Helpdesk)</h2>
          <p className="text-muted-foreground">
            고객의 문의, 불만, A/S 요청 등을 접수, 처리 및 종결하는 프로세스를 관리합니다.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> 티켓 생성
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 티켓</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">미접수</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">처리중</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">해결완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      <NaverCrawlPanel activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>티켓 ID</TableHead>
              <TableHead>제목</TableHead>
              {activeTab === "review" && <TableHead>별점</TableHead>}
              <TableHead>고객</TableHead>
              <TableHead>작성일</TableHead>
              <TableHead>담당자</TableHead>
              <TableHead>우선순위</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={activeTab === "review" ? 9 : 8} className="h-24 text-center">
                  {activeTab === "qna" ? "등록된 Q&A 티켓이 없습니다." : "등록된 리뷰 티켓이 없습니다."}
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => {
                const naverDate = getNaverDate(ticket.description);
                const rating = getRating(ticket.subject);
                return (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.id.substring(0, 8)}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleTicketClick(ticket)}
                        className="text-left text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {ticket.subject}
                      </button>
                    </TableCell>
                    {activeTab === "review" && (
                      <TableCell>{renderStars(rating)}</TableCell>
                    )}
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{ticket.customer.name}</span>
                        <span className="text-xs text-muted-foreground">{ticket.customer.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatDate(naverDate)}
                      </span>
                    </TableCell>
                    <TableCell>{ticket.assignedTo?.name || "미할당"}</TableCell>
                    <TableCell>
                      <Badge variant={ticket.priority === "URGENT" || ticket.priority === "HIGH" ? "destructive" : "outline"}>
                        {ticket.priority === "URGENT" ? "긴급" :
                         ticket.priority === "HIGH" ? "높음" :
                         ticket.priority === "MEDIUM" ? "보통" : "낮음"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ticket.status === "OPEN" ? "default" : ticket.status === "IN_PROGRESS" ? "secondary" : "outline"}>
                        {ticket.status === "OPEN" ? "미접수" :
                         ticket.status === "IN_PROGRESS" ? "처리중" :
                         ticket.status === "RESOLVED" ? "해결됨" : "종결"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleTicketClick(ticket)}>상세보기</Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTicket && getRating(selectedTicket.subject) && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-5 w-5 fill-yellow-400" />
                  <span>{getRating(selectedTicket.subject)}점</span>
                </div>
              )}
              <span>{selectedTicket?.subject}</span>
            </DialogTitle>
            <DialogDescription>
              티켓 ID: {selectedTicket?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">작성자:</span>
                  <span className="ml-2">{selectedTicket.customer.name}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">이메일:</span>
                  <span className="ml-2">{selectedTicket.customer.email}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">작성일:</span>
                  <span className="ml-2">{formatDate(getNaverDate(selectedTicket.description))}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">상태:</span>
                  <Badge className="ml-2" variant={selectedTicket.status === "OPEN" ? "default" : selectedTicket.status === "IN_PROGRESS" ? "secondary" : "outline"}>
                    {selectedTicket.status === "OPEN" ? "미접수" :
                     selectedTicket.status === "IN_PROGRESS" ? "처리중" :
                     selectedTicket.status === "RESOLVED" ? "해결됨" : "종결"}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">우선순위:</span>
                  <Badge className="ml-2" variant={selectedTicket.priority === "URGENT" || selectedTicket.priority === "HIGH" ? "destructive" : "outline"}>
                    {selectedTicket.priority === "URGENT" ? "긴급" :
                     selectedTicket.priority === "HIGH" ? "높음" :
                     selectedTicket.priority === "MEDIUM" ? "보통" : "낮음"}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">담당자:</span>
                  <span className="ml-2">{selectedTicket.assignedTo?.name || "미할당"}</span>
                </div>
              </div>

              {/* 리뷰 내용 */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">리뷰 내용</h4>
                <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed">
                  {getReviewContent(selectedTicket.description)}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  닫기
                </Button>
                <Button>
                  답변 작성
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
