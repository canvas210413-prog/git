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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrder, deleteOrder } from "@/app/actions/orders";
import { updateOrderDeliveryStatus } from "@/app/actions/delivery";
import { getAfterServiceById } from "@/app/actions/after-service";
import { Pencil, Save, X, Trash2, Package, Truck, MapPin, Home, CheckCircle, RefreshCw, Wrench, Calendar, AlertCircle, Filter, Search, RotateCcw, Settings2, Eye, EyeOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrderSearchFilter } from "./order-search-filter";
import { EditOrderDialog } from "./edit-order-dialog";
import { ASRequestDialog } from "./as-request-dialog";

// 컬럼 정의
const ALL_COLUMNS = [
  { id: "orderDate", label: "날짜", width: "w-[100px]", default: true },
  { id: "recipientName", label: "고객명", width: "w-[100px]", default: true },
  { id: "recipientPhone", label: "전화번호", width: "w-[120px]", default: true },
  { id: "recipientMobile", label: "이동통신", width: "w-[120px]", default: true },
  { id: "recipientZipCode", label: "우편번호", width: "w-[100px]", default: true },
  { id: "recipientAddr", label: "주소", width: "w-[180px]", default: true },
  { id: "orderNumber", label: "주문번호", width: "w-[120px]", default: true },
  { id: "productInfo", label: "상품명 및 수량", width: "w-[150px]", default: true },
  { id: "deliveryMsg", label: "배송메시지", width: "w-[150px]", default: true },
  { id: "orderSource", label: "고객주문처명", width: "w-[100px]", default: true },
  { id: "basePrice", label: "단가", width: "w-[100px]", default: true },
  { id: "shippingFee", label: "배송비", width: "w-[100px]", default: true },
  { id: "courier", label: "택배사", width: "w-[100px]", default: true },
  { id: "trackingNumber", label: "운송장번호", width: "w-[120px]", default: true },
  { id: "giftSent", label: "사은품발송", width: "w-[100px]", default: true },
] as const;

type ColumnId = typeof ALL_COLUMNS[number]["id"];

// 배송 상태 5단계 정의
const DELIVERY_STATUS_STEPS = [
  { key: "PICKED_UP", label: "상품인수", icon: Package },
  { key: "IN_TRANSIT", label: "상품이동중", icon: Truck },
  { key: "ARRIVED", label: "배송지도착", icon: MapPin },
  { key: "OUT_FOR_DELIVERY", label: "배송출발", icon: Home },
  { key: "DELIVERED", label: "배송완료", icon: CheckCircle },
];

// 배송 상태 진행 표시 컴포넌트
function DeliveryStatusProgress({ status }: { status: string | null }) {
  if (!status || status === "PENDING") {
    return <span className="text-gray-400 text-xs">-</span>;
  }

  const currentIndex = DELIVERY_STATUS_STEPS.findIndex(s => s.key === status);
  
  return (
    <div className="flex items-center gap-0.5">
      {DELIVERY_STATUS_STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const Icon = step.icon;
        
        return (
          <div key={step.key} className="flex items-center">
            <div
              className={`
                flex flex-col items-center
                ${isCompleted ? 'text-blue-600' : 'text-gray-300'}
              `}
              title={step.label}
            >
              <Icon className={`h-4 w-4 ${isCurrent ? 'animate-pulse' : ''}`} />
            </div>
            {index < DELIVERY_STATUS_STEPS.length - 1 && (
              <div 
                className={`w-2 h-0.5 mx-0.5 ${
                  index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// 배송 상태 뱃지 컴포넌트
function DeliveryStatusBadge({ status }: { status: string | null }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: "대기", className: "bg-gray-100 text-gray-600" },
    PICKED_UP: { label: "상품인수", className: "bg-blue-100 text-blue-700" },
    IN_TRANSIT: { label: "상품이동중", className: "bg-indigo-100 text-indigo-700" },
    ARRIVED: { label: "배송지도착", className: "bg-purple-100 text-purple-700" },
    OUT_FOR_DELIVERY: { label: "배송출발", className: "bg-orange-100 text-orange-700" },
    DELIVERED: { label: "배송완료", className: "bg-green-100 text-green-700" },
  };

  const config = statusConfig[status || "PENDING"] || statusConfig.PENDING;
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

export function OrdersTable({ 
  orders: initialOrders,
  selectedOrderIds,
  onSelectionChange 
}: { 
  orders: any[];
  selectedOrderIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}) {
  const { data: session } = useSession();
  
  // 현재 사용자의 협력사 정보 (null이면 본사 - 전체 접근)
  const userPartner = (session?.user as { assignedPartner?: string | null })?.assignedPartner || null;
  
  // 날짜순 정렬 함수
  const sortOrdersByDate = (orderList: any[]) => {
    return [...orderList].sort((a, b) => {
      return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
    });
  };

  const [orders, setOrders] = useState(sortOrdersByDate(initialOrders));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [isPending, startTransition] = useTransition();
  
  // 외부에서 전달된 selectedOrderIds를 사용하거나, 내부 상태 사용
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());
  const selectedIds = selectedOrderIds || internalSelectedIds;
  const setSelectedIds = onSelectionChange || setInternalSelectedIds;
  const [asDialogOpen, setAsDialogOpen] = useState(false);
  const [selectedAsInfo, setSelectedAsInfo] = useState<any>(null);
  const [loadingAs, setLoadingAs] = useState(false);
  const [asSelectedOrder, setAsSelectedOrder] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // 컬럼 표시 상태 (로컬스토리지에서 복원 또는 기본값 사용)
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`orders-columns-${userPartner || "headquarters"}`);
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
        `orders-columns-${userPartner || "headquarters"}`,
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

  // 주문 수정 팝업 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogMode, setEditDialogMode] = useState<"view" | "edit" | "create">("edit");
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<any>(null);
  
  // 에러 다이얼로그 상태
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 검색 및 필터 상태
  // 협력사 사용자는 자신의 업체로 초기화
  const [orderSource, setOrderSource] = useState("all");
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // 허용된 고객주문처명 목록
  const ALL_ORDER_SOURCES = ["본사", "로켓그로스", "그로트", "스몰닷", "해피포즈", "기타"];
  
  // 협력사 사용자는 자신의 업체만 표시
  const ALLOWED_ORDER_SOURCES = useMemo(() => {
    if (userPartner) {
      return [userPartner];
    }
    return ALL_ORDER_SOURCES;
  }, [userPartner]);
  
  // 협력사 사용자는 업체 필터 자동 설정
  useEffect(() => {
    if (userPartner && orderSource === "all") {
      setOrderSource(userPartner);
    }
  }, [userPartner]);

  // props 변경 시 정렬하여 상태 업데이트
  useEffect(() => {
    setOrders(sortOrdersByDate(initialOrders));
  }, [initialOrders]);

  // 검색 및 필터링
  const filteredOrders = orders.filter((order) => {
    // 고객주문처명 필터
    if (orderSource !== "all") {
      const source = order.orderSource || "자사몰";
      if (source !== orderSource) {
        return false;
      }
    }

    // 수취인명 검색
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

  // 검색 초기화
  const handleResetSearch = () => {
    setOrderSource("all");
    setSearchName("");
    setSearchPhone("");
    setDateRange("all");
    setStartDate("");
    setEndDate("");
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

  const startEdit = (order: any) => {
    setEditingId(order.id);
    setEditData({
      orderDate: new Date(order.orderDate).toISOString().split("T")[0],
      recipientName: order.recipientName || "",
      recipientPhone: order.recipientPhone || "",
      recipientMobile: order.recipientMobile || "",
      recipientZipCode: order.recipientZipCode || "",
      recipientAddr: order.recipientAddr || "",
      orderNumber: order.orderNumber || "",
      productInfo: order.productInfo || "",
      deliveryMsg: order.deliveryMsg || "",
      orderSource: order.orderSource || "",
      basePrice: order.basePrice || 0,
      shippingFee: order.shippingFee || 0,
      courier: order.courier || "",
      trackingNumber: order.trackingNumber || "",
      deliveryStatus: order.deliveryStatus || "",
      status: order.status,
      giftSent: order.giftSent ?? false,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (orderId: string) => {
    startTransition(async () => {
      // 숫자 필드 변환
      const updateData: any = { ...editData };
      
      // 숫자 필드를 명시적으로 변환
      if (updateData.basePrice !== undefined) {
        updateData.basePrice = Number(updateData.basePrice) || 0;
      }
      if (updateData.shippingFee !== undefined) {
        updateData.shippingFee = Number(updateData.shippingFee) || 0;
      }
      if (updateData.additionalFee !== undefined) {
        updateData.additionalFee = Number(updateData.additionalFee) || 0;
      }
      
      // totalAmount 계산
      const basePrice = updateData.basePrice || 0;
      const shippingFee = updateData.shippingFee || 0;
      const additionalFee = updateData.additionalFee || 0;
      updateData.totalAmount = basePrice + shippingFee + additionalFee;
      
      console.log("[saveEdit] Sending data:", { orderId, updateData });
      
      const result = await updateOrder(orderId, updateData);
      
      console.log("[saveEdit] Result:", result);
      
      if (result.success) {
        // 성공 시 편집 모드 종료 및 상태 초기화
        setEditingId(null);
        setEditData({});
        
        // 페이지 새로고침
        window.location.reload();
      } else {
        // 실패 시 에러 메시지 표시
        const errorDetails = result.error?.details 
          ? `\n상세: ${JSON.stringify(result.error.details, null, 2)}`
          : "";
        alert(`❌ 저장 실패: ${result.error?.message || "알 수 없는 오류"}${errorDetails}`);
      }
    });
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("정말 이 주문을 삭제하시겠습니까?")) return;

    startTransition(async () => {
      try {
        const result = await deleteOrder(orderId);
        
        if (result.success) {
          setOrders(orders.filter((o) => o.id !== orderId));
          alert("주문이 삭제되었습니다.");
        } else {
          setErrorMessage(result.error?.message || "알 수 없는 오류");
          setErrorDialogOpen(true);
        }
      } catch (error) {
        console.error("Delete failed:", error);
        setErrorMessage(error instanceof Error ? error.message : "주문 삭제 중 오류가 발생했습니다.");
        setErrorDialogOpen(true);
      }
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedOrders.map(o => o.id)));
    }
  };

  // 개별 선택/해제
  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 다중 삭제
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`선택한 ${selectedIds.size}개의 주문을 삭제하시겠습니까?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const deletePromises = Array.from(selectedIds).map(id => deleteOrder(id));
        const results = await Promise.all(deletePromises);
        
        // 성공한 것만 필터링
        const successIds = Array.from(selectedIds).filter((id, idx) => results[idx].success);
        const failedCount = selectedIds.size - successIds.length;
        
        if (successIds.length > 0) {
          setOrders(orders.filter(o => !successIds.includes(o.id)));
        }
        
        setSelectedIds(new Set());
        
        if (failedCount === 0) {
          alert(`${successIds.length}개의 주문이 삭제되었습니다.`);
        } else {
          alert(`${successIds.length}개 삭제 성공, ${failedCount}개 실패`);
        }
      } catch (error) {
        console.error("Bulk delete failed:", error);
        alert("일부 주문 삭제에 실패했습니다.");
      }
    });
  };

  const handleViewAsInfo = async (asInfo: any) => {
    setLoadingAs(true);
    setAsDialogOpen(true);
    
    const result = await getAfterServiceById(asInfo.id);
    
    if (result.success && result.data) {
      setSelectedAsInfo(result.data);
    } else {
      setSelectedAsInfo(asInfo);
    }
    
    setLoadingAs(false);
  };

  const handleSyncDelivery = async (orderId: string) => {
    startTransition(async () => {
      const result = await updateOrderDeliveryStatus(orderId);
      
      if (result.success) {
        alert("✅ 배송 정보가 업데이트되었습니다");
        window.location.reload();
      } else {
        alert("❌ " + (result.error || "배송 정보 조회 실패"));
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: { variant: "secondary", label: "대기" },
      PROCESSING: { variant: "default", label: "처리중" },
      SHIPPED: { variant: "outline", label: "배송중" },
      DELIVERED: { variant: "outline", label: "배송완료" },
      CANCELLED: { variant: "destructive", label: "취소" },
    };
    const config = variants[status] || { variant: "default", label: status };
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 영역 */}
      <OrderSearchFilter
        searchName={searchName}
        setSearchName={setSearchName}
        searchPhone={searchPhone}
        setSearchPhone={setSearchPhone}
        orderSource={orderSource}
        setOrderSource={setOrderSource}
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

      {/* 테이블 */}
      <div className="rounded-md border">
        {/* 컬럼 설정 버튼 */}
        <div className="flex justify-end p-2 border-b bg-gray-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" />
                컬럼 설정
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>표시할 컬럼 선택</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_COLUMNS.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.has(column.id)}
                  onCheckedChange={() => toggleColumn(column.id)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className="flex gap-1 px-2 py-1">
                <Button variant="outline" size="sm" onClick={showAllColumns} className="flex-1 text-xs">
                  전체 표시
                </Button>
                <Button variant="outline" size="sm" onClick={resetColumns} className="flex-1 text-xs">
                  기본값
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
            <span className="text-sm font-medium">{selectedIds.size}개 선택됨</span>
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={paginatedOrders.length > 0 && selectedIds.size === paginatedOrders.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                {visibleColumns.has("orderDate") && <TableHead className="w-[100px]">날짜</TableHead>}
                {visibleColumns.has("recipientName") && <TableHead>고객명</TableHead>}
                {visibleColumns.has("recipientPhone") && <TableHead>전화번호</TableHead>}
                {visibleColumns.has("recipientMobile") && <TableHead>이동통신</TableHead>}
                {visibleColumns.has("recipientZipCode") && <TableHead>우편번호</TableHead>}
                {visibleColumns.has("recipientAddr") && <TableHead>주소</TableHead>}
                {visibleColumns.has("orderNumber") && <TableHead>주문번호</TableHead>}
                {visibleColumns.has("productInfo") && <TableHead>상품명 및 수량</TableHead>}
                {visibleColumns.has("deliveryMsg") && <TableHead>배송메시지</TableHead>}
                {visibleColumns.has("orderSource") && <TableHead>고객주문처명</TableHead>}
                {visibleColumns.has("basePrice") && <TableHead>단가</TableHead>}
                {visibleColumns.has("shippingFee") && <TableHead>배송비</TableHead>}
                {visibleColumns.has("courier") && <TableHead>택배사</TableHead>}
                {visibleColumns.has("trackingNumber") && <TableHead>운송장번호</TableHead>}
                {visibleColumns.has("giftSent") && <TableHead className="text-center">사은품발송</TableHead>}
                <TableHead className="text-center">AS요청</TableHead>
                <TableHead className="w-[120px] text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={16} className="h-24 text-center">
                  {filteredOrders.length === 0 && orders.length > 0 
                    ? "검색 결과가 없습니다." 
                    : "등록된 주문이 없습니다."
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => {
                const isEditing = editingId === order.id;
                return (
                  <TableRow key={order.id} className={isEditing ? "bg-blue-50" : ""}>
                    {/* 체크박스 */}
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(order.id)}
                        onCheckedChange={() => toggleSelectOne(order.id)}
                      />
                    </TableCell>
                    {/* 날짜 */}
                    {visibleColumns.has("orderDate") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editData.orderDate}
                          onChange={(e) =>
                            setEditData({ ...editData, orderDate: e.target.value })
                          }
                          className="w-[100px]"
                        />
                      ) : (
                        new Date(order.orderDate || order.createdAt).toLocaleDateString("ko-KR")
                      )}
                    </TableCell>
                    )}

                    {/* 수취인명 */}
                    {visibleColumns.has("recipientName") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.recipientName}
                          onChange={(e) =>
                            setEditData({ ...editData, recipientName: e.target.value })
                          }
                          className="w-[100px]"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setDetailDialogOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                        >
                          {order.recipientName || "-"}
                        </button>
                      )}
                    </TableCell>
                    )}

                    {/* 수취인 전화번호 */}
                    {visibleColumns.has("recipientPhone") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.recipientPhone}
                          onChange={(e) =>
                            setEditData({ ...editData, recipientPhone: e.target.value })
                          }
                          className="w-[120px]"
                        />
                      ) : (
                        order.recipientPhone || "-"
                      )}
                    </TableCell>
                    )}

                    {/* 수취인 이동통신 */}
                    {visibleColumns.has("recipientMobile") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.recipientMobile}
                          onChange={(e) =>
                            setEditData({ ...editData, recipientMobile: e.target.value })
                          }
                          className="w-[120px]"
                        />
                      ) : (
                        order.recipientMobile || "-"
                      )}
                    </TableCell>
                    )}

                    {/* 수취인 우편번호 */}
                    {visibleColumns.has("recipientZipCode") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.recipientZipCode}
                          onChange={(e) =>
                            setEditData({ ...editData, recipientZipCode: e.target.value })
                          }
                          className="w-[80px]"
                        />
                      ) : (
                        order.recipientZipCode || "-"
                      )}
                    </TableCell>
                    )}

                    {/* 수취인 주소 */}
                    {visibleColumns.has("recipientAddr") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.recipientAddr}
                          onChange={(e) =>
                            setEditData({ ...editData, recipientAddr: e.target.value })
                          }
                          className="w-[180px]"
                        />
                      ) : (
                        <div className="max-w-[180px] truncate" title={order.recipientAddr}>
                          {order.recipientAddr || "-"}
                        </div>
                      )}
                    </TableCell>
                    )}

                    {/* 주문번호 */}
                    {visibleColumns.has("orderNumber") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.orderNumber}
                          onChange={(e) =>
                            setEditData({ ...editData, orderNumber: e.target.value })
                          }
                          className="w-[120px]"
                        />
                      ) : (
                        order.orderNumber || "-"
                      )}
                    </TableCell>
                    )}

                    {/* 상품명 및 수량 */}
                    {visibleColumns.has("productInfo") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.productInfo}
                          onChange={(e) =>
                            setEditData({ ...editData, productInfo: e.target.value })
                          }
                          className="w-[150px]"
                        />
                      ) : (
                        <div className="max-w-[150px] truncate" title={order.productInfo}>
                          {order.productInfo || "-"}
                        </div>
                      )}
                    </TableCell>
                    )}

                    {/* 배송메시지 */}
                    {visibleColumns.has("deliveryMsg") && (
                    <TableCell>
                      {isEditing ? (
                        <Textarea
                          value={editData.deliveryMsg}
                          onChange={(e) =>
                            setEditData({ ...editData, deliveryMsg: e.target.value })
                          }
                          className="w-[150px]"
                          rows={2}
                        />
                      ) : (
                        <div className="max-w-[150px] truncate" title={order.deliveryMsg}>
                          {order.deliveryMsg || "-"}
                        </div>
                      )}
                    </TableCell>
                    )}

                    {/* 고객주문처명 */}
                    {visibleColumns.has("orderSource") && (
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={editData.orderSource}
                          onValueChange={(value) =>
                            setEditData({ ...editData, orderSource: value })
                          }
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="자사몰">자사몰</SelectItem>
                            <SelectItem value="스몰닷">스몰닷</SelectItem>
                            <SelectItem value="쇼핑몰">쇼핑몰</SelectItem>
                            <SelectItem value="그로트">그로트</SelectItem>
                            <SelectItem value="해피포즈">해피포즈</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        order.orderSource || "-"
                      )}
                    </TableCell>
                    )}

                    {/* 단가 */}
                    {visibleColumns.has("basePrice") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editData.basePrice}
                          onChange={(e) =>
                            setEditData({ ...editData, basePrice: e.target.value })
                          }
                          className="w-[100px]"
                        />
                      ) : (
                        (() => {
                          const price = (Number(order.basePrice) || 0);
                          return price > 0 ? price.toLocaleString() : "-";
                        })()
                      )}
                    </TableCell>
                    )}

                    {/* 배송비 */}
                    {visibleColumns.has("shippingFee") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editData.shippingFee}
                          onChange={(e) =>
                            setEditData({ ...editData, shippingFee: e.target.value })
                          }
                          className="w-[100px]"
                        />
                      ) : (
                        order.shippingFee ? Number(order.shippingFee).toLocaleString() : "-"
                      )}
                    </TableCell>
                    )}

                    {/* 택배사 */}
                    {visibleColumns.has("courier") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.courier}
                          onChange={(e) =>
                            setEditData({ ...editData, courier: e.target.value })
                          }
                          className="w-[100px]"
                        />
                      ) : (
                        order.courier || "-"
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
                          className="w-[120px]"
                        />
                      ) : (
                        order.trackingNumber || "-"
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

                    {/* 작업 */}
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(order.id)}
                            disabled={isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            disabled={isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          {order.courier && order.trackingNumber && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSyncDelivery(order.id)}
                              disabled={isPending}
                              title="배송정보 연동"
                            >
                              <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedOrderForEdit(order);
                              setEditDialogMode("edit");
                              setEditDialogOpen(true);
                            }}
                            title="수정"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(order.id)}
                            disabled={isPending}
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-500">
            {startIndex + 1} - {Math.min(endIndex, filteredOrders.length)} / 총 {filteredOrders.length}건
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              처음
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              이전
            </Button>
            
            {/* 페이지 번호들 */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="min-w-[40px]"
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              다음
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              마지막
            </Button>
          </div>
        </div>
      )}
    </div>

      {/* AS 요청 다이얼로그 */}
      <ASRequestDialog
        open={asDialogOpen}
        onOpenChange={setAsDialogOpen}
        order={asSelectedOrder}
      />

      {/* AS 접수 정보 다이얼로그 */}
      <Dialog open={asDialogOpen && selectedAsInfo} onOpenChange={setAsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              AS 접수 상세 정보
            </DialogTitle>
            <DialogDescription>
              고객 A/S 접수 및 처리 내역을 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {loadingAs ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : selectedAsInfo ? (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">접수번호</label>
                  <p className="text-base font-semibold">{selectedAsInfo.ticketNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">접수일시</label>
                  <p className="text-base flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedAsInfo.serviceDate).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">고객명</label>
                  <p className="text-base font-semibold">{selectedAsInfo.customerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">연락처</label>
                  <p className="text-base">{selectedAsInfo.customerPhone}</p>
                </div>
              </div>

              {/* 상태 */}
              <div>
                <label className="text-sm font-medium text-gray-500">처리 상태</label>
                <div className="mt-1">
                  <Badge className={
                    selectedAsInfo.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    selectedAsInfo.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    selectedAsInfo.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {selectedAsInfo.status === "RECEIVED" && "접수"}
                    {selectedAsInfo.status === "DIAGNOSED" && "진단 중"}
                    {selectedAsInfo.status === "PARTS_ORDERED" && "부품 발주"}
                    {selectedAsInfo.status === "SCHEDULED" && "방문 예정"}
                    {selectedAsInfo.status === "IN_PROGRESS" && "처리 중"}
                    {selectedAsInfo.status === "COMPLETED" && "완료"}
                    {selectedAsInfo.status === "CANCELLED" && "취소"}
                  </Badge>
                  <Badge variant="outline" className="ml-2">
                    {selectedAsInfo.priority === "URGENT" && "긴급"}
                    {selectedAsInfo.priority === "HIGH" && "높음"}
                    {selectedAsInfo.priority === "NORMAL" && "보통"}
                    {selectedAsInfo.priority === "LOW" && "낮음"}
                  </Badge>
                </div>
              </div>

              {/* 제품 정보 */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  제품 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">제품명</label>
                    <p className="text-base">{selectedAsInfo.productName || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">모델명</label>
                    <p className="text-base">{selectedAsInfo.modelNumber || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">시리얼번호</label>
                    <p className="text-base font-mono text-sm">{selectedAsInfo.serialNumber || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">보증 상태</label>
                    <p className="text-base">
                      {selectedAsInfo.warrantyStatus === 'IN_WARRANTY' ? '보증기간 내' : '보증기간 외'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 증상 및 문제 */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  증상 및 문제
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">문제 유형</label>
                    <p className="text-base">
                      {selectedAsInfo.issueType === 'NOISE' && '소음'}
                      {selectedAsInfo.issueType === 'FILTER' && '필터 교체'}
                      {selectedAsInfo.issueType === 'POWER' && '전원 문제'}
                      {selectedAsInfo.issueType === 'SENSOR' && '센서 오류'}
                      {selectedAsInfo.issueType === 'PERFORMANCE' && '성능 저하'}
                      {selectedAsInfo.issueType === 'ODOR' && '냄새'}
                      {selectedAsInfo.issueType === 'OTHER' && '기타'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">증상 설명</label>
                    <p className="text-base bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                      {selectedAsInfo.issueDescription || selectedAsInfo.issueTitle || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 처리 내역 */}
              {(selectedAsInfo.repairContent || selectedAsInfo.repairDetails) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">수리 내역</h4>
                  <p className="text-base bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                    {selectedAsInfo.repairContent || selectedAsInfo.repairDetails}
                  </p>
                </div>
              )}

              {/* 배송 정보 */}
              {(selectedAsInfo.courier || selectedAsInfo.trackingNumber) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    배송 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">택배사</label>
                      <p className="text-base">{selectedAsInfo.courier || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">운송장번호</label>
                      <p className="text-base font-mono text-sm">{selectedAsInfo.trackingNumber || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 비용 정보 */}
              {(selectedAsInfo.totalCost > 0 || selectedAsInfo.laborCost > 0 || selectedAsInfo.partsCost > 0) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">비용 정보</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">인건비</label>
                      <p className="text-base font-semibold">
                        {selectedAsInfo.laborCost?.toLocaleString()}원
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">부품비</label>
                      <p className="text-base font-semibold">
                        {selectedAsInfo.partsCost?.toLocaleString()}원
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">총 비용</label>
                      <p className="text-lg font-bold text-blue-600">
                        {selectedAsInfo.totalCost?.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 담당자 정보 */}
              {selectedAsInfo.assignedTo && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">담당자</h4>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {selectedAsInfo.assignedTo.name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{selectedAsInfo.assignedTo.name}</p>
                      <p className="text-sm text-gray-500">{selectedAsInfo.assignedTo.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              AS 정보를 불러올 수 없습니다.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 주문 상세 정보 다이얼로그 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-600">주문 상세 정보</DialogTitle>
            <DialogDescription>
              주문번호: {selectedOrder?.orderNumber || "-"}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* 고객 정보 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  고객 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">고객명</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.recipientName || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">전화번호</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.recipientPhone || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">휴대전화</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.recipientMobile || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">우편번호</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.recipientZipCode || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">주소</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.recipientAddr || "-"}</p>
                  </div>
                </div>
              </div>

              {/* 주문 정보 */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  주문 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">주문일</label>
                    <p className="text-base font-semibold text-gray-800">
                      {selectedOrder.orderDate 
                        ? new Date(selectedOrder.orderDate).toLocaleDateString("ko-KR") 
                        : new Date(selectedOrder.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">주문처</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.orderSource || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">배송 메시지</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.deliveryMsg || "-"}</p>
                  </div>
                </div>
              </div>

              {/* 상품 정보 */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-600" />
                  상품 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">상품명 및 수량</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.productInfo || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">단가</label>
                    <p className="text-base font-semibold text-gray-800">
                      {selectedOrder.basePrice ? `${selectedOrder.basePrice.toLocaleString()}원` : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">배송비</label>
                    <p className="text-base font-semibold text-gray-800">
                      {selectedOrder.shippingFee ? `${selectedOrder.shippingFee.toLocaleString()}원` : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">총 금액</label>
                    <p className="text-lg font-bold text-emerald-600">
                      {selectedOrder.totalAmount ? `${selectedOrder.totalAmount.toLocaleString()}원` : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 배송 정보 */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-600" />
                  배송 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">택배사</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.courier || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">운송장번호</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.trackingNumber || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">배송 상태</label>
                    <div className="mt-1">
                      <DeliveryStatusProgress status={selectedOrder.deliveryStatus} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">사은품 발송</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.giftSent || "-"}</p>
                  </div>
                </div>
              </div>

              {/* 기타 정보 */}
              {(selectedOrder.memo || selectedOrder.internalNotes) && (
                <div className="bg-gradient-to-br from-gray-50 to-slate-100 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-3 text-gray-800">기타 정보</h4>
                  {selectedOrder.memo && (
                    <div className="mb-3">
                      <label className="text-sm font-medium text-gray-600">메모</label>
                      <p className="text-base text-gray-800">{selectedOrder.memo}</p>
                    </div>
                  )}
                  {selectedOrder.internalNotes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">내부 메모</label>
                      <p className="text-base text-gray-800">{selectedOrder.internalNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 주문 수정 다이얼로그 */}
      <EditOrderDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        order={selectedOrderForEdit}
        mode={editDialogMode}
      />

      {/* 오류 메시지 다이얼로그 */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>오류 발생</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60 text-sm whitespace-pre-wrap break-words">
              {errorMessage}
            </pre>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(errorMessage);
                  alert("오류 메시지가 복사되었습니다.");
                }}
              >
                복사
              </Button>
              <Button onClick={() => setErrorDialogOpen(false)}>
                닫기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
