"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  stock: number;
  category: string | null;
  images: string[];
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  discountRate: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/mall/products");
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">전체 상품</h1>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500">등록된 상품이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/mall/products/${product.id}`}
              className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square relative bg-slate-100 overflow-hidden">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    No Image
                  </div>
                )}
                {product.discountRate > 0 && (
                  <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    {product.discountRate}%
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-slate-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-sm text-slate-500 line-clamp-1 mb-2">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm ml-1 text-slate-600">{product.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-slate-400">
                    리뷰 {product.reviewCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  {product.originalPrice && (
                    <span className="text-sm text-slate-400 line-through">
                      {product.originalPrice.toLocaleString()}원
                    </span>
                  )}
                  <span className="font-bold text-lg text-slate-900">
                    {product.price.toLocaleString()}원
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
