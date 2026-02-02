"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { generateAIResponse } from "@/app/actions/support";

interface AIResponseButtonProps {
  ticketId: string;
  ticketSubject: string;
}

export function AIResponseButton({ ticketId, ticketSubject }: AIResponseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [response, setResponse] = useState<{
    suggestedReply: string;
    category: string;
    priority: string;
    sentiment: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await generateAIResponse(ticketId);
      
      if (result.success && result.response) {
        setResponse(result.response);
        setIsOpen(true);
      } else {
        setError(result.error || "AI 응답 생성에 실패했습니다.");
      }
    } catch (e) {
      setError("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (response?.suggestedReply) {
      navigator.clipboard.writeText(response.suggestedReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "destructive";
      case "HIGH": return "destructive";
      case "MEDIUM": return "default";
      case "LOW": return "secondary";
      default: return "outline";
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "Positive": return "text-green-600 bg-green-50";
      case "Negative": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 text-purple-500" />
        )}
        AI 답변 생성
      </Button>

      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI 생성 답변
            </DialogTitle>
            <DialogDescription>
              &quot;{ticketSubject}&quot;에 대한 AI 추천 답변입니다.
            </DialogDescription>
          </DialogHeader>

          {response && (
            <div className="space-y-4">
              {/* 분석 결과 */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">📁 {response.category}</Badge>
                <Badge variant={getPriorityColor(response.priority) as any}>
                  ⚡ {response.priority}
                </Badge>
                <span className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(response.sentiment)}`}>
                  😊 {response.sentiment}
                </span>
              </div>

              {/* 추천 답변 */}
              <div className="relative">
                <div className="p-4 bg-slate-50 rounded-lg border whitespace-pre-wrap text-sm">
                  {response.suggestedReply}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              닫기
            </Button>
            <Button onClick={handleCopy} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              답변 복사
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
