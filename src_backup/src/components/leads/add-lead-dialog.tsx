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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createLead } from "@/app/actions/leads";
import { useFormState } from "react-dom";

const initialState = { message: null, errors: {} };

export function AddLeadDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createLead, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> 새 주문 기회 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>새 주문 기회 추가</DialogTitle>
          <DialogDescription>
            새로운 구매 여정(주문 기회)을 등록합니다.
          </DialogDescription>
        </DialogHeader>
        <form action={async (formData) => {
          await formAction(formData);
          setOpen(false);
        }}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                상품명
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="예: 프리미엄 패딩"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customerName" className="text-right">
                고객명
              </Label>
              <Input
                id="customerName"
                name="customerName"
                placeholder="고객 이름"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">
                예상 금액
              </Label>
              <Input
                id="value"
                name="value"
                type="number"
                placeholder="0"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                단계
              </Label>
              <Select name="status" defaultValue="NEW">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="단계 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">상품 조회 (Viewed)</SelectItem>
                  <SelectItem value="CONTACTED">장바구니 (Cart)</SelectItem>
                  <SelectItem value="QUALIFIED">주문서 작성 (Checkout)</SelectItem>
                  <SelectItem value="PROPOSAL">결제 시도 (Payment)</SelectItem>
                  <SelectItem value="WON">구매 완료 (Purchased)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">저장</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
