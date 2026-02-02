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
import { RefreshCw, AlertCircle, CheckCircle, Trash2, HelpCircle, Chrome } from "lucide-react";
import { 
  crawlAndSyncNaverQnA,
  crawlAndSyncNaverQnARemote,
  deleteAllNaverTickets
} from "@/app/actions/naver-crawl-backend";

interface NaverQnACrawlPanelProps {
  onCrawlComplete?: () => void;
}

export function NaverQnACrawlPanel({ onCrawlComplete }: NaverQnACrawlPanelProps) {
  const [productUrl, setProductUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count?: number; skipped?: number; total?: number; error?: string } | null>(null);

  const handleCrawl = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await crawlAndSyncNaverQnA(productUrl);

      setResult({ 
        success: response.success, 
        count: response.newTickets,
        skipped: response.skipped,
        total: response.total,
        error: response.error 
      });
      
      if (response.success) {
        if (onCrawlComplete) {
          setTimeout(() => {
            onCrawlComplete();
          }, 1500);
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 2500);
        }
      }
    } catch (error) {
      setResult({ success: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoteCrawl = async () => {
    setRemoteLoading(true);
    setResult(null);

    try {
      const response = await crawlAndSyncNaverQnARemote(productUrl);

      setResult({ 
        success: response.success, 
        count: response.newTickets,
        skipped: response.skipped,
        total: response.total,
        error: response.error 
      });
      
      if (response.success) {
        if (onCrawlComplete) {
          setTimeout(() => {
            onCrawlComplete();
          }, 1500);
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 2500);
        }
      }
    } catch (error) {
      setResult({ success: false, error: String(error) });
    } finally {
      setRemoteLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("네이버 Q&A에서 가져온 모든 데이터를 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    setResult(null);

    try {
      const response = await deleteAllNaverTickets();

      setResult({ 
        success: response.success, 
        count: response.count,
        error: response.error 
      });
      
      if (response.success) {
        if (onCrawlComplete) {
          setTimeout(() => {
            onCrawlComplete();
          }, 1500);
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
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
          <HelpCircle className="h-5 w-5 text-blue-500" />
          네이버 스마트스토어 Q&A 크롤링
        </CardTitle>
        <CardDescription>
          네이버 스마트스토어 상품의 Q&A를 크롤링하여 우선순위를 자동 분류합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            disabled={loading || remoteLoading || deleting || !productUrl}
            className="flex-1"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                크롤링 중...
              </>
            ) : (
              <>
                <HelpCircle className="mr-2 h-4 w-4" />
                네이버 Q&A 크롤링 시작
              </>
            )}
          </Button>

          <Button 
            onClick={handleRemoteCrawl} 
            disabled={loading || remoteLoading || deleting || !productUrl}
            variant="secondary"
            className="flex-1"
          >
            {remoteLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                원격 크롤링 중...
              </>
            ) : (
              <>
                <Chrome className="mr-2 h-4 w-4" />
                원격 브라우저 크롤링
              </>
            )}
          </Button>

          <Button 
            onClick={handleDeleteAll} 
            disabled={loading || remoteLoading || deleting}
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
                    {result.count !== undefined && result.total !== undefined
                      ? `${result.total}개 중 ${result.count}개의 새로운 Q&A가 수집되었습니다. (중복 ${result.skipped}개 제외)`
                      : `${result.count}개의 Q&A가 삭제되었습니다.`
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

        <div className="pt-4 border-t space-y-2">
          <p className="text-xs text-muted-foreground">
            💡 Q&A가 크롤링되면 자동으로 우선순위가 분류되고, LLM을 통해 자동 답변이 생성됩니다.
          </p>
          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
              🌐 원격 브라우저 크롤링 사용법:
            </p>
            <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-decimal">
              <li>Chrome을 디버깅 모드로 실행: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">chrome.exe --remote-debugging-port=9222</code></li>
              <li>네이버 상품 페이지 열기 및 로그인 (필요시 캡챠 해결)</li>
              <li>"원격 브라우저 크롤링" 버튼 클릭</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
