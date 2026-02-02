"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useMallCart } from "./MallCartProvider";

export function MallCartButton() {
  const { totalQuantity } = useMallCart();

  return (
    <Link
      href="/mall/cart"
      className="relative flex items-center justify-center p-2 text-slate-600 hover:text-slate-900 transition-colors"
    >
      <ShoppingCart className="h-5 w-5" />
      {totalQuantity > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {totalQuantity > 99 ? "99+" : totalQuantity}
        </span>
      )}
    </Link>
  );
}
