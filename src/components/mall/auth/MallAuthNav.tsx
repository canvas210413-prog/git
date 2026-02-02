"use client";

import Link from "next/link";
import { useMallAuth } from "./MallAuthProvider";
import { User, LogOut, Loader2 } from "lucide-react";

export function MallAuthNav() {
  const { user, loading, logout } = useMallAuth();

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-slate-400" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/mall/mypage"
          className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          <User className="h-4 w-4" />
          {user.name}님
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/mall/login"
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        로그인
      </Link>
      <Link
        href="/mall/signup"
        className="text-sm font-medium bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700"
      >
        회원가입
      </Link>
    </div>
  );
}
