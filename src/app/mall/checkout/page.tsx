"use client";

import { useEffect, useState } from "react";
import { useMallAuth } from "@/components/mall/auth/MallAuthProvider";
import { useRouter } from "next/navigation";
import { useMallCart, MallCartItem } from "@/components/mall/cart/MallCartProvider";
import Image from "next/image";
import {
  Loader2,
  MapPin,
  Plus,
  CreditCard,
  Truck,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Tag,
} from "lucide-react";

interface Address {
  id: string;
  name: string;
  recipient: string;
  phone: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  isDefault: boolean;
}

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  validUntil: string;
  isUsed: boolean;
  isExpired: boolean;
}

export default function CheckoutPage() {
  const { user, loading } = useMallAuth();
  const router = useRouter();
  const { items, subtotal, clear: clearCart } = useMallCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showCouponSelector, setShowCouponSelector] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "BANK" | "VIRTUAL">("CARD");
  const [orderNote, setOrderNote] = useState("");
  const [newAddress, setNewAddress] = useState({
    name: "",
    recipient: "",
    phone: "",
    zipCode: "",
    address: "",
    addressDetail: "",
    isDefault: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/mall/login?redirect=/mall/checkout");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (items.length === 0 && !loading) {
      router.replace("/mall/cart");
    }
  }, [items, loading, router]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchCoupons();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/mall/mypage/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
        // 기본 배송지 자동 선택
        const defaultAddr = data.find((a: Address) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (data.length > 0) {
          setSelectedAddressId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/mall/mypage/coupons?status=available");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    }
  };

  const handleAddAddress = async () => {
    try {
      const res = await fetch("/api/mall/mypage/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });

      if (res.ok) {
        const address = await res.json();
        setAddresses([...addresses, address]);
        setSelectedAddressId(address.id);
        setShowAddressForm(false);
        setNewAddress({
          name: "",
          recipient: "",
          phone: "",
          zipCode: "",
          address: "",
          addressDetail: "",
          isDefault: false,
        });
      }
    } catch (error) {
      console.error("Failed to add address:", error);
    }
  };

  const shipping = subtotal >= 50000 ? 0 : 3000;
  
  // 쿠폰 할인 계산
  const couponDiscount = selectedCoupon
    ? selectedCoupon.discountType === "PERCENT"
      ? Math.min(
          (subtotal * selectedCoupon.discountValue) / 100,
          selectedCoupon.maxDiscountAmount || Infinity
        )
      : selectedCoupon.discountValue
    : 0;

  const total = subtotal + shipping - couponDiscount;

  // 데모 결제 처리 (즉시 결제완료)
  const handleDemoPayment = async () => {
    if (!selectedAddressId) {
      alert("배송지를 선택해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
      
      const res = await fetch("/api/mall/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item: MallCartItem) => ({
            productId: item.productId,
            productName: item.nameSnapshot || item.name,
            quantity: item.quantity,
            price: item.priceSnapshot || item.price,
            image: item.imageSnapshot || item.image,
          })),
          shippingAddress: selectedAddress,
          paymentMethod,
          couponId: selectedCoupon?.id,
          couponDiscount,
          subtotal,
          shipping,
          total,
          orderNote,
          isDemo: true, // 데모 결제 플래그
        }),
      });

      if (res.ok) {
        const order = await res.json();
        clearCart();
        router.push(`/mall/orders/${order.id}/complete`);
      } else {
        const error = await res.json();
        alert(error.message || "주문에 실패했습니다");
      }
    } catch (error) {
      alert("주문 처리 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!selectedAddressId) {
      alert("배송지를 선택해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
      
      const res = await fetch("/api/mall/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item: MallCartItem) => ({
            productId: item.productId,
            productName: item.nameSnapshot || item.name,
            quantity: item.quantity,
            price: item.priceSnapshot || item.price,
            image: item.imageSnapshot || item.image,
          })),
          shippingAddress: selectedAddress,
          paymentMethod,
          couponId: selectedCoupon?.id,
          couponDiscount,
          subtotal,
          shipping,
          total,
          orderNote,
        }),
      });

      if (res.ok) {
        const order = await res.json();
        clearCart();
        router.push(`/mall/orders/${order.id}/complete`);
      } else {
        const error = await res.json();
        alert(error.message || "주문에 실패했습니다");
      }
    } catch (error) {
      alert("주문 처리 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || items.length === 0) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">주문/결제</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽: 주문 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 배송지 선택 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h2 className="font-semibold text-slate-900">배송지</h2>
              </div>
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                새 배송지 추가
              </button>
            </div>

            {/* 새 배송지 폼 */}
            {showAddressForm && (
              <div className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="배송지명 (예: 집, 회사)"
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="받으시는 분"
                    value={newAddress.recipient}
                    onChange={(e) => setNewAddress({ ...newAddress, recipient: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <input
                  type="tel"
                  placeholder="연락처"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="우편번호"
                    value={newAddress.zipCode}
                    onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                    className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  <button className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">
                    주소 검색
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="주소"
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="상세주소"
                  value={newAddress.addressDetail}
                  onChange={(e) => setNewAddress({ ...newAddress, addressDetail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddressForm(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleAddAddress}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    저장
                  </button>
                </div>
              </div>
            )}

            {/* 배송지 목록 */}
            {addresses.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>등록된 배송지가 없습니다</p>
                <p className="text-sm">새 배송지를 추가해주세요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAddressId === address.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{address.name}</span>
                          {address.isDefault && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                              기본
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          {address.recipient} · {address.phone}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          [{address.zipCode}] {address.address} {address.addressDetail}
                        </p>
                      </div>
                      {selectedAddressId === address.id && (
                        <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 주문 상품 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-slate-900">주문 상품</h2>
            </div>

            <div className="divide-y divide-slate-100">
              {items.map((item: MallCartItem) => (
                  <div key={item.productId} className="py-4 flex gap-4">
                    <div className="relative w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center text-slate-400 text-xs">
                      No Image
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.nameSnapshot}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-slate-500">수량: {item.quantity}개</span>
                        <span className="font-medium">
                          {(item.priceSnapshot * item.quantity).toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          </div>

          {/* 쿠폰 선택 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-slate-900">쿠폰</h2>
            </div>

            <button
              onClick={() => setShowCouponSelector(!showCouponSelector)}
              className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-slate-300"
            >
              <span className={selectedCoupon ? "text-slate-900" : "text-slate-500"}>
                {selectedCoupon ? selectedCoupon.name : "쿠폰을 선택해주세요"}
              </span>
              {showCouponSelector ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {showCouponSelector && (
              <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => {
                    setSelectedCoupon(null);
                    setShowCouponSelector(false);
                  }}
                  className="w-full p-3 text-left hover:bg-slate-50 border-b border-slate-100"
                >
                  쿠폰 사용 안함
                </button>
                {coupons.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    사용 가능한 쿠폰이 없습니다
                  </div>
                ) : (
                  coupons.map((coupon) => {
                    const isAvailable = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;
                    return (
                      <button
                        key={coupon.id}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedCoupon(coupon);
                            setShowCouponSelector(false);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`w-full p-3 text-left border-b border-slate-100 last:border-0 ${
                          isAvailable ? "hover:bg-slate-50" : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{coupon.name}</p>
                            <p className="text-sm text-slate-500">
                              {coupon.discountType === "PERCENT"
                                ? `${coupon.discountValue}% 할인`
                                : `${coupon.discountValue.toLocaleString()}원 할인`}
                              {coupon.minOrderAmount &&
                                ` (${coupon.minOrderAmount.toLocaleString()}원 이상)`}
                            </p>
                          </div>
                          {!isAvailable && (
                            <span className="text-xs text-red-500">최소 주문금액 미달</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 결제 수단 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-slate-900">결제 수단</h2>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "CARD", label: "카드 결제" },
                { value: "BANK", label: "계좌이체" },
                { value: "VIRTUAL", label: "가상계좌" },
              ].map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value as "CARD" | "BANK" | "VIRTUAL")}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    paymentMethod === method.value
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* 배송 메모 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">배송 메모</h2>
            <textarea
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder="배송 시 요청사항을 입력해주세요"
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* 오른쪽: 결제 요약 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm sticky top-4">
            <h2 className="font-semibold text-slate-900 mb-4">결제 금액</h2>

            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>상품 금액</span>
                <span>{subtotal.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>배송비</span>
                <span className={shipping === 0 ? "text-green-600" : ""}>
                  {shipping === 0 ? "무료" : `${shipping.toLocaleString()}원`}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>쿠폰 할인</span>
                  <span>-{couponDiscount.toLocaleString()}원</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center py-4">
              <span className="font-semibold text-slate-900">총 결제 금액</span>
              <span className="text-xl font-bold text-blue-600">
                {total.toLocaleString()}원
              </span>
            </div>

            {subtotal < 50000 && (
              <div className="p-3 bg-amber-50 text-amber-700 rounded-lg text-sm mb-4 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {(50000 - subtotal).toLocaleString()}원 더 구매하시면 무료배송!
                </span>
              </div>
            )}

            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || !selectedAddressId}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                `${total.toLocaleString()}원 결제하기`
              )}
            </button>

            {/* 데모 결제 버튼 */}
            <button
              onClick={handleDemoPayment}
              disabled={isSubmitting || !selectedAddressId}
              className="w-full mt-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  데모 결제 (즉시 완료)
                </>
              )}
            </button>
            <p className="text-xs text-purple-500 text-center mt-1">
              ※ 데모 모드: 실결제 없이 주문이 CRM에 반영됩니다
            </p>

            <p className="text-xs text-slate-400 text-center mt-3">
              위 주문 내용을 확인하였으며, 결제에 동의합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
