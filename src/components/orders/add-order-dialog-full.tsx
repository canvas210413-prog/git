"use client";

import { useState, useTransition, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import { getActiveBaseProducts, type BaseProductData } from "@/app/actions/base-products";
import { Loader2 } from "lucide-react";

// 허용된 고객주문처명 목록
const ALLOWED_ORDER_SOURCES = ["본사", "로켓그로스", "그로트", "스몰닷", "해피포즈", "기타"];

// 택배사 목록
const courierList = [
  { code: "HANJIN", name: "한진택배" },
  { code: "CJ", name: "CJ대한통운" },
  { code: "LOTTE", name: "롯데택배" },
  { code: "LOGEN", name: "로젠택배" },
  { code: "POST", name: "우체국택배" },
  { code: "GSP", name: "GS편의점택배" },
  { code: "KDEXP", name: "경동택배" },
  { code: "DAESIN", name: "대신택배" },
];

export function AddOrderDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [baseProducts, setBaseProducts] = useState<BaseProductData[]>([]);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const { data: session } = useSession();
  
  // 선택된 상품 ID 목록 (수량이 1 이상인 상품들)
  const selectedProductIds = Object.keys(productQuantities).filter(id => productQuantities[id] > 0);
  
  // 현재 사용자의 협력사 정보 (null이면 본사)
  const userPartner = (session?.user as { assignedPartner?: string | null })?.assignedPartner || null;
  // 본사는 모든 주문처 선택 가능, 협력사는 자신의 주문처만
  const isHeadquarters = !userPartner;
  
  const [formData, setFormData] = useState({
    orderDate: new Date().toISOString().split("T")[0],
    recipientName: "",
    recipientPhone: "",
    recipientMobile: "",
    recipientZipCode: "",
    recipientAddr: "",
    orderNumber: "",
    productInfo: "",
    deliveryMsg: "",
    orderSource: userPartner || "본사",
    basePrice: 0,
    shippingFee: 3000,
    courier: "",
    trackingNumber: "",
  });

  // 기준상품 목록 로드 (협력사별 필터링)
  useEffect(() => {
    const loadProducts = async () => {
      // 현재 사용자의 협력사에 맞는 상품만 조회
      const products = await getActiveBaseProducts(userPartner);
      setBaseProducts(products);
    };
    loadProducts();
  }, [userPartner]);

  // 다이얼로그 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setProductQuantities({});
      setFormData({
        orderDate: new Date().toISOString().split("T")[0],
        recipientName: "",
        recipientPhone: "",
        recipientMobile: "",
        recipientZipCode: "",
        recipientAddr: "",
        orderNumber: "",
        productInfo: "",
        deliveryMsg: "",
        orderSource: userPartner || "본사",  // 협력사 정보 반영
        basePrice: 0,
        shippingFee: 3000,
        courier: "",
        trackingNumber: "",
      });
    }
  }, [open, userPartner]);

  // 상품 선택/해제 토글
  const handleProductToggle = (productId: string) => {
    const currentQty = productQuantities[productId] || 0;
    
    if (currentQty > 0) {
      // 이미 선택된 경우 제거
      const newQuantities = { ...productQuantities };
      delete newQuantities[productId];
      setProductQuantities(newQuantities);
      updateProductInfoAndPrice(newQuantities);
    } else {
      // 새로 선택 (기본 수량 1)
      const newQuantities = { ...productQuantities, [productId]: 1 };
      setProductQuantities(newQuantities);
      updateProductInfoAndPrice(newQuantities);
    }
  };

  // 상품 수량 변경
  const handleQuantityChange = (productId: string, newQty: number) => {
    if (newQty < 1) {
      // 수량이 0 이하면 제거
      const newQuantities = { ...productQuantities };
      delete newQuantities[productId];
      setProductQuantities(newQuantities);
      updateProductInfoAndPrice(newQuantities);
    } else {
      const newQuantities = { ...productQuantities, [productId]: newQty };
      setProductQuantities(newQuantities);
      updateProductInfoAndPrice(newQuantities);
    }
  };

  // 상품 정보와 가격 업데이트
  const updateProductInfoAndPrice = (quantities: Record<string, number>) => {
    const selectedIds = Object.keys(quantities).filter(id => quantities[id] > 0);
    const selectedProducts = baseProducts.filter(p => selectedIds.includes(p.id));
    
    // 상품명 (수량개) 형식으로 생성
    const productNames = selectedProducts.map(p => {
      const qty = quantities[p.id];
      return qty > 1 ? `${p.name}(${qty}개)` : p.name;
    }).join(', ');
    
    // 단가 * 수량 합계 계산
    const totalPrice = selectedProducts.reduce((sum, p) => {
      return sum + (p.unitPrice * (quantities[p.id] || 0));
    }, 0);
    
    setFormData((prev) => ({
      ...prev,
      productInfo: productNames,
      basePrice: totalPrice,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 필수 필드 검증
    if (!formData.recipientName?.trim()) {
      alert("고객명을 입력해주세요.");
      return;
    }
    if (!formData.recipientMobile?.trim() && !formData.recipientPhone?.trim()) {
      alert("연락처를 입력해주세요.");
      return;
    }

    const basePrice = Number(formData.basePrice) || 0;
    const shippingFee = Number(formData.shippingFee) || 0;
    const totalAmount = basePrice + shippingFee;

    const orderData = {
      orderDate: formData.orderDate,
      totalAmount,
      status: "PENDING",
      
      recipientName: formData.recipientName,
      recipientPhone: formData.recipientPhone,
      recipientMobile: formData.recipientMobile,
      recipientZipCode: formData.recipientZipCode,
      recipientAddr: formData.recipientAddr,
      orderNumber: formData.orderNumber,
      productInfo: formData.productInfo,
      deliveryMsg: formData.deliveryMsg,
      orderSource: formData.orderSource,
      basePrice,
      shippingFee,
      courier: formData.courier,
      trackingNumber: formData.trackingNumber,
    };

    startTransition(async () => {
      try {
        const result = await createOrder(orderData);
        
        if (result.success) {
          setOpen(false);
          
          alert("✅ 주문이 등록되었습니다.");
          window.location.reload();
        } else {
          alert(`❌ 주문 등록 실패: ${result.error?.message || "알 수 없는 오류"}`);
        }
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
          {/* 날짜 및 주문번호 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderDate">날짜 *</Label>
              <Input
                id="orderDate"
                type="date"
                required
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderNumber">주문번호</Label>
              <Input
                id="orderNumber"
                placeholder="ORD-2023-001"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
              />
            </div>
          </div>

          {/* 고객 정보 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">고객 정보</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">고객명 *</Label>
                <Input
                  id="recipientName"
                  placeholder="홍길동"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientPhone">전화번호</Label>
                <Input
                  id="recipientPhone"
                  type="tel"
                  placeholder="010-5555-5555"
                  value={formData.recipientPhone}
                  onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientMobile">이동통신</Label>
                <Input
                  id="recipientMobile"
                  type="tel"
                  placeholder="010-5555-5555"
                  value={formData.recipientMobile}
                  onChange={(e) => setFormData({ ...formData, recipientMobile: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientZipCode">우편번호</Label>
                <Input
                  id="recipientZipCode"
                  placeholder="12345"
                  value={formData.recipientZipCode}
                  onChange={(e) => setFormData({ ...formData, recipientZipCode: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-3">
                <Label htmlFor="recipientAddr">주소</Label>
                <Input
                  id="recipientAddr"
                  placeholder="서울시 성동구 00동"
                  value={formData.recipientAddr}
                  onChange={(e) => setFormData({ ...formData, recipientAddr: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 상품 선택 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">상품 선택 (수량 조절 후 자동 선택됨)</h3>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
              {baseProducts.map((product) => {
                const qty = productQuantities[product.id] || 0;
                const isSelected = qty > 0;
                return (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between p-3 rounded-md border transition-colors ${
                      isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-blue-600">
                        {product.unitPrice.toLocaleString()}원
                      </span>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(product.id, qty - 1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold disabled:opacity-50"
                          disabled={qty === 0}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={(e) => {
                            const newQty = parseInt(e.target.value);
                            if (newQty >= 0) {
                              handleQuantityChange(product.id, newQty || 0);
                            }
                          }}
                          className="w-14 h-7 text-center border rounded text-sm font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(product.id, qty + 1)}
                          className="w-7 h-7 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {baseProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  등록된 기준상품이 없습니다.
                </p>
              )}
            </div>
            {selectedProductIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                선택된 상품: {selectedProductIds.length}종류, 총 {Object.values(productQuantities).reduce((a, b) => a + b, 0)}개
              </p>
            )}
          </div>

          {/* 선택된 상품 표시 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>선택된 상품 (자동입력)</Label>
              <div className="min-h-[80px] border rounded-lg p-3 bg-gray-50">
                {selectedProductIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {baseProducts
                      .filter(p => selectedProductIds.includes(p.id))
                      .map(product => {
                        const qty = productQuantities[product.id] || 1;
                        return (
                          <div
                            key={product.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            <span>{product.name}</span>
                            <span className="font-semibold">x{qty}</span>
                            <span className="text-blue-600">{(product.unitPrice * qty).toLocaleString()}원</span>
                            <button
                              type="button"
                              onClick={() => handleProductToggle(product.id)}
                              className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                              title="제거"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    상품을 선택해주세요
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderSource">고객주문처명 {!isHeadquarters && "(고정)"}</Label>
              <Select
                value={formData.orderSource}
                onValueChange={(value) => setFormData({ ...formData, orderSource: value })}
                disabled={!isHeadquarters}
              >
                <SelectTrigger className={!isHeadquarters ? "bg-gray-100" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_ORDER_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 금액 및 배송 */}
          {/* 금액 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>단가 (자동계산)</Label>
              <Input
                type="number"
                value={formData.basePrice}
                readOnly
                className="bg-blue-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingFee">배송비</Label>
              {formData.shippingFee === -1 || (formData.shippingFee && ![3000, 5000, 7000].includes(Number(formData.shippingFee))) ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.shippingFee === -1 ? "" : formData.shippingFee}
                    onChange={(e) => setFormData({ ...formData, shippingFee: Number(e.target.value) || 0 })}
                    placeholder="배송비 입력"
                    className="flex-1 min-w-[120px]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={() => setFormData({ ...formData, shippingFee: 3000 })}
                  >
                    선택으로
                  </Button>
                </div>
              ) : (
                <Select
                  value={String(formData.shippingFee)}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setFormData({ ...formData, shippingFee: -1 });
                    } else {
                      setFormData({ ...formData, shippingFee: Number(value) });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3000">3,000원</SelectItem>
                    <SelectItem value="5000">5,000원</SelectItem>
                    <SelectItem value="7000">7,000원</SelectItem>
                    <SelectItem value="custom">직접입력</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* 배송 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courier">택배사</Label>
              <Select
                value={formData.courier}
                onValueChange={(value) => setFormData({ ...formData, courier: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {courierList.map((courier) => (
                    <SelectItem key={courier.code} value={courier.code}>
                      {courier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trackingNumber">운송장번호</Label>
              <Input
                id="trackingNumber"
                placeholder="123456789"
                value={formData.trackingNumber}
                onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
              />
            </div>
          </div>

          {/* 배송 메시지 */}
          <div className="space-y-2">
            <Label htmlFor="deliveryMsg">배송메세지</Label>
            <Textarea
              id="deliveryMsg"
              placeholder="문 앞에 놓아주세요"
              rows={2}
              value={formData.deliveryMsg}
              onChange={(e) => setFormData({ ...formData, deliveryMsg: e.target.value })}
            />
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
              등록
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
