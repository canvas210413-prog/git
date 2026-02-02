"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, XCircle } from "lucide-react";
import Link from "next/link";

interface InventoryData {
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
}

interface InventorySectionProps {
  data: InventoryData;
}

export function InventorySection({ data }: InventorySectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/dashboard/inventory">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 재고량</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStock.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">전체 부품 수량</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/inventory">
        <Card className={`hover:shadow-md transition-shadow cursor-pointer ${
          data.lowStockItems > 0 ? "border-yellow-200 bg-yellow-50/50" : ""
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${
              data.lowStockItems > 0 ? "text-yellow-700" : ""
            }`}>부족 재고</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${
              data.lowStockItems > 0 ? "text-yellow-500" : "text-muted-foreground"
            }`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              data.lowStockItems > 0 ? "text-yellow-700" : ""
            }`}>{data.lowStockItems.toLocaleString()}</div>
            <p className={`text-xs ${
              data.lowStockItems > 0 ? "text-yellow-600" : "text-muted-foreground"
            }`}>최소 수량 미달 품목</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/inventory">
        <Card className={`hover:shadow-md transition-shadow cursor-pointer ${
          data.outOfStockItems > 0 ? "border-red-200 bg-red-50/50" : ""
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${
              data.outOfStockItems > 0 ? "text-red-700" : ""
            }`}>품절 품목</CardTitle>
            <XCircle className={`h-4 w-4 ${
              data.outOfStockItems > 0 ? "text-red-500" : "text-muted-foreground"
            }`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              data.outOfStockItems > 0 ? "text-red-700" : ""
            }`}>{data.outOfStockItems.toLocaleString()}</div>
            <p className={`text-xs ${
              data.outOfStockItems > 0 ? "text-red-600" : "text-muted-foreground"
            }`}>재고 없는 품목</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
