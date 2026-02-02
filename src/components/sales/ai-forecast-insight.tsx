"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, AlertTriangle, Lightbulb, Target } from "lucide-react";
import { getAIForecastInsight } from "@/app/actions/forecast";

export function AIForecastInsight() {
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState<{
    summary: string;
    keyFactors: string[];
    recommendations: string[];
    riskLevel: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getAIForecastInsight();

      if (result.success && result.insight) {
        setInsight(result.insight);
      } else {
        setError(result.error || "인사이트 생성에 실패했습니다.");
      }
    } catch (e) {
      setError("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case "LOW":
        return "낮음";
      case "MEDIUM":
        return "보통";
      case "HIGH":
        return "높음";
      default:
        return level;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI 매출 인사이트
            </CardTitle>
            <CardDescription>
              AI가 분석한 매출 전망 및 추천 액션
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            분석 생성
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {!insight && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-purple-200" />
            <p>버튼을 클릭하여 AI 분석을 시작하세요.</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-purple-500" />
            <p className="text-muted-foreground">AI가 데이터를 분석 중입니다...</p>
          </div>
        )}

        {insight && (
          <div className="space-y-4">
            {/* 요약 */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">전망 요약</h4>
                  <p className="text-sm text-muted-foreground">{insight.summary}</p>
                </div>
              </div>
            </div>

            {/* 위험도 */}
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium">위험 수준:</span>
              <Badge className={getRiskColor(insight.riskLevel)}>
                {getRiskLabel(insight.riskLevel)}
              </Badge>
            </div>

            {/* 주요 요인 */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                주요 영향 요인
              </h4>
              <ul className="space-y-1">
                {insight.keyFactors.map((factor, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-muted-foreground flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            {/* 추천 액션 */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                추천 액션
              </h4>
              <ul className="space-y-1">
                {insight.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-muted-foreground flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
