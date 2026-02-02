import Link from "next/link";
import { MallAuthNav } from "@/components/mall/auth/MallAuthNav";
import { MallCartButton } from "@/components/mall/cart/MallCartButton";
import { Store } from "lucide-react";

export function MallNavbar() {
  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/mall" className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Store className="h-6 w-6 text-blue-600" />
          K-Project Mall
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/mall" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            홈
          </Link>
          <Link href="/mall/products" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            전체상품
          </Link>
          <Link href="/mall/qna" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Q&A
          </Link>
          <MallAuthNav />
          <MallCartButton />
        </div>
      </div>
    </nav>
  );
}
