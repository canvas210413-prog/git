"use client";

import { useState, useEffect, useTransition } from "react";
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
import { getCustomersForSelect } from "@/app/actions/customers-select";
import { Loader2 } from "lucide-react";

export function AddOrderDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");

  useEffect(() => {
    if (open) {
      getCustomersForSelect().then(setCustomers);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const unitPrice = parseFloat(formData.get("unitPrice") as string) || 0;
    const shippingFee = parseFloat(formData.get("shippingFee") as string) || 0;

    // 상품 정보 조합: 쉴드 + 색상 + 수량
    const shield = formData.get("shield") as string;
    const color = formData.get("color") as string;
    const quantity = formData.get("quantity") as string;
    const productInfo = `${shield} / ${color} / ${quantity}개`;

    const orderData = {
      customerId: selectedCustomer,
      orderDate: formData.get("orderDate") as string,
      totalAmount: unitPrice + shippingFee,
      status: formData.get("status") as string,
      
      recipientName: formData.get("recipientName") as string,
      recipientPhone: formData.get("recipientPhone") as string,
      recipientMobile: formData.get("recipientMobile") as string,
      recipientZipCode: formData.get("recipientZipCode") as string,
      recipientAddr: formData.get("recipientAddr") as string,
      orderNumber: formData.get("orderNumber") as string,
      productInfo,
      deliveryMsg: formData.get("deliveryMsg") as string,
      orderSource: formData.get("orderSource") as string,
      unitPrice,
      shippingFee,
      courier: formData.get("courier") as string,
      trackingNumber: formData.get("trackingNumber") as string,
    };

    startTransition(async () => {
      try {
        await createOrder(orderData);
        setOpen(false);
        (e.target as HTMLFormElement).reset();
        setSelectedCustomer("");
      } catch (error) {
        console.error("주문 생성 실패:", error);
        alert("주문 생성에 실패했습니다.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 주문 등록</DialogTitle>
          <DialogDescription>
            주문 정보를 입력하세요. (* 필수 항목)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 날짜 및 기본 정보 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderDate">날짜 *</Label>
              <Input
                id="orderDate"
                name="orderDate"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer">고객 선택 *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer} required>
                <SelectTrigger>
                  <SelectValue placeholder="고객 선택" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderNumber">주문번호</Label>
              <Input
                id="orderNumber"
                name="orderNumber"
                placeholder="ORD-2023-001"
              />
            </div>
          </div>

          {/* 수취인 정보 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">수취인 정보</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">수취인명</Label>
                <Input
                  id="recipientName"
                  name="recipientName"
                  placeholder="홍길동"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientPhone">수취인 전화번호</Label>
                <Input
                  id="recipientPhone"
                  name="recipientPhone"
                  type="tel"
                  placeholder="010-5555-5555"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientMobile">수취인 이동통신</Label>
                <Input
                  id="recipientMobile"
                  name="recipientMobile"
                  type="tel"
                  placeholder="010-5555-5555"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientZipCode">우편번호</Label>
                <Input
                  id="recipientZipCode"
                  name="recipientZipCode"
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2 col-span-3">
                <Label htmlFor="recipientAddr">수취인 주소</Label>
                <Input
                  id="recipientAddr"
                  name="recipientAddr"
                  placeholder="서울시 성동구 00동"
                />
              </div>
            </div>
          </div>

          {/* 상품 정보 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">상품명 및 수량</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shield">쉴드</Label>
                <Input
                  id="shield"
                  name="shield"
                  placeholder="엘스 팔이드"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">색상</Label>
                <Select name="color" defaultValue="화이트">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="화이트">화이트</SelectItem>
                    <SelectItem value="블랙">블랙</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">수량</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderSource">고객주문처명</Label>
                <Select name="orderSource" defaultValue="본사">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="본사">본사</SelectItem>
                    <SelectItem value="그로트">그로트</SelectItem>
                    <SelectItem value="헤이플로">헤이플로</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 금액 및 배송 */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">단가</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                min="0"
                placeholder="99000"
                defaultValue="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingFee">배송비</Label>
              <Input
                id="shippingFee"
                name="shippingFee"
                type="number"
                min="0"
                placeholder="3000"
                defaultValue="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courier">택배사</Label>
              <Input
                id="courier"
                name="courier"
                placeholder="CJ대한통운"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trackingNumber">운송장번호</Label>
              <Input
                id="trackingNumber"
                name="trackingNumber"
                placeholder="123456789"
              />
            </div>
          </div>

          {/* 배송 메시지 */}
          <div className="space-y-2">
            <Label htmlFor="deliveryMsg">배송메세지</Label>
            <Textarea
              id="deliveryMsg"
              name="deliveryMsg"
              placeholder="문 앞에 놓아주세요"
              rows={2}
            />
          </div>

          {/* 상태 */}
          <div className="space-y-2">
            <Label htmlFor="status">상태</Label>
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

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending || !selectedCustomer}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              등록
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
