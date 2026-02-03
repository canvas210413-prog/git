"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Package, 
  Truck, 
  DollarSign, 
  Calendar,
  BarChart2,
  Search,
  RefreshCcw,
  ShieldAlert,
  Settings,
  Calculator,
  Save,
  PiggyBank,
  Percent,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { updateKPISettings } from "@/app/actions/base-products";

// ============================================================================
// Types
// ============================================================================

interface PartnerConfig {
  supplyPrice: number;  // 개당 공급가
  costPrice: number;    // 개당 원가
  enabled: boolean;
}

interface KPISettings {
  partners: Record<string, PartnerConfig>;
  defaultShippingFee: number;  // 기본 배송비
  vatRate: number;
  commissionRate: number;
}

// 상품별 KPI 설정 타입
interface ProductKPISetting {
  id: number;
  name: string;
  partnerCode: string;
  unitPrice: number;
  kpiSupplyPrice: number | null;
  kpiCostPrice: number | null;
  kpiCommissionRate: number | null;  // 수수료율 (기본 0.02585 = 2.585%)
  kpiUnitCount: number;               // 기본단가당 건수 (예: 198000원=2건)
  kpiCountEnabled: boolean;
  kpiSalesEnabled: boolean;
}

interface PartnerStats {
  partner: string;
  count: number;
  countForKPI: number;  // KPI 건수 카운트
  quantity: number;
  basePrice: number;        // 실제 단가 합계 (DB basePrice 필드)
  basePriceForKPI: number;  // KPI 매출 합계
  shippingFee: number;      // 배송비 합계 (DB shippingFee 필드)
  supplyPrice: number;      // 계산된 공급가
  vat: number;
  totalWithVat: number;
  cost: number;
  commission: number;
  margin: number;
}

interface TotalsStats {
  count: number;
  countForKPI: number;
  quantity: number;
  basePrice: number;
  basePriceForKPI: number;
  shippingFee: number;
  supplyPrice: number;
  vat: number;
  totalWithVat: number;
  cost: number;
  commission: number;
  margin: number;
}

interface DashboardData {
  dateRange: {
    startDate: string;
    endDate: string;
    year: number;
  };
  selected: {
    byPartner: PartnerStats[];
    totals: TotalsStats;
  };
  monthToDate: {
    byPartner: PartnerStats[];
    totals: TotalsStats;
  };
  lastMonth: TotalsStats;
  yearToDate: {
    byPartner: PartnerStats[];
    totals: TotalsStats;
    productSales: Record<string, number>;
  };
  productKPISettings: ProductKPISetting[];
  priceInfo: {
    vatRate: number;
    commissionRate: number;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("ko-KR").format(Math.round(num));
};

const formatCurrency = (num: number): string => {
  return `${formatNumber(num)}원`;
};

// ============================================================================
// Default KPI Settings
// ============================================================================

const DEFAULT_KPI_SETTINGS: KPISettings = {
  partners: {
    "본사": { supplyPrice: 45000, costPrice: 42000, enabled: true },
    "로켓그로스": { supplyPrice: 99000, costPrice: 42000, enabled: true },
    "그로트": { supplyPrice: 99000, costPrice: 42000, enabled: true },
    "스몰닷": { supplyPrice: 99000, costPrice: 42000, enabled: true },
    "해피포즈": { supplyPrice: 99000, costPrice: 42000, enabled: true },
  },
  defaultShippingFee: 3000,
  vatRate: 0.1,
  commissionRate: 0,
};

// ============================================================================
// Components
// ============================================================================

// 선택기간 매출현황 섹션
function SelectedPeriodSection({ 
  data, 
  displayDate,
  settings,
}: { 
  data: { byPartner: PartnerStats[]; totals: TotalsStats };
  displayDate: string;
  settings: KPISettings;
}) {
  const filteredData = data.byPartner.filter(p => 
    settings.partners[p.partner]?.enabled !== false
  );

  const totals = filteredData.reduce(
    (acc, p) => ({
      count: acc.count + p.count,
      countForKPI: acc.countForKPI + (p.countForKPI || 0),
      quantity: acc.quantity + p.quantity,
      basePrice: acc.basePrice + p.basePrice,
      basePriceForKPI: acc.basePriceForKPI + (p.basePriceForKPI || 0),
      shippingFee: acc.shippingFee + p.shippingFee,
      supplyPrice: acc.supplyPrice + p.supplyPrice,
      totalWithVat: acc.totalWithVat + p.totalWithVat,
    }),
    { count: 0, countForKPI: 0, quantity: 0, basePrice: 0, basePriceForKPI: 0, shippingFee: 0, supplyPrice: 0, totalWithVat: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
        <h2 className="text-2xl font-bold text-gray-800">선택기간 매출현황</h2>
        <span className="text-sm text-gray-500">({displayDate})</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 총매출 (KPI 설정 기준) */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 border shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              총매출 (KPI 기준)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredData.map(p => (
              <div key={p.partner} className="flex justify-between items-center py-1 px-2 rounded hover:bg-white/50">
                <span className="text-sm text-gray-600">{p.partner}</span>
                <span className="font-semibold text-blue-700">{formatCurrency(p.basePriceForKPI || p.basePrice)}</span>
              </div>
            ))}
            <div className="border-t-2 border-blue-200 pt-3 mt-3 bg-white/60 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">합계</span>
                <span className="font-bold text-xl text-blue-600">{formatCurrency(totals.basePriceForKPI || totals.basePrice)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 주문건수 (KPI 설정 기준) */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300 border shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              주문건수 (KPI 기준)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredData.map(p => (
              <div key={p.partner} className="flex justify-between items-center py-1 px-2 rounded hover:bg-white/50">
                <span className="text-sm text-gray-600">{p.partner}</span>
                <span className="font-semibold text-purple-700">{formatNumber(p.countForKPI || p.count)}건</span>
              </div>
            ))}
            <div className="border-t-2 border-purple-200 pt-3 mt-3 bg-white/60 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">합계</span>
                <span className="font-bold text-xl text-purple-600">{formatNumber(totals.countForKPI || totals.count)}건</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 공급가 (상품별 설정값) */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 border shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              공급가 (설정값)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredData.map(p => (
              <div key={p.partner} className="flex justify-between items-center py-1 px-2 rounded hover:bg-white/50">
                <span className="text-sm text-gray-600">{p.partner}</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(p.supplyPrice)}</span>
              </div>
            ))}
            <div className="border-t-2 border-emerald-200 pt-3 mt-3 bg-white/60 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">합계</span>
                <span className="font-bold text-xl text-emerald-600">{formatCurrency(totals.supplyPrice)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 배송비 */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 border shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Truck className="h-5 w-5 text-orange-600" />
              </div>
              배송비
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredData.map(p => (
              <div key={p.partner} className="flex justify-between items-center py-1 px-2 rounded hover:bg-white/50">
                <span className="text-sm text-gray-600">{p.partner}</span>
                <span className="font-semibold text-orange-700">{formatCurrency(p.shippingFee)}</span>
              </div>
            ))}
            <div className="border-t-2 border-orange-200 pt-3 mt-3 bg-white/60 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">합계</span>
                <span className="font-bold text-xl text-orange-600">{formatCurrency(totals.shippingFee)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 1일~현재 누계 섹션
function MonthToDateSection({ 
  data,
  settings,
  year,
  month
}: { 
  data: { byPartner: PartnerStats[]; totals: TotalsStats };
  settings: KPISettings;
  year: number;
  month: number;
}) {
  const filteredData = data.byPartner.filter(p => 
    settings.partners[p.partner]?.enabled !== false
  );

  const totals = filteredData.reduce(
    (acc, p) => ({
      count: acc.count + p.count,
      countForKPI: acc.countForKPI + (p.countForKPI || 0),
      quantity: acc.quantity + p.quantity,
      basePrice: acc.basePrice + p.basePrice,
      basePriceForKPI: acc.basePriceForKPI + (p.basePriceForKPI || 0),
      shippingFee: acc.shippingFee + p.shippingFee,
      supplyPrice: acc.supplyPrice + p.supplyPrice,
      totalWithVat: acc.totalWithVat + p.totalWithVat,
      margin: acc.margin + p.margin,
    }),
    { count: 0, countForKPI: 0, quantity: 0, basePrice: 0, basePriceForKPI: 0, shippingFee: 0, supplyPrice: 0, totalWithVat: 0, margin: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 bg-gradient-to-b from-emerald-600 to-teal-600 rounded-full"></div>
        <h2 className="text-2xl font-bold text-gray-800">1일~현재 누계</h2>
        <span className="text-sm text-gray-500">({year}년 {month}월 1일 ~ 현재)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 기간별 매출 합계 (KPI 기준) */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 border shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              기간별 매출합계 (KPI)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredData.map(p => (
              <div key={p.partner} className="flex justify-between items-center py-1 px-2 rounded hover:bg-white/50">
                <span className="text-sm text-gray-600">{p.partner}</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(p.basePriceForKPI || p.basePrice)}</span>
              </div>
            ))}
            <div className="border-t-2 border-emerald-200 pt-3 mt-3 bg-white/60 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">합계</span>
                <span className="font-bold text-xl text-emerald-600">{formatCurrency(totals.basePriceForKPI || totals.basePrice)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 1~현재일 건수 (KPI 기준) */}
        <Card className="bg-gradient-to-br from-cyan-50 to-sky-50 border-cyan-300 border shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Package className="h-5 w-5 text-cyan-600" />
              </div>
              1~현재일 건수 (KPI)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredData.map(p => (
              <div key={p.partner} className="flex justify-between items-center py-1 px-2 rounded hover:bg-white/50">
                <span className="text-sm text-gray-600">{p.partner}</span>
                <span className="font-semibold text-cyan-700">{formatNumber(p.countForKPI || p.count)}건</span>
              </div>
            ))}
            <div className="border-t-2 border-cyan-200 pt-3 mt-3 bg-white/60 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">합계</span>
                <span className="font-bold text-xl text-cyan-600">{formatNumber(totals.countForKPI || totals.count)}건</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 공급가 (커스터마이징) */}
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-300 border shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <DollarSign className="h-5 w-5 text-violet-600" />
              </div>
              공급가 (설정값)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredData.map(p => (
              <div key={p.partner} className="flex justify-between items-center py-1 px-2 rounded hover:bg-white/50">
                <span className="text-sm text-gray-600">{p.partner}</span>
                <span className="font-semibold text-violet-700">{formatCurrency(p.supplyPrice)}</span>
              </div>
            ))}
            <div className="border-t-2 border-violet-200 pt-3 mt-3 bg-white/60 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">합계</span>
                <span className="font-bold text-xl text-violet-600">{formatCurrency(totals.supplyPrice)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 배송비 */}
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300 border shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Truck className="h-5 w-5 text-amber-600" />
              </div>
              배송비 합계
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredData.map(p => (
              <div key={p.partner} className="flex justify-between items-center py-1 px-2 rounded hover:bg-white/50">
                <span className="text-sm text-gray-600">{p.partner}</span>
                <span className="font-semibold text-amber-700">{formatCurrency(p.shippingFee)}</span>
              </div>
            ))}
            <div className="border-t-2 border-amber-200 pt-3 mt-3 bg-white/60 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">합계</span>
                <span className="font-bold text-xl text-amber-600">{formatCurrency(totals.shippingFee)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 마진 및 누적통계 섹션
function MarginAndStatsSection({ 
  monthData,
  yearData,
  lastMonth,
  settings,
  year,
}: { 
  monthData: { byPartner: PartnerStats[]; totals: TotalsStats };
  yearData: { byPartner: PartnerStats[]; totals: TotalsStats; productSales: Record<string, number> };
  lastMonth: TotalsStats;
  settings: KPISettings;
  year: number;
}) {
  const filteredMonthData = monthData.byPartner.filter(p => 
    settings.partners[p.partner]?.enabled !== false
  );

  const monthTotals = filteredMonthData.reduce(
    (acc, p) => ({
      count: acc.count + p.count,
      quantity: acc.quantity + p.quantity,
      basePrice: acc.basePrice + p.basePrice,
      shippingFee: acc.shippingFee + p.shippingFee,
      supplyPrice: acc.supplyPrice + p.supplyPrice,
      cost: acc.cost + p.cost,
      margin: acc.margin + p.margin,
      vat: acc.vat + p.vat,
      totalWithVat: acc.totalWithVat + p.totalWithVat,
      commission: acc.commission + (p.commission || 0),
    }),
    { count: 0, quantity: 0, basePrice: 0, shippingFee: 0, supplyPrice: 0, cost: 0, margin: 0, vat: 0, totalWithVat: 0, commission: 0 }
  );

  const filteredYearData = yearData.byPartner.filter(p => 
    settings.partners[p.partner]?.enabled !== false
  );

  const yearTotals = filteredYearData.reduce(
    (acc, p) => ({
      count: acc.count + p.count,
      quantity: acc.quantity + p.quantity,
      basePrice: acc.basePrice + p.basePrice,
      shippingFee: acc.shippingFee + p.shippingFee,
      supplyPrice: acc.supplyPrice + p.supplyPrice,
      cost: acc.cost + p.cost,
      margin: acc.margin + p.margin,
      vat: acc.vat + p.vat,
      totalWithVat: acc.totalWithVat + p.totalWithVat,
      commission: acc.commission + (p.commission || 0),
    }),
    { count: 0, quantity: 0, basePrice: 0, shippingFee: 0, supplyPrice: 0, cost: 0, margin: 0, vat: 0, totalWithVat: 0, commission: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
        <h2 className="text-2xl font-bold text-gray-800">마진 및 누적통계</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 이번달 마진 */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 border shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <PiggyBank className="h-5 w-5 text-green-600" />
              </div>
              1~현재 일 마진금액
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-white/60 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">공급가(부가세제외)</span>
                <span className="font-semibold">{formatCurrency(monthTotals.supplyPrice / 1.1)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">원가 합계</span>
                <span className="font-semibold text-red-600">-{formatCurrency(monthTotals.cost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">배송비 합계</span>
                <span className="font-semibold text-red-600">-{formatCurrency(monthTotals.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">수수료 합계</span>
                <span className="font-semibold text-red-600">-{formatCurrency(monthTotals.commission)}</span>
              </div>
              <div className="border-t-2 border-green-200 pt-2 mt-2 flex justify-between items-center">
                <span className="font-bold text-gray-800">순마진</span>
                <span className="font-bold text-2xl text-green-600">
                  {formatCurrency(monthTotals.margin)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 전월 실적 */}
        <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-slate-300 border shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Calendar className="h-5 w-5 text-slate-600" />
              </div>
              전월 실적
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white/60 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">주문건수</span>
                <span className="font-semibold">{formatNumber(lastMonth.count)}건</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">매출 합계</span>
                <span className="font-semibold">{formatCurrency(lastMonth.basePrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">공급가 합계</span>
                <span className="font-semibold">{formatCurrency(lastMonth.supplyPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">배송비</span>
                <span className="font-semibold">{formatCurrency(lastMonth.shippingFee)}</span>
              </div>
              <div className="border-t-2 border-slate-300 pt-2 mt-2 flex justify-between items-center">
                <span className="font-bold text-gray-800">마진</span>
                <span className="font-bold text-lg text-green-600">{formatCurrency(lastMonth.margin)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 연간 누적 */}
        <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-300 border shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <BarChart2 className="h-5 w-5 text-indigo-600" />
              </div>
              {year}년 누적
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white/60 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">총 주문건수</span>
                <span className="font-semibold">{formatNumber(yearTotals.count)}건</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">총 매출</span>
                <span className="font-semibold">{formatCurrency(yearTotals.basePrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">총 공급가</span>
                <span className="font-semibold">{formatCurrency(yearTotals.supplyPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">총 배송비</span>
                <span className="font-semibold">{formatCurrency(yearTotals.shippingFee)}</span>
              </div>
              <div className="border-t-2 border-indigo-300 pt-2 mt-2 flex justify-between items-center">
                <span className="font-bold text-gray-800">총 마진</span>
                <span className="font-bold text-lg text-green-600">{formatCurrency(yearTotals.margin)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상품별 판매수량 - 숨김 처리 */}
      {false && (
      <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-300 border shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Package className="h-5 w-5 text-rose-600" />
            </div>
            {year}년 상품별 판매수량
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(yearData.productSales).map(([product, qty]) => (
              <div key={product} className="bg-white/60 p-3 rounded-lg text-center">
                <p className="text-sm text-gray-600">{product}</p>
                <p className="font-bold text-lg text-rose-600">{formatNumber(qty)}개</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function IntegratedDashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 날짜 상태 (기본값: 오늘)
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // KPI 설정 상태
  const [kpiSettings, setKpiSettings] = useState<KPISettings>(DEFAULT_KPI_SETTINGS);
  const [productKPISettings, setProductKPISettings] = useState<ProductKPISetting[]>([]);

  const fetchData = useCallback(async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        startDate: start || startDate,
        endDate: end || endDate,
      });
      
      const response = await fetch(`/api/performance/integrated-dashboard?${queryParams}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result.data);
          // 상품 KPI 설정도 함께 저장
          if (result.data.productKPISettings) {
            setProductKPISettings(result.data.productKPISettings);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    fetchData(startDate, endDate);
  };

  const handleReset = () => {
    const todayDate = new Date().toISOString().split('T')[0];
    setStartDate(todayDate);
    setEndDate(todayDate);
    fetchData(todayDate, todayDate);
  };

  const handleKPISettingsSave = () => {
    // 데이터 다시 로드
    fetchData(startDate, endDate);
  };

  // 세션 로딩 중
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 권한 체크 - ADMIN만 접근 가능
  const userRole = (session?.user as { role?: string })?.role;
  if (userRole !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Card className="max-w-md w-full shadow-2xl border-red-200">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <ShieldAlert className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-red-700">접근 권한 없음</CardTitle>
                <p className="text-sm text-red-600 mt-1">관리자 전용 페이지입니다</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <Button onClick={() => window.history.back()} className="bg-blue-600 hover:bg-blue-700">
              이전 페이지로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">대시보드 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const displayDate = data.dateRange?.startDate === data.dateRange?.endDate
    ? `${data.dateRange.startDate.replace(/-/g, '.')}` 
    : `${data.dateRange?.startDate.replace(/-/g, '.')} ~ ${data.dateRange?.endDate.replace(/-/g, '.')}`;

  const currentMonth = new Date(data.dateRange.endDate).getMonth() + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            통합대시보드
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            {displayDate} 기준 실시간 성과 현황
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* KPI 설정 버튼 */}
          <Link href="/dashboard/performance/integrated/kpi-settings">
            <Button
              variant="outline"
              className="shadow-md hover:shadow-lg transition-all bg-white"
            >
              <Settings className="mr-2 h-4 w-4" />
              KPI 설정
            </Button>
          </Link>
          
          {/* 날짜 검색 */}
          <div className="flex items-center gap-2 bg-white p-3 rounded-xl shadow-md">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-36 border-gray-200"
              />
            </div>
            <span className="text-gray-400">~</span>
            <Input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-36 border-gray-200"
            />
            <Button 
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Search className="mr-1 h-4 w-4" />
              조회
            </Button>
            <Button 
              onClick={handleReset}
              disabled={loading}
              variant="outline"
            >
              <RefreshCcw className="mr-1 h-4 w-4" />
              오늘
            </Button>
          </div>
        </div>
      </div>

      {/* 선택기간 매출현황 */}
      <SelectedPeriodSection 
        data={data.selected} 
        displayDate={displayDate}
        settings={kpiSettings}
      />

      {/* 1일~현재 누계 */}
      <MonthToDateSection 
        data={data.monthToDate}
        settings={kpiSettings}
        year={data.dateRange.year}
        month={currentMonth}
      />

      {/* 마진 및 누적통계 */}
      <MarginAndStatsSection 
        monthData={data.monthToDate}
        yearData={data.yearToDate}
        lastMonth={data.lastMonth}
        settings={kpiSettings}
        year={data.dateRange.year}
      />

      {/* 계산 기준 정보 */}
      <Card className="bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
            <div className="p-2 bg-white rounded-lg shadow-sm">📌</div>
            현재 적용된 KPI 설정 (상품별)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          <div className="bg-white/60 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productKPISettings.filter(p => p.kpiCountEnabled || p.kpiSalesEnabled).slice(0, 6).map(product => (
                <div key={product.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {product.partnerCode}
                  </span>
                  <span className="font-medium text-gray-800 truncate">{product.name}</span>
                  <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                    {product.kpiSupplyPrice && <span>공급가:{formatNumber(product.kpiSupplyPrice)}원</span>}
                    {product.kpiCostPrice && <span>원가:{formatNumber(product.kpiCostPrice)}원</span>}
                  </div>
                </div>
              ))}
            </div>
            {productKPISettings.length > 6 && (
              <p className="text-center text-gray-500 mt-3 text-sm">
                ... 외 {productKPISettings.length - 6}개 상품
              </p>
            )}
            {productKPISettings.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                등록된 상품이 없습니다. KPI 설정 버튼을 클릭하여 상품을 등록해주세요.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
