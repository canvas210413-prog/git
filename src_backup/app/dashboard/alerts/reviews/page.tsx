"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  AlertTriangle, Star, MessageSquare, Eye, Shield,
  ThumbsDown, Flag, CheckCircle, XCircle, ExternalLink
} from "lucide-react";

interface MaliciousReview {
  id: string;
  time: string;
  platform: string;
  productName: string;
  rating: number;
  content: string;
  detectedReason: string;
  riskLevel: "high" | "medium" | "low";
  status: "pending" | "confirmed" | "dismissed";
  reviewer: string;
}

export default function MaliciousReviewsPage() {
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [selectedReview, setSelectedReview] = useState<MaliciousReview | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [stats, setStats] = useState({
    totalDetected: 12,
    pending: 5,
    confirmed: 4,
    dismissed: 3,
  });

  const [reviews, setReviews] = useState<MaliciousReview[]>([
    {
      id: "1",
      time: "2025-12-03 13:45",
      platform: "스마트스토어",
      productName: "프리미엄 스킨케어 세트",
      rating: 1,
      content: "완전 사기업체입니다. 절대 구매하지 마세요. 다른 데서 훨씬 싸게 팔아요. 환불도 안해주고 최악!!!",
      detectedReason: "경쟁사 유도, 과격한 표현",
      riskLevel: "high",
      status: "pending",
      reviewer: "구매자A***",
    },
    {
      id: "2",
      time: "2025-12-03 11:20",
      platform: "쿠팡",
      productName: "유기농 그래놀라",
      rating: 1,
      content: "배송 왔는데 유통기한 얼마 안남음. 먹다가 배탈남. 소비자원에 신고할거임",
      detectedReason: "허위 사실 의심, 신고 협박",
      riskLevel: "high",
      status: "pending",
      reviewer: "익명***",
    },
    {
      id: "3",
      time: "2025-12-02 16:30",
      platform: "스마트스토어",
      productName: "블루투스 이어폰",
      rating: 2,
      content: "음질 별로예요. 가격대비 그냥 그래요",
      detectedReason: "낮은 평점",
      riskLevel: "low",
      status: "dismissed",
      reviewer: "음악좋아***",
    },
    {
      id: "4",
      time: "2025-12-02 09:15",
      platform: "11번가",
      productName: "천연 비누 세트",
      rating: 1,
      content: "가짜 리뷰 보고 샀는데 완전 후회. 이 업체 리뷰 조작함. 조심하세요",
      detectedReason: "리뷰 조작 언급, 비방",
      riskLevel: "medium",
      status: "confirmed",
      reviewer: "소비자***",
    },
  ]);

  const handleStatusChange = (id: string, newStatus: "confirmed" | "dismissed") => {
    setReviews(reviews.map(r => 
      r.id === id ? { ...r, status: newStatus } : r
    ));
    setDetailOpen(false);
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "high": return <Badge variant="destructive">위험 높음</Badge>;
      case "medium": return <Badge className="bg-yellow-500">위험 보통</Badge>;
      default: return <Badge variant="secondary">위험 낮음</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="border-yellow-500 text-yellow-600">검토 대기</Badge>;
      case "confirmed": return <Badge variant="destructive">악성 확인</Badge>;
      case "dismissed": return <Badge variant="secondary">정상 처리</Badge>;
      default: return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">악성 리뷰 감지</h2>
          <p className="text-muted-foreground">
            AI가 악성 리뷰를 자동으로 감지하고 알립니다
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={alertEnabled} onCheckedChange={setAlertEnabled} />
            <Label>자동 감지 활성화</Label>
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">감지된 리뷰</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDetected}건</div>
            <p className="text-xs text-muted-foreground">최근 7일</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">검토 대기</CardTitle>
            <Eye className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{stats.pending}건</div>
            <p className="text-xs text-yellow-700">확인 필요</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">악성 확인</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{stats.confirmed}건</div>
            <p className="text-xs text-red-700">대응 필요</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">정상 처리</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.dismissed}건</div>
            <p className="text-xs text-muted-foreground">오탐지</p>
          </CardContent>
        </Card>
      </div>

      {/* 감지 기준 안내 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            AI 감지 기준
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-3 border rounded-lg">
              <p className="font-medium text-sm">경쟁사 유도</p>
              <p className="text-xs text-muted-foreground">다른 업체/제품 언급</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-medium text-sm">허위 사실</p>
              <p className="text-xs text-muted-foreground">확인되지 않은 주장</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-medium text-sm">과격한 표현</p>
              <p className="text-xs text-muted-foreground">욕설, 비방, 협박</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-medium text-sm">반복 패턴</p>
              <p className="text-xs text-muted-foreground">동일인 의심 리뷰</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 리뷰 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>감지된 리뷰 목록</CardTitle>
          <CardDescription>AI가 악성으로 의심되는 리뷰를 감지했습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>감지 시간</TableHead>
                <TableHead>플랫폼</TableHead>
                <TableHead>상품</TableHead>
                <TableHead>평점</TableHead>
                <TableHead>감지 사유</TableHead>
                <TableHead>위험도</TableHead>
                <TableHead>상태</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id} className={review.status === "pending" ? "bg-yellow-50" : ""}>
                  <TableCell className="text-sm">{review.time}</TableCell>
                  <TableCell>{review.platform}</TableCell>
                  <TableCell className="max-w-32 truncate">{review.productName}</TableCell>
                  <TableCell>{renderStars(review.rating)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{review.detectedReason}</TableCell>
                  <TableCell>{getRiskBadge(review.riskLevel)}</TableCell>
                  <TableCell>{getStatusBadge(review.status)}</TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedReview(review);
                        setDetailOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>리뷰 상세 정보</DialogTitle>
            <DialogDescription>
              감지된 리뷰의 상세 내용을 확인하고 처리합니다
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge>{selectedReview.platform}</Badge>
                  {getRiskBadge(selectedReview.riskLevel)}
                </div>
                {renderStars(selectedReview.rating)}
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">상품명</Label>
                <p className="font-medium">{selectedReview.productName}</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">작성자</Label>
                <p>{selectedReview.reviewer}</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">리뷰 내용</Label>
                <div className="p-3 bg-muted rounded-lg mt-1">
                  <p className="text-sm">{selectedReview.content}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">감지 사유</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Flag className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">{selectedReview.detectedReason}</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">💡 추천 대응 방안</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• 플랫폼에 허위 리뷰 신고 접수</li>
                  <li>• 정중한 댓글로 사실관계 정정</li>
                  <li>• 실제 구매 여부 확인 요청</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              닫기
            </Button>
            {selectedReview?.status === "pending" && (
              <>
                <Button 
                  variant="secondary"
                  onClick={() => handleStatusChange(selectedReview.id, "dismissed")}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  정상 처리
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleStatusChange(selectedReview.id, "confirmed")}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  악성 확인
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
