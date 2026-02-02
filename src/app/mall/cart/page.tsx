"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useMallCart } from "@/components/mall/cart/MallCartProvider";
import { useMallAuth } from "@/components/mall/auth/MallAuthProvider";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { items, removeItem, setQuantity, subtotal } = useMallCart();
  const { user } = useMallAuth();
  const router = useRouter();

  const handleCheckout = () => {
    if (user) {
      router.push("/mall/checkout");
    } else {
      router.push("/mall/login?redirect=/mall/checkout");
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="h-24 w-24 text-slate-300 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            장바구니가 비어있습니다
          </h1>
          <p className="text-slate-500 mb-8">
            마음에 드는 상품을 장바구니에 담아보세요!
          </p>
          <Link
            href="/mall/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            쇼핑 계속하기
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">장바구니</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
              <div
                key={item.productId}
                className="bg-white rounded-xl p-4 shadow-sm flex gap-4"
              >
                <Link href={`/mall/products/${item.productId}`} className="flex-shrink-0">
                  <div className="w-24 h-24 relative bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center text-slate-400 text-xs">
                    No Image
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/mall/products/${item.productId}`}>
                    <h3 className="font-medium text-slate-900 line-clamp-2 hover:text-blue-600 transition-colors">
                      {item.nameSnapshot}
                    </h3>
                  </Link>
                  <p className="text-lg font-bold text-slate-900 mt-2">
                    {item.priceSnapshot.toLocaleString()}원
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-slate-200 rounded-lg">
                      <button
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="p-2 text-slate-500 hover:text-slate-700 disabled:opacity-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-2 text-center min-w-[3rem]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        className="p-2 text-slate-500 hover:text-slate-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-4">주문 요약</h2>
            
            <div className="space-y-3 pb-4 border-b">
              <div className="flex justify-between text-slate-600">
                <span>상품 금액</span>
                <span>{subtotal.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>배송비</span>
                <span>{subtotal >= 50000 ? "무료" : "3,000원"}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-4">
              <span className="font-bold text-slate-900">총 결제금액</span>
              <span className="text-xl font-bold text-blue-600">
                {(subtotal + (subtotal >= 50000 ? 0 : 3000)).toLocaleString()}원
              </span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              주문하기
            </button>

            <p className="text-xs text-slate-500 text-center mt-4">
              5만원 이상 구매 시 무료배송
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
