"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw, AlertCircle, CheckCircle, Trash2, ShoppingCart, Info } from "lucide-react";
import { 
  parseCoupangHtmlAndSync,
  deleteAllCoupangReviews,
} from "@/app/actions/coupang-crawl-backend";

interface CoupangCrawlPanelProps {
  defaultUrl?: string;
}

export function CoupangCrawlPanel({ 
  defaultUrl = "https://www.coupang.com/vp/products/7024065775"
}: CoupangCrawlPanelProps) {
  const [productUrl] = useState(defaultUrl);
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{ 
    success: boolean; 
    count?: number; 
    skipped?: number; 
    total?: number; 
    error?: string 
  } | null>(null);

  const handleParseHtml = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await parseCoupangHtmlAndSync(htmlContent);

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
    if (!confirm("쿠팡에서 가져온 모든 리뷰 티켓을 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    setResult(null);

    try {
      const response = await deleteAllCoupangReviews();

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
          <ShoppingCart className="h-5 w-5 text-red-500" />
          쿠팡 리뷰 수집
        </CardTitle>
        <CardDescription>
          쿠팡 상품 페이지의 리뷰 HTML을 붙여넣어 자동으로 티켓을 생성합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 안내 박스 */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200">리뷰 HTML 가져오는 방법:</p>
              <ol className="list-decimal list-inside text-blue-700 dark:text-blue-300 space-y-1">
                <li>쿠팡 상품 페이지 접속: <a href={productUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900 dark:hover:text-blue-100">{productUrl}</a></li>
                <li>리뷰 섹션으로 스크롤하여 리뷰 로드</li>
                <li>개발자 도구 열기 (F12 또는 Ctrl+Shift+I)</li>
                <li>Elements 탭에서 리뷰 영역의 article 태그들이 있는 부분 선택</li>
                <li>우클릭 → Copy → Copy outerHTML</li>
                <li>아래 텍스트 영역에 붙여넣기</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="htmlInput">리뷰 HTML 내용</Label>
          <Textarea
            id="htmlInput"
            placeholder={`<article class="twc-pt-[16px]">...</article> 형태의 HTML을 붙여넣기 하세요...

(여러 리뷰를 한번에 붙여넣기 가능합니다)`}
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            rows={10}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            쿠팡 리뷰 섹션의 article 태그들을 복사해서 붙여넣으세요. 여러 리뷰를 한번에 추출합니다.
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleParseHtml} 
            disabled={loading || deleting || !htmlContent}
            className="flex-1 bg-red-500 hover:bg-red-600"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                파싱 중...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                HTML에서 리뷰 추출
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
                    {result.count !== undefined && result.total !== undefined ? '동기화 완료' : '삭제 완료'}
                  </p>
                  <p className="text-sm">
                    {result.total !== undefined 
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
            💡 <strong>쿠팡 크롤링:</strong> 중복 체크(리뷰 ID)를 통해 새로운 리뷰만 가져옵니다.
            "전체 삭제" 버튼은 쿠팡 리뷰에서 가져온 티켓만 삭제합니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
