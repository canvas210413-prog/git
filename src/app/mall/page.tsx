"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, ChevronRight, Truck, Shield, RefreshCw, Headphones, Loader2 } from "lucide-react";

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

export default function MallHomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch featured products
        const featuredRes = await fetch("/api/mall/products?featured=true&limit=4");
        const featuredData = await featuredRes.json();
        if (featuredData.products) {
          setFeaturedProducts(featuredData.products);
        }

        // Fetch all products
        const allRes = await fetch("/api/mall/products?limit=6");
        const allData = await allRes.json();
        if (allData.products) {
          setAllProducts(allData.products);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              건강한 공기를 위한<br />
              <span className="text-yellow-300">K-Project 쉴드</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              H13 헤파 필터와 플라즈마이온 기술로<br />
              초미세먼지, 바이러스, 세균을 99.9% 제거합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/mall/products"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-full hover:bg-blue-50 transition-colors"
              >
                전체 상품 보기
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                href="/mall/products/2"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 text-blue-900 font-semibold rounded-full hover:bg-yellow-300 transition-colors"
              >
                베스트셀러 보기
                <Star className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3 p-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">무료배송</p>
                <p className="text-sm text-slate-500">5만원 이상 무료</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">품질보증</p>
                <p className="text-sm text-slate-500">1년 무상 A/S</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <RefreshCw className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">교환/반품</p>
                <p className="text-sm text-slate-500">7일 이내 가능</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Headphones className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">고객상담</p>
                <p className="text-sm text-slate-500">1588-0000</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">인기 상품</h2>
            <Link
              href="/mall/products"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              전체보기
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : featuredProducts.length === 0 ? (
            <p className="text-center text-slate-500 py-12">등록된 상품이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
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
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm ml-1 text-slate-600">{product.rating ? product.rating.toFixed(1) : '0.0'}</span>
                      </div>
                      <span className="text-sm text-slate-400">
                        리뷰 {product.reviewCount ? product.reviewCount.toLocaleString() : '0'}
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
      </section>

      {/* All Products Preview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">전체 상품</h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : allProducts.length === 0 ? (
            <p className="text-center text-slate-500 py-12">등록된 상품이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/mall/products/${product.id}`}
                  className="group flex gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-24 h-24 relative bg-white rounded-lg overflow-hidden flex-shrink-0">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-xs text-slate-600">{product.rating ? product.rating.toFixed(1) : '0.0'}</span>
                      <span className="text-xs text-slate-400">({product.reviewCount || 0})</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      {product.discountRate > 0 && (
                        <span className="text-sm font-bold text-red-500">{product.discountRate}%</span>
                      )}
                      <span className="font-bold text-slate-900">
                        {product.price.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            K-Project 쉴드로 우리 가족의 건강을 지켜주세요.
            신규 회원에게는 첫 구매 10% 할인 쿠폰을 드립니다.
          </p>
          <Link
            href="/mall/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors"
          >
            회원가입하고 쿠폰받기
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
