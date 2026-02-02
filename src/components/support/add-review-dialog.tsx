"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Star } from "lucide-react";

interface AddReviewDialogProps {
  onSuccess?: () => void;
}

export function AddReviewDialog({ onSuccess }: AddReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    author: "",
    rating: "5",
    content: "",
    source: "Manual",
    option: "",
    productUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author: formData.author,
          rating: parseInt(formData.rating),
          content: formData.content,
          source: formData.source,
          option: formData.option || null,
          productUrl: formData.productUrl || null,
          date: new Date().toISOString(),
          sentiment: parseInt(formData.rating) >= 4 ? "Positive" : parseInt(formData.rating) === 3 ? "Neutral" : "Negative",
        }),
      });

      if (response.ok) {
        alert("✅ 리뷰가 등록되었습니다.");
        setOpen(false);
        setFormData({
          author: "",
          rating: "5",
          content: "",
          source: "Manual",
          option: "",
          productUrl: "",
        });
        if (onSuccess) onSuccess();
      } else {
        const error = await response.json();
        alert(`❌ 등록 실패: ${error.error || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("리뷰 등록 오류:", error);
      alert("❌ 리뷰 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          리뷰 등록
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>고객 리뷰 등록</DialogTitle>
          <DialogDescription>
            불만 추적 테스트를 위해 임의로 리뷰를 등록할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">작성자명 *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) =>
                  setFormData({ ...formData, author: e.target.value })
                }
                placeholder="홍길동"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">별점 *</Label>
              <Select
                value={formData.rating}
                onValueChange={(value) =>
                  setFormData({ ...formData, rating: value })
                }
              >
                <SelectTrigger id="rating">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">⭐ 1점 (매우 불만)</SelectItem>
                  <SelectItem value="2">⭐⭐ 2점 (불만)</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ 3점 (보통)</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ 4점 (만족)</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ 5점 (매우 만족)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">리뷰 내용 *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="예: 배송이 너무 늦어서 불만입니다. 환불하고 싶어요. 제품도 불량이에요."
              rows={5}
              required
            />
            <p className="text-sm text-muted-foreground">
              💡 불만 키워드 예시: 불만, 환불, 반품, 불량, 늦은, 배송지연, 최악, 별로, 실망 등
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">출처</Label>
              <Select
                value={formData.source}
                onValueChange={(value) =>
                  setFormData({ ...formData, source: value })
                }
              >
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">수동 입력</SelectItem>
                  <SelectItem value="Naver SmartStore">네이버 스마트스토어</SelectItem>
                  <SelectItem value="Coupang">쿠팡</SelectItem>
                  <SelectItem value="11st">11번가</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="option">상품 옵션</Label>
              <Input
                id="option"
                value={formData.option}
                onChange={(e) =>
                  setFormData({ ...formData, option: e.target.value })
                }
                placeholder="블랙/M"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="productUrl">상품 URL</Label>
            <Input
              id="productUrl"
              value={formData.productUrl}
              onChange={(e) =>
                setFormData({ ...formData, productUrl: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
