"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/app/actions/orders";
import { Loader2 } from "lucide-react";

export function AddOrderDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [customerId, setCustomerId] = useState("");
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // 고객 선택 - 현재는 첫 번째 샘플 고객 사용
    const customers = await fetch("/api/customers").then(r => r.json()).catch(() => []);
    const firstCustomer = customers[0]?.id || "temp-id";

    const basePrice = parseFloat(formData.get("basePrice") as string) || 0;
    const additionalFee = parseFloat(formData.get("additionalFee") as string) || 0;
    const shippingFee = parseFloat(formData.get("shippingFee") as string) || 0;

    const orderData = {
      customerId: firstCustomer,
      totalAmount: basePrice + additionalFee + shippingFee,
      status: formData.get("status") as string,
      basePrice, // 참고용으로 저장 (현재 스키마에는 없음)
    };

    startTransition(async () => {
      try {
        await createOrder(orderData);
        setOpen(false);
        (e.target as HTMLFormElement).reset();
      } catch (error) {
        console.error("주문 생성 실패:", error);
        alert("주문 생성에 실패했습니다.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 주문 등록</DialogTitle>
          <DialogDescription>
            고객 주문 정보를 입력하세요. (* 필수 항목)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium">📝 간편 주문 등록</p>
            <p className="text-xs mt-1">
              현재는 기본 필드만 지원합니다. 추가 필드(배송지, 상품명 등)는 데이터베이스 스키마 업데이트 후 사용 가능합니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">주문 상태 *</Label>
              <Select name="status" defaultValue="PENDING">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">대기</SelectItem>
                  <SelectItem value="PROCESSING">처리중</SelectItem>
                  <SelectItem value="SHIPPED">배송중</SelectItem>
                  <SelectItem value="DELIVERED">배송완료</SelectItem>
                  <SelectItem value="CANCELLED">취소</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="basePrice">주문 금액 (원) *</Label>
              <Input
                id="basePrice"
                name="basePrice"
                type="number"
                min="0"
                placeholder="99000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="additionalFee">추가 금액</Label>
              <Input
                id="additionalFee"
                name="additionalFee"
                type="number"
                min="0"
                defaultValue="0"
                placeholder="3000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingFee">배송비</Label>
              <Input
                id="shippingFee"
                name="shippingFee"
                type="number"
                min="0"
                defaultValue="0"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700">
              총 주문 금액: <span className="text-lg font-bold text-blue-600">자동 계산됨</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              기본 금액 + 추가 금액 + 배송비
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              주문 등록
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
