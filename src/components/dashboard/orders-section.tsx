"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Clock, CheckCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

interface OrdersData {
  total: number;
  pending: number;
  completed: number;
  averageValue: number;
}

interface OrdersSectionProps {
  data: OrdersData;
}

export function OrdersSection({ data }: OrdersSectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Link href="/dashboard/orders">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 주문</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">총 주문 건수</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/orders/status">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">대기 중</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{data.pending.toLocaleString()}</div>
            <p className="text-xs text-orange-600">처리 대기 주문</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/orders/status">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{data.completed.toLocaleString()}</div>
            <p className="text-xs text-green-600">처리 완료 주문</p>
          </CardContent>
        </Card>
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">평균 주문액</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.averageValue)}</div>
          <p className="text-xs text-muted-foreground">주문당 평균 금액</p>
        </CardContent>
      </Card>
    </div>
  );
}
