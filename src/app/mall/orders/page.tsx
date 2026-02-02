"use client";

import { useEffect, useState } from "react";
import { useMallAuth } from "@/components/mall/auth/MallAuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Package,
  ChevronRight,
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  MapPin,
  RefreshCw,
  Search,
  Calendar,
  Filter,
} from "lucide-react";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  items: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  recipientName: string;
  recipientAddr: string;
  deliveryMsg: string;
  courier?: string;
  trackingNumber?: string;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

// 주문 상태 매핑
const ORDER_STATUS = {
  PENDING: { label: "결제대기", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  PAID: { label: "결제완료", color: "bg-blue-100 text-blue-700", icon: CreditCard },
  PREPARING: { label: "상품준비중", color: "bg-purple-100 text-purple-700", icon: Package },
  SHIPPING: { label: "배송중", color: "bg-cyan-100 text-cyan-700", icon: Truck },
  DELIVERED: { label: "배송완료", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CANCELLED: { label: "주문취소", color: "bg-red-100 text-red-700", icon: XCircle },
  REFUNDED: { label: "환불완료", color: "bg-gray-100 text-gray-700", icon: RefreshCw },
};

export default function OrdersPage() {
  const { user, loading } = useMallAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/mall/login?redirect=/mall/orders");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mall/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 필터링된 주문 목록
  const filteredOrders = orders.filter((order) => {
    // 상태 필터
    if (filter !== "all" && order.status !== filter) return false;
    
    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const items = parseItems(order.items);
      const itemNames = items.map((i) => i.productName?.toLowerCase() || "").join(" ");
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        itemNames.includes(query)
      );
    }
    return true;
  });

  // items JSON 파싱
  const parseItems = (itemsJson: string): OrderItem[] => {
    try {
      return JSON.parse(itemsJson || "[]");
    } catch {
      return [];
    }
  };

  // 주문 상품 요약
  const getItemsSummary = (itemsJson: string) => {
    const items = parseItems(itemsJson);
    if (items.length === 0) return "상품 정보 없음";
    const firstName = items[0].productName || "상품";
    if (items.length === 1) return firstName;
    return `${firstName} 외 ${items.length - 1}건`;
  };

  // 첫 번째 상품 이미지
  const getFirstItemImage = (itemsJson: string) => {
    const items = parseItems(itemsJson);
    return items[0]?.image || null;
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShoppingBag className="h-7 w-7 text-blue-600" />
          주문내역
        </h1>
        <p className="text-slate-500 mt-1">총 {orders.length}개의 주문</p>
      </div>

      {/* 필터 & 검색 */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 상태 필터 */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              전체
            </button>
            {Object.entries(ORDER_STATUS).slice(0, 5).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {value.label}
              </button>
            ))}
          </div>

          {/* 검색 */}
          <div className="relative flex-1 sm:max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="주문번호/상품명 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* 주문 목록 */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {filter !== "all" ? "해당 상태의 주문이 없습니다" : "주문 내역이 없습니다"}
          </h3>
          <p className="text-slate-500 mb-6">
            {filter !== "all" 
              ? "다른 필터를 선택해보세요" 
              : "첫 번째 쇼핑을 시작해보세요!"}
          </p>
          <Link
            href="/mall/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            쇼핑하러 가기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const items = parseItems(order.items);
            const StatusIcon = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.icon || Package;
            const statusInfo = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || {
              label: order.status,
              color: "bg-gray-100 text-gray-700",
            };

            return (
              <Link
                key={order.id}
                href={`/mall/orders/${order.id}`}
                className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* 주문 헤더 */}
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-sm text-slate-500">
                      {order.orderNumber}
                    </span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${statusInfo.color}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {statusInfo.label}
                  </div>
                </div>

                {/* 주문 내용 */}
                <div className="p-5">
                  <div className="flex gap-4">
                    {/* 상품 이미지 */}
                    <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                      {items[0]?.image ? (
                        <Image
                          src={items[0].image}
                          alt={items[0].productName || "상품"}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* 상품 정보 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 mb-1 truncate">
                        {getItemsSummary(order.items)}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>수량: {items.reduce((sum, i) => sum + (i.quantity || 1), 0)}개</span>
                        <span className="font-semibold text-slate-900">
                          {order.totalAmount.toLocaleString()}원
                        </span>
                      </div>

                      {/* 배송 정보 */}
                      {order.status === "SHIPPING" && order.trackingNumber && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-cyan-600">
                          <Truck className="h-4 w-4" />
                          <span>{order.courier || "택배"}: {order.trackingNumber}</span>
                        </div>
                      )}

                      {order.status === "DELIVERED" && order.deliveredAt && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>
                            {new Date(order.deliveredAt).toLocaleDateString("ko-KR")} 배송완료
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 화살표 */}
                    <div className="flex items-center">
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* 빠른 액션 버튼 */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                  {order.status === "SHIPPING" && order.trackingNumber && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(
                          `https://tracker.delivery/#/${order.courier || "kr.cjlogistics"}/${order.trackingNumber}`,
                          "_blank"
                        );
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                    >
                      <Truck className="h-4 w-4" />
                      배송조회
                    </button>
                  )}
                  {order.status === "DELIVERED" && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        // 리뷰 작성 페이지로 이동
                        router.push(`/mall/orders/${order.id}/review`);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                    >
                      ✏️ 리뷰작성
                    </button>
                  )}
                  {(order.status === "PENDING" || order.status === "PAID") && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm("정말 주문을 취소하시겠습니까?")) {
                          // 주문 취소 API 호출
                          fetch(`/api/mall/orders/${order.id}/cancel`, { method: "POST" })
                            .then(() => fetchOrders());
                        }
                      }}
                      className="px-3 py-1.5 bg-white border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      주문취소
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
