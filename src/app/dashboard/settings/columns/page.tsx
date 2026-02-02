"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common";
import { Save, RefreshCcw } from "lucide-react";
import {
  getPartnerList,
  getPartnerColumnSettings,
  savePartnerColumnSettings,
  ORDER_COLUMNS,
  CUSTOMER_COLUMNS,
  AS_COLUMNS,
} from "@/app/actions/column-settings";

interface ColumnDef {
  id: string;
  name: string;
  required: boolean;
}

export default function ColumnSettingsPage() {
  const [partners, setPartners] = useState<string[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // 컬럼 선택 상태
  const [orderColumns, setOrderColumns] = useState<string[]>([]);
  const [customerColumns, setCustomerColumns] = useState<string[]>([]);
  const [asColumns, setAsColumns] = useState<string[]>([]);

  // 협력사 목록 로드
  useEffect(() => {
    const loadPartners = async () => {
      const list = await getPartnerList();
      setPartners(list);
      if (list.length > 0 && !selectedPartner) {
        setSelectedPartner(list[0]);
      }
    };
    loadPartners();
  }, []);

  // 협력사 변경 시 설정 로드
  useEffect(() => {
    if (selectedPartner) {
      loadSettings(selectedPartner);
    }
  }, [selectedPartner]);

  const loadSettings = async (partnerCode: string) => {
    setLoading(true);
    try {
      const settings = await getPartnerColumnSettings(partnerCode);
      setOrderColumns(settings.orderColumns);
      setCustomerColumns(settings.customerColumns);
      setAsColumns(settings.asColumns);
    } catch (error) {
      console.error("설정 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPartner) return;
    
    setSaving(true);
    try {
      const result = await savePartnerColumnSettings(
        selectedPartner,
        orderColumns,
        customerColumns,
        asColumns
      );
      
      if (result.success) {
        alert("✅ 컬럼 설정이 저장되었습니다.");
      } else {
        alert(`❌ 저장 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleColumnToggle = (
    columnId: string,
    columns: string[],
    setColumns: (cols: string[]) => void,
    columnDefs: ColumnDef[]
  ) => {
    // 필수 컬럼은 해제 불가
    const isRequired = columnDefs.find(c => c.id === columnId)?.required;
    if (isRequired) return;
    
    if (columns.includes(columnId)) {
      setColumns(columns.filter(c => c !== columnId));
    } else {
      setColumns([...columns, columnId]);
    }
  };

  const renderColumnCheckboxes = (
    columnDefs: ColumnDef[],
    selectedColumns: string[],
    setSelectedColumns: (cols: string[]) => void
  ) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {columnDefs.map(column => (
        <div
          key={column.id}
          className={`flex items-center space-x-2 p-2 rounded border ${
            column.required ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
          }`}
        >
          <Checkbox
            id={column.id}
            checked={selectedColumns.includes(column.id)}
            onCheckedChange={() =>
              handleColumnToggle(column.id, selectedColumns, setSelectedColumns, columnDefs)
            }
            disabled={column.required}
          />
          <Label
            htmlFor={column.id}
            className={`cursor-pointer text-sm ${column.required ? 'font-semibold text-blue-700' : ''}`}
          >
            {column.name}
            {column.required && <span className="text-xs text-blue-500 ml-1">(필수)</span>}
          </Label>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="협력사별 컬럼 설정"
        description="협력사별로 주문/고객/AS 목록에 표시할 컬럼을 설정합니다."
      >
        <Button onClick={handleSave} disabled={saving || !selectedPartner}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "저장 중..." : "설정 저장"}
        </Button>
      </PageHeader>

      {/* 협력사 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>협력사 선택</CardTitle>
          <CardDescription>
            컬럼 설정을 적용할 협력사를 선택하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedPartner} onValueChange={setSelectedPartner}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="협력사 선택" />
              </SelectTrigger>
              <SelectContent>
                {partners.map(partner => (
                  <SelectItem key={partner} value={partner}>
                    {partner}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedPartner && loadSettings(selectedPartner)}
              disabled={loading}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 컬럼 설정 탭 */}
      {selectedPartner && (
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">주문 목록 컬럼</TabsTrigger>
            <TabsTrigger value="customers">고객 목록 컬럼</TabsTrigger>
            <TabsTrigger value="as">AS 목록 컬럼</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>주문 목록 컬럼 설정</CardTitle>
                <CardDescription>
                  "{selectedPartner}" 협력사의 주문 목록에 표시할 컬럼을 선택하세요.
                  파란색 항목은 필수 컬럼입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">로딩 중...</div>
                ) : (
                  renderColumnCheckboxes(ORDER_COLUMNS, orderColumns, setOrderColumns)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>고객 목록 컬럼 설정</CardTitle>
                <CardDescription>
                  "{selectedPartner}" 협력사의 고객 목록에 표시할 컬럼을 선택하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">로딩 중...</div>
                ) : (
                  renderColumnCheckboxes(CUSTOMER_COLUMNS, customerColumns, setCustomerColumns)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="as">
            <Card>
              <CardHeader>
                <CardTitle>AS 목록 컬럼 설정</CardTitle>
                <CardDescription>
                  "{selectedPartner}" 협력사의 AS 목록에 표시할 컬럼을 선택하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">로딩 중...</div>
                ) : (
                  renderColumnCheckboxes(AS_COLUMNS, asColumns, setAsColumns)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* 선택된 컬럼 미리보기 */}
      {selectedPartner && (
        <Card>
          <CardHeader>
            <CardTitle>선택된 컬럼 미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">주문 목록 ({orderColumns.length}개)</h4>
                <div className="flex flex-wrap gap-1">
                  {orderColumns.map(colId => {
                    const col = ORDER_COLUMNS.find(c => c.id === colId);
                    return (
                      <span
                        key={colId}
                        className={`px-2 py-1 text-xs rounded ${
                          col?.required ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
                        }`}
                      >
                        {col?.name || colId}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">고객 목록 ({customerColumns.length}개)</h4>
                <div className="flex flex-wrap gap-1">
                  {customerColumns.map(colId => {
                    const col = CUSTOMER_COLUMNS.find(c => c.id === colId);
                    return (
                      <span
                        key={colId}
                        className={`px-2 py-1 text-xs rounded ${
                          col?.required ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
                        }`}
                      >
                        {col?.name || colId}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">AS 목록 ({asColumns.length}개)</h4>
                <div className="flex flex-wrap gap-1">
                  {asColumns.map(colId => {
                    const col = AS_COLUMNS.find(c => c.id === colId);
                    return (
                      <span
                        key={colId}
                        className={`px-2 py-1 text-xs rounded ${
                          col?.required ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
                        }`}
                      >
                        {col?.name || colId}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
