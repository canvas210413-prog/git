"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Settings, Save, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { updateKPISettings } from "@/app/actions/base-products";

// 상품별 KPI 설정 타입
interface ProductKPISetting {
  id: number;
  name: string;
  partnerCode: string;
  unitPrice: number;
  kpiSupplyPrice: number | null;
  kpiCostPrice: number | null;
  kpiCommissionRate: number | null;
  kpiUnitCount: number;
  kpiCountEnabled: boolean;
  kpiSalesEnabled: boolean;
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("ko-KR").format(Math.round(num));
};

export default function KPISettingsPage() {
  const router = useRouter();
  const [productSettings, setProductSettings] = useState<ProductKPISetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePartner, setActivePartner] = useState<string>("all");

  useEffect(() => {
    fetchProductSettings();
  }, []);

  const fetchProductSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/performance/integrated-dashboard`);
      const result = await response.json();

      if (result.success && result.data.productKPISettings) {
        setProductSettings(result.data.productKPISettings);
      }
    } catch (error) {
      console.error("Failed to fetch product settings:", error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const partners = Array.from(new Set(productSettings.map(p => p.partnerCode))).sort();
  const filteredProducts = activePartner === "all" 
    ? productSettings 
    : productSettings.filter(p => p.partnerCode === activePartner);

  const handleProductChange = (
    productId: number, 
    field: keyof ProductKPISetting, 
    value: number | boolean | null
  ) => {
    setProductSettings(prev => prev.map(p => 
      p.id === productId ? { ...p, [field]: value } : p
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = productSettings.map(p => ({
        id: String(p.id),
        kpiSupplyPrice: p.kpiSupplyPrice,
        kpiCostPrice: p.kpiCostPrice,
        kpiCommissionRate: p.kpiCommissionRate,
        kpiUnitCount: p.kpiUnitCount,
        kpiCountEnabled: p.kpiCountEnabled,
        kpiSalesEnabled: p.kpiSalesEnabled,
      }));
      
      const result = await updateKPISettings(updates);
      
      if (result.success) {
        toast.success("KPI 설정이 저장되었습니다.");
        // 현재 페이지 유지 (페이지 이동 제거)
      } else {
        toast.error(result.error || "저장 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Failed to save KPI settings:", error);
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkToggle = (field: 'kpiCountEnabled' | 'kpiSalesEnabled', value: boolean) => {
    const targetProducts = activePartner === "all" 
      ? productSettings.map(p => p.id)
      : productSettings.filter(p => p.partnerCode === activePartner).map(p => p.id);
    
    setProductSettings(prev => prev.map(p => 
      targetProducts.includes(p.id) ? { ...p, [field]: value } : p
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/performance/integrated")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Settings className="h-8 w-8 text-blue-600" />
              KPI 설정 (상품별)
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              상품별로 공급가, 원가, 수수료율, 건수를 설정합니다.
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg" className="bg-blue-600 hover:bg-blue-700">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              저장
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* 협력사 필터 */}
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-sm font-medium text-gray-700">협력사 필터:</Label>
              <Button
                variant={activePartner === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActivePartner("all")}
              >
                전체
              </Button>
              {partners.map(partner => (
                <Button
                  key={partner}
                  variant={activePartner === partner ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActivePartner(partner)}
                >
                  {partner}
                </Button>
              ))}
            </div>

            {/* 일괄 적용 버튼 */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">일괄 적용:</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkToggle('kpiCountEnabled', true)}>
                  전체 건수 포함
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkToggle('kpiCountEnabled', false)}>
                  전체 건수 제외
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkToggle('kpiSalesEnabled', true)}>
                  전체 매출 포함
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkToggle('kpiSalesEnabled', false)}>
                  전체 매출 제외
                </Button>
              </div>
            </div>

            {/* 상품 목록 테이블 */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[50px]">ID</TableHead>
                    <TableHead className="w-[180px]">상품명</TableHead>
                    <TableHead className="w-[80px]">협력사</TableHead>
                    <TableHead className="w-[100px]">기본단가</TableHead>
                    <TableHead className="w-[110px]">공급가 설정</TableHead>
                    <TableHead className="w-[110px]">원가 설정</TableHead>
                    <TableHead className="w-[100px]">수수료율(%)</TableHead>
                    <TableHead className="w-[70px]">건수</TableHead>
                    <TableHead className="w-[70px] text-center">건수</TableHead>
                    <TableHead className="w-[70px] text-center">매출</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                        등록된 상품이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map(product => (
                      <TableRow key={product.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm text-gray-500">
                          {product.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {product.partnerCode}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatNumber(product.unitPrice)}원
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="미설정"
                            value={product.kpiSupplyPrice ?? ''}
                            onChange={(e) => handleProductChange(
                              product.id, 
                              'kpiSupplyPrice', 
                              e.target.value ? Number(e.target.value) : null
                            )}
                            className="w-24 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="미설정"
                            value={product.kpiCostPrice ?? ''}
                            onChange={(e) => handleProductChange(
                              product.id, 
                              'kpiCostPrice', 
                              e.target.value ? Number(e.target.value) : null
                            )}
                            className="w-24 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="2.585"
                            value={product.kpiCommissionRate !== null ? (product.kpiCommissionRate * 100).toFixed(3) : ''}
                            onChange={(e) => handleProductChange(
                              product.id, 
                              'kpiCommissionRate', 
                              e.target.value ? Number(e.target.value) / 100 : null
                            )}
                            className="w-20 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            value={product.kpiUnitCount || 1}
                            onChange={(e) => handleProductChange(
                              product.id, 
                              'kpiUnitCount', 
                              e.target.value ? Number(e.target.value) : 1
                            )}
                            className="w-16 text-sm"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={product.kpiCountEnabled}
                            onCheckedChange={(checked) => handleProductChange(
                              product.id, 
                              'kpiCountEnabled', 
                              !!checked
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={product.kpiSalesEnabled}
                            onCheckedChange={(checked) => handleProductChange(
                              product.id, 
                              'kpiSalesEnabled', 
                              !!checked
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-blue-700">
                <strong>💡 KPI 설정 안내:</strong>
              </p>
              <ul className="text-sm text-blue-600 space-y-1 ml-4 list-disc">
                <li><strong>공급가 설정:</strong> 미설정 시 기본단가가 적용됩니다.</li>
                <li><strong>원가 설정:</strong> 미설정 시 마진 계산에서 원가 0원으로 처리됩니다.</li>
                <li><strong>수수료율(%):</strong> 미설정 시 기본 2.585%가 적용됩니다. (수수료 = 공급가 × 수수료율)</li>
                <li><strong>건수:</strong> 기본단가당 주문건수입니다. (예: 198,000원 = 2건으로 설정 시 카운트 2개)</li>
                <li><strong>건수 포함:</strong> 체크 해제 시 해당 상품의 주문이 KPI 주문건수에서 제외됩니다.</li>
                <li><strong>매출 포함:</strong> 체크 해제 시 해당 상품의 매출이 KPI 총매출에서 제외됩니다.</li>
              </ul>
              <p className="text-sm text-blue-600 mt-2">
                <strong>📊 마진 계산:</strong> 마진 = 공급가액(부가세 제외) - 원가 - 배송비 - 수수료
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
