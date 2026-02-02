"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { 
  AlertTriangle,
  ThumbsDown,
  MessageSquare,
  Search,
  RefreshCcw,
  Star,
  Bell,
  BellRing,
  Eye,
  CheckCircle,
  Clock,
  Filter,
  TrendingDown
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
  author: string;
  content: string;
  rating: number;
  date: string;
  sentiment: string | null;
  topics: string | null;
  option: string | null;
  productUrl: string | null;
  isAlerted?: boolean;
  alertStatus?: string;
  alertNote?: string;
}

// 부정적 키워드 목록 (불만 감지용)
const negativeKeywords = [
  "불만", "환불", "반품", "교환", "불량", "고장", "망가", "깨진", "파손",
  "늦은", "지연", "안와", "안옴", "배송", "느림", "최악", "별로", "후회",
  "실망", "화남", "짜증", "불쾌", "사기", "가짜", "품질", "조잡", "싸구려",
  "소음", "시끄", "고객센터", "응대", "무시", "답변", "연락", "전화"
];

export default function ComplaintAlertPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertNote, setAlertNote] = useState("");

  // 리뷰 데이터 가져오기
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reviews");
      if (response.ok) {
        const data = await response.json();
        // 불만 리뷰 분석 (낮은 평점 또는 부정적 키워드 포함)
        const analyzedReviews = data.map((review: Review) => ({
          ...review,
          isAlerted: isComplaintReview(review),
          alertStatus: review.alertStatus || "NEW",
        }));
        setReviews(analyzedReviews);
        setFilteredReviews(analyzedReviews.filter((r: Review) => r.isAlerted));
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  // 불만 리뷰 판별
  const isComplaintReview = (review: Review): boolean => {
    // 1~2점은 무조건 불만
    if (review.rating <= 2) return true;
    
    // 3점이면서 부정적 키워드 포함
    if (review.rating === 3) {
      const content = review.content.toLowerCase();
      return negativeKeywords.some(keyword => content.includes(keyword));
    }
    
    // 부정적 감성 분석 결과
    if (review.sentiment === "Negative") return true;
    
    return false;
  };

  // 불만 심각도 계산
  const getSeverity = (review: Review): { level: string; color: string } => {
    const keywordCount = negativeKeywords.filter(k => 
      review.content.toLowerCase().includes(k)
    ).length;

    if (review.rating === 1 || keywordCount >= 3) {
      return { level: "심각", color: "bg-red-100 text-red-800" };
    }
    if (review.rating === 2 || keywordCount >= 2) {
      return { level: "높음", color: "bg-orange-100 text-orange-800" };
    }
    return { level: "보통", color: "bg-yellow-100 text-yellow-800" };
  };

  // 감지된 키워드 추출
  const getDetectedKeywords = (content: string): string[] => {
    return negativeKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    );
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // 필터링
  useEffect(() => {
    let result = reviews.filter(r => r.isAlerted);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (review) =>
          review.author.toLowerCase().includes(term) ||
          review.content.toLowerCase().includes(term)
      );
    }

    if (ratingFilter !== "all") {
      result = result.filter((review) => review.rating === parseInt(ratingFilter));
    }

    if (statusFilter !== "all") {
      result = result.filter((review) => review.alertStatus === statusFilter);
    }

    setFilteredReviews(result);
  }, [searchTerm, ratingFilter, statusFilter, reviews]);

  // 통계
  const complaintReviews = reviews.filter(r => r.isAlerted);
  const stats = {
    total: complaintReviews.length,
    critical: complaintReviews.filter(r => r.rating === 1).length,
    high: complaintReviews.filter(r => r.rating === 2).length,
    medium: complaintReviews.filter(r => r.rating === 3).length,
    new: complaintReviews.filter(r => r.alertStatus === "NEW").length,
    inProgress: complaintReviews.filter(r => r.alertStatus === "IN_PROGRESS").length,
    resolved: complaintReviews.filter(r => r.alertStatus === "RESOLVED").length,
  };

  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setAlertNote(review.alertNote || "");
    setDialogOpen(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedReview) return;
    
    try {
      const response = await fetch(`/api/reviews/${selectedReview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertStatus: newStatus,
          alertNote: alertNote,
        }),
      });

      if (response.ok) {
        await fetchReviews();
        setDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">불만 리뷰 알림</h2>
          <p className="text-muted-foreground">
            낮은 평점 및 부정적 키워드가 감지된 리뷰를 모니터링하고 대응합니다.
          </p>
        </div>
        <Button onClick={fetchReviews} disabled={loading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {/* 긴급 알림 */}
      {stats.critical > 0 && (
        <Alert variant="destructive">
          <BellRing className="h-4 w-4" />
          <AlertTitle>긴급 불만 리뷰 감지!</AlertTitle>
          <AlertDescription>
            {stats.critical}건의 1점 리뷰가 발견되었습니다. 즉각적인 대응이 필요합니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 불만 리뷰</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              전체 리뷰 중 {reviews.length > 0 ? ((stats.total / reviews.length) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">심각 (1점)</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">즉시 대응 필요</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">미처리</CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.new}</div>
            <p className="text-xs text-muted-foreground">확인 대기중</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">해결완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">
              처리율 {stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 평점별 분포 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">불만 리뷰 평점 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {[1, 2, 3].map((rating) => {
              const count = complaintReviews.filter(r => r.rating === rating).length;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={rating} className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      {renderStars(rating)}
                    </div>
                    <span className="text-sm font-medium">{count}건</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${rating === 1 ? "bg-red-500" : rating === 2 ? "bg-orange-500" : "bg-yellow-500"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">불만 리뷰 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="작성자, 내용으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="평점" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 평점</SelectItem>
                <SelectItem value="1">1점</SelectItem>
                <SelectItem value="2">2점</SelectItem>
                <SelectItem value="3">3점</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="처리상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="NEW">미처리</SelectItem>
                <SelectItem value="IN_PROGRESS">처리중</SelectItem>
                <SelectItem value="RESOLVED">해결완료</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 불만 리뷰 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>불만 리뷰 목록</CardTitle>
          <CardDescription>
            총 {filteredReviews.length}건의 불만 리뷰
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>심각도</TableHead>
                <TableHead>평점</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead>작성자</TableHead>
                <TableHead className="max-w-[300px]">리뷰 내용</TableHead>
                <TableHead>감지 키워드</TableHead>
                <TableHead>처리상태</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    로딩중...
                  </TableCell>
                </TableRow>
              ) : filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-green-600">
                      <CheckCircle className="h-8 w-8" />
                      <span>불만 리뷰가 없습니다!</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReviews.map((review) => {
                  const severity = getSeverity(review);
                  const detectedKeywords = getDetectedKeywords(review.content);
                  return (
                    <TableRow key={review.id}>
                      <TableCell>
                        <Badge className={severity.color}>
                          {severity.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(review.date)}</TableCell>
                      <TableCell>{review.author}</TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="truncate text-sm">{review.content}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {detectedKeywords.slice(0, 3).map((keyword, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-red-50 text-red-700">
                              {keyword}
                            </Badge>
                          ))}
                          {detectedKeywords.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{detectedKeywords.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {review.alertStatus === "NEW" && (
                          <Badge className="bg-orange-100 text-orange-800">
                            <Bell className="mr-1 h-3 w-3" />
                            미처리
                          </Badge>
                        )}
                        {review.alertStatus === "IN_PROGRESS" && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Clock className="mr-1 h-3 w-3" />
                            처리중
                          </Badge>
                        )}
                        {review.alertStatus === "RESOLVED" && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            해결
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewReview(review)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 리뷰 상세 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>불만 리뷰 상세</DialogTitle>
            <DialogDescription>
              리뷰를 확인하고 처리 상태를 업데이트합니다.
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              {/* 리뷰 정보 */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedReview.author}</span>
                    <div className="flex">{renderStars(selectedReview.rating)}</div>
                  </div>
                  <Badge className={getSeverity(selectedReview).color}>
                    {getSeverity(selectedReview).level}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedReview.date)} | {selectedReview.source}
                </p>
                <p className="text-sm whitespace-pre-wrap">{selectedReview.content}</p>
                
                {/* 감지된 키워드 */}
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">감지된 불만 키워드</p>
                  <div className="flex flex-wrap gap-1">
                    {getDetectedKeywords(selectedReview.content).map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="bg-red-50 text-red-700">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* 처리 메모 */}
              <div className="space-y-2">
                <Label htmlFor="alertNote">처리 메모</Label>
                <Textarea
                  id="alertNote"
                  placeholder="고객 응대 내용, 조치 사항 등을 기록하세요..."
                  value={alertNote}
                  onChange={(e) => setAlertNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              닫기
            </Button>
            <Button 
              variant="secondary"
              onClick={() => handleUpdateStatus("IN_PROGRESS")}
            >
              <Clock className="mr-2 h-4 w-4" />
              처리중
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleUpdateStatus("RESOLVED")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              해결완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
