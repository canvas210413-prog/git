"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { OrderStatusTable } from "@/components/orders/order-status-table";
import { OrderStatusExcelToolbar } from "@/components/orders/order-status-excel-toolbar";
import { EditOrderDialog } from "@/components/orders/edit-order-dialog";
import { PageHeader } from "@/components/common";
import { StatCard, StatGrid } from "@/components/common/stat-card";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Download, Package, Gift, XCircle, Truck } from "lucide-react";
import { deleteAllOrders, updateOrder } from "@/app/actions/orders";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ============================================================================
// Types
// ============================================================================

interface OrderSourceStats {
  [key: string]: {
    total: number;
    withTracking: number;
    withoutTracking: number;
  };
}

// ============================================================================
// Sub-components
// ============================================================================

interface OrderSourceStatsCardsProps {
  stats: OrderSourceStats;
}

function OrderSourceStatsCards({ stats }: OrderSourceStatsCardsProps) {
  const sources = Object.keys(stats);
  
  if (sources.length === 0) {
    return (
      <StatGrid columns={2}>
        <StatCard
          title="전체 주문"
          value="0"
          icon="package"
        />
      </StatGrid>
    );
  }

  return (
    <StatGrid columns={Math.min(sources.length + 1, 4) as 2 | 3 | 4 | 5}>
      <StatCard
        title="전체 주문"
        value={formatNumber(
          sources.reduce((sum, source) => sum + stats[source].total, 0)
        )}
        icon="package"
      />
      {sources.slice(0, 3).map((source) => (
        <StatCard
          key={source}
          title={source}
          value={formatNumber(stats[source].total)}
          description={`운송장: ${stats[source].withTracking}/${stats[source].total}`}
          icon="building"
          variant={stats[source].withTracking === stats[source].total ? "success" : "warning"}
        />
      ))}
    </StatGrid>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function OrderStatusPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  
  // 체크박스 선택 상태 (pending과 completed 각각 별도 관리)
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(new Set());
  const [selectedCompletedIds, setSelectedCompletedIds] = useState<Set<string>>(new Set());

  // 신규 주문 등록 다이얼로그 상태
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // 허용된 고객주문처명 목록
  const ALLOWED_ORDER_SOURCES = ["본사", "로켓그로스", "그로트", "스몰닷", "해피포즈", "기타"];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 모든 주문 가져오기 (미등록 + 등록완료 모두)
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        // Date 객체를 문자열로 변환 및 orderSource 정규화
        const processedOrders = data.map((order: any) => {
          // orderSource 정규화: 허용된 값이 아니면 "본사"로 설정
          let normalizedSource = order.orderSource || "본사";
          if (!ALLOWED_ORDER_SOURCES.includes(normalizedSource)) {
            normalizedSource = "본사";
          }

          return {
            ...order,
            orderSource: normalizedSource,
            orderDate: order.orderDate instanceof Date 
              ? order.orderDate.toISOString().split('T')[0]
              : typeof order.orderDate === 'string'
                ? order.orderDate.split('T')[0]
                : order.orderDate,
            createdAt: order.createdAt instanceof Date
              ? order.createdAt.toISOString()
              : order.createdAt,
            updatedAt: order.updatedAt instanceof Date
              ? order.updatedAt.toISOString()
              : order.updatedAt,
          };
        });
        setOrders(processedOrders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 탭별 주문 필터링
  const pendingOrders = orders.filter((order) => !order.trackingNumber);
  const completedOrders = orders.filter((order) => order.trackingNumber);

  // 현재 활성 탭의 주문 목록
  const displayOrders = activeTab === "pending" ? pendingOrders : completedOrders;
  
  // 현재 탭의 선택 상태
  const currentSelectedIds = activeTab === "pending" ? selectedPendingIds : selectedCompletedIds;
  const setCurrentSelectedIds = activeTab === "pending" ? setSelectedPendingIds : setSelectedCompletedIds;

  // 선택된 항목만 다운로드
  const handleDownloadSelected = () => {
    const selectedOrders = displayOrders.filter(order => currentSelectedIds.has(order.id));
    
    if (selectedOrders.length === 0) {
      alert("다운로드할 항목을 선택해주세요.");
      return;
    }

    const wb = XLSX.utils.book_new();

    const data = selectedOrders.map((order) => ({
      날짜: order.orderDate || "",
      고객명: order.recipientName || "",
      전화번호: order.recipientPhone || "",
      이동통신: order.recipientMobile || "",
      우편번호: order.recipientZipCode || "",
      주소: order.recipientAddr || "",
      주문번호: order.orderNumber || "",
      "상품명 및 수량": order.productInfo || "",
      배송메시지: order.deliveryMsg || "",
      고객주문처명: order.orderSource || "자사몰",
      단가: order.basePrice ? Number(order.basePrice).toLocaleString() : "-",
      배송비: order.shippingFee ? Number(order.shippingFee).toLocaleString() : "-",
      택배사: order.courier || "",
      운송장번호: order.trackingNumber || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    
    const columns = [
      { header: "날짜", key: "날짜", width: 12 },
      { header: "고객명", key: "고객명", width: 15 },
      { header: "전화번호", key: "전화번호", width: 15 },
      { header: "이동통신", key: "이동통신", width: 15 },
      { header: "우편번호", key: "우편번호", width: 12 },
      { header: "주소", key: "주소", width: 40 },
      { header: "주문번호", key: "주문번호", width: 20 },
      { header: "상품명 및 수량", key: "상품명 및 수량", width: 30 },
      { header: "배송메시지", key: "배송메시지", width: 30 },
      { header: "고객주문처명", key: "고객주문처명", width: 15 },
      { header: "단가", key: "단가", width: 12 },
      { header: "배송비", key: "배송비", width: 10 },
      { header: "택배사", key: "택배사", width: 15 },
      { header: "운송장번호", key: "운송장번호", width: 20 },
    ];
    
    ws["!cols"] = columns.map((col) => ({ wch: col.width }));

    XLSX.utils.book_append_sheet(wb, ws, "발주서");
    XLSX.writeFile(wb, `발주서_선택항목_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // 업체별 통계 계산 (현재 탭 기준)
  const stats: OrderSourceStats = {};
  displayOrders.forEach((order) => {
    const source = order.orderSource || "자사몰";
    if (!stats[source]) {
      stats[source] = { total: 0, withTracking: 0, withoutTracking: 0 };
    }
    stats[source].total++;
    if (order.trackingNumber) {
      stats[source].withTracking++;
    } else {
      stats[source].withoutTracking++;
    }
  });

  // 운송장 자동생성 처리
  const handleAutoGenerateTracking = async () => {
    const selectedOrders = displayOrders.filter(order => currentSelectedIds.has(order.id));
    
    if (selectedOrders.length === 0) {
      alert("운송장을 생성할 주문을 선택해주세요.");
      return;
    }

    if (!confirm(`선택된 ${selectedOrders.length}건의 주문에 운송장번호를 "자동생성"으로 입력하시겠습니까?`)) {
      return;
    }

    setDeleting(true);
    try {
      const results = [];
      const errors: { orderNumber: string; error: string }[] = [];

      for (const order of selectedOrders) {
        try {
          const result = await updateOrder(order.id, {
            trackingNumber: "자동생성",
            courier: order.courier || "미정", // 택배사가 없으면 "미정"으로 설정
          });

          if (result.success) {
            results.push(order.orderNumber || order.id);
          } else {
            errors.push({
              orderNumber: order.orderNumber || order.id,
              error: result.error?.message || "업데이트 실패",
            });
          }
        } catch (error: any) {
          errors.push({
            orderNumber: order.orderNumber || order.id,
            error: error.message || "알 수 없는 오류",
          });
        }
      }

      if (errors.length === 0) {
        alert(`✅ ${results.length}건의 운송장번호가 "자동생성"으로 입력되었습니다.`);
      } else {
        let message = `✅ 성공: ${results.length}건\n`;
        message += `❌ 실패: ${errors.length}건\n\n`;
        message += "실패 상세:\n";
        errors.forEach((err) => {
          message += `- ${err.orderNumber}: ${err.error}\n`;
        });
        alert(message);
      }

      // 데이터 새로고침
      await fetchOrders();
      
      // 선택 해제
      setCurrentSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to generate tracking numbers:", error);
      alert("❌ 운송장 생성 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  // 사은품 일괄 발송 처리
  const handleBulkGiftSent = async () => {
    const selectedOrders = displayOrders.filter(order => currentSelectedIds.has(order.id));
    
    if (selectedOrders.length === 0) {
      alert("사은품을 발송 처리할 주문을 선택해주세요.");
      return;
    }

    if (!confirm(`선택된 ${selectedOrders.length}건의 주문을 사은품 발송으로 처리하시겠습니까?`)) {
      return;
    }

    setDeleting(true);
    try {
      const results = [];
      const errors: { orderNumber: string; error: string }[] = [];

      for (const order of selectedOrders) {
        try {
          const result = await updateOrder(order.id, {
            giftSent: true,
          });

          if (result.success) {
            results.push(order.orderNumber || order.id);
          } else {
            errors.push({
              orderNumber: order.orderNumber || order.id,
              error: result.error?.message || "업데이트 실패",
            });
          }
        } catch (error: any) {
          errors.push({
            orderNumber: order.orderNumber || order.id,
            error: error.message || String(error),
          });
        }
      }

      const successCount = results.length;
      const failCount = errors.length;

      let message = `✅ 성공: ${successCount}건이 사은품 발송으로 처리되었습니다.\n`;
      if (failCount > 0) {
        message += `❌ 실패: ${failCount}건\n\n`;
        message += "실패 상세:\n";
        errors.slice(0, 10).forEach((err) => {
          message += `- 주문번호 ${err.orderNumber}: ${err.error}\n`;
        });
        if (errors.length > 10) {
          message += `\n... 외 ${errors.length - 10}건`;
        }
      }

      alert(message);

      if (successCount > 0) {
        await fetchOrders();
        // 선택 해제
        setCurrentSelectedIds(new Set());
      }
    } catch (error) {
      console.error("Bulk gift sent error:", error);
      alert(`❌ 일괄 처리 중 오류 발생: ${error}`);
    } finally {
      setDeleting(false);
    }
  };

  // 사은품 일괄 발송 취소 처리
  const handleBulkGiftSentCancel = async () => {
    const selectedOrders = displayOrders.filter(order => currentSelectedIds.has(order.id));
    
    if (selectedOrders.length === 0) {
      alert("사은품 발송을 취소할 주문을 선택해주세요.");
      return;
    }

    if (!confirm(`선택된 ${selectedOrders.length}건의 주문을 사은품 발송 취소로 처리하시겠습니까?`)) {
      return;
    }

    setDeleting(true);
    try {
      const results = [];
      const errors: { orderNumber: string; error: string }[] = [];

      for (const order of selectedOrders) {
        try {
          const result = await updateOrder(order.id, {
            giftSent: false,
          });

          if (result.success) {
            results.push(order.orderNumber || order.id);
          } else {
            errors.push({
              orderNumber: order.orderNumber || order.id,
              error: result.error?.message || "업데이트 실패",
            });
          }
        } catch (error: any) {
          errors.push({
            orderNumber: order.orderNumber || order.id,
            error: error.message || String(error),
          });
        }
      }

      const successCount = results.length;
      const failCount = errors.length;

      let message = `✅ 성공: ${successCount}건이 사은품 발송 취소로 처리되었습니다.\n`;
      if (failCount > 0) {
        message += `❌ 실패: ${failCount}건\n\n`;
        message += "실패 상세:\n";
        errors.slice(0, 10).forEach((err) => {
          message += `- 주문번호 ${err.orderNumber}: ${err.error}\n`;
        });
        if (errors.length > 10) {
          message += `\n... 외 ${errors.length - 10}건`;
        }
      }

      alert(message);

      if (successCount > 0) {
        await fetchOrders();
        // 선택 해제
        setCurrentSelectedIds(new Set());
      }
    } catch (error) {
      console.error("Bulk gift sent cancel error:", error);
      alert(`❌ 일괄 처리 중 오류 발생: ${error}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`정말로 모든 주문(${orders.length}건)을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteAllOrders();
      if (result.success) {
        alert(`✅ ${result.data?.deletedCount || 0}건의 주문이 삭제되었습니다.`);
        await fetchOrders();
      } else {
        alert(`❌ 삭제 실패: ${result.error?.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Delete all error:", error);
      alert(`❌ 삭제 중 오류 발생: ${error}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">로딩중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="주문상태확인(협력사)"
        description="모든 주문을 확인하고 배송정보를 관리하세요."
      >
        <div className="flex items-center gap-3">
          {/* 신규 주문 등록 */}
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            variant="default"
            size="default"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            신규 주문 등록
          </Button>

          {/* 선택된 주문 액션 */}
          {currentSelectedIds.size > 0 && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="default">
                    <Package className="mr-2 h-4 w-4" />
                    주문 작업 ({currentSelectedIds.size})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>선택된 주문 작업</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleAutoGenerateTracking} disabled={deleting}>
                    <Truck className="mr-2 h-4 w-4" />
                    운송장 번호 생성
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadSelected}>
                    <Download className="mr-2 h-4 w-4" />
                    운송장용 다운로드
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleBulkGiftSent} disabled={deleting}>
                    <Gift className="mr-2 h-4 w-4" />
                    사은품 일괄 발송
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkGiftSentCancel} disabled={deleting}>
                    <XCircle className="mr-2 h-4 w-4" />
                    사은품 발송 취소
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* 엑셀 관리 */}
          <OrderStatusExcelToolbar orders={orders} />

          {/* 전체 삭제 */}
          <Button
            onClick={handleDeleteAll}
            variant="outline"
            size="default"
            disabled={deleting || orders.length === 0}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? "삭제중..." : "전체 삭제"}
          </Button>
        </div>
      </PageHeader>

      {/* 업체별 통계 카드 */}
      <OrderSourceStatsCards stats={stats} />

      {/* 탭 기반 주문 목록 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "pending" | "completed")} className="w-full">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>주문 목록</CardTitle>
                <CardDescription className="mt-1.5">
                  운송장 등록 상태별로 주문을 확인하세요
                </CardDescription>
              </div>
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="pending" className="relative">
                  배송정보 미등록
                  {pendingOrders.length > 0 && (
                    <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                      {pendingOrders.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed" className="relative">
                  배송정보 등록완료
                  {completedOrders.length > 0 && (
                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      {completedOrders.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <TabsContent value="pending" className="mt-0">
              <OrderStatusTable 
                orders={pendingOrders} 
                orderSourceStats={stats}
                selectedOrderIds={selectedPendingIds}
                onSelectionChange={setSelectedPendingIds}
              />
            </TabsContent>
            <TabsContent value="completed" className="mt-0">
              <OrderStatusTable 
                orders={completedOrders} 
                orderSourceStats={stats}
                selectedOrderIds={selectedCompletedIds}
                onSelectionChange={setSelectedCompletedIds}
              />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* 신규 주문 등록 다이얼로그 */}
      <EditOrderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        order={null}
        mode="create"
        onSuccess={() => {
          fetchOrders();
        }}
      />
    </div>
  );
}
