"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, ChevronRight, Truck, Shield, RefreshCw, Loader2 } from "lucide-react";
import { AddToCartButton } from "@/components/mall/cart/AddToCartButton";
import { BuyNowButton } from "@/components/mall/cart/BuyNowButton";

interface Review {
  id: string;
  authorName: string;
  rating: number;
  content: string;
  images: string[];
  isVerified: boolean;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  stock: number;
  category: string | null;
  images: string[];
  options: any;
  tags: string | null;
  isFeatured: boolean;
  viewCount: number;
  soldCount: number;
  rating: number;
  reviewCount: number;
  discountRate: number;
  reviews: Review[];
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: Props) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { id } = await params;
        const res = await fetch(`/api/mall/products/${id}`);
        
        if (!res.ok) {
          router.push("/mall/products");
          return;
        }
        
        const data = await res.json();
        setProduct(data);
        
        // Fetch related products
        const relRes = await fetch(`/api/mall/products?limit=4`);
        const relData = await relRes.json();
        if (relData.products) {
          setRelatedProducts(relData.products.filter((p: Product) => p.id !== id));
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        router.push("/mall/products");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProduct();
  }, [params, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/mall" className="hover:text-slate-900">홈</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/mall/products" className="hover:text-slate-900">전체상품</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900">{product.category}</span>
      </nav>

      {/* Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {/* Product Image */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="aspect-square relative">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                No Image
              </div>
            )}
            {product.discountRate > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
                {product.discountRate}% 할인
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="bg-white rounded-xl p-6 shadow-sm flex-1">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(product.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-300"
                    }`}
                  />
                ))}
                <span className="ml-2 font-medium text-slate-700">{product.rating}</span>
              </div>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">
                리뷰 {product.reviewCount.toLocaleString()}개
              </span>
            </div>

            <p className="text-slate-600 mb-6">{product.description}</p>

            {/* Price */}
            <div className="border-t border-b py-6 mb-6">
              <div className="flex items-baseline gap-3">
                {product.originalPrice && (
                  <span className="text-slate-400 line-through text-lg">
                    {product.originalPrice.toLocaleString()}원
                  </span>
                )}
                <span className="text-3xl font-bold text-slate-900">
                  {product.price.toLocaleString()}원
                </span>
                {product.discountRate > 0 && (
                  <span className="text-red-500 font-bold text-lg">
                    {product.discountRate}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center text-center p-3 bg-slate-50 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600 mb-2" />
                <span className="text-xs text-slate-600">무료배송</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-slate-50 rounded-lg">
                <Shield className="h-6 w-6 text-green-600 mb-2" />
                <span className="text-xs text-slate-600">1년 A/S</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-slate-50 rounded-lg">
                <RefreshCw className="h-6 w-6 text-orange-600 mb-2" />
                <span className="text-xs text-slate-600">7일 교환</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <AddToCartButton
                productId={product.id}
                name={product.name}
                price={product.price}
                image={product.images[0]}
                className="flex-1 py-3"
              />
              <BuyNowButton
                productId={product.id}
                name={product.name}
                price={product.price}
                image={product.images[0]}
                className="flex-1 py-3"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {product.tags && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-16">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">관련 태그</h2>
          <div className="flex flex-wrap gap-2">
            {product.tags.split(",").map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm"
              >
                #{tag.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">관련 상품</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.slice(0, 4).map((relProduct) => (
              <Link
                key={relProduct.id}
                href={`/mall/products/${relProduct.id}`}
                className="group"
              >
                <div className="aspect-square relative bg-slate-100 rounded-lg overflow-hidden mb-3">
                  {relProduct.images[0] ? (
                    <Image
                      src={relProduct.images[0]}
                      alt={relProduct.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      No Image
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-slate-900 line-clamp-2 text-sm group-hover:text-blue-600 transition-colors">
                  {relProduct.name}
                </h3>
                <p className="font-bold text-slate-900 mt-1">
                  {relProduct.price.toLocaleString()}원
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
