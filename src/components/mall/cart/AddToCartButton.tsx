"use client";

import { ShoppingCart, Loader2 } from "lucide-react";
import { useMallCart } from "@/components/mall/cart/MallCartProvider";
import { useState } from "react";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  image?: string;
  className?: string;
}

export function AddToCartButton({ productId, name, price, image, className = "" }: AddToCartButtonProps) {
  const { addItem } = useMallCart();
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    
    // 장바구니에 추가
    addItem({
      productId,
      nameSnapshot: name,
      priceSnapshot: price,
      imageSnapshot: image,
    });

    // 애니메이션 효과
    setTimeout(() => {
      setIsAdding(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }, 300);
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding}
      className={`flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors ${className}`}
    >
      {isAdding ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : showSuccess ? (
        <>
          <ShoppingCart className="h-5 w-5 text-green-600" />
          <span className="text-green-600">담았습니다!</span>
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5" />
          <span>장바구니</span>
        </>
      )}
    </button>
  );
}
