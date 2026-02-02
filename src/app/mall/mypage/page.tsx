"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMallAuth } from "@/components/mall/auth/MallAuthProvider";
import { useRouter } from "next/navigation";
import { 
  User, 
  Package, 
  MapPin, 
  Ticket, 
  Settings, 
  ChevronRight,
  Loader2,
  Award
} from "lucide-react";

export default function MyPage() {
  const { user, loading } = useMallAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ orderCount: 0, couponCount: 0, grade: "BASIC" });

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/mall/login?redirect=/mall/mypage");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetch("/api/mall/mypage/stats")
        .then(res => res.json())
        .then(data => {
          if (data.stats) setStats(data.stats);
        })
        .catch(console.error);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    { href: "/mall/orders", icon: Package, label: "주문내역", badge: stats.orderCount },
    { href: "/mall/mypage/addresses", icon: MapPin, label: "배송지 관리" },
    { href: "/mall/mypage/coupons", icon: Ticket, label: "쿠폰함", badge: stats.couponCount },
    { href: "/mall/mypage/profile", icon: User, label: "회원정보 수정" },
    { href: "/mall/mypage/settings", icon: Settings, label: "알림 설정" },
  ];

  const gradeColors: Record<string, string> = {
    VIP: "bg-purple-100 text-purple-700",
    GOLD: "bg-yellow-100 text-yellow-700",
    SILVER: "bg-slate-200 text-slate-700",
    BASIC: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">마이페이지</h1>

      {/* User Info Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-900">{user.name}님</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${gradeColors[stats.grade] || gradeColors.BASIC}`}>
                <Award className="h-3 w-3 inline mr-1" />
                {stats.grade}
              </span>
            </div>
            <p className="text-slate-500">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.orderCount}</p>
          <p className="text-sm text-slate-500">총 주문</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">{stats.couponCount}</p>
          <p className="text-sm text-slate-500">보유 쿠폰</p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white rounded-xl shadow-sm divide-y">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5 text-slate-500" />
              <span className="font-medium text-slate-900">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {item.badge}
                </span>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
