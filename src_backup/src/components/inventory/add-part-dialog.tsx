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
import { Plus } from "lucide-react";
import { createPart } from "@/app/actions/inventory";
import { useRouter } from "next/navigation";

export function AddPartDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      partNumber: formData.get("partNumber") as string,
      description: formData.get("description") as string,
      quantity: parseInt(formData.get("quantity") as string),
      minStock: parseInt(formData.get("minStock") as string),
      unitPrice: parseFloat(formData.get("unitPrice") as string),
      location: formData.get("location") as string,
    };

    const result = await createPart(data);

    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      alert("부품 등록에 실패했습니다: " + result.error);
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> 부품 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>새 부품 등록</DialogTitle>
            <DialogDescription>
              미니 공기청정기 부품의 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                부품명
              </Label>
              <Input
                id="name"
                name="name"
                className="col-span-3"
                required
                placeholder="예: HEPA 필터"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="partNumber" className="text-right">
                부품번호
              </Label>
              <Input
                id="partNumber"
                name="partNumber"
                className="col-span-3"
                required
                placeholder="예: FLT-HEPA-001"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                설명
              </Label>
              <Textarea
                id="description"
                name="description"
                className="col-span-3"
                placeholder="부품 상세 설명"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                현재 재고
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                className="col-span-3"
                required
                defaultValue={0}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minStock" className="text-right">
                최소 재고
              </Label>
              <Input
                id="minStock"
                name="minStock"
                type="number"
                className="col-span-3"
                required
                defaultValue={10}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unitPrice" className="text-right">
                단가 (₩)
              </Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
                className="col-span-3"
                required
                placeholder="예: 15000"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                보관 위치
              </Label>
              <Input
                id="location"
                name="location"
                className="col-span-3"
                placeholder="예: A동-1층-선반3"
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
