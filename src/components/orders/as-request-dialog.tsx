"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Loader2, Wrench } from "lucide-react";

interface Order {
  id: string;
  orderDate: string;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientMobile: string | null;
  recipientZipCode: string | null;
  recipientAddr: string | null;
  orderNumber: string | null;
  productInfo: string | null;
  deliveryMsg: string | null;
  orderSource: string | null;
}

interface ASRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;  // order를 optional로 변경
  onSuccess?: () => void;  // 성공 시 콜백 추가
}

// 문제 유형 목록
const ISSUE_TYPES = [
  { value: "NOISE", label: "소음" },
  { value: "FILTER", label: "필터 교체" },
  { value: "POWER", label: "전원 문제" },
  { value: "SENSOR", label: "센서 오류" },
  { value: "PERFORMANCE", label: "성능 저하" },
  { value: "ODOR", label: "냄새" },
  { value: "OTHER", label: "기타" },
];

export function ASRequestDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: ASRequestDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<any>({});

  // order가 변경될 때 폼 데이터 초기화 (주문 정보 자동완성)
  useEffect(() => {
    if (open) {
      if (order) {
        // 주문에서 AS를 생성하는 경우
        const orderDateStr = order.orderDate 
          ? (typeof order.orderDate === 'string' 
              ? order.orderDate.split("T")[0] 
              : new Date(order.orderDate).toISOString().split("T")[0])
          : "";
        
        setFormData({
          customerName: order.recipientName || "",
          customerPhone: order.recipientMobile || order.recipientPhone || "",
          customerAddress: order.recipientAddr || "",
          productName: order.productInfo || "",
          companyName: order.orderSource || "",
          purchaseDate: orderDateStr,
          issueType: "OTHER",
          description: "",
          status: "RECEIVED",
          receivedAt: new Date().toISOString().split("T")[0],
        });
      } else {
        // 독립적으로 AS를 생성하는 경우
        setFormData({
          customerName: "",
          customerPhone: "",
          customerAddress: "",
          productName: "",
          companyName: "",
          purchaseDate: "",
          issueType: "OTHER",
          description: "",
          status: "RECEIVED",
          receivedAt: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [order, open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 필수 필드 검증
    if (!formData.customerName?.trim()) {
      alert("고객명을 입력해주세요.");
      return;
    }
    if (!formData.customerPhone?.trim()) {
      alert("연락처를 입력해주세요.");
      return;
    }
    if (!formData.description?.trim()) {
      alert("증상 설명을 입력해주세요.");
      return;
    }

    const asData = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerAddress: formData.customerAddress || "",
      productName: formData.productName || "",
      companyName: formData.companyName || "",
      purchaseDate: formData.purchaseDate || null,
      issueType: formData.issueType,
      issueDescription: formData.description,
      status: formData.status,
      receivedAt: formData.receivedAt,
    };

    startTransition(async () => {
      try {
        const response = await fetch("/api/after-service", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(asData),
        });

        if (response.ok) {
          alert("✅ AS 요청이 접수되었습니다.");
          onOpenChange(false);
          
          // 성공 콜백이 있으면 호출 (페이지 리프레시 등)
          if (onSuccess) {
            onSuccess();
          } else {
            // 기본 동작: AS 페이지로 이동 제안
            if (confirm("AS 관리 페이지로 이동하시겠습니까?")) {
              window.location.href = "/dashboard/after-service";
            }
          }
        } else {
          const error = await response.json();
          alert(`❌ AS 접수 실패: ${error.error || "알 수 없는 오류"}`);
        }
      } catch (error) {
        console.error("AS 접수 실패:", error);
        alert("AS 접수에 실패했습니다.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-purple-500" />
            AS 요청 접수
          </DialogTitle>
          <DialogDescription>
            {order ? "주문 정보가 자동으로 채워집니다. AS 관련 정보를 입력해주세요." : "새로운 AS 건을 접수합니다."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 고객 정보 (자동 완성됨) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2 text-blue-600">
              📋 고객 정보 {order && "(주문에서 자동 입력)"}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">고객명 *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName || ""}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="홍길동"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">연락처 *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone || ""}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="010-1234-5678"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerAddress">주소</Label>
              <Input
                id="customerAddress"
                value={formData.customerAddress || ""}
                onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                placeholder="서울시 강남구..."
              />
            </div>
          </div>

          {/* 제품 정보 (자동 완성됨) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2 text-blue-600">
              📦 제품 정보
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName">제품명</Label>
                <Input
                  id="productName"
                  value={formData.productName || ""}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="쉴드미니 프로"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">구매처</Label>
                <Input
                  id="companyName"
                  value={formData.companyName || ""}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="본사"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">구매일</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate || ""}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>
          </div>

          {/* AS 관련 정보 (직접 입력) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2 text-purple-600">
              🔧 AS 요청 정보 (직접 입력)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueType">문제 유형 *</Label>
                <Select
                  value={formData.issueType || "OTHER"}
                  onValueChange={(value) => setFormData({ ...formData, issueType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="문제 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="receivedAt">접수일</Label>
                <Input
                  id="receivedAt"
                  type="date"
                  value={formData.receivedAt || new Date().toISOString().split("T")[0]}
                  onChange={(e) => setFormData({ ...formData, receivedAt: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">증상 설명 *</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="AS 요청 사유 및 증상을 입력해주세요."
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending} className="bg-purple-600 hover:bg-purple-700">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              AS 접수
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
