"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Plus, Download, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddOrderDialog } from "@/components/orders/add-order-dialog-full";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrderExcelToolbar } from "@/components/orders/order-excel-toolbar";
import { PageHeader } from "@/components/common";
import { StatCard, StatGrid } from "@/components/common/stat-card";
import { formatNumber } from "@/lib/utils";
import { clearTrackingNumbers } from "@/app/actions/orders";

// ============================================================================
// Types
// ============================================================================

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
}

// ============================================================================
// Sub-components
// ============================================================================

interface OrderStatsCardsProps {
  stats: OrderStats;
}

function OrderStatsCards({ stats }: OrderStatsCardsProps) {
  return (
    <StatGrid columns={4}>
      <StatCard
        title="전체 주문"
        value={formatNumber(stats.total)}
        icon="package"
      />
      <StatCard
        title="대기"
        value={formatNumber(stats.pending)}
        icon="clock"
      />
      <StatCard
        title="배송중"
        value={formatNumber(stats.shipped)}
        icon="truck"
        variant="warning"
      />
      <StatCard
        title="배송완료"
        value={formatNumber(stats.delivered)}
        icon="check-circle"
        variant="success"
      />
    </StatGrid>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // 서버 사이드 검색을 위한 상태
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [orderSource, setOrderSource] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 서버 사이드 검색: 모든 검색 조건을 API로 전달
        const params = new URLSearchParams({
          filter: 'with-tracking',
          limit: itemsPerPage.toString(),
          page: currentPage.toString(),
        });
        
        // 검색 조건 추가 (DB에서 검색)
        if (searchName.trim()) {
          params.append('search', searchName.trim());
        }
        if (searchPhone.trim()) {
          params.append('searchPhone', searchPhone.trim());
        }
        if (orderSource && orderSource !== 'all') {
          params.append('orderSource', orderSource);
        }
        if (startDate) {
          params.append('startDate', startDate);
        }
        if (endDate) {
          params.append('endDate', endDate);
        }
        
        const ordersResponse = await fetch(`/api/orders?${params.toString()}`);
        
        if (ordersResponse.ok) {
          const result = await ordersResponse.json();
          const ordersData = result.data || result; // 새 형식 또는 구 형식 호환
          const total = result.total || ordersData.length;
          setTotalCount(total);
          setOrders(ordersData);
          
          // API에서 받은 전체 통계 사용 (페이지 변경 시에도 고정된 값)
          if (result.stats) {
            setStats({
              total: total,
              pending: result.stats.pending || 0,
              processing: 0, // 숨김
              shipped: result.stats.shipped || 0,
              delivered: result.stats.delivered || 0,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentPage, itemsPerPage, searchName, searchPhone, orderSource, startDate, endDate]); // 검색 조건 변경 시도 재호출

  // 검색 조건 변경 핸들러 (자식 컴포넌트에서 호출)
  const handleSearchChange = (params: {
    searchName?: string;
    searchPhone?: string;
    orderSource?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    if (params.searchName !== undefined) setSearchName(params.searchName);
    if (params.searchPhone !== undefined) setSearchPhone(params.searchPhone);
    if (params.orderSource !== undefined) setOrderSource(params.orderSource);
    if (params.startDate !== undefined) setStartDate(params.startDate);
    if (params.endDate !== undefined) setEndDate(params.endDate);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  // 검색 초기화
  const handleResetSearch = () => {
    setSearchName("");
    setSearchPhone("");
    setOrderSource("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  // 전체 다운로드
  const handleDownloadAll = () => {
    if (orders.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    const wb = XLSX.utils.book_new();

    const data = orders.map((order) => ({
      날짜: order.orderDate ? new Date(order.orderDate).toLocaleDateString('ko-KR') : "",
      고객명: order.recipientName || "",
      전화번호: order.recipientPhone || "",
      이동통신: order.recipientMobile || "",
      우편번호: order.recipientZipCode || "",
      주소: order.recipientAddr || "",
      주문번호: order.orderNumber || "",
      상품명및수량: order.productInfo || "",
      배송메시지: order.deliveryMsg || "",
      고객주문처명: order.orderSource || "자사몰",
      단가: order.basePrice ? order.basePrice.toLocaleString() : "0",
      배송비: order.shippingFee ? order.shippingFee.toLocaleString() : "0",
      택배사: order.courier || "",
      운송장번호: order.trackingNumber || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    
    const columns = [
      { header: "날짜", width: 12 },
      { header: "고객명", width: 12 },
      { header: "전화번호", width: 15 },
      { header: "이동통신", width: 15 },
      { header: "우편번호", width: 10 },
      { header: "주소", width: 40 },
      { header: "주문번호", width: 18 },
      { header: "상품명및수량", width: 30 },
      { header: "배송메시지", width: 25 },
      { header: "고객주문처명", width: 15 },
      { header: "단가", width: 12 },
      { header: "배송비", width: 10 },
      { header: "택배사", width: 12 },
      { header: "운송장번호", width: 18 },
    ];
    
    ws["!cols"] = columns.map((col) => ({ wch: col.width }));

    XLSX.utils.book_append_sheet(wb, ws, "주문데이터");
    XLSX.writeFile(wb, `주문데이터_전체_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // 선택된 항목만 다운로드
  const handleDownloadSelected = () => {
    const selectedOrders = orders.filter(order => selectedOrderIds.has(order.id));
    
    if (selectedOrders.length === 0) {
      alert("다운로드할 항목을 선택해주세요.");
      return;
    }

    const wb = XLSX.utils.book_new();

    const data = selectedOrders.map((order) => ({
      날짜: order.orderDate ? new Date(order.orderDate).toLocaleDateString('ko-KR') : "",
      고객명: order.recipientName || "",
      전화번호: order.recipientPhone || "",
      이동통신: order.recipientMobile || "",
      우편번호: order.recipientZipCode || "",
      주소: order.recipientAddr || "",
      주문번호: order.orderNumber || "",
      상품명및수량: order.productInfo || "",
      배송메시지: order.deliveryMsg || "",
      고객주문처명: order.orderSource || "자사몰",
      단가: order.basePrice ? order.basePrice.toLocaleString() : "0",
      배송비: order.shippingFee ? order.shippingFee.toLocaleString() : "0",
      택배사: order.courier || "",
      운송장번호: order.trackingNumber || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    
    const columns = [
      { header: "날짜", width: 12 },
      { header: "고객명", width: 12 },
      { header: "전화번호", width: 15 },
      { header: "이동통신", width: 15 },
      { header: "우편번호", width: 10 },
      { header: "주소", width: 40 },
      { header: "주문번호", width: 18 },
      { header: "상품명및수량", width: 30 },
      { header: "배송메시지", width: 25 },
      { header: "고객주문처명", width: 15 },
      { header: "단가", width: 12 },
      { header: "배송비", width: 10 },
      { header: "택배사", width: 12 },
      { header: "운송장번호", width: 18 },
    ];
    
    ws["!cols"] = columns.map((col) => ({ wch: col.width }));

    XLSX.utils.book_append_sheet(wb, ws, "주문데이터");
    XLSX.writeFile(wb, `주문데이터_선택항목_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // 선택된 주문의 운송장번호 삭제
  const handleClearTrackingNumbers = async () => {
    if (selectedOrderIds.size === 0) {
      alert("운송장번호를 삭제할 주문을 선택해주세요.");
      return;
    }

    if (!confirm(`선택된 ${selectedOrderIds.size}건의 운송장번호를 삭제하시겠습니까?\n(주문 자체는 삭제되지 않고 운송장번호만 비워집니다)`)) {
      return;
    }

    try {
      const result = await clearTrackingNumbers(Array.from(selectedOrderIds));
      
      if (result.success) {
        alert(`${result.data?.cleared || 0}건의 운송장번호가 삭제되었습니다.`);
        setSelectedOrderIds(new Set());
        // 페이지 새로고침 (운송장번호가 없어지면 이 페이지에서 사라짐)
        window.location.reload();
      } else {
        alert(`오류: ${result.error?.message || "운송장번호 삭제에 실패했습니다."}`);
      }
    } catch (error) {
      console.error("운송장번호 삭제 오류:", error);
      alert("운송장번호 삭제 중 오류가 발생했습니다.");
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
        title="주문 데이터 통합(고객상세조회)"
        description={`배송정보가 등록 완료된 주문만 표시됩니다. 엑셀처럼 그리드에서 직접 편집, 추가, 삭제가 가능합니다. (표시: ${orders.length}건 / 전체: ${totalCount.toLocaleString()}건)`}
      >
        <div className="flex items-center gap-3">
          {/* 운송장번호 삭제 버튼 */}
          {selectedOrderIds.size > 0 && (
            <Button 
              variant="destructive" 
              size="default" 
              onClick={handleClearTrackingNumbers}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              운송장번호 삭제 ({selectedOrderIds.size}건)
            </Button>
          )}

          {/* 신규 등록 */}
          <AddOrderDialog>
            <Button variant="default" size="default" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> 신규 등록
            </Button>
          </AddOrderDialog>

          {/* 다운로드 드롭다운 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default">
                <Download className="mr-2 h-4 w-4" />
                다운로드
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>엑셀 다운로드</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadAll}>
                <Download className="mr-2 h-4 w-4" />
                전체 다운로드 ({orders.length}건)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDownloadSelected}
                disabled={selectedOrderIds.size === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                선택 다운로드 ({selectedOrderIds.size}건)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 엑셀 업로드 - 숨김 처리 */}
          {/* <OrderExcelToolbar orders={orders} buttonText="엑셀 업로드" /> */}
        </div>
      </PageHeader>

      {/* 통계 카드 */}
      <OrderStatsCards stats={stats} />

      {/* 인라인 편집 가능한 테이블 */}
      <OrdersTable 
        orders={orders}
        totalCount={totalCount}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(value) => {
          setItemsPerPage(Number(value));
          setCurrentPage(1);
        }}
        selectedOrderIds={selectedOrderIds}
        onSelectionChange={setSelectedOrderIds}
        // 서버 사이드 검색 props
        searchName={searchName}
        searchPhone={searchPhone}
        orderSource={orderSource}
        startDate={startDate}
        endDate={endDate}
        onSearchChange={handleSearchChange}
        onResetSearch={handleResetSearch}
      />
    </div>
  );
}
