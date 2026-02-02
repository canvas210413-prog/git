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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Copy, Check, Wand2 } from "lucide-react";
import { generateAIMarketingMessage } from "@/app/actions/marketing";

export function AIMessageGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [segment, setSegment] = useState("VIP");
  const [campaignType, setCampaignType] = useState("재구매 유도");
  const [productInfo, setProductInfo] = useState("");
  const [message, setMessage] = useState<{
    subject: string;
    body: string;
    callToAction: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await generateAIMarketingMessage(segment, campaignType, productInfo);

      if (result.success && result.message) {
        setMessage(result.message);
      } else {
        setError(result.error || "메시지 생성에 실패했습니다.");
      }
    } catch (e) {
      setError("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const segments = [
    { value: "VIP", label: "VIP 고객" },
    { value: "Enterprise", label: "기업 고객" },
    { value: "SMB", label: "중소기업" },
    { value: "Individual", label: "개인 고객" },
    { value: "At-Risk", label: "이탈 위험 고객" },
  ];

  const campaignTypes = [
    "재구매 유도",
    "신규 가입 환영",
    "이탈 방지",
    "시즌 할인",
    "신제품 출시",
    "휴면 고객 활성화",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wand2 className="h-4 w-4 text-purple-500" />
          AI 메시지 생성
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI 마케팅 메시지 생성
          </DialogTitle>
          <DialogDescription>
            타겟 세그먼트와 캠페인 유형을 선택하면 AI가 최적화된 메시지를 생성합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 입력 폼 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>타겟 세그먼트</Label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((seg) => (
                    <SelectItem key={seg.value} value={seg.value}>
                      {seg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>캠페인 유형</Label>
              <Select value={campaignType} onValueChange={setCampaignType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {campaignTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>제품/서비스 정보 (선택)</Label>
            <Input
              placeholder="예: 프리미엄 노트북, 30% 할인 이벤트"
              value={productInfo}
              onChange={(e) => setProductInfo(e.target.value)}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            메시지 생성
          </Button>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {/* 생성된 메시지 */}
          {message && (
            <div className="space-y-3 pt-4 border-t">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    제목
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy("subject", message.subject)}
                    >
                      {copied === "subject" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="font-medium">{message.subject}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    본문
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy("body", message.body)}
                    >
                      {copied === "body" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-sm text-muted-foreground">{message.body}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    CTA (Call to Action)
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy("cta", message.callToAction)}
                    >
                      {copied === "cta" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <span className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
                    {message.callToAction}
                  </span>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
