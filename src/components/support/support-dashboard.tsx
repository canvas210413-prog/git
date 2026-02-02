"use client";

import { useState } from "react";
import { NaverReviewCrawlPanel } from "@/components/support/naver-review-crawl-panel";
import { TicketExcelToolbar } from "@/components/support/ticket-excel-toolbar";
import { AddReviewDialog } from "@/components/support/add-review-dialog";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Inbox, AlertCircle, Clock, CheckCircle, Plus, Star, ShoppingCart, Store } from "lucide-react";

interface SupportDashboardProps {
  tickets: any[];
  reviews: any[];
  stats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
}

export function SupportDashboard({ tickets, reviews, stats }: SupportDashboardProps) {
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [platformTab, setPlatformTab] = useState<"manual" | "naver" | "coupang">("manual");

  // 네이버 리뷰 티켓만 필터링
  const naverReviewTickets = tickets.filter((ticket) => {
    return ticket.description.includes("[네이버 리뷰 -");
  });

  // 쿠팡 리뷰 티켓만 필터링
  const coupangReviewTickets = tickets.filter((ticket) => {
    return ticket.description.includes("[쿠팡 리뷰 -");
  });

  // 수동 입력 리뷰 통계
  const manualReviewStats = {
    total: reviews.length,
    open: reviews.filter(r => !r.isAlerted).length,
    inProgress: reviews.filter(r => r.alertStatus === "IN_PROGRESS").length,
    resolved: reviews.filter(r => r.alertStatus === "RESOLVED").length,
  };

  // 현재 선택된 플랫폼의 티켓
  const currentReviewTickets = platformTab === "naver" ? naverReviewTickets : platformTab === "coupang" ? coupangReviewTickets : [];

  // Helper to extract date from description
  const getReviewDate = (description: string) => {
    const naverMatch = description.match(/\[네이버 리뷰 - (.+?)\]/);
    if (naverMatch) return naverMatch[1];
    const coupangMatch = description.match(/\[쿠팡 리뷰 - (.+?)\]/);
    if (coupangMatch) return coupangMatch[1];
    return null;
  };

  // Helper to extract rating from subject
  const getRating = (subject: string) => {
    const naverMatch = subject.match(/\[리뷰\]\s*(\d)점/);
    if (naverMatch) return parseInt(naverMatch[1]);
    const coupangMatch = subject.match(/\[쿠팡 리뷰\]\s*(\d)점/);
    if (coupangMatch) return parseInt(coupangMatch[1]);
    return null;
  };

  // Helper to extract review content from description
  const getReviewContent = (description: string) => {
    let content = description.replace(/\[네이버 리뷰 - .+?\]\s*/, '');
    content = content.replace(/\[쿠팡 리뷰 - .+?\]\s*/, '');
    return content;
  };

  // Helper to format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const cleanDate = dateStr.replace(/\.$/, '');
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

  // Handle ticket click
  const handleTicketClick = (ticket: any) => {
    setSelectedTicket(ticket);
    setDialogOpen(true);
  };

  // 네이버 리뷰 통계
  const naverReviewStats = {
    total: naverReviewTickets.length,
    open: naverReviewTickets.filter(t => t.status === "OPEN").length,
    inProgress: naverReviewTickets.filter(t => t.status === "IN_PROGRESS").length,
    resolved: naverReviewTickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length,
  };

  // 쿠팡 리뷰 통계
  const coupangReviewStats = {
    total: coupangReviewTickets.length,
    open: coupangReviewTickets.filter(t => t.status === "OPEN").length,
    inProgress: coupangReviewTickets.filter(t => t.status === "IN_PROGRESS").length,
    resolved: coupangReviewTickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length,
  };

  // 현재 선택된 플랫폼의 통계
  const currentStats = platformTab === "manual" ? manualReviewStats : platformTab === "naver" ? naverReviewStats : coupangReviewStats;

  // 리뷰 날짜 포맷팅
  const formatReviewDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">고객 리뷰 관리</h2>
          <p className="text-muted-foreground">
            네이버 스마트스토어 및 쿠팡의 상품 리뷰를 수집하고 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TicketExcelToolbar tickets={tickets} />
          <AddReviewDialog onSuccess={() => window.location.reload()} />
          <Button>
            <Plus className="mr-2 h-4 w-4" /> 티켓 생성
          </Button>
        </div>
      </div>

      {/* 플랫폼 탭 */}
      <Tabs value={platformTab} onValueChange={(v) => setPlatformTab(v as "manual" | "naver" | "coupang")} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Star className="h-4 w-4 text-purple-600" />
            수동 입력 ({manualReviewStats.total})
          </TabsTrigger>
          <TabsTrigger value="naver" className="flex items-center gap-2">
            <Store className="h-4 w-4 text-green-600" />
            네이버 ({naverReviewStats.total})
          </TabsTrigger>
          <TabsTrigger value="coupang" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-red-500" />
            쿠팡 ({coupangReviewStats.total})
          </TabsTrigger>
        </TabsList>

        {/* 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 리뷰</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">미확인</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{currentStats.open}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">확인중</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{currentStats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">처리완료</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{currentStats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* 수동 입력 탭 컨텐츠 */}
        <TabsContent value="manual" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>작성자</TableHead>
                  <TableHead>별점</TableHead>
                  <TableHead>리뷰 내용</TableHead>
                  <TableHead>출처</TableHead>
                  <TableHead>작성일</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      등록된 리뷰가 없습니다. 위에서 리뷰를 등록해보세요.
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">{review.id.substring(0, 8)}</TableCell>
                      <TableCell>{review.author}</TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {review.content}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{review.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatReviewDate(review.date)}</span>
                      </TableCell>
                      <TableCell>
                        {review.isAlerted ? (
                          <Badge variant="destructive">
                            불만 감지
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            정상
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* 네이버 탭 컨텐츠 */}
        <TabsContent value="naver" className="space-y-4">
          <NaverReviewCrawlPanel />
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>리뷰 제목</TableHead>
                  <TableHead>별점</TableHead>
                  <TableHead>작성자</TableHead>
                  <TableHead>작성일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {naverReviewTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      등록된 네이버 리뷰가 없습니다. 위에서 네이버 리뷰를 크롤링해보세요.
                    </TableCell>
                  </TableRow>
                ) : (
                  naverReviewTickets.map((ticket) => {
                    const reviewDate = getReviewDate(ticket.description);
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
                        <TableCell>{renderStars(rating)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{ticket.customer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDate(reviewDate)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ticket.status === "OPEN" ? "default" : ticket.status === "IN_PROGRESS" ? "secondary" : "outline"}>
                            {ticket.status === "OPEN" ? "미확인" :
                             ticket.status === "IN_PROGRESS" ? "확인중" : "완료"}
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
        </TabsContent>

        {/* 쿠팡 탭 컨텐츠 */}
        <TabsContent value="coupang" className="space-y-4">
          <CoupangCrawlPanel defaultUrl="https://www.coupang.com/vp/products/7024065775" />
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>리뷰 제목</TableHead>
                  <TableHead>별점</TableHead>
                  <TableHead>작성자</TableHead>
                  <TableHead>작성일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupangReviewTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      등록된 쿠팡 리뷰가 없습니다. 위에서 쿠팡 리뷰를 크롤링해보세요.
                    </TableCell>
                  </TableRow>
                ) : (
                  coupangReviewTickets.map((ticket) => {
                    const reviewDate = getReviewDate(ticket.description);
                    const rating = getRating(ticket.subject);
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.id.substring(0, 8)}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleTicketClick(ticket)}
                            className="text-left text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                          >
                            {ticket.subject}
                          </button>
                        </TableCell>
                        <TableCell>{renderStars(rating)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{ticket.customer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDate(reviewDate)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ticket.status === "OPEN" ? "destructive" : ticket.status === "IN_PROGRESS" ? "secondary" : "outline"}>
                            {ticket.status === "OPEN" ? "미확인" :
                             ticket.status === "IN_PROGRESS" ? "확인중" : "완료"}
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
        </TabsContent>
      </Tabs>

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
              리뷰 ID: {selectedTicket?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">작성자:</span>
                  <span className="ml-2">{selectedTicket.customer.name}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">작성일:</span>
                  <span className="ml-2">{formatDate(getReviewDate(selectedTicket.description))}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">리뷰 내용</h4>
                <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed">
                  {getReviewContent(selectedTicket.description)}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
