"use client";

import { useEffect, useState } from "react";
import { useMallAuth } from "@/components/mall/auth/MallAuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  Package,
  CreditCard,
  Truck,
  Loader2,
} from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  recipientName: string;
  recipientAddr: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

export default function OrderCompletePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { user, loading } = useMallAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderId, setOrderId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setOrderId(p.id));
  }, [params]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/mall/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (orderId && user) {
      fetchOrder();
    }
  }, [orderId, user]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/mall/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        router.replace("/mall/orders");
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500">주문 정보를 찾을 수 없습니다</p>
      </div>
    );
  }

  const parsedItems = typeof order.items === "string" ? JSON.parse(order.items) : order.items;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* 성공 아이콘 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">주문이 완료되었습니다!</h1>
          <p className="text-slate-600 mt-2">
            주문번호: <span className="font-mono font-semibold">{order.orderNumber}</span>
          </p>
        </div>

        {/* 주문 진행 상태 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs text-slate-600 mt-2">결제완료</span>
            </div>
            <div className="flex-1 h-1 bg-slate-200 mx-2" />
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                <Package className="h-5 w-5 text-slate-400" />
              </div>
              <span className="text-xs text-slate-400 mt-2">상품준비</span>
            </div>
            <div className="flex-1 h-1 bg-slate-200 mx-2" />
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                <Truck className="h-5 w-5 text-slate-400" />
              </div>
              <span className="text-xs text-slate-400 mt-2">배송중</span>
            </div>
            <div className="flex-1 h-1 bg-slate-200 mx-2" />
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-slate-400" />
              </div>
              <span className="text-xs text-slate-400 mt-2">배송완료</span>
            </div>
          </div>
        </div>

        {/* 주문 상품 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">주문 상품</h2>
          <div className="divide-y divide-slate-100">
            {parsedItems.map((item: any, index: number) => (
              <div key={index} className="py-3 flex justify-between">
                <div>
                  <p className="font-medium text-slate-900">{item.productName}</p>
                  <p className="text-sm text-slate-500">수량: {item.quantity}개</p>
                </div>
                <p className="font-medium">{(item.price * item.quantity).toLocaleString()}원</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between">
            <span className="font-semibold text-slate-900">총 결제 금액</span>
            <span className="text-xl font-bold text-blue-600">
              {order.totalAmount.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 배송 정보 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">배송 정보</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">받으시는 분:</span>{" "}
              <span className="text-slate-900">{order.recipientName}</span>
            </p>
            <p>
              <span className="text-slate-500">배송지:</span>{" "}
              <span className="text-slate-900">{order.recipientAddr}</span>
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <Link
            href="/mall/orders"
            className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg text-center hover:bg-slate-50 transition-colors"
          >
            주문 내역 확인
          </Link>
          <Link
            href="/mall"
            className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg text-center hover:bg-blue-700 transition-colors"
          >
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    </div>
  );
}
