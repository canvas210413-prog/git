"use client";

import { useEffect, useState } from "react";
import { useMallAuth } from "@/components/mall/auth/MallAuthProvider";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Package,
  ChevronLeft,
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  MapPin,
  RefreshCw,
  Phone,
  Mail,
  FileText,
  Copy,
  Check,
  ExternalLink,
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
  customerName: string;
  customerEmail: string;
  recipientName: string;
  recipientAddr: string;
  recipientZip: string;
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
  PENDING: { label: "결제대기", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: Clock },
  PAID: { label: "결제완료", color: "text-blue-600", bgColor: "bg-blue-100", icon: CreditCard },
  PREPARING: { label: "상품준비중", color: "text-purple-600", bgColor: "bg-purple-100", icon: Package },
  SHIPPING: { label: "배송중", color: "text-cyan-600", bgColor: "bg-cyan-100", icon: Truck },
  DELIVERED: { label: "배송완료", color: "text-green-600", bgColor: "bg-green-100", icon: CheckCircle },
  CANCELLED: { label: "주문취소", color: "text-red-600", bgColor: "bg-red-100", icon: XCircle },
  REFUNDED: { label: "환불완료", color: "text-gray-600", bgColor: "bg-gray-100", icon: RefreshCw },
};

// 주문 진행 단계
const ORDER_STEPS = ["PENDING", "PAID", "PREPARING", "SHIPPING", "DELIVERED"];

export default function OrderDetailPage() {
  const { user, loading } = useMallAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/mall/login?redirect=/mall/orders/${orderId}`);
    }
  }, [user, loading, router, orderId]);

  useEffect(() => {
    if (user && orderId) {
      fetchOrder();
    }
  }, [user, orderId]);

  const fetchOrder = async () => {
    setIsLoading(true);
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
      router.replace("/mall/orders");
    } finally {
      setIsLoading(false);
    }
  };

  // items JSON 파싱
  const parseItems = (itemsJson: string): OrderItem[] => {
    try {
      return JSON.parse(itemsJson || "[]");
    } catch {
      return [];
    }
  };

  // 주문번호 복사
  const copyOrderNumber = async () => {
    if (order) {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 주문 취소
  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm("정말 주문을 취소하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/mall/orders/${orderId}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        fetchOrder();
      } else {
        alert("주문 취소에 실패했습니다.");
      }
    } catch (error) {
      alert("주문 취소 중 오류가 발생했습니다.");
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || !order) return null;

  const items = parseItems(order.items);
  const statusInfo = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || {
    label: order.status,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    icon: Package,
  };
  const StatusIcon = statusInfo.icon;
  const currentStepIndex = ORDER_STEPS.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 뒤로가기 */}
      <Link
        href="/mall/orders"
        className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ChevronLeft className="h-5 w-5" />
        주문내역으로 돌아가기
      </Link>

      {/* 주문 상태 카드 */}
      <div className={`rounded-2xl p-6 mb-6 ${statusInfo.bgColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full bg-white ${statusInfo.color}`}>
              <StatusIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${statusInfo.color}`}>
                {statusInfo.label}
              </h2>
              <p className="text-sm text-slate-600">
                주문일: {new Date(order.createdAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">주문번호</p>
            <button
              onClick={copyOrderNumber}
              className="flex items-center gap-1 font-mono text-slate-700 hover:text-blue-600"
            >
              {order.orderNumber}
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* 진행 단계 (취소된 주문이 아닌 경우에만) */}
        {!isCancelled && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {ORDER_STEPS.map((step, index) => {
                const stepInfo = ORDER_STATUS[step as keyof typeof ORDER_STATUS];
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div key={step} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                          isCompleted
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-400 border-2 border-slate-200"
                        } ${isCurrent ? "ring-4 ring-blue-200" : ""}`}
                      >
                        {index + 1}
                      </div>
                      <span
                        className={`mt-2 text-xs ${
                          isCompleted ? "text-blue-600 font-medium" : "text-slate-400"
                        }`}
                      >
                        {stepInfo.label}
                      </span>
                    </div>
                    {index < ORDER_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-2 rounded ${
                          index < currentStepIndex ? "bg-blue-600" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 배송 추적 (배송중인 경우) */}
      {order.status === "SHIPPING" && order.trackingNumber && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5 text-cyan-600" />
            배송 추적
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">택배사</p>
              <p className="font-medium">{order.courier || "택배"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">송장번호</p>
              <p className="font-mono">{order.trackingNumber}</p>
            </div>
            <button
              onClick={() =>
                window.open(
                  `https://tracker.delivery/#/${order.courier || "kr.cjlogistics"}/${order.trackingNumber}`,
                  "_blank"
                )
              }
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              배송조회
            </button>
          </div>
        </div>
      )}

      {/* 주문 상품 */}
      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
            주문 상품 ({items.length}개)
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {items.map((item, index) => (
            <div key={index} className="p-6 flex gap-4">
              <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.productName || "상품"}
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
              <div className="flex-1">
                <Link
                  href={`/mall/products/${item.productId}`}
                  className="font-medium text-slate-900 hover:text-blue-600"
                >
                  {item.productName || "상품"}
                </Link>
                <div className="mt-1 text-sm text-slate-500">
                  수량: {item.quantity || 1}개
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {(item.price * (item.quantity || 1)).toLocaleString()}원
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 배송지 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            배송지 정보
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex">
              <dt className="w-20 text-slate-500">받는분</dt>
              <dd className="flex-1 text-slate-900">{order.recipientName}</dd>
            </div>
            <div className="flex">
              <dt className="w-20 text-slate-500">주소</dt>
              <dd className="flex-1 text-slate-900">{order.recipientAddr}</dd>
            </div>
            {order.deliveryMsg && (
              <div className="flex">
                <dt className="w-20 text-slate-500">배송메모</dt>
                <dd className="flex-1 text-slate-700">{order.deliveryMsg}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* 결제 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            결제 정보
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">상품 금액</dt>
              <dd className="text-slate-900">{order.subtotal.toLocaleString()}원</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">배송비</dt>
              <dd className="text-slate-900">
                {order.subtotal >= 50000 ? "무료" : "3,000원"}
              </dd>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <dt>쿠폰 할인</dt>
                <dd>-{order.discountAmount.toLocaleString()}원</dd>
              </div>
            )}
            <div className="pt-3 border-t border-slate-100 flex justify-between">
              <dt className="font-semibold text-slate-900">총 결제 금액</dt>
              <dd className="font-bold text-blue-600 text-lg">
                {order.totalAmount.toLocaleString()}원
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="mt-6 flex gap-3 justify-end">
        {(order.status === "PENDING" || order.status === "PAID") && (
          <button
            onClick={handleCancelOrder}
            className="px-6 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            주문 취소
          </button>
        )}
        {order.status === "DELIVERED" && (
          <Link
            href={`/mall/orders/${orderId}/review`}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            리뷰 작성
          </Link>
        )}
        <Link
          href="/mall/products"
          className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
        >
          쇼핑 계속하기
        </Link>
      </div>
    </div>
  );
}
