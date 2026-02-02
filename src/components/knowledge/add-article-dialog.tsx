"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus } from "lucide-react";
import { createArticle } from "@/app/actions/knowledge";
import { useRouter } from "next/navigation";

export function AddArticleDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("FAQ");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      category: category,
      tags: formData.get("tags") as string,
    };

    const result = await createArticle(data);

    if (result.success) {
      setOpen(false);
      router.refresh();
      // 폼 리셋
      (e.target as HTMLFormElement).reset();
      setCategory("FAQ");
    } else {
      alert("문서 등록에 실패했습니다: " + result.error);
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> 문서 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>새 지식 문서 작성</DialogTitle>
            <DialogDescription>
              FAQ, 제품 매뉴얼, 사용 가이드 등을 작성하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                카테고리
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAQ">FAQ</SelectItem>
                  <SelectItem value="제품 매뉴얼">제품 매뉴얼</SelectItem>
                  <SelectItem value="사용 가이드">사용 가이드</SelectItem>
                  <SelectItem value="문제 해결">문제 해결</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                제목
              </Label>
              <Input
                id="title"
                name="title"
                className="col-span-3"
                required
                placeholder="예: 필터 교체 방법"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="content" className="text-right pt-2">
                내용
              </Label>
              <Textarea
                id="content"
                name="content"
                className="col-span-3 min-h-[200px]"
                required
                placeholder="상세한 내용을 입력하세요..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">
                태그
              </Label>
              <Input
                id="tags"
                name="tags"
                className="col-span-3"
                placeholder="예: 필터, 교체, 유지보수 (쉼표로 구분)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
