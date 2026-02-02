"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Search, FileText, MessageSquare } from "lucide-react";
import { searchArticlesWithAI } from "@/app/actions/knowledge";

export function AIKnowledgeSearch() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    answer: string;
    sources: string[];
    relatedArticles: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await searchArticlesWithAI(query);

      if (response.success) {
        setResult({
          answer: response.answer || "",
          sources: response.sources || [],
          relatedArticles: response.relatedArticles || [],
        });
      } else {
        setError(response.error || "검색에 실패했습니다.");
      }
    } catch (e) {
      setError("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* 검색 입력 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="자연어로 질문하세요... 예: 배송 관련 FAQ가 뭐야?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={isLoading} className="gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          AI 검색
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 검색 결과 */}
      {result && (
        <div className="space-y-4">
          {/* AI 답변 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                AI 답변
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{result.answer}</p>
              </div>
            </CardContent>
          </Card>

          {/* 참고 문서 */}
          {result.sources.length > 0 && result.sources[0] !== "일반 답변" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  참고 문서
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.sources.map((source, idx) => (
                    <Badge key={idx} variant="secondary">
                      {source}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 관련 문서 목록 */}
          {result.relatedArticles.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">관련 문서</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.relatedArticles.map((article) => (
                    <li
                      key={article.id}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{article.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {article.category}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        보기
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
