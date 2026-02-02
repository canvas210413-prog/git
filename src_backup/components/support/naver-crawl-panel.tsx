"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { 
  crawlAndSyncNaverQnA, 
  deleteAllNaverTickets,
  crawlAndSyncNaverReviews,
  deleteAllNaverReviews
} from "@/app/actions/naver-crawl-backend";

interface NaverCrawlPanelProps {
  activeTab: "qna" | "review";
  onTabChange: (tab: "qna" | "review") => void;
}

export function NaverCrawlPanel({ activeTab, onTabChange }: NaverCrawlPanelProps) {
  const [productUrl, setProductUrl] = useState("");
  // const [crawlType, setCrawlType] = useState<"qna" | "review">("qna"); // Lifted up
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count?: number; skipped?: number; total?: number; error?: string } | null>(null);

  const handleCrawl = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Server Action으로 백엔드에서 직접 크롤링 및 저장
      const response = activeTab === "qna" 
        ? await crawlAndSyncNaverQnA(productUrl)
        : await crawlAndSyncNaverReviews(productUrl);

      setResult({ 
        success: response.success, 
        count: response.newTickets,
        skipped: response.skipped,
        total: response.total,
        error: response.error 
      });
      
      if (response.success) {
        // 페이지 새로고침하여 새 티켓 표시
        setTimeout(() => {
          window.location.reload();
        }, 2500);
      }
    } catch (error) {
      setResult({ success: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    const targetName = activeTab === "qna" ? "Q&A" : "리뷰";
    if (!confirm(`네이버 ${targetName}에서 가져온 모든 티켓을 삭제하시겠습니까?`)) {
      return;
    }

    setDeleting(true);
    setResult(null);

    try {
      const response = activeTab === "qna"
        ? await deleteAllNaverTickets()
        : await deleteAllNaverReviews();

      setResult({ 
        success: response.success, 
        count: response.count,
        error: response.error 
      });
      
      if (response.success) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      setResult({ success: false, error: String(error) });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          네이버 스마트스토어 크롤링
        </CardTitle>
        <CardDescription>
          네이버 스마트스토어 상품의 Q&A 또는 리뷰를 크롤링하여 자동으로 티켓을 생성합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as "qna" | "review")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qna">Q&A 문의</TabsTrigger>
            <TabsTrigger value="review">상품 리뷰</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="productUrl">상품 URL</Label>
          <Input
            id="productUrl"
            placeholder="https://smartstore.naver.com/kproject/products/7024065775"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            네이버 스마트스토어 상품의 전체 URL을 입력하세요.
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleCrawl} 
            disabled={loading || deleting || !productUrl}
            className="flex-1"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                크롤링 중...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {activeTab === "qna" ? "네이버 Q&A 크롤링 시작" : "네이버 리뷰 크롤링 시작"}
              </>
            )}
          </Button>

          <Button 
            onClick={handleDeleteAll} 
            disabled={loading || deleting}
            variant="destructive"
          >
            {deleting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                삭제 중...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                전체 삭제
              </>
            )}
          </Button>
        </div>

        {result && (
          <div
            className={`flex items-start gap-2 p-3 rounded-md ${
              result.success
                ? "bg-green-50 text-green-900"
                : "bg-red-50 text-red-900"
            }`}
          >
            {result.success ? (
              <>
                <CheckCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-medium">
                    {result.count !== undefined ? '동기화 완료' : '삭제 완료'}
                  </p>
                  <p className="text-sm">
                    {result.count !== undefined 
                      ? `${result.total}개 중 ${result.count}개의 새로운 티켓이 생성되었습니다. (중복 ${result.skipped}개 제외)`
                      : `${result.count}개의 티켓이 삭제되었습니다.`
                    }
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-medium">작업 실패</p>
                  <p className="text-sm">{result.error}</p>
                </div>
              </>
            )}
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>백엔드 크롤링:</strong> 중복 체크(제목+작성자+작성일)를 통해 새로운 Q&A만 가져옵니다.
            "전체 삭제" 버튼은 네이버 Q&A에서 가져온 티켓만 삭제합니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
