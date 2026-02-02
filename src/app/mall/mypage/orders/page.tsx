"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMallAuth } from "@/components/mall/auth/MallAuthProvider";
import { useRouter } from "next/navigation";
import { 
  Loader2,
  Package,
  ChevronRight,
  Clock
} from "lucide-react";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: string;
};

export default function OrdersPage() {
  const { user, loading } = useMallAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/mall/login?redirect=/mall/mypage/orders");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetch("/api/mall/mypage/orders")
        .then(res => res.json())
        .then(data => {
          if (data.orders) setOrders(data.orders);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: "주문완료", color: "bg-yellow-100 text-yellow-700" },
    PAID: { label: "결제완료", color: "bg-blue-100 text-blue-700" },
    SHIPPING: { label: "배송중", color: "bg-purple-100 text-purple-700" },
    DELIVERED: { label: "배송완료", color: "bg-green-100 text-green-700" },
    CANCELLED: { label: "취소됨", color: "bg-red-100 text-red-700" },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/mall/mypage" className="hover:text-slate-900">마이페이지</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900">주문내역</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-8">주문내역</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">주문내역이 없습니다</p>
          <Link
            href="/mall/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            쇼핑하러 가기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const items = JSON.parse(order.items || "[]");
            const status = statusLabels[order.status] || statusLabels.PENDING;
            
            return (
              <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-500">
                      주문번호: {order.orderNumber}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(order.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                
                <div className="border-t pt-4">
                  {items.slice(0, 2).map((item: { name: string; quantity: number; price: number }, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm mb-2">
                      <span className="text-slate-700">{item.name} x {item.quantity}</span>
                      <span className="text-slate-900 font-medium">
                        {(item.price * item.quantity).toLocaleString()}원
                      </span>
                    </div>
                  ))}
                  {items.length > 2 && (
                    <p className="text-sm text-slate-500">외 {items.length - 2}건</p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="font-bold text-slate-900">
                    총 {order.totalAmount.toLocaleString()}원
                  </span>
                  <Link
                    href={`/mall/mypage/orders/${order.id}`}
                    className="text-blue-600 text-sm font-medium hover:underline"
                  >
                    상세보기
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
