"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Save, Loader2, Plus, Trash2, Info, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// 마진 차감 항목 타입
interface MarginDeduction {
  id: string;
  type: "cost" | "shippingFee" | "commission" | "custom";
  enabled: boolean;
  label: string;
  description: string;
  valueType: "kpi" | "fixed" | "rate";
  fixedValue: number;
  rate?: number;
  excludePartners?: string[];
  operator?: "add" | "subtract";  // +(수익 추가) 또는 -(비용 차감)
}

// 마진 공식 설정 타입
interface MarginFormulaConfig {
  version: number;
  name: string;
  description: string;
  formula: {
    base: "supplyPrice" | "basePrice";
    vatExclude: boolean;
    vatRate: number;
    deductions: MarginDeduction[];
  };
  updatedAt: string;
  updatedBy: string;
}

interface MarginSettingsDialogProps {
  onSave?: () => void;
}

export function MarginSettingsDialog({ onSave }: MarginSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<MarginFormulaConfig | null>(null);

  // 설정 로드
  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/margin-formula");
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error("마진 설정 로드 실패:", error);
      toast.error("마진 설정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  // 설정 저장
  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      const res = await fetch("/api/settings/margin-formula", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          formula: config.formula,
          updatedBy: "admin",
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("마진 설정이 저장되었습니다.");
        setOpen(false);
        onSave?.();
      } else {
        toast.error(data.message || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("마진 설정 저장 실패:", error);
      toast.error("마진 설정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 차감 항목 수정
  const updateDeduction = (id: string, updates: Partial<MarginDeduction>) => {
    if (!config) return;
    setConfig({
      ...config,
      formula: {
        ...config.formula,
        deductions: config.formula.deductions.map((d) =>
          d.id === id ? { ...d, ...updates } : d
        ),
      },
    });
  };

  // 커스텀 항목 추가
  const addCustomDeduction = () => {
    if (!config) return;
    const newId = `custom_${Date.now()}`;
    setConfig({
      ...config,
      formula: {
        ...config.formula,
        deductions: [
          ...config.formula.deductions,
          {
            id: newId,
            type: "custom",
            enabled: true,
            label: "새 항목",
            description: "사용자 정의 비용 항목",
            valueType: "fixed",
            fixedValue: 0,
            operator: "subtract",  // 기본은 차감
          },
        ],
      },
    });
  };

  // 커스텀 항목 삭제
  const removeDeduction = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      formula: {
        ...config.formula,
        deductions: config.formula.deductions.filter((d) => d.id !== id),
      },
    });
  };

  // 마진 공식 미리보기 문자열 생성
  const getFormulaPreview = () => {
    if (!config) return "";
    
    const base = config.formula.base === "supplyPrice" ? "공급가" : "판매가";
    const enabledDeductions = config.formula.deductions.filter((d) => d.enabled);
    
    if (enabledDeductions.length === 0) {
      return `마진 = ${base}`;
    }
    
    const deductionStr = enabledDeductions
      .map((d) => {
        const operator = d.operator === "add" ? "+" : "-";
        let valueStr = "";
        if (d.valueType === "rate" && d.rate) {
          valueStr = `${d.label}(${(d.rate * 100).toFixed(3)}%)`;
        } else if (d.valueType === "fixed") {
          valueStr = `${d.label}(${d.fixedValue.toLocaleString()}원)`;
        } else {
          valueStr = d.label;
        }
        return `${operator} ${valueStr}`;
      })
      .join(" ");
    
    return `마진 = ${base} ${deductionStr}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="shadow-md hover:shadow-lg transition-all bg-white"
        >
          <Calculator className="mr-2 h-4 w-4" />
          마진 설정
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            마진 계산 공식 설정
          </DialogTitle>
          <DialogDescription>
            마진 산출에 사용되는 항목들을 설정합니다. 변경사항은 즉시 대시보드에 반영됩니다.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : config ? (
          <div className="space-y-6 py-4">
            {/* 공식 미리보기 */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">현재 마진 공식</span>
                </div>
                <p className="text-lg font-mono bg-white/60 p-3 rounded-lg text-gray-800">
                  {getFormulaPreview()}
                </p>
              </CardContent>
            </Card>

            {/* 기본 설정 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">기본 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>공식 이름</Label>
                    <Input
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      placeholder="예: 기본 마진 공식"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>기준 금액</Label>
                    <Select
                      value={config.formula.base}
                      onValueChange={(value: "supplyPrice" | "basePrice") =>
                        setConfig({
                          ...config,
                          formula: { ...config.formula, base: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supplyPrice">공급가 (KPI 설정값)</SelectItem>
                        <SelectItem value="basePrice">판매가 (주문 금액)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>설명</Label>
                  <Textarea
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                    placeholder="마진 공식에 대한 설명"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 차감 항목 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">차감 항목</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCustomDeduction}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    항목 추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.formula.deductions.map((deduction, index) => (
                  <div
                    key={deduction.id}
                    className={`p-4 rounded-lg border ${
                      deduction.enabled
                        ? "bg-white border-gray-200"
                        : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={deduction.enabled}
                          onCheckedChange={(checked) =>
                            updateDeduction(deduction.id, { enabled: checked })
                          }
                        />
                        <div>
                          <Input
                            value={deduction.label}
                            onChange={(e) =>
                              updateDeduction(deduction.id, { label: e.target.value })
                            }
                            className="font-medium h-8 w-32"
                            disabled={deduction.type !== "custom"}
                          />
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                          {deduction.type === "cost" && "원가"}
                          {deduction.type === "shippingFee" && "배송비"}
                          {deduction.type === "commission" && "수수료"}
                          {deduction.type === "custom" && "사용자정의"}
                        </span>
                      </div>
                      {deduction.type === "custom" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeDeduction(deduction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {deduction.enabled && (
                      <div className="grid grid-cols-4 gap-3 pl-11">
                        {/* 연산자 선택 */}
                        <div className="space-y-1">
                          <Label className="text-xs">연산자</Label>
                          <Select
                            value={deduction.operator || "subtract"}
                            onValueChange={(value: "add" | "subtract") =>
                              updateDeduction(deduction.id, { operator: value })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="subtract">- (차감)</SelectItem>
                              <SelectItem value="add">+ (추가)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs">값 유형</Label>
                          <Select
                            value={deduction.valueType}
                            onValueChange={(value: "kpi" | "fixed" | "rate") =>
                              updateDeduction(deduction.id, { valueType: value })
                            }
                            disabled={deduction.type === "cost"}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kpi">KPI 설정값</SelectItem>
                              <SelectItem value="fixed">고정값 (원)</SelectItem>
                              <SelectItem value="rate">비율 (%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {deduction.valueType === "fixed" && (
                          <div className="space-y-1">
                            <Label className="text-xs">고정값 (원)</Label>
                            <Input
                              type="number"
                              value={deduction.fixedValue}
                              onChange={(e) =>
                                updateDeduction(deduction.id, {
                                  fixedValue: Number(e.target.value),
                                })
                              }
                              className="h-9"
                            />
                          </div>
                        )}

                        {deduction.valueType === "rate" && (
                          <div className="space-y-1">
                            <Label className="text-xs">비율 (%)</Label>
                            <Input
                              type="number"
                              step="0.001"
                              value={(deduction.rate || 0) * 100}
                              onChange={(e) =>
                                updateDeduction(deduction.id, {
                                  rate: Number(e.target.value) / 100,
                                })
                              }
                              className="h-9"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <Label className="text-xs">설명</Label>
                          <Input
                            value={deduction.description}
                            onChange={(e) =>
                              updateDeduction(deduction.id, { description: e.target.value })
                            }
                            className="h-9 text-xs"
                            placeholder="항목 설명"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 안내 메시지 */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">참고사항</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-amber-700">
                  <li>원가는 상품별 KPI 설정에서 지정한 값이 자동 적용됩니다.</li>
                  <li>배송비는 로켓그로스를 제외한 모든 협력사에 적용됩니다.</li>
                  <li>수수료는 기준금액(공급가/판매가)에 비율을 곱해 계산됩니다.</li>
                  <li>설정 변경 후 저장하면 즉시 대시보드에 반영됩니다.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
