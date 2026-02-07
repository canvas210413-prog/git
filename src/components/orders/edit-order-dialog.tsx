"use client";

import { useState, useTransition, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import { createOrder, updateOrder } from "@/app/actions/orders";
import { getActiveBaseProducts, type BaseProductData } from "@/app/actions/base-products";
import { Loader2, Eye, Edit } from "lucide-react";

interface Order {
  id: string;
  orderDate: string | Date;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientMobile: string | null;
  recipientZipCode: string | null;
  recipientAddr: string | null;
  orderNumber: string | null;
  productInfo: string | null;
  deliveryMsg: string | null;
  orderSource: string | null;
  basePrice?: number | null;
  totalAmount?: number | null;
  shippingFee: number | null;
  courier: string | null;
  trackingNumber: string | null;
  giftSent?: boolean | null;
}

interface EditOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  mode: "view" | "edit" | "create";
  onSuccess?: (updatedOrder?: any) => void;
}

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

export function EditOrderDialog({
  open,
  onOpenChange,
  order,
  mode,
  onSuccess,
}: EditOrderDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<any>({});
  const [baseProducts, setBaseProducts] = useState<BaseProductData[]>([]);
  // 상품ID별 수량을 관리하는 객체 { productId: quantity }
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const { data: session } = useSession();
  
  // 현재 사용자의 협력사 정보
  const userPartner = (session?.user as any)?.assignedPartner || null;
  // 본사는 모든 주문처 선택 가능, 협력사는 자신의 주문처만
  const isHeadquarters = !userPartner;

  // 선택된 상품 ID 목록 (수량이 1 이상인 상품)
  const selectedProductIds = Object.entries(productQuantities)
    .filter(([_, qty]) => qty > 0)
    .map(([id, _]) => id);

  // 기준상품 목록 로드 (협력사별 필터링)
  useEffect(() => {
    const loadProducts = async () => {
      // 현재 사용자의 협력사에 맞는 상품만 조회
      const products = await getActiveBaseProducts(userPartner);
      setBaseProducts(products);
    };
    loadProducts();
  }, [userPartner]);

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
    // 음수는 0으로 처리
    const qty = Math.max(0, newQty);
    
    if (qty === 0) {
      // 수량이 0이면 제거
      const newQuantities = { ...productQuantities };
      delete newQuantities[productId];
      setProductQuantities(newQuantities);
      updateProductInfoAndPrice(newQuantities);
    } else {
      const newQuantities = { ...productQuantities, [productId]: qty };
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
    
    setFormData((prev: any) => ({
      ...prev,
      productInfo: productNames,
      basePrice: totalPrice,
    }));
  };

  // order 또는 mode가 변경될 때 폼 데이터 초기화
  useEffect(() => {
    if (!open) return; // 다이얼로그가 닫혀있으면 실행하지 않음
    
    if (mode === "create") {
      setProductQuantities({});
      // 기본 orderSource 설정: 본사는 "본사", 협력사는 자신의 협력사명
      const defaultOrderSource = userPartner || "본사";
      
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
        orderSource: defaultOrderSource,
        basePrice: "",
        shippingFee: "3000",
        courier: "",
        trackingNumber: "",
        giftSent: false,
      });
    } else if (order && baseProducts.length > 0) {
      // 기존 주문 데이터 로드 시 상품 선택 및 수량 복원
      const basePrice = order.basePrice ?? (Number(order.totalAmount || 0) - Number(order.shippingFee || 0));
      
      // productInfo에서 상품명과 수량 추출하여 매칭
      // 형식: "상품명(2개), 상품명2" 또는 "상품명, 상품명2" 또는 "상품명 x 2"
      const productInfo = order.productInfo || "";
      const quantities: Record<string, number> = {};
      
      // 상품명 매칭 함수: 정확한 일치 또는 포함 관계 확인
      const findMatchingProduct = (searchName: string) => {
        const normalizedSearch = searchName.trim().toLowerCase();
        
        // 1. 정확한 이름 매칭
        let matched = baseProducts.find(p => p.name.toLowerCase() === normalizedSearch);
        if (matched) return matched;
        
        // 2. 기준상품 이름이 검색어에 포함된 경우 (예: "매일두유 99box" -> "매일두유")
        matched = baseProducts.find(p => normalizedSearch.includes(p.name.toLowerCase()));
        if (matched) return matched;
        
        // 3. 검색어가 기준상품 이름에 포함된 경우 (예: "두유" -> "매일두유")
        matched = baseProducts.find(p => p.name.toLowerCase().includes(normalizedSearch));
        if (matched) return matched;
        
        return null;
      };
      
      if (productInfo) {
        // 쉼표로 분리된 각 상품 항목 처리
        const items = productInfo.split(',').map(item => item.trim());
        
        items.forEach(item => {
          // "상품명(3개)" 형식 확인
          let qtyMatch = item.match(/^(.+?)\((\d+)개\)$/);
          
          // "상품명 x 3" 또는 "상품명 X 3" 형식 확인
          if (!qtyMatch) {
            qtyMatch = item.match(/^(.+?)\s*[xX×]\s*(\d+)$/);
          }
          
          if (qtyMatch) {
            // 수량이 명시된 경우
            const productName = qtyMatch[1].trim();
            const qty = parseInt(qtyMatch[2], 10);
            
            // 상품명으로 baseProducts에서 찾기
            const matchedProduct = findMatchingProduct(productName);
            if (matchedProduct) {
              quantities[matchedProduct.id] = (quantities[matchedProduct.id] || 0) + qty;
            }
          } else {
            // 수량 없이 상품명만 있는 경우 (기본 수량 1)
            const productName = item.trim();
            const matchedProduct = findMatchingProduct(productName);
            if (matchedProduct) {
              quantities[matchedProduct.id] = (quantities[matchedProduct.id] || 0) + 1;
            }
          }
        });
      }
      
      setProductQuantities(quantities);
      
      // orderDate 처리: Date 객체 또는 문자열 모두 처리
      let orderDateStr = new Date().toISOString().split("T")[0];
      if (order.orderDate) {
        if (order.orderDate instanceof Date) {
          orderDateStr = order.orderDate.toISOString().split("T")[0];
        } else if (typeof order.orderDate === "string") {
          orderDateStr = order.orderDate.split("T")[0];
        }
      }
      
      setFormData({
        orderDate: orderDateStr,
        recipientName: order.recipientName || "",
        recipientPhone: order.recipientPhone || "",
        recipientMobile: order.recipientMobile || "",
        recipientZipCode: order.recipientZipCode || "",
        recipientAddr: order.recipientAddr || "",
        orderNumber: order.orderNumber || "",
        productInfo: order.productInfo || "",
        deliveryMsg: order.deliveryMsg || "",
        orderSource: order.orderSource || "본사",
        basePrice: basePrice || "",
        shippingFee: order.shippingFee || "",
        courier: order.courier || "",
        trackingNumber: order.trackingNumber || "",
        giftSent: order.giftSent ?? false,
      });
    }
  }, [order, mode, open, baseProducts]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (mode === "view") {
      onOpenChange(false);
      return;
    }

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
      totalAmount,
      courier: formData.courier,
      trackingNumber: formData.trackingNumber,
      giftSent: formData.giftSent,
      status: "PENDING",
    };

    startTransition(async () => {
      try {
        let result;
        
        if (mode === "create") {
          result = await createOrder(orderData);
        } else {
          result = await updateOrder(order!.id, orderData);
        }

        if (result.success) {
          alert(mode === "create" ? "✅ 주문이 등록되었습니다." : "✅ 주문이 수정되었습니다.");
          onOpenChange(false);
          if (onSuccess) {
            // 수정된 주문 데이터를 콜백으로 전달 (새로고침 없이 목록 업데이트)
            const updatedOrder = {
              ...order,
              ...orderData,
              id: mode === "create" ? result.data?.id : order!.id,
            };
            onSuccess(updatedOrder);
          } else {
            window.location.reload();
          }
        } else {
          alert(`❌ ${mode === "create" ? "등록" : "수정"} 실패: ${result.error?.message || "알 수 없는 오류"}`);
        }
      } catch (error) {
        console.error("주문 처리 실패:", error);
        alert(`주문 ${mode === "create" ? "등록" : "수정"}에 실패했습니다.`);
      }
    });
  };

  const isViewMode = mode === "view";
  const dialogTitle = mode === "create" ? "새 주문 등록" : mode === "edit" ? "주문 수정" : "주문 조회";
  const dialogDescription = mode === "create" 
    ? "주문 정보를 입력하세요. (* 필수 항목)"
    : mode === "edit" 
    ? "주문 정보를 수정하세요."
    : "주문 상세 정보입니다.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "view" ? <Eye className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 날짜 및 주문번호 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderDate">날짜 *</Label>
              <Input
                id="orderDate"
                type="date"
                value={formData.orderDate || ""}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                required
                disabled={isViewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderNumber">주문번호</Label>
              <Input
                id="orderNumber"
                value={formData.orderNumber || ""}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                placeholder="ORD-2023-001"
                disabled={isViewMode}
              />
            </div>
          </div>

          {/* 고객 정보 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">고객 정보</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">고객명 *</Label>
                <Input
                  id="recipientName"
                  value={formData.recipientName || ""}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder="홍길동"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientPhone">전화번호</Label>
                <Input
                  id="recipientPhone"
                  type="tel"
                  value={formData.recipientPhone || ""}
                  onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                  placeholder="010-5555-5555"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientMobile">이동통신 *</Label>
                <Input
                  id="recipientMobile"
                  type="tel"
                  value={formData.recipientMobile || ""}
                  onChange={(e) => setFormData({ ...formData, recipientMobile: e.target.value })}
                  placeholder="010-5555-5555"
                  disabled={isViewMode}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientZipCode">우편번호</Label>
                <Input
                  id="recipientZipCode"
                  value={formData.recipientZipCode || ""}
                  onChange={(e) => setFormData({ ...formData, recipientZipCode: e.target.value })}
                  placeholder="12345"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2 col-span-3">
                <Label htmlFor="recipientAddr">주소</Label>
                <Input
                  id="recipientAddr"
                  value={formData.recipientAddr || ""}
                  onChange={(e) => setFormData({ ...formData, recipientAddr: e.target.value })}
                  placeholder="서울시 성동구 00동"
                  disabled={isViewMode}
                />
              </div>
            </div>
          </div>

          {/* 상품 정보 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">상품 정보</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>상품 선택 (기준정보) - 수량 조절 가능</Label>
                <div className="border rounded-lg p-3 max-h-[250px] overflow-y-auto space-y-2">
                  {baseProducts.map((product) => {
                    const qty = productQuantities[product.id] || 0;
                    const isSelected = qty > 0;
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center justify-between p-2 rounded transition-colors ${
                          isSelected ? 'bg-blue-100 border border-blue-300' : 'border border-transparent hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-sm font-medium">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-600 whitespace-nowrap">
                            {product.unitPrice.toLocaleString()}원
                          </span>
                          {!isViewMode && (
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(product.id, qty - 1)}
                                disabled={qty === 0}
                                className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-bold transition-colors"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={qty}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  handleQuantityChange(product.id, val);
                                }}
                                className="w-14 h-7 text-center border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(product.id, qty + 1)}
                                className="w-7 h-7 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-bold transition-colors"
                              >
                                +
                              </button>
                            </div>
                          )}
                          {isViewMode && qty > 0 && (
                            <span className="ml-2 text-sm font-medium text-gray-600">x{qty}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {baseProducts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      등록된 상품이 없습니다
                    </p>
                  )}
                </div>
                {selectedProductIds.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-blue-600 font-medium">
                      선택된 상품 ({selectedProductIds.length}종류, 총 {Object.values(productQuantities).reduce((a, b) => a + b, 0)}개)
                    </p>
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
                              {!isViewMode && (
                                <button
                                  type="button"
                                  onClick={() => handleProductToggle(product.id)}
                                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
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
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-300 rounded-lg"
                              >
                                <span className="font-medium text-gray-800">{product.name}</span>
                                <span className="text-sm text-gray-500">x{qty}</span>
                                <span className="font-bold text-blue-600">
                                  {(product.unitPrice * qty).toLocaleString()}원
                                </span>
                                {!isViewMode && (
                                  <div className="flex items-center gap-1 ml-2 border-l pl-2">
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(product.id, qty - 1)}
                                      className="w-5 h-5 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold"
                                    >
                                      -
                                    </button>
                                    <span className="w-6 text-center text-sm">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(product.id, qty + 1)}
                                      className="w-5 h-5 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold"
                                    >
                                      +
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleProductToggle(product.id)}
                                      className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                                      title="제거"
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
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
                  <input
                    type="hidden"
                    id="productInfo"
                    value={formData.productInfo || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderSource">고객주문처명</Label>
                  {isHeadquarters ? (
                    // 본사: 모든 협력사 선택 가능
                    <Select
                      value={formData.orderSource || "본사"}
                      onValueChange={(value) => setFormData({ ...formData, orderSource: value })}
                      disabled={isViewMode}
                    >
                      <SelectTrigger>
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
                  ) : (
                    // 협력사: 자신의 협력사명으로 고정
                    <Input
                      id="orderSource"
                      value={userPartner || ""}
                      readOnly
                      disabled
                      className="bg-gray-100"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 금액 및 배송 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">금액 및 배송</h3>
            {/* 금액 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">단가 (자동계산)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  min="0"
                  value={formData.basePrice || ""}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  placeholder="99000"
                  disabled={isViewMode}
                  className="bg-blue-50"
                />
                {selectedProductIds.length > 0 && (
                  <p className="text-xs text-blue-600">
                    선택한 상품 합계: {Number(formData.basePrice || 0).toLocaleString()}원
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingFee">배송비</Label>
                {formData.shippingFee === "custom" || (formData.shippingFee && !["3000", "5000", "7000"].includes(String(formData.shippingFee))) ? (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={formData.shippingFee === "custom" ? "" : formData.shippingFee}
                      onChange={(e) => setFormData({ ...formData, shippingFee: e.target.value })}
                      placeholder="배송비 입력"
                      disabled={isViewMode}
                      className="flex-1 min-w-[120px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => setFormData({ ...formData, shippingFee: "3000" })}
                      disabled={isViewMode}
                    >
                      선택으로
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={String(formData.shippingFee || "3000")}
                    onValueChange={(value) => setFormData({ ...formData, shippingFee: value })}
                    disabled={isViewMode}
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
                  value={formData.courier || ""}
                  onValueChange={(value) => setFormData({ ...formData, courier: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="택배사 선택" />
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
                  value={formData.trackingNumber || ""}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                  placeholder="123456789"
                  disabled={isViewMode}
                />
              </div>
            </div>
          </div>

          {/* 배송 메시지 */}
          <div className="space-y-2">
            <Label htmlFor="deliveryMsg">배송메세지</Label>
            <Textarea
              id="deliveryMsg"
              value={formData.deliveryMsg || ""}
              onChange={(e) => setFormData({ ...formData, deliveryMsg: e.target.value })}
              placeholder="문 앞에 놓아주세요"
              rows={2}
              disabled={isViewMode}
            />
          </div>

          {/* 사은품 발송 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="giftSent"
              checked={formData.giftSent || false}
              onChange={(e) => setFormData({ ...formData, giftSent: e.target.checked })}
              className="h-4 w-4 cursor-pointer"
              disabled={isViewMode}
            />
            <Label htmlFor="giftSent" className="cursor-pointer">사은품 발송</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {isViewMode ? "닫기" : "취소"}
            </Button>
            {!isViewMode && (
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "등록" : "저장"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
