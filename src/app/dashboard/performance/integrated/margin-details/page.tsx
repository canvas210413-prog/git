"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Calculator, Loader2 } from "lucide-react";

// 커스텀 항목 상세 타입
interface CustomDeductionDetail {
  id: string;
  label: string;
  value: number;
  operator: string;  // "add" | "subtract"
}

// 검색기간 주문 상세 내역 타입
interface SearchPeriodOrderDetail {
  id: string;
  orderSource: string;
  customerName: string;
  productInfo: string;
  quantity: number;
  basePrice: number;
  matchedKPI: string | null;
  supplyPrice: number;
  supplyPriceExVat: number;
  cost: number;
  shippingFee: number;
  commission: number;
  customDeductions?: CustomDeductionDetail[];  // 커스텀 항목(기타비용 등)
  margin: number;
}

// 마진 설정 정보 타입
interface MarginConfig {
  name: string;
  description: string;
  formula: {
    base: string;
    vatExclude: boolean;
    vatRate: number;
    deductions: {
      id: string;
      type: string;
      enabled: boolean;
      label: string;
      description: string;
      valueType: string;
      fixedValue: number;
      rate?: number;
      excludePartners?: string[];
      operator?: string;
    }[];
  };
  updatedAt: string;
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("ko-KR").format(Math.round(num));
};

const formatCurrency = (num: number): string => {
  return `${formatNumber(num)}원`;
};

export default function MarginDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<SearchPeriodOrderDetail[]>([]);
  const [marginConfig, setMarginConfig] = useState<MarginConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 활성화된 커스텀 항목 목록 (컬럼 헤더용)
  const customColumns = marginConfig?.formula.deductions.filter(
    d => d.type === "custom" && d.enabled
  ) || [];

  useEffect(() => {
    if (!startDate || !endDate) {
      setError("날짜 파라미터가 없습니다.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/performance/integrated-dashboard?startDate=${startDate}&endDate=${endDate}`
        );
        
        if (!response.ok) {
          throw new Error("데이터를 불러오는데 실패했습니다.");
        }

        const result = await response.json();
        if (result.success && result.data?.searchPeriodMargin?.details) {
          setDetails(result.data.searchPeriodMargin.details);
          if (result.data.marginConfig) {
            setMarginConfig(result.data.marginConfig);
          }
        } else {
          throw new Error("데이터 형식이 올바르지 않습니다.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  const displayDateRange = startDate === endDate 
    ? startDate 
    : `${startDate} ~ ${endDate}`;

  // 협력사별로 그룹핑
  const groupedByPartner = details.reduce((acc, detail) => {
    const partner = detail.orderSource;
    if (!acc[partner]) {
      acc[partner] = [];
    }
    acc[partner].push(detail);
    return acc;
  }, {} as Record<string, SearchPeriodOrderDetail[]>);

  // 협력사 순서 정렬
  const partners = ["본사", "로켓그로스", "그로트", "스몰닷", "해피포즈"];
  const sortedPartners = partners.filter(p => groupedByPartner[p]);

  // 협력사별 합계 계산 (커스텀 항목 포함)
  const partnerTotals = Object.entries(groupedByPartner).reduce((acc, [partner, orders]) => {
    // 커스텀 항목별 합계 계산
    const customTotals: Record<string, number> = {};
    orders.forEach(o => {
      if (o.customDeductions) {
        o.customDeductions.forEach(cd => {
          if (!customTotals[cd.id]) customTotals[cd.id] = 0;
          customTotals[cd.id] += cd.value;
        });
      }
    });
    
    acc[partner] = {
      count: orders.length,
      supplyPriceExVat: orders.reduce((sum, o) => sum + o.supplyPriceExVat, 0),
      cost: orders.reduce((sum, o) => sum + o.cost, 0),
      shippingFee: orders.reduce((sum, o) => sum + o.shippingFee, 0),
      commission: orders.reduce((sum, o) => sum + o.commission, 0),
      customTotals,
      margin: orders.reduce((sum, o) => sum + o.margin, 0),
    };
    return acc;
  }, {} as Record<string, any>);

  // 전체 합계 (커스텀 항목 포함)
  const grandTotal = Object.values(partnerTotals).reduce((acc, totals) => {
    // 커스텀 항목 합산
    if (totals.customTotals) {
      Object.entries(totals.customTotals).forEach(([id, value]) => {
        if (!acc.customTotals[id]) acc.customTotals[id] = 0;
        acc.customTotals[id] += value as number;
      });
    }
    return {
      count: acc.count + totals.count,
      supplyPriceExVat: acc.supplyPriceExVat + totals.supplyPriceExVat,
      cost: acc.cost + totals.cost,
      shippingFee: acc.shippingFee + totals.shippingFee,
      commission: acc.commission + totals.commission,
      customTotals: acc.customTotals,
      margin: acc.margin + totals.margin,
    };
  }, { count: 0, supplyPriceExVat: 0, cost: 0, shippingFee: 0, commission: 0, customTotals: {} as Record<string, number>, margin: 0 });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Button onClick={() => router.back()} variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              돌아가기
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                <Calculator className="h-8 w-8 text-blue-600" />
                검색기간 마진 상세 내역
              </h1>
              <p className="text-sm text-gray-600 mt-1">{displayDateRange}</p>
            </div>
          </div>
        </div>

        {/* 전체 합계 카드 */}
        <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-blue-300 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-blue-900">전체 합계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <span className="text-sm text-gray-600">총 건수</span>
                <p className="text-xl font-bold text-blue-700">{grandTotal.count}건</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">공급가(VAT제외)</span>
                <p className="text-xl font-bold">{formatCurrency(grandTotal.supplyPriceExVat)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">원가 합계</span>
                <p className="text-xl font-bold text-red-600">-{formatCurrency(grandTotal.cost)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">배송비 합계</span>
                <p className="text-xl font-bold text-red-600">-{formatCurrency(grandTotal.shippingFee)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">수수료 합계</span>
                <p className="text-xl font-bold text-red-600">-{formatCurrency(grandTotal.commission)}</p>
              </div>
              {/* 커스텀 항목 합계 표시 */}
              {customColumns.map(col => {
                const total = grandTotal.customTotals[col.id] || 0;
                const operator = col.operator || "subtract";
                return (
                  <div key={col.id}>
                    <span className="text-sm text-gray-600">{col.label} 합계</span>
                    <p className={`text-xl font-bold ${operator === "add" ? "text-green-600" : "text-red-600"}`}>
                      {operator === "add" ? "+" : "-"}{formatCurrency(total)}
                    </p>
                  </div>
                );
              })}
              <div>
                <span className="text-sm text-gray-600">순마진 합계</span>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(grandTotal.margin)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 협력사별 상세 내역 */}
        {sortedPartners.map((partner) => {
          const orders = groupedByPartner[partner];
          const totals = partnerTotals[partner];
          
          return (
            <Card key={partner} className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      partner === "본사" ? "bg-blue-100 text-blue-700" :
                      partner === "로켓그로스" ? "bg-orange-100 text-orange-700" :
                      partner === "그로트" ? "bg-green-100 text-green-700" :
                      partner === "스몰닷" ? "bg-purple-100 text-purple-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {partner}
                    </span>
                    <span className="text-gray-500">({orders.length}건)</span>
                  </CardTitle>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">협력사 마진: </span>
                      <span className="font-bold text-green-600 text-lg">{formatCurrency(totals.margin)}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs font-semibold">고객명</TableHead>
                        <TableHead className="text-xs font-semibold">상품정보</TableHead>
                        <TableHead className="text-xs font-semibold text-center">수량</TableHead>
                        <TableHead className="text-xs font-semibold">매칭KPI</TableHead>
                        <TableHead className="text-xs font-semibold text-right">공급가(VAT제외)</TableHead>
                        <TableHead className="text-xs font-semibold text-right">원가</TableHead>
                        <TableHead className="text-xs font-semibold text-right">배송비</TableHead>
                        <TableHead className="text-xs font-semibold text-right">수수료</TableHead>
                        {/* 커스텀 항목 컬럼 헤더 동적 추가 */}
                        {customColumns.map(col => (
                          <TableHead key={col.id} className="text-xs font-semibold text-right">
                            {col.label}
                          </TableHead>
                        ))}
                        <TableHead className="text-xs font-semibold text-right">마진</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((detail, idx) => (
                        <TableRow key={detail.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <TableCell className="text-sm">{detail.customerName}</TableCell>
                          <TableCell className="text-sm max-w-[300px] truncate" title={detail.productInfo}>
                            {detail.productInfo}
                          </TableCell>
                          <TableCell className="text-sm text-center">{detail.quantity}</TableCell>
                          <TableCell className="text-sm">
                            {detail.matchedKPI ? (
                              <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                                {detail.matchedKPI}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs">
                                미매칭
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-right font-mono">{formatNumber(detail.supplyPriceExVat)}</TableCell>
                          <TableCell className="text-sm text-right font-mono text-red-600">-{formatNumber(detail.cost)}</TableCell>
                          <TableCell className="text-sm text-right font-mono text-red-600">-{formatNumber(detail.shippingFee)}</TableCell>
                          <TableCell className="text-sm text-right font-mono text-red-600">-{formatNumber(detail.commission)}</TableCell>
                          {/* 커스텀 항목 값 동적 표시 */}
                          {customColumns.map(col => {
                            const customItem = detail.customDeductions?.find(cd => cd.id === col.id);
                            const value = customItem?.value || 0;
                            const operator = customItem?.operator || col.operator || "subtract";
                            return (
                              <TableCell key={col.id} className={`text-sm text-right font-mono ${operator === "add" ? "text-green-600" : "text-red-600"}`}>
                                {operator === "add" ? "+" : "-"}{formatNumber(value)}
                              </TableCell>
                            );
                          })}
                          <TableCell className={`text-sm text-right font-mono font-semibold ${detail.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatNumber(detail.margin)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* 협력사별 소계 */}
                      <TableRow className="bg-blue-50 font-semibold">
                        <TableCell colSpan={4} className="text-sm">소계</TableCell>
                        <TableCell className="text-sm text-right font-mono">{formatNumber(totals.supplyPriceExVat)}</TableCell>
                        <TableCell className="text-sm text-right font-mono text-red-600">-{formatNumber(totals.cost)}</TableCell>
                        <TableCell className="text-sm text-right font-mono text-red-600">-{formatNumber(totals.shippingFee)}</TableCell>
                        <TableCell className="text-sm text-right font-mono text-red-600">-{formatNumber(totals.commission)}</TableCell>
                        {/* 커스텀 항목 소계 */}
                        {customColumns.map(col => {
                          const total = totals.customTotals?.[col.id] || 0;
                          const operator = col.operator || "subtract";
                          return (
                            <TableCell key={col.id} className={`text-sm text-right font-mono ${operator === "add" ? "text-green-600" : "text-red-600"}`}>
                              {operator === "add" ? "+" : "-"}{formatNumber(total)}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-sm text-right font-mono text-green-600 text-lg">{formatNumber(totals.margin)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
