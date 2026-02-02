"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Package } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { updatePartStock } from "@/app/actions/inventory";
import { useRouter } from "next/navigation";

interface Part {
  id: string;
  partNumber: string;
  name: string;
  quantity: number;
  minStock: number;
  location?: string;
  unitPrice?: number;
  category?: string;
}

interface InventoryGridProps {
  parts: Part[];
}

export function InventoryGrid({ parts }: InventoryGridProps) {
  const router = useRouter();
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleAdjustment = (partId: string, delta: number) => {
    setAdjustments(prev => ({
      ...prev,
      [partId]: (prev[partId] || 0) + delta
    }));
  };

  const handleInputChange = (partId: string, value: string) => {
    const num = parseInt(value) || 0;
    setAdjustments(prev => ({
      ...prev,
      [partId]: num
    }));
  };

  const handleApply = async (part: Part) => {
    const adjustment = adjustments[part.id] || 0;
    if (adjustment === 0) return;

    console.log(`[handleApply] 시작 - partId: ${part.id}, name: ${part.name}, adjustment: ${adjustment}`);
    setLoading(prev => ({ ...prev, [part.id]: true }));
    
    try {
      const newQuantity = part.quantity + adjustment;
      console.log(`[handleApply] 현재: ${part.quantity}, 조정: ${adjustment}, 새값: ${newQuantity}`);
      
      const result = await updatePartStock(part.id, newQuantity);
      console.log(`[handleApply] 결과:`, result);
      
      if (!result.success) {
        alert(`업데이트 실패: ${result.error}`);
        return;
      }
      
      // 조정값 초기화
      setAdjustments(prev => {
        const newAdj = { ...prev };
        delete newAdj[part.id];
        return newAdj;
      });
      
      router.refresh();
      console.log(`[handleApply] 완료 및 페이지 새로고침`);
    } catch (error) {
      console.error("[handleApply] 재고 업데이트 실패:", error);
      alert(`에러: ${error}`);
    } finally {
      setLoading(prev => ({ ...prev, [part.id]: false }));
    }
  };

  const getStockStatus = (part: Part) => {
    if (part.quantity <= part.minStock * 0.5) {
      return { status: "위험", color: "bg-red-500", textColor: "text-red-600" };
    } else if (part.quantity <= part.minStock) {
      return { status: "부족", color: "bg-orange-500", textColor: "text-orange-600" };
    } else if (part.quantity <= part.minStock * 1.5) {
      return { status: "정상", color: "bg-green-500", textColor: "text-green-600" };
    } else {
      return { status: "충분", color: "bg-blue-500", textColor: "text-blue-600" };
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
      {parts.map((part) => {
        const adjustment = adjustments[part.id] || 0;
        const newQuantity = part.quantity + adjustment;
        const stockStatus = getStockStatus(part);
        const isLoading = loading[part.id];

        return (
          <Card key={part.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-bold truncate" title={part.name}>
                    {part.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {part.partNumber}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${stockStatus.textColor} border-0 text-xs shrink-0`}
                >
                  {stockStatus.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* 현재 재고 */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">현재 재고</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${stockStatus.textColor}`}>
                    {formatNumber(part.quantity)}
                  </span>
                  <span className="text-sm text-muted-foreground">개</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>최소: {formatNumber(part.minStock)}</span>
                  <span>•</span>
                  <span>{part.location || '-'}</span>
                </div>
              </div>

              {/* 입고/출고 조정 */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8"
                    onClick={() => handleAdjustment(part.id, -10)}
                    disabled={loading[part.id]}
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    출고
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8"
                    onClick={() => handleAdjustment(part.id, 10)}
                    disabled={loading[part.id]}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    입고
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="±수량"
                    value={adjustments[part.id] || ""}
                    onChange={(e) => handleInputChange(part.id, e.target.value)}
                    className="h-8 text-sm"
                    disabled={loading[part.id]}
                  />
                  <Button
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => handleApply(part)}
                    disabled={(adjustments[part.id] || 0) === 0 || loading[part.id]}
                  >
                    {loading[part.id] ? "..." : "적용"}
                  </Button>
                </div>
              </div>

              {/* 미리보기 */}
              {(adjustments[part.id] || 0) !== 0 && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">변경 후:</span>
                    <span className={`font-bold ${(adjustments[part.id] || 0) > 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {formatNumber(part.quantity + (adjustments[part.id] || 0))}개
                      <span className="text-xs ml-1">
                        ({(adjustments[part.id] || 0) > 0 ? '+' : ''}{formatNumber(adjustments[part.id] || 0)})
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* 빈 상태 */}
      {parts.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">등록된 부품이 없습니다</p>
            <p className="text-sm text-muted-foreground">
              부품을 추가하여 재고 관리를 시작하세요
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
