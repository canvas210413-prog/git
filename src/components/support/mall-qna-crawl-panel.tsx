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
import { RefreshCw, AlertCircle, CheckCircle, Trash2, Store, ShoppingBag } from "lucide-react";
import { 
  crawlMallQnA,
  deleteAllMallQnATickets
} from "@/app/actions/mall-qna-crawl";

interface MallQnACrawlPanelProps {
  onCrawlComplete?: () => void;
}

export function MallQnACrawlPanel({ onCrawlComplete }: MallQnACrawlPanelProps) {
  const [mallUrl, setMallUrl] = useState("http://localhost:5100");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count?: number; skipped?: number; total?: number; error?: string } | null>(null);

  const handleCrawl = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await crawlMallQnA(mallUrl);

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

  const handleDeleteAll = async () => {
    if (!confirm("자사몰 Q&A에서 가져온 모든 데이터를 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    setResult(null);

    try {
      const response = await deleteAllMallQnATickets();

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
          <Store className="h-5 w-5 text-purple-500" />
          자사몰 Q&A 수집
        </CardTitle>
        <CardDescription>
          K-Project Mall의 Q&A 게시판에서 고객 문의를 수집합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mallUrl">자사몰 URL</Label>
          <Input
            id="mallUrl"
            placeholder="http://localhost:5100"
            value={mallUrl}
            onChange={(e) => setMallUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            자사몰 서버 주소를 입력하세요. (기본: http://localhost:5100)
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleCrawl} 
            disabled={loading || deleting || !mallUrl}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                수집 중...
              </>
            ) : (
              <>
                <ShoppingBag className="mr-2 h-4 w-4" />
                자사몰 Q&A 수집
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
          <div className={`p-4 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            {result.success ? (
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">수집 완료!</p>
                  <p className="text-sm text-green-700">
                    {result.count !== undefined 
                      ? `새로운 Q&A ${result.count}건이 등록되었습니다.`
                      : "삭제가 완료되었습니다."}
                    {result.skipped !== undefined && result.skipped > 0 && (
                      <span className="block text-green-600">
                        (중복 {result.skipped}건 스킵, 전체 {result.total}건)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">오류 발생</p>
                  <p className="text-sm text-red-700">{result.error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-slate-50 p-3 rounded-lg">
          <p className="font-medium mb-1">💡 자사몰 Q&A 수집 안내</p>
          <ul className="list-disc list-inside space-y-1">
            <li>자사몰의 Q&A 게시판 데이터를 CRM으로 가져옵니다</li>
            <li>수집된 Q&A는 AI가 우선순위를 자동 분류합니다</li>
            <li>답변이 필요한 질문은 상담 목록에 표시됩니다</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
