"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Save, X, Filter, Pencil, Trash2, Plus, Check, Wrench, Settings2, Eye, EyeOff } from "lucide-react";
import { updateOrder } from "@/app/actions/orders";
import { OrderSearchFilter } from "./order-search-filter";
import { EditOrderDialog } from "./edit-order-dialog";
import { ASRequestDialog } from "./as-request-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 컬럼 정의
const ALL_COLUMNS = [
  { id: "orderDate", label: "날짜", width: "w-[100px]", default: true },
  { id: "recipientName", label: "고객명", width: "w-[100px]", default: true },
  { id: "recipientPhone", label: "전화번호", width: "w-[120px]", default: true },
  { id: "recipientMobile", label: "이동통신", width: "w-[120px]", default: true },
  { id: "recipientZipCode", label: "우편번호", width: "w-[100px]", default: false },
  { id: "recipientAddr", label: "주소", width: "w-[250px]", default: true },
  { id: "orderNumber", label: "주문번호", width: "w-[150px]", default: true },
  { id: "productInfo", label: "상품명 및 수량", width: "w-[200px]", default: true },
  { id: "deliveryMsg", label: "배송메시지", width: "w-[200px]", default: false },
  { id: "orderSource", label: "고객주문처명", width: "w-[120px]", default: true },
  { id: "basePrice", label: "단가", width: "w-[100px]", default: true },
  { id: "shippingFee", label: "배송비", width: "w-[100px]", default: false },
  { id: "courier", label: "택배사", width: "w-[120px]", default: true },
  { id: "trackingNumber", label: "운송장번호", width: "w-[150px]", default: true },
  { id: "giftSent", label: "사은품발송", width: "w-[100px]", default: false },
] as const;

type ColumnId = typeof ALL_COLUMNS[number]["id"];

interface Order {
  id: string;
  orderDate: string;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientMobile: string | null;
  recipientZipCode: string | null;
  recipientAddr: string | null;
  orderNumber: string | null;
  productInfo: string | null;
  deliveryMsg: string | null;
  orderSource: string | null;
  basePrice: number | null;
  shippingFee: number | null;
  courier: string | null;
  trackingNumber: string | null;
  giftSent: boolean | null;
}

interface OrderSourceStats {
  [key: string]: {
    total: number;
    withTracking: number;
    withoutTracking: number;
  };
}

interface OrderStatusTableProps {
  orders: Order[];
  orderSourceStats: OrderSourceStats;
  selectedOrderIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export function OrderStatusTable({ 
  orders: initialOrders, 
  orderSourceStats,
  selectedOrderIds: externalSelectedIds,
  onSelectionChange 
}: OrderStatusTableProps) {
  const { data: session } = useSession();
  
  // 현재 사용자의 협력사 정보 (null이면 본사 - 전체 접근)
  const userPartner = (session?.user as { assignedPartner?: string | null })?.assignedPartner || null;
  
  // 초기 주문 목록을 날짜순으로 정렬
  const sortOrdersByDate = (orderList: Order[]) => {
    return [...orderList].sort((a, b) => {
      return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
    });
  };

  const [orders, setOrders] = useState(sortOrdersByDate(initialOrders));
  const [isPending, startTransition] = useTransition();

  // initialOrders가 변경될 때 병합 업데이트 (낙관적 업데이트 유지)
  useEffect(() => {
    setOrders(prevOrders => {
      // 기존 orders의 ID를 Map으로 저장 (낙관적 업데이트 데이터 보존)
      const prevOrdersMap = new Map(prevOrders.map(o => [o.id, o]));
      
      // initialOrders를 기반으로 업데이트하되, 낙관적 업데이트가 있으면 유지
      const mergedOrders = initialOrders.map(newOrder => {
        const prevOrder = prevOrdersMap.get(newOrder.id);
        // 이전에 낙관적 업데이트가 있었다면 그 값을 우선 사용
        return prevOrder || newOrder;
      });
      
      return sortOrdersByDate(mergedOrders);
    });
  }, [initialOrders]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [filterSource, setFilterSource] = useState<string>("all");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // 컬럼 표시 상태 (로컬스토리지에서 복원 또는 기본값 사용)
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`order-columns-${userPartner || "headquarters"}`);
      if (saved) {
        try {
          return new Set(JSON.parse(saved) as ColumnId[]);
        } catch {
          // 파싱 실패시 기본값 사용
        }
      }
    }
    // 기본 표시 컬럼
    return new Set(ALL_COLUMNS.filter(col => col.default).map(col => col.id));
  });

  // 컬럼 표시 상태 변경 시 로컬스토리지에 저장
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `order-columns-${userPartner || "headquarters"}`,
        JSON.stringify(Array.from(visibleColumns))
      );
    }
  }, [visibleColumns, userPartner]);

  // 컬럼 토글 핸들러
  const toggleColumn = (columnId: ColumnId) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  // 모든 컬럼 표시
  const showAllColumns = () => {
    setVisibleColumns(new Set(ALL_COLUMNS.map(col => col.id)));
  };

  // 기본 컬럼만 표시
  const resetColumns = () => {
    setVisibleColumns(new Set(ALL_COLUMNS.filter(col => col.default).map(col => col.id)));
  };
  
  // 팝업 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | "create">("view");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // AS 요청 다이얼로그 상태
  const [asDialogOpen, setAsDialogOpen] = useState(false);
  const [asSelectedOrder, setAsSelectedOrder] = useState<Order | null>(null);
  
  // 체크박스 선택 상태 (외부에서 제어하거나 내부에서 관리)
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());
  const selectedOrderIds = externalSelectedIds ?? internalSelectedIds;
  const setSelectedOrderIds = onSelectionChange 
    ? (ids: Set<string>) => {
        setInternalSelectedIds(ids);
        onSelectionChange(ids);
      }
    : setInternalSelectedIds;
  
  const [newOrderData, setNewOrderData] = useState<any>({
    orderDate: new Date().toISOString().split('T')[0],
    recipientName: "",
    recipientPhone: "",
    recipientMobile: "",
    recipientZipCode: "",
    recipientAddr: "",
    orderNumber: "",
    productInfo: "",
    deliveryMsg: "",
    orderSource: "본사",
    basePrice: "",
    shippingFee: "",
    courier: "",
    trackingNumber: "",
    giftSent: false,
  });

  // 허용된 고객주문처명 목록
  const ALL_ORDER_SOURCES = ["본사", "로켓그로스", "그로트", "스몰닷", "해피포즈", "기타"];
  
  // 협력사 사용자는 자신의 업체만 표시
  const ALLOWED_ORDER_SOURCES = useMemo(() => {
    if (userPartner) {
      return [userPartner];
    }
    return ALL_ORDER_SOURCES;
  }, [userPartner]);
  
  // 협력사 사용자는 업체 필터 자동 설정 및 신규 주문 업체명 설정
  useEffect(() => {
    if (userPartner) {
      if (filterSource === "all") {
        setFilterSource(userPartner);
      }
      setNewOrderData((prev: any) => ({ ...prev, orderSource: userPartner }));
    }
  }, [userPartner]);

  // 택배사 목록
  const courierList = [
    { code: "CJ", name: "CJ대한통운" },
    { code: "HANJIN", name: "한진택배" },
    { code: "LOTTE", name: "롯데택배" },
    { code: "LOGEN", name: "로젠택배" },
    { code: "POST", name: "우체국택배" },
    { code: "GSP", name: "GS편의점택배" },
    { code: "KDEXP", name: "경동택배" },
    { code: "DAESIN", name: "대신택배" },
  ];

  // 체크박스 핸들러
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedOrders.map(order => order.id));
      setSelectedOrderIds(allIds);
    } else {
      setSelectedOrderIds(new Set());
    }
  };

  const handleSelectOne = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrderIds);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrderIds(newSelected);
  };

  // 선택된 주문 가져오기
  const getSelectedOrders = () => {
    return orders.filter(order => selectedOrderIds.has(order.id));
  };

  // 검색 및 필터링
  const filteredOrders = orders.filter((order) => {
    // 업체 필터
    if (filterSource !== "all") {
      const source = order.orderSource || "자사몰";
      if (!ALLOWED_ORDER_SOURCES.includes(source) || source !== filterSource) {
        return false;
      }
    }

    // 고객명 검색
    if (searchName.trim()) {
      const name = order.recipientName || "";
      if (!name.toLowerCase().includes(searchName.toLowerCase().trim())) {
        return false;
      }
    }

    // 전화번호 검색
    if (searchPhone.trim()) {
      const phone = order.recipientPhone || order.recipientMobile || "";
      if (!phone.includes(searchPhone.trim())) {
        return false;
      }
    }

    // 날짜 필터
    const orderDate = new Date(order.orderDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateRange === "1day") {
      const orderDay = new Date(orderDate);
      orderDay.setHours(0, 0, 0, 0);
      if (orderDay.getTime() !== today.getTime()) {
        return false;
      }
    } else if (dateRange === "1week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (orderDate < weekAgo) {
        return false;
      }
    } else if (dateRange === "1month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      if (orderDate < monthAgo) {
        return false;
      }
    } else if (dateRange === "1year") {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      if (orderDate < yearAgo) {
        return false;
      }
    } else if (dateRange === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (orderDate < start || orderDate > end) {
        return false;
      }
    }

    return true;
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // 필터 변경 시 첫 페이지로
  const handleFilterChange = (value: string) => {
    setFilterSource(value);
    setCurrentPage(1);
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 페이지당 항목 수 변경
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // 검색 초기화
  const handleResetSearch = () => {
    setSearchName("");
    setSearchPhone("");
    setDateRange("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  // 편집 시작
  const startEdit = (order: Order) => {
    setEditingId(order.id);
    setEditData({
      orderDate: order.orderDate,
      recipientName: order.recipientName || "",
      recipientPhone: order.recipientPhone || "",
      recipientMobile: order.recipientMobile || "",
      recipientZipCode: order.recipientZipCode || "",
      recipientAddr: order.recipientAddr || "",
      orderNumber: order.orderNumber || "",
      productInfo: order.productInfo || "",
      deliveryMsg: order.deliveryMsg || "",
      orderSource: order.orderSource || "자사몰",
      basePrice: order.basePrice || "",
      shippingFee: order.shippingFee || "",
      courier: order.courier || "",
      trackingNumber: order.trackingNumber || "",
      giftSent: order.giftSent ?? false,
    });
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // 저장
  const saveEdit = async (orderId: string) => {
    startTransition(async () => {
      const result = await updateOrder(orderId, {
        orderDate: editData.orderDate,
        recipientName: editData.recipientName,
        recipientPhone: editData.recipientPhone,
        recipientMobile: editData.recipientMobile,
        recipientZipCode: editData.recipientZipCode,
        recipientAddr: editData.recipientAddr,
        orderNumber: editData.orderNumber,
        productInfo: editData.productInfo,
        deliveryMsg: editData.deliveryMsg,
        orderSource: editData.orderSource,
        basePrice: editData.basePrice ? Number(editData.basePrice) : undefined,
        shippingFee: editData.shippingFee ? Number(editData.shippingFee) : undefined,
        courier: editData.courier,
        trackingNumber: editData.trackingNumber,
        giftSent: editData.giftSent,
      });

      if (result.success) {
        alert("✅ 수정되었습니다.");
        // 페이지 새로고침하여 최신 데이터 표시
        window.location.reload();
      } else {
        alert(`❌ 저장 실패: ${result.error?.message || "알 수 없는 오류"}`);
      }
    });
  };

  // 삭제
  const handleDelete = async (orderId: string) => {
    if (!confirm("정말 이 주문을 삭제하시겠습니까?")) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          window.location.reload();
        } else {
          alert("❌ 삭제 실패");
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert(`❌ 삭제 중 오류 발생: ${error}`);
      }
    });
  };

  // 다중 삭제
  const handleBulkDelete = async () => {
    if (selectedOrderIds.size === 0) return;
    
    if (!confirm(`선택한 ${selectedOrderIds.size}개의 주문을 삭제하시겠습니까?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const deletePromises = Array.from(selectedOrderIds).map(id =>
          fetch(`/api/orders/${id}`, { method: "DELETE" })
        );
        await Promise.all(deletePromises);
        
        setSelectedOrderIds(new Set());
        alert(`${selectedOrderIds.size}개의 주문이 삭제되었습니다.`);
        window.location.reload();
      } catch (error) {
        console.error("Bulk delete failed:", error);
        alert("일부 주문 삭제에 실패했습니다.");
      }
    });
  };

  // 신규 등록 시작
  const startAddNew = () => {
    setIsAddingNew(true);
    setNewOrderData({
      orderDate: new Date().toISOString().split('T')[0],
      recipientName: "",
      recipientPhone: "",
      recipientMobile: "",
      recipientZipCode: "",
      recipientAddr: "",
      orderNumber: "",
      productInfo: "",
      deliveryMsg: "",
      orderSource: "자사몰",
      basePrice: "",
      shippingFee: "",
      courier: "",
      trackingNumber: "",
    });
  };

  // 신규 등록 취소
  const cancelAddNew = () => {
    setIsAddingNew(false);
    setNewOrderData({});
  };

  // 신규 주문 저장
  const saveNewOrder = async () => {
    // 필수 필드 검증
    if (!newOrderData.recipientName?.trim()) {
      alert("고객명을 입력해주세요.");
      return;
    }
    if (!newOrderData.recipientMobile?.trim() && !newOrderData.recipientPhone?.trim()) {
      alert("연락처를 입력해주세요.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newOrderData,
            basePrice: newOrderData.basePrice ? Number(newOrderData.basePrice) : null,
            shippingFee: newOrderData.shippingFee ? Number(newOrderData.shippingFee) : null,
            status: "PENDING",
          }),
        });

        if (response.ok) {
          const newOrder = await response.json();
          alert("✅ 주문이 등록되었습니다.");
          // 페이지 새로고침하여 최신 데이터 표시
          window.location.reload();
        } else {
          const error = await response.json();
          alert(`❌ 등록 실패: ${error.error || "알 수 없는 오류"}`);
        }
      } catch (error) {
        console.error("Create order error:", error);
        alert(`❌ 등록 중 오류 발생: ${error}`);
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
  };

  // 업체 목록
  const sources = ["all", ...Object.keys(orderSourceStats)];

  return (
    <Card>
      {/* 검색 필터 */}
      <div className="p-4 border-b">
        <OrderSearchFilter
          searchName={searchName}
          setSearchName={setSearchName}
          searchPhone={searchPhone}
          setSearchPhone={setSearchPhone}
          orderSource={filterSource}
          setOrderSource={setFilterSource}
          dateRange={dateRange}
          setDateRange={setDateRange}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          filteredCount={filteredOrders.length}
          totalCount={orders.length}
          onReset={handleResetSearch}
          onPageChange={() => setCurrentPage(1)}
          orderSources={ALLOWED_ORDER_SOURCES}
          showOrderSourceFilter={true}
          disableOrderSourceFilter={!!userPartner}
        />
      </div>

      {/* 주문 개수 표시 및 컬럼 필터 */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            전체 {filteredOrders.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)}개 표시
          </div>
          {selectedOrderIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-600">{selectedOrderIds.size}개 선택됨</span>
              <Button 
                onClick={handleBulkDelete} 
                variant="destructive" 
                size="sm"
                disabled={isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                선택 삭제
              </Button>
            </div>
          )}
        </div>
        
        {/* 컬럼 필터 드롭다운 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              컬럼 설정
              <span className="text-xs text-muted-foreground">
                ({visibleColumns.size}/{ALL_COLUMNS.length})
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>표시할 컬럼 선택</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex gap-1 px-2 py-1">
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={showAllColumns}>
                <Eye className="h-3 w-3 mr-1" /> 전체
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={resetColumns}>
                <EyeOff className="h-3 w-3 mr-1" /> 기본
              </Button>
            </div>
            <DropdownMenuSeparator />
            {ALL_COLUMNS.map(column => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={visibleColumns.has(column.id)}
                onCheckedChange={() => toggleColumn(column.id)}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <input
                  type="checkbox"
                  checked={paginatedOrders.length > 0 && paginatedOrders.every(order => selectedOrderIds.has(order.id))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="cursor-pointer"
                />
              </TableHead>
              {visibleColumns.has("orderDate") && <TableHead className="w-[100px]">날짜</TableHead>}
              {visibleColumns.has("recipientName") && <TableHead className="w-[100px]">고객명</TableHead>}
              {visibleColumns.has("recipientPhone") && <TableHead className="w-[120px]">전화번호</TableHead>}
              {visibleColumns.has("recipientMobile") && <TableHead className="w-[120px]">이동통신</TableHead>}
              {visibleColumns.has("recipientZipCode") && <TableHead className="w-[100px]">우편번호</TableHead>}
              {visibleColumns.has("recipientAddr") && <TableHead className="w-[250px]">주소</TableHead>}
              {visibleColumns.has("orderNumber") && <TableHead className="w-[150px]">주문번호</TableHead>}
              {visibleColumns.has("productInfo") && <TableHead className="w-[200px]">상품명 및 수량</TableHead>}
              {visibleColumns.has("deliveryMsg") && <TableHead className="w-[200px]">배송메시지</TableHead>}
              {visibleColumns.has("orderSource") && <TableHead className="w-[120px]">고객주문처명</TableHead>}
              {visibleColumns.has("basePrice") && <TableHead className="w-[100px]">단가</TableHead>}
              {visibleColumns.has("shippingFee") && <TableHead className="w-[100px]">배송비</TableHead>}
              {visibleColumns.has("courier") && <TableHead className="w-[120px]">택배사</TableHead>}
              {visibleColumns.has("trackingNumber") && <TableHead className="w-[150px]">운송장번호</TableHead>}
              {visibleColumns.has("giftSent") && <TableHead className="w-[100px] text-center">사은품발송</TableHead>}
              <TableHead className="w-[80px] text-center">AS요청</TableHead>
              <TableHead className="w-[100px] text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 신규 등록 행 */}
            {isAddingNew && (
              <TableRow className="bg-blue-50 hover:bg-blue-100">
                {/* 체크박스 (신규 등록 시 비활성화) */}
                <TableCell></TableCell>
                
                {/* 날짜 */}
                {visibleColumns.has("orderDate") && (
                  <TableCell>
                    <Input
                      type="date"
                      value={newOrderData.orderDate}
                      onChange={(e) => setNewOrderData({ ...newOrderData, orderDate: e.target.value })}
                      className="h-8 w-full"
                    />
                  </TableCell>
                )}

                {/* 고객명 */}
                {visibleColumns.has("recipientName") && (
                  <TableCell>
                    <Input
                      placeholder="고객명*"
                      value={newOrderData.recipientName}
                      onChange={(e) => setNewOrderData({ ...newOrderData, recipientName: e.target.value })}
                      className="h-8 w-full"
                    />
                  </TableCell>
                )}

                {/* 전화번호 */}
                {visibleColumns.has("recipientPhone") && (
                  <TableCell>
                    <Input
                      placeholder="전화번호"
                      value={newOrderData.recipientPhone}
                      onChange={(e) => setNewOrderData({ ...newOrderData, recipientPhone: e.target.value })}
                      className="h-8 w-full"
                    />
                  </TableCell>
                )}

                {/* 이동통신 */}
                {visibleColumns.has("recipientMobile") && (
                  <TableCell>
                    <Input
                      placeholder="휴대폰*"
                      value={newOrderData.recipientMobile}
                      onChange={(e) => setNewOrderData({ ...newOrderData, recipientMobile: e.target.value })}
                      className="h-8 w-full"
                    />
                  </TableCell>
                )}

                {/* 우편번호 */}
                {visibleColumns.has("recipientZipCode") && (
                  <TableCell>
                    <Input
                      placeholder="우편번호"
                      value={newOrderData.recipientZipCode}
                      onChange={(e) => setNewOrderData({ ...newOrderData, recipientZipCode: e.target.value })}
                      className="h-8 w-full"
                    />
                  </TableCell>
                )}

                {/* 주소 */}
                {visibleColumns.has("recipientAddr") && (
                  <TableCell>
                    <Input
                      placeholder="주소"
                      value={newOrderData.recipientAddr}
                      onChange={(e) => setNewOrderData({ ...newOrderData, recipientAddr: e.target.value })}
                      className="h-8 w-full"
                    />
                  </TableCell>
                )}

                {/* 주문번호 */}
                {visibleColumns.has("orderNumber") && (
                  <TableCell>
                    <Input
                      placeholder="주문번호"
                      value={newOrderData.orderNumber}
                      onChange={(e) => setNewOrderData({ ...newOrderData, orderNumber: e.target.value })}
                      className="h-8 w-full"
                    />
                  </TableCell>
                )}

                {/* 상품명 및 수량 */}
                {visibleColumns.has("productInfo") && (
                  <TableCell>
                    <Input
                      placeholder="상품명 및 수량"
                      value={newOrderData.productInfo}
                      onChange={(e) => setNewOrderData({ ...newOrderData, productInfo: e.target.value })}
                      className="h-8 w-full"
                    />
                  </TableCell>
                )}

                {/* 배송메시지 */}
                {visibleColumns.has("deliveryMsg") && (
                  <TableCell>
                    <Input
                      placeholder="배송메시지"
                      value={newOrderData.deliveryMsg}
                      onChange={(e) => setNewOrderData({ ...newOrderData, deliveryMsg: e.target.value })}
                      className="h-8 w-full"
                    />
                  </TableCell>
                )}

                {/* 고객주문처명 */}
                {visibleColumns.has("orderSource") && (
                  <TableCell>
                    <Select
                      value={newOrderData.orderSource}
                      onValueChange={(value) => setNewOrderData({ ...newOrderData, orderSource: value })}
                      disabled={!!userPartner}
                    >
                      <SelectTrigger className={`w-full h-8 ${userPartner ? 'opacity-70' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALLOWED_ORDER_SOURCES.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}

                {/* 단가 */}
                {visibleColumns.has("basePrice") && (
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="단가"
                      value={newOrderData.basePrice}
                      onChange={(e) => setNewOrderData({ ...newOrderData, basePrice: e.target.value })}
                      className="h-8 w-full"
                    />
                  </TableCell>
                )}

                {/* 배송비 */}
                {visibleColumns.has("shippingFee") && (
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="배송비"
                      value={newOrderData.shippingFee}
                      onChange={(e) => setNewOrderData({ ...newOrderData, shippingFee: e.target.value })}
                      className="h-8 w-full"
                    />
                  </TableCell>
                )}

                {/* 택배사 */}
                {visibleColumns.has("courier") && (
                  <TableCell>
                    <Select
                      value={newOrderData.courier}
                      onValueChange={(value) => setNewOrderData({ ...newOrderData, courier: value })}
                    >
                    <SelectTrigger className="w-full h-8">
                      <SelectValue placeholder="택배사" />
                    </SelectTrigger>
                    <SelectContent>
                      {courierList.map((courier) => (
                        <SelectItem key={courier.code} value={courier.code}>
                          {courier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </TableCell>
                )}

                {/* 운송장번호 */}
                {visibleColumns.has("trackingNumber") && (
                  <TableCell>
                    <Input
                      placeholder="운송장번호"
                      value={newOrderData.trackingNumber}
                      onChange={(e) => setNewOrderData({ ...newOrderData, trackingNumber: e.target.value })}
                      className="h-8 w-full"
                    />
                  </TableCell>
                )}
                
                {/* 사은품 발송 */}
                {visibleColumns.has("giftSent") && (
                  <TableCell className="text-center">
                    <Button
                      variant={newOrderData.giftSent ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewOrderData({ ...newOrderData, giftSent: !newOrderData.giftSent })}
                      className={`h-7 px-2 text-xs ${newOrderData.giftSent ? "bg-green-600 hover:bg-green-700" : ""}`}
                    >
                      {newOrderData.giftSent ? "발송" : "미발송"}
                    </Button>
                  </TableCell>
                )}
                
                {/* AS요청 - 신규 등록에서는 비활성 */}
                <TableCell className="text-center">
                  <span className="text-gray-400">-</span>
                </TableCell>
                {/* 저장 버튼 */}
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveNewOrder}
                    disabled={isPending}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4 text-green-500" />
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {filteredOrders.length === 0 && !isAddingNew && (
              <TableRow>
                <TableCell colSpan={visibleColumns.size + 3} className="h-24 text-center">
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
            {paginatedOrders.map((order) => {
              const isEditing = editingId === order.id;

              return (
                <TableRow key={order.id}>
                  {/* 체크박스 */}
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.has(order.id)}
                      onChange={(e) => handleSelectOne(order.id, e.target.checked)}
                      className="cursor-pointer"
                    />
                  </TableCell>
                  
                  {/* 날짜 */}
                  {visibleColumns.has("orderDate") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editData.orderDate?.split('T')[0] || ""}
                          onChange={(e) => setEditData({ ...editData, orderDate: e.target.value })}
                          className="h-8 w-full"
                        />
                      ) : (
                        formatDate(order.orderDate)
                      )}
                    </TableCell>
                  )}

                  {/* 고객명 - 클릭시 조회 팝업 */}
                  {visibleColumns.has("recipientName") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.recipientName || ""}
                          onChange={(e) => setEditData({ ...editData, recipientName: e.target.value })}
                          className="h-8 w-full"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setDialogMode("view");
                            setDialogOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                        >
                          {order.recipientName}
                        </button>
                      )}
                    </TableCell>
                  )}

                  {/* 전화번호 */}
                  {visibleColumns.has("recipientPhone") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.recipientPhone || ""}
                          onChange={(e) => setEditData({ ...editData, recipientPhone: e.target.value })}
                          className="h-8 w-full"
                        />
                      ) : (
                        order.recipientPhone
                      )}
                    </TableCell>
                  )}

                  {/* 이동통신 */}
                  {visibleColumns.has("recipientMobile") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.recipientMobile || ""}
                          onChange={(e) => setEditData({ ...editData, recipientMobile: e.target.value })}
                          className="h-8 w-full"
                        />
                      ) : (
                        order.recipientMobile
                      )}
                    </TableCell>
                  )}

                  {/* 우편번호 */}
                  {visibleColumns.has("recipientZipCode") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.recipientZipCode || ""}
                          onChange={(e) => setEditData({ ...editData, recipientZipCode: e.target.value })}
                          className="h-8 w-full"
                        />
                      ) : (
                        order.recipientZipCode
                      )}
                    </TableCell>
                  )}

                  {/* 주소 */}
                  {visibleColumns.has("recipientAddr") && (
                    <TableCell className="max-w-[250px]">
                      {isEditing ? (
                        <Input
                          value={editData.recipientAddr || ""}
                          onChange={(e) => setEditData({ ...editData, recipientAddr: e.target.value })}
                          className="h-8 w-full"
                        />
                      ) : (
                        <div className="truncate" title={order.recipientAddr || ""}>{order.recipientAddr}</div>
                      )}
                    </TableCell>
                  )}

                  {/* 주문번호 */}
                  {visibleColumns.has("orderNumber") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.orderNumber || ""}
                          onChange={(e) => setEditData({ ...editData, orderNumber: e.target.value })}
                          className="h-8 w-full"
                        />
                      ) : (
                        order.orderNumber
                      )}
                    </TableCell>
                  )}

                  {/* 상품명 및 수량 */}
                  {visibleColumns.has("productInfo") && (
                    <TableCell className="max-w-[200px]">
                      {isEditing ? (
                        <Input
                          value={editData.productInfo || ""}
                          onChange={(e) => setEditData({ ...editData, productInfo: e.target.value })}
                          className="h-8 w-full"
                        />
                      ) : (
                        <div className="truncate" title={order.productInfo || ""}>{order.productInfo}</div>
                      )}
                    </TableCell>
                  )}

                  {/* 배송메시지 */}
                  {visibleColumns.has("deliveryMsg") && (
                    <TableCell className="max-w-[200px]">
                      {isEditing ? (
                        <Input
                          value={editData.deliveryMsg || ""}
                          onChange={(e) => setEditData({ ...editData, deliveryMsg: e.target.value })}
                          className="h-8 w-full"
                        />
                      ) : (
                        <div className="truncate" title={order.deliveryMsg || ""}>{order.deliveryMsg}</div>
                      )}
                    </TableCell>
                  )}

                  {/* 고객주문처명 */}
                  {visibleColumns.has("orderSource") && (
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={editData.orderSource || "자사몰"}
                          onValueChange={(value) => setEditData({ ...editData, orderSource: value })}
                          disabled={!!userPartner}
                        >
                          <SelectTrigger className={`w-full h-8 ${userPartner ? 'opacity-70' : ''}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALLOWED_ORDER_SOURCES.map((source) => (
                              <SelectItem key={source} value={source}>
                                {source}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        order.orderSource || "자사몰"
                      )}
                    </TableCell>
                  )}

                  {/* 단가 */}
                  {visibleColumns.has("basePrice") && (
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editData.basePrice || ""}
                          onChange={(e) => setEditData({ ...editData, basePrice: e.target.value })}
                          className="h-8 w-full text-right"
                        />
                      ) : (
                        order.basePrice?.toLocaleString() || "-"
                      )}
                    </TableCell>
                  )}

                  {/* 배송비 */}
                  {visibleColumns.has("shippingFee") && (
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editData.shippingFee || ""}
                          onChange={(e) => setEditData({ ...editData, shippingFee: e.target.value })}
                          className="h-8 w-full text-right"
                        />
                      ) : (
                        order.shippingFee?.toLocaleString() || "-"
                      )}
                    </TableCell>
                  )}

                  {/* 택배사 */}
                  {visibleColumns.has("courier") && (
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={editData.courier}
                          onValueChange={(value) =>
                            setEditData({ ...editData, courier: value })
                          }
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue placeholder="택배사 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {courierList.map((courier) => (
                              <SelectItem key={courier.code} value={courier.code}>
                                {courier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={!order.courier ? "text-gray-400" : ""}>
                          {order.courier || "미등록"}
                        </span>
                      )}
                    </TableCell>
                  )}

                  {/* 운송장번호 */}
                  {visibleColumns.has("trackingNumber") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.trackingNumber}
                          onChange={(e) =>
                            setEditData({ ...editData, trackingNumber: e.target.value })
                          }
                          className="h-8"
                        />
                      ) : (
                        <span className={!order.trackingNumber ? "text-gray-400" : ""}>
                          {order.trackingNumber || "미등록"}
                        </span>
                      )}
                    </TableCell>
                  )}

                  {/* 사은품 발송 */}
                  {visibleColumns.has("giftSent") && (
                    <TableCell className="text-center">
                      {isEditing ? (
                        <Button
                          variant={editData.giftSent ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEditData({ ...editData, giftSent: !editData.giftSent })}
                          className={`h-7 px-2 text-xs ${editData.giftSent ? "bg-green-600 hover:bg-green-700" : ""}`}
                        >
                          {editData.giftSent ? "발송" : "미발송"}
                        </Button>
                      ) : (
                        <Button
                          variant={order.giftSent ? "default" : "outline"}
                          size="sm"
                          onClick={async () => {
                            const debugInfo: string[] = [];
                            const timestamp = new Date().toISOString();
                            
                            debugInfo.push(`🕒 시작 시간: ${timestamp}`);
                            debugInfo.push(`📦 주문 ID: ${order.id}`);
                            debugInfo.push(`👤 고객명: ${order.recipientName}`);
                            debugInfo.push(`📋 이전 상태: ${order.giftSent ? '발송' : '미발송'}`);
                            
                            const newValue = !order.giftSent;
                            const previousValue = order.giftSent;
                          
                          debugInfo.push(`📋 새 상태: ${newValue ? '발송' : '미발송'}`);
                          
                          try {
                            // 즉시 UI 업데이트 (낙관적 업데이트)
                            debugInfo.push(`✅ UI 낙관적 업데이트 시작`);
                            setOrders(prevOrders => {
                              const updated = prevOrders.map(o => o.id === order.id ? { ...o, giftSent: newValue } : o);
                              debugInfo.push(`📊 업데이트된 주문 수: ${updated.filter(o => o.id === order.id).length}`);
                              return updated;
                            });
                            
                            // 비동기로 서버 업데이트
                            debugInfo.push(`🌐 서버 업데이트 요청 시작...`);
                            debugInfo.push(`📤 전송 데이터: { giftSent: ${newValue} }`);
                            
                            const startTime = performance.now();
                            const result = await updateOrder(order.id, { giftSent: newValue });
                            const endTime = performance.now();
                            const duration = (endTime - startTime).toFixed(2);
                            
                            debugInfo.push(`⏱️ API 응답 시간: ${duration}ms`);
                            debugInfo.push(`📥 응답: ${JSON.stringify(result, null, 2)}`);
                            
                            // 실패 시 롤백
                            if (!result.success) {
                              debugInfo.push(`❌ 업데이트 실패!`);
                              debugInfo.push(`🔙 롤백 수행 중...`);
                              setOrders(prevOrders =>
                                prevOrders.map(o => o.id === order.id ? { ...o, giftSent: previousValue } : o)
                              );
                              debugInfo.push(`🔙 롤백 완료`);
                              
                              if (result.error) {
                                debugInfo.push(`❌ 에러 코드: ${result.error.code}`);
                                debugInfo.push(`❌ 에러 메시지: ${result.error.message}`);
                                if (result.error.details) {
                                  debugInfo.push(`📋 에러 상세: ${JSON.stringify(result.error.details, null, 2)}`);
                                }
                              }
                              
                              alert('🐛 디버깅 정보\n\n' + debugInfo.join('\n'));
                            } else {
                              debugInfo.push(`✅ 업데이트 성공!`);
                              console.log('✅ 사은품발송 업데이트 성공:', debugInfo.join('\n'));
                            }
                          } catch (error) {
                            debugInfo.push(`💥 예외 발생: ${error}`);
                            debugInfo.push(`🔙 롤백 수행 중...`);
                            setOrders(prevOrders =>
                              prevOrders.map(o => o.id === order.id ? { ...o, giftSent: previousValue } : o)
                            );
                            alert('🐛 디버깅 정보\n\n' + debugInfo.join('\n'));
                          }
                        }}
                        className={`h-7 px-2 text-xs ${order.giftSent ? "bg-green-600 hover:bg-green-700" : ""}`}
                      >
                        {order.giftSent ? "발송" : "미발송"}
                      </Button>
                      )}
                    </TableCell>
                  )}

                  {/* AS요청 */}
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAsSelectedOrder(order);
                        setAsDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0"
                      title="AS 요청"
                    >
                      <Wrench className="h-4 w-4 text-purple-500" />
                    </Button>
                  </TableCell>

                  {/* 관리 */}
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEdit(order.id)}
                          disabled={isPending}
                          className="h-8 w-8 p-0"
                        >
                          <Save className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={isPending}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setDialogMode("edit");
                            setDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                          title="수정"
                        >
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(order.id)}
                          disabled={isPending}
                          className="h-8 w-8 p-0"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="p-4 border-t flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            이전
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
              // 현재 페이지 주변 페이지만 표시
              const pageNumber = currentPage <= 5
                ? i + 1
                : currentPage >= totalPages - 4
                ? totalPages - 9 + i
                : currentPage - 5 + i;

              if (pageNumber < 1 || pageNumber > totalPages) return null;

              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  className="w-10"
                >
                  {pageNumber}
                </Button>
              );
            })}
            {totalPages > 10 && currentPage < totalPages - 5 && (
              <>
                <span className="text-gray-400">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  className="w-10"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            다음
          </Button>
        </div>
      )}

      {/* 주문 조회/수정 다이얼로그 */}
      <EditOrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={selectedOrder}
        mode={dialogMode}
      />

      {/* AS 요청 다이얼로그 */}
      <ASRequestDialog
        open={asDialogOpen}
        onOpenChange={setAsDialogOpen}
        order={asSelectedOrder}
      />
    </Card>
  );
}
