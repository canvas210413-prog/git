"use client";

import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";
import { useMallCart } from "@/components/mall/cart/MallCartProvider";
import { useMallAuth } from "@/components/mall/auth/MallAuthProvider";
import { useState } from "react";

interface BuyNowButtonProps {
  productId: string;
  name: string;
  price: number;
  image?: string;
  className?: string;
}

export function BuyNowButton({ productId, name, price, image, className = "" }: BuyNowButtonProps) {
  const { addItem, clear } = useMallCart();
  const { user } = useMallAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBuyNow = async () => {
    setIsProcessing(true);
    
    // 장바구니 비우고 해당 상품만 추가
    clear();
    addItem({
      productId,
      nameSnapshot: name,
      priceSnapshot: price,
      imageSnapshot: image,
    });

    // 로그인 상태에 따라 라우팅
    setTimeout(() => {
      if (user) {
        router.push("/mall/checkout");
      } else {
        router.push("/mall/login?redirect=/mall/checkout");
      }
      setIsProcessing(false);
    }, 300);
  };

  return (
    <button
      onClick={handleBuyNow}
      disabled={isProcessing}
      className={`flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors ${className}`}
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <CreditCard className="h-5 w-5" />
          <span>바로구매</span>
        </>
      )}
    </button>
  );
}
