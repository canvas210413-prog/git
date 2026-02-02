"use client";

import { useEffect, useState } from "react";
import { useMallAuth } from "@/components/mall/auth/MallAuthProvider";
import { useRouter } from "next/navigation";
import { 
  Ticket, 
  Loader2, 
  Copy, 
  CheckCircle,
  Calendar,
  Clock,
  ShoppingBag
} from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  validFrom: string;
  validUntil: string;
  isUsed: boolean;
  usedAt: string | null;
  isExpired: boolean;
}

export default function CouponsPage() {
  const { user, loading } = useMallAuth();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "available" | "used">("all");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/mall/login?redirect=/mall/mypage/coupons");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchCoupons();
    }
  }, [user]);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/mall/mypage/coupons");
      const data = await res.json();
      // API returns array directly
      if (Array.isArray(data)) {
        setCoupons(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredCoupons = coupons.filter((coupon) => {
    if (filter === "available") return !coupon.isUsed && !coupon.isExpired;
    if (filter === "used") return coupon.isUsed;
    return true;
  });

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === "PERCENT") {
      return `${coupon.discountValue}% 할인`;
    }
    return `${coupon.discountValue.toLocaleString()}원 할인`;
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">쿠폰함</h1>

      {/* 필터 */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "all", label: "전체" },
          { value: "available", label: "사용 가능" },
          { value: "used", label: "사용 완료" },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value as "all" | "available" | "used")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === item.value
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 쿠폰 목록 */}
      {filteredCoupons.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <Ticket className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">
            {filter === "all" ? "보유한 쿠폰이 없습니다" : 
             filter === "available" ? "사용 가능한 쿠폰이 없습니다" : 
             "사용한 쿠폰이 없습니다"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCoupons.map((coupon) => {
            const isDisabled = coupon.isUsed || coupon.isExpired;
            
            return (
              <div 
                key={coupon.id} 
                className={`bg-white rounded-xl shadow-sm overflow-hidden ${isDisabled ? "opacity-60" : ""}`}
              >
                <div className="flex">
                  {/* 할인 정보 */}
                  <div className={`w-32 flex-shrink-0 flex flex-col items-center justify-center p-4 ${
                    isDisabled ? "bg-slate-100" : "bg-gradient-to-br from-blue-500 to-purple-500"
                  }`}>
                    <span className={`text-2xl font-bold ${isDisabled ? "text-slate-400" : "text-white"}`}>
                      {coupon.discountType === "PERCENT" ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString()}원`}
                    </span>
                    <span className={`text-xs ${isDisabled ? "text-slate-400" : "text-white/80"}`}>
                      할인
                    </span>
                  </div>

                  {/* 쿠폰 정보 */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900">{coupon.name}</h3>
                        {coupon.description && (
                          <p className="text-sm text-slate-500">{coupon.description}</p>
                        )}
                      </div>
                      {coupon.isUsed && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded">
                          사용완료
                        </span>
                      )}
                      {!coupon.isUsed && coupon.isExpired && (
                        <span className="px-2 py-1 bg-red-100 text-red-500 text-xs rounded">
                          기간만료
                        </span>
                      )}
                    </div>

                    {/* 사용 조건 */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {coupon.minOrderAmount && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <ShoppingBag className="h-3 w-3" />
                          {coupon.minOrderAmount.toLocaleString()}원 이상 구매 시
                        </span>
                      )}
                      {coupon.maxDiscountAmount && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          최대 {coupon.maxDiscountAmount.toLocaleString()}원 할인
                        </span>
                      )}
                    </div>

                    {/* 쿠폰 코드 & 만료일 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-slate-100 rounded font-mono text-sm text-slate-700">
                          {coupon.code}
                        </span>
                        {!isDisabled && (
                          <button
                            onClick={() => handleCopy(coupon.code, coupon.id)}
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            title="복사"
                          >
                            {copiedId === coupon.id ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {new Date(coupon.validUntil).toLocaleDateString("ko-KR")} 까지
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
