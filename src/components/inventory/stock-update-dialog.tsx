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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package } from "lucide-react";
import { updatePartStock, adjustPartStock } from "@/app/actions/inventory";
import { useRouter } from "next/navigation";

interface StockUpdateDialogProps {
  part: {
    id: string;
    name: string;
    partNumber: string;
    quantity: number;
    minStock: number;
  };
}

export function StockUpdateDialog({ part }: StockUpdateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSetStock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const quantity = parseInt(formData.get("quantity") as string);

    const result = await updatePartStock(part.id, quantity);

    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      alert("재고 업데이트 실패: " + result.error);
    }

    setLoading(false);
  }

  async function handleAdjustStock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const adjustment = parseInt(formData.get("adjustment") as string);
    const type = formData.get("type") as "IN" | "OUT";

    const result = await adjustPartStock(part.id, adjustment, type);

    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      alert("재고 조정 실패: " + result.error);
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Package className="mr-2 h-4 w-4" /> 재고 관리
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{part.name} - 재고 관리</DialogTitle>
          <DialogDescription>
            부품번호: {part.partNumber} | 현재 재고: {part.quantity}개 (최소: {part.minStock}개)
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="adjust" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="adjust">입고/출고</TabsTrigger>
            <TabsTrigger value="set">직접 설정</TabsTrigger>
          </TabsList>

          <TabsContent value="adjust">
            <form onSubmit={handleAdjustStock}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    유형
                  </Label>
                  <div className="col-span-3 flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="type" value="IN" defaultChecked />
                      <span>입고</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="type" value="OUT" />
                      <span>출고</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="adjustment" className="text-right">
                    수량
                  </Label>
                  <Input
                    id="adjustment"
                    name="adjustment"
                    type="number"
                    min="1"
                    className="col-span-3"
                    required
                    placeholder="예: 50"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "처리 중..." : "적용"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="set">
            <form onSubmit={handleSetStock}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">
                    재고 수량
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    className="col-span-3"
                    required
                    defaultValue={part.quantity}
                    placeholder="예: 100"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "변경 중..." : "변경"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
