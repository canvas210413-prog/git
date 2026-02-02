"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Truck, 
  Package, 
  MapPin, 
  Phone,
  Search,
  RefreshCcw,
  ExternalLink,
  Link2,
  Unlink2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  Pencil,
  Save,
  X,
  Settings2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { updateOrder, deleteAllOrders } from "@/app/actions/orders";
import { Trash2 } from "lucide-react";
import { OrderSearchFilter } from "@/components/orders/order-search-filter";
import { EditOrderDialog } from "@/components/orders/edit-order-dialog";

// 컬럼 정의
const ALL_COLUMNS = [
  { id: "orderDate", label: "날짜", width: "w-[100px]", default: true },
  { id: "recipientName", label: "고객명", width: "w-[100px]", default: true },
  { id: "recipientPhone", label: "전화번호", width: "w-[120px]", default: true },
  { id: "recipientMobile", label: "이동통신", width: "w-[120px]", default: true },
  { id: "recipientZipCode", label: "우편번호", width: "w-[100px]", default: true },
  { id: "recipientAddr", label: "주소", width: "w-[200px]", default: true },
  { id: "orderNumber", label: "주문번호", width: "w-[120px]", default: true },
  { id: "productInfo", label: "상품명 및 수량", width: "w-[150px]", default: true },
  { id: "deliveryMsg", label: "배송메시지", width: "w-[150px]", default: true },
  { id: "orderSource", label: "고객주문처명", width: "w-[100px]", default: true },
  { id: "basePrice", label: "단가", width: "w-[100px]", default: true },
  { id: "giftSent", label: "사은품발송", width: "w-[100px]", default: true },
  { id: "shippingFee", label: "배송비", width: "w-[100px]", default: true },
  { id: "courier", label: "택배사", width: "w-[100px]", default: true },
  { id: "trackingNumber", label: "운송장번호", width: "w-[120px]", default: true },
] as const;

type ColumnId = typeof ALL_COLUMNS[number]["id"];

interface Order {
  id: string;
  orderNumber: string | null;
  orderDate: string;
  status: string;
  totalAmount: number;
  basePrice?: number | null;
  shippingFee?: number | null;
  giftSent?: boolean | null;
  orderSource: string | null;
  productInfo: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientMobile: string | null;
  recipientZipCode: string | null;
  recipientAddr: string | null;
  deliveryMsg: string | null;
  courier: string | null;
  trackingNumber: string | null;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

// 스마트택배 API 키
const SWEET_TRACKER_API_KEY = "VK03WcRZ14cLtIqLux105w";

// 스마트택배 택배사 코드 목록 (주요 택배사)
const sweetTrackerCouriers = [
  { code: "01", name: "우체국택배" },
  { code: "04", name: "CJ대한통운" },
  { code: "05", name: "한진택배" },
  { code: "06", name: "로젠택배" },
  { code: "08", name: "롯데택배" },
  { code: "11", name: "일양로지스" },
  { code: "17", name: "천일택배" },
  { code: "22", name: "대신택배" },
  { code: "23", name: "경동택배" },
  { code: "24", name: "GS Postbox 택배" },
  { code: "46", name: "CU편의점택배" },
  { code: "53", name: "농협택배" },
  { code: "54", name: "홈픽택배" },
];

// 택배사 목록 (기존 - 직접 링크용)
const courierList = [
  { code: "CJ", name: "CJ대한통운", trackingUrl: "https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=", sweetCode: "04" },
  { code: "HANJIN", name: "한진택배", trackingUrl: "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mession-open&wblnum=", sweetCode: "05" },
  { code: "LOTTE", name: "롯데택배", trackingUrl: "https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=", sweetCode: "08" },
  { code: "LOGEN", name: "로젠택배", trackingUrl: "https://www.ilogen.com/web/personal/trace/", sweetCode: "06" },
  { code: "POST", name: "우체국택배", trackingUrl: "https://service.epost.go.kr/trace.RetrieveDomRi498.comm?displayHeader=N&sid1=", sweetCode: "01" },
  { code: "GSP", name: "GS편의점택배", trackingUrl: "https://www.cvsnet.co.kr/invoice/tracking.do?invoice_no=", sweetCode: "24" },
  { code: "KDEXP", name: "경동택배", trackingUrl: "https://kdexp.com/basicNew498.kd?barcode=", sweetCode: "23" },
  { code: "DAESIN", name: "대신택배", trackingUrl: "https://www.ds3211.co.kr/freight/internalFreightSearch.ht?billno=", sweetCode: "22" },
];

export default function DeliveryIntegrationPage() {
  const { data: session } = useSession();
  
  // 현재 사용자의 협력사 정보 (null이면 본사 - 전체 접근)
  const userPartner = (session?.user as { assignedPartner?: string | null })?.assignedPartner || null;
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCourier, setEditCourier] = useState("");
  const [editTrackingNumber, setEditTrackingNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  
  // 컬럼 표시 상태 (로컬스토리지에서 복원 또는 기본값 사용)
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`delivery-columns-${userPartner || "headquarters"}`);
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
        `delivery-columns-${userPartner || "headquarters"}`,
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
  
  // 검색 필터 상태 추가
  const [orderSource, setOrderSource] = useState("all");
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 주문상태 불러오기 관련 state
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]); // 미등록 주문 목록
  const [loadingPending, setLoadingPending] = useState(false);
  
  // 체크박스 선택 상태
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  
  // 팝업 다이얼로그 상태
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view");
  const [selectedDialogOrder, setSelectedDialogOrder] = useState<Order | null>(null);
  
  // 스마트택배 배송조회 관련 상태
  const [trackingCourier, setTrackingCourier] = useState("04"); // 기본 CJ대한통운
  const [trackingInvoice, setTrackingInvoice] = useState("");
  const [showTrackingResult, setShowTrackingResult] = useState(false);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);

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

  // 스마트택배 조회 폼 제출
  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCourier || !trackingInvoice) {
      alert("택배사와 운송장 번호를 모두 입력해주세요.");
      return;
    }
    setShowTrackingResult(true);
    setTrackingDialogOpen(true);
  };

  // 주문 데이터 가져오기 (배송정보 미등록 주문)
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 배송정보 미등록 주문 가져오기
      const response = await fetch("/api/orders?filter=pending-delivery");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        setFilteredOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // 배송정보 미등록 주문 가져오기 (주문상태 불러오기 버튼 클릭 시)
  const fetchPendingOrders = async () => {
    setLoadingPending(true);
    try {
      const response = await fetch("/api/orders?filter=pending-delivery");
      if (response.ok) {
        const data = await response.json();
        setPendingOrders(data);
        
        // 미등록 주문을 메인 테이블에 합치기 (중복 제거)
        const existingIds = new Set(orders.map(o => o.id));
        const newOrders = data.filter((order: Order) => !existingIds.has(order.id));
        const mergedOrders = [...orders, ...newOrders];
        setOrders(mergedOrders);
        setFilteredOrders(mergedOrders);
        
        alert(`✅ ${data.length}건의 미등록 주문을 불러왔습니다.`);
      }
    } catch (error) {
      console.error("Failed to fetch pending orders:", error);
      alert("❌ 미등록 주문을 불러오는데 실패했습니다.");
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 필터링 로직 업데이트
  useEffect(() => {
    let result = orders;

    // 고객주문처명 필터
    if (orderSource !== "all") {
      result = result.filter((order) => order.orderSource === orderSource);
    }

    // 고객명 검색
    if (searchName.trim()) {
      const name = searchName.toLowerCase().trim();
      result = result.filter((order) => 
        order.recipientName?.toLowerCase().includes(name)
      );
    }

    // 전화번호 검색
    if (searchPhone.trim()) {
      result = result.filter((order) => 
        order.recipientPhone?.includes(searchPhone.trim()) || 
        order.recipientMobile?.includes(searchPhone.trim())
      );
    }

    // 날짜 필터
    if (dateRange !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      result = result.filter((order) => {
        const orderDate = new Date(order.orderDate);
        
        if (dateRange === "1day") {
          const orderDay = new Date(orderDate);
          orderDay.setHours(0, 0, 0, 0);
          return orderDay.getTime() === today.getTime();
        } else if (dateRange === "1week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo;
        } else if (dateRange === "1month") {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        } else if (dateRange === "1year") {
          const yearAgo = new Date(today);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          return orderDate >= yearAgo;
        } else if (dateRange === "custom" && startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return orderDate >= start && orderDate <= end;
        }
        
        return true;
      });
    }

    // 기존 검색어 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          order.orderNumber?.toLowerCase().includes(term) ||
          order.recipientName?.toLowerCase().includes(term) ||
          order.trackingNumber?.toLowerCase().includes(term) ||
          order.courier?.toLowerCase().includes(term)
      );
    }

    // 배송 상태 필터
    if (deliveryFilter === "linked") {
      result = result.filter((order) => order.courier && order.trackingNumber);
    } else if (deliveryFilter === "unlinked") {
      result = result.filter((order) => !order.courier || !order.trackingNumber);
    } else if (deliveryFilter === "shipped") {
      result = result.filter((order) => order.status === "SHIPPED");
    }

    setFilteredOrders(result);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  }, [searchName, searchPhone, orderSource, dateRange, startDate, endDate, searchTerm, deliveryFilter, orders]);

  // 배송 연동 통계
  const stats = {
    total: orders.length,
    linked: orders.filter((o) => o.courier && o.trackingNumber).length,
    unlinked: orders.filter((o) => !o.courier || !o.trackingNumber).length,
    shipped: orders.filter((o) => o.status === "SHIPPED").length,
  };

  const handleEditDelivery = (order: Order) => {
    setSelectedOrder(order);
    setEditCourier(order.courier || "");
    setEditTrackingNumber(order.trackingNumber || "");
    setDialogOpen(true);
  };

  const startEdit = (order: Order) => {
    setEditingId(order.id);
    setEditData({
      courier: order.courier || "",
      trackingNumber: order.trackingNumber || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveInlineEdit = async (orderId: string) => {
    setSaving(true);
    try {
      const result = await updateOrder(orderId, {
        courier: editData.courier,
        trackingNumber: editData.trackingNumber,
        status: editData.courier && editData.trackingNumber ? "SHIPPED" : undefined,
      });

      if (result.success) {
        // 저장 후 전체 목록 새로고침 (배송정보 등록된 주문만)
        const response = await fetch("/api/orders?filter=with-tracking");
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
          setFilteredOrders(data);
        }
        setEditingId(null);
        setEditData({});
        alert("✅ 배송정보가 등록되었습니다.");
      } else {
        alert(`❌ 저장 실패: ${result.error?.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Failed to update delivery info:", error);
      alert(`❌ 저장 중 오류 발생: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("정말 이 주문을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchOrders();
      } else {
        alert("❌ 삭제 실패");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert(`❌ 삭제 중 오류 발생: ${error}`);
    }
  };

  // 다중 삭제
  const handleBulkDelete = async () => {
    if (selectedOrderIds.size === 0) return;
    
    if (!confirm(`선택한 ${selectedOrderIds.size}개의 주문을 삭제하시겠습니까?`)) {
      return;
    }

    setDeleting(true);
    try {
      const deletePromises = Array.from(selectedOrderIds).map(id =>
        fetch(`/api/orders/${id}`, { method: "DELETE" })
      );
      
      const responses = await Promise.all(deletePromises);
      const successCount = responses.filter(r => r.ok).length;
      
      if (successCount === selectedOrderIds.size) {
        alert(`${successCount}개의 주문이 삭제되었습니다.`);
      } else {
        alert(`${successCount}/${selectedOrderIds.size}개의 주문이 삭제되었습니다.`);
      }
      
      setSelectedOrderIds(new Set());
      await fetchOrders();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert("일부 주문 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveDelivery = async () => {
    if (!selectedOrder) return;
    
    setSaving(true);
    try {
      const result = await updateOrder(selectedOrder.id, {
        courier: editCourier || undefined,
        trackingNumber: editTrackingNumber || undefined,
        status: editCourier && editTrackingNumber ? "SHIPPED" : selectedOrder.status,
      });

      if (result.success) {
        await fetchOrders();
        setDialogOpen(false);
      } else {
        alert(`❌ 저장 실패: ${result.error?.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Failed to update delivery info:", error);
      alert(`❌ 저장 중 오류 발생: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  // Excel 배송정보 Import (DB에 바로 저장)
  const handleDeliveryImport = async (data: any[]) => {
    try {
      console.log(`📦 ${data.length}건의 배송정보를 처리합니다...`);

      const results = [];
      const errors: { row: number; identifier: string; error: string }[] = [];
      const updatedOrders = [...orders];
      
      // 협력사별 성공 건수 추적 (orderSource 기반)
      const partnerUpdates: Map<string, { orderSource: string; count: number; orders: string[] }> = new Map();

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 1;

        try {
          const orderNumber = String(row.주문번호 || "").trim();
          const recipientName = String(row.고객명 || "").trim();
          const recipientPhone = String(row.전화번호 || "").trim();
          const recipientMobile = String(row.이동통신 || "").trim();
          const courier = String(row.택배사 || "").trim();
          const trackingNumber = String(row.운송장번호 || "").trim();

          if (!courier || !trackingNumber) {
            errors.push({
              row: rowNumber,
              identifier: orderNumber || recipientName || `행 ${rowNumber}`,
              error: "택배사 또는 운송장번호가 없습니다",
            });
            continue;
          }

          // 주문 찾기 (우선순위: 주문번호 > 고객명+전화번호 > 고객명+이동통신)
          let orderIndex = -1;
          
          // 1. 주문번호로 매칭
          if (orderNumber) {
            orderIndex = updatedOrders.findIndex((o) => o.orderNumber === orderNumber);
          }
          
          // 2. 주문번호 매칭 실패 시 고객명 + 전화번호로 매칭
          if (orderIndex === -1 && recipientName && recipientPhone) {
            orderIndex = updatedOrders.findIndex(
              (o) => o.recipientName === recipientName && o.recipientPhone === recipientPhone
            );
          }
          
          // 3. 그래도 실패 시 고객명 + 이동통신으로 매칭
          if (orderIndex === -1 && recipientName && recipientMobile) {
            orderIndex = updatedOrders.findIndex(
              (o) => o.recipientName === recipientName && o.recipientMobile === recipientMobile
            );
          }

          if (orderIndex === -1) {
            errors.push({
              row: rowNumber,
              identifier: orderNumber || recipientName || `행 ${rowNumber}`,
              error: `매칭되는 주문을 찾을 수 없습니다 (주문번호: ${orderNumber || "없음"}, 고객명: ${recipientName || "없음"})`,
            });
            continue;
          }

          const order = updatedOrders[orderIndex];

          // DB에 바로 저장 (skipNotification: true로 개별 알림 방지)
          const result = await updateOrder(order.id, {
            courier,
            trackingNumber,
            status: "SHIPPED",
            skipNotification: true, // 개별 알림 건너뛰기
          });

          if (result.success) {
            // 로컬 상태도 업데이트
            updatedOrders[orderIndex] = {
              ...updatedOrders[orderIndex],
              courier,
              trackingNumber,
              status: "SHIPPED",
            };
            results.push({ row: rowNumber, identifier: orderNumber || recipientName || order.id });
            
            // 협력사별 업데이트 추적 (orderSource 기반)
            if (order.orderSource) {
              const partnerKey = order.orderSource;
              const existing = partnerUpdates.get(partnerKey);
              if (existing) {
                existing.count++;
                existing.orders.push(orderNumber || order.id);
              } else {
                partnerUpdates.set(partnerKey, {
                  orderSource: order.orderSource,
                  count: 1,
                  orders: [orderNumber || order.id],
                });
              }
            }
          } else {
            errors.push({
              row: rowNumber,
              identifier: orderNumber || recipientName || order.id,
              error: result.error?.message || "DB 저장 실패",
            });
          }
        } catch (error: any) {
          errors.push({
            row: rowNumber,
            identifier: row.주문번호 || row.고객명 || `행 ${rowNumber}`,
            error: error.message || String(error),
          });
        }
      }

      const successCount = results.length;
      const failCount = errors.length;

      // 협력사별로 통합 알림 전송 (Server Action 사용)
      if (partnerUpdates.size > 0) {
        try {
          console.log(`📧 [배송정보 업로드] 협력사별 통합 알림 전송 시작...`);
          const { notifyPartnerDeliveryUpdates } = await import("@/app/actions/notifications");
          
          const result = await notifyPartnerDeliveryUpdates(partnerUpdates);
          
          if (result.success) {
            console.log(`✅ [배송정보 업로드] ${partnerUpdates.size}개 협력사 알림 전송 완료`);
          } else {
            console.error(`❌ [배송정보 업로드] 협력사 알림 전송 실패:`, result.error);
          }
        } catch (notifyError) {
          console.error("❌ 협력사 알림 전송 실패:", notifyError);
          // 알림 실패는 전체 프로세스에 영향을 주지 않음
        }
      }

      let message = `✅ 성공: ${successCount}건 (DB에 저장 완료)\n`;
      if (failCount > 0) {
        message += `❌ 실패: ${failCount}건\n\n`;
        message += "실패 상세:\n";
        errors.slice(0, 10).forEach((err) => {
          message += `- 행 ${err.row} (${err.identifier}): ${err.error}\n`;
        });
        if (errors.length > 10) {
          message += `\n... 외 ${errors.length - 10}건`;
        }
      }

      alert(message);

      if (successCount > 0) {
        setOrders(updatedOrders);
        setFilteredOrders(updatedOrders);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert(`❌ 가져오기 실패: ${error}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length === 0) {
          alert("❌ 엑셀 파일에 데이터가 없습니다.");
          return;
        }

        handleDeliveryImport(jsonData);
      } catch (error) {
        console.error("Excel parse error:", error);
        alert(`❌ 엑셀 파일 읽기 실패: ${error}`);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // 배송정보 Excel Export (일괄내역받기 - 모든 항목)
  const handleExportDelivery = () => {
    const wb = XLSX.utils.book_new();

    const data = orders.map((order) => ({
      고객명: order.recipientName || "",
      전화번호: order.recipientPhone || "",
      이동통신: order.recipientMobile || "",
      우편번호: order.recipientZipCode || "",
      주소: order.recipientAddr || "",
      주문번호: order.orderNumber || "",
      상품명및수량: order.productInfo || "",
      배송메시지: order.deliveryMsg || "",
      고객주문처명: order.orderSource || "",
      단가: order.basePrice ? order.basePrice.toLocaleString() : "0",
      배송비: order.shippingFee ? order.shippingFee.toLocaleString() : "0",
      택배사: order.courier || "",
      운송장번호: order.trackingNumber || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 12 }, // 고객명
      { wch: 15 }, // 전화번호
      { wch: 15 }, // 이동통신
      { wch: 12 }, // 우편번호
      { wch: 30 }, // 주소
      { wch: 18 }, // 주문번호
      { wch: 25 }, // 상품명및수량
      { wch: 20 }, // 배송메시지
      { wch: 15 }, // 고객주문처명
      { wch: 12 }, // 단가
      { wch: 10 }, // 배송비
      { wch: 15 }, // 택배사
      { wch: 18 }, // 운송장번호
    ];

    XLSX.utils.book_append_sheet(wb, ws, "배송정보");
    XLSX.writeFile(wb, `배송정보목록_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // 선택된 항목만 다운로드
  const handleExportSelectedDelivery = () => {
    const selectedOrders = orders.filter(order => selectedOrderIds.has(order.id));
    
    if (selectedOrders.length === 0) {
      alert("다운로드할 항목을 선택해주세요.");
      return;
    }

    const wb = XLSX.utils.book_new();

    const data = selectedOrders.map((order) => ({
      고객명: order.recipientName || "",
      전화번호: order.recipientPhone || "",
      이동통신: order.recipientMobile || "",
      우편번호: order.recipientZipCode || "",
      주소: order.recipientAddr || "",
      주문번호: order.orderNumber || "",
      상품명및수량: order.productInfo || "",
      배송메시지: order.deliveryMsg || "",
      고객주문처명: order.orderSource || "",
      단가: order.basePrice ? order.basePrice.toLocaleString() : "0",
      배송비: order.shippingFee ? order.shippingFee.toLocaleString() : "0",
      택배사: order.courier || "",
      운송장번호: order.trackingNumber || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 12 }, // 고객명
      { wch: 15 }, // 전화번호
      { wch: 15 }, // 이동통신
      { wch: 12 }, // 우편번호
      { wch: 30 }, // 주소
      { wch: 18 }, // 주문번호
      { wch: 25 }, // 상품명및수량
      { wch: 20 }, // 배송메시지
      { wch: 15 }, // 고객주문처명
      { wch: 12 }, // 단가
      { wch: 10 }, // 배송비
      { wch: 15 }, // 택배사
      { wch: 18 }, // 운송장번호
    ];

    XLSX.utils.book_append_sheet(wb, ws, "배송정보");
    XLSX.writeFile(wb, `배송정보_선택항목_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // 샘플 다운로드
  const handleDownloadSample = () => {
    const sampleData = [
      {
        주문번호: "ORD-2024-001",
        고객명: "홍길동",
        택배사: "CJ",
        운송장번호: "123456789012",
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws["!cols"] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "배송정보_샘플");
    XLSX.writeFile(wb, "배송정보_샘플.xlsx");
  };

  // 최종 등록: 모든 배송정보를 DB에 업데이트
  const handleFinalSubmit = async () => {
    const ordersWithTracking = orders.filter(o => o.courier && o.trackingNumber);
    
    if (ordersWithTracking.length === 0) {
      alert("⚠️ 등록할 배송정보가 없습니다. 택배사와 운송장번호를 입력해주세요.");
      return;
    }

    if (!confirm(`${ordersWithTracking.length}건의 배송정보를 최종 등록하시겠습니까?`)) {
      return;
    }

    setSaving(true);
    try {
      const results = [];
      const errors: { orderNumber: string; error: string }[] = [];

      for (const order of ordersWithTracking) {
        try {
          const result = await updateOrder(order.id, {
            courier: order.courier || undefined,
            trackingNumber: order.trackingNumber || undefined,
            status: "SHIPPED",
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

      let message = `✅ 성공: ${successCount}건이 DB에 등록되었습니다.\n`;
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

      // 성공한 주문들은 목록에서 제거
      if (successCount > 0) {
        await fetchOrders();
      }
    } catch (error) {
      console.error("Final submit error:", error);
      alert(`❌ 최종 등록 실패: ${error}`);
    } finally {
      setSaving(false);
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

  const getTrackingUrl = (courier: string | null, trackingNumber: string | null) => {
    if (!courier || !trackingNumber) return null;
    const courierInfo = courierList.find(c => c.code === courier || c.name === courier);
    if (courierInfo) {
      return courierInfo.trackingUrl + trackingNumber;
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
  };

  // 검색 초기화 함수
  const handleResetSearch = () => {
    setSearchName("");
    setSearchPhone("");
    setOrderSource("전체");
    setDateRange("all");
    setStartDate("");
    setEndDate("");
    setItemsPerPage(10);
    setCurrentPage(1);
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">배송 정보 연동</h2>
          <p className="text-muted-foreground">
            1) 내려받기로 엑셀 다운 → 2) 택배사/운송장번호 입력 → 3) 배송정보 등록으로 업로드 → 4) 최종 등록으로 완료
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default">
                <Download className="mr-2 h-4 w-4" />
                1. 내려받기
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>엑셀 다운로드</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportDelivery} disabled={orders.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                전체 다운로드 ({orders.length}건)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportSelectedDelivery} disabled={selectedOrderIds.size === 0}>
                <Download className="mr-2 h-4 w-4" />
                선택 다운로드 ({selectedOrderIds.size}건)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild variant="default" size="default">
            <label className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              2. 배송정보 등록
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </Button>
          <Button 
            onClick={handleFinalSubmit} 
            variant="default" 
            size="default"
            disabled={saving || orders.filter(o => o.courier && o.trackingNumber).length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            3. 최종 등록
          </Button>
          <Button onClick={fetchOrders} disabled={loading} variant="outline" size="default">
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
          <Button
            onClick={handleDeleteAll}
            variant="destructive"
            size="default"
            disabled={deleting || orders.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? "삭제중..." : "전체 삭제"}
          </Button>
        </div>
      </div>

      {/* 🚚 스마트택배 배송 조회 카드 */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Truck className="h-5 w-5" />
            스마트택배 실시간 배송 조회
          </CardTitle>
          <CardDescription>
            운송장 번호를 입력하면 실시간 배송 상태를 조회할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTrackingSubmit} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="trackingCourier" className="text-sm font-medium mb-2 block">택배사</Label>
              <Select value={trackingCourier} onValueChange={setTrackingCourier}>
                <SelectTrigger id="trackingCourier">
                  <SelectValue placeholder="택배사 선택" />
                </SelectTrigger>
                <SelectContent>
                  {sweetTrackerCouriers.map((courier) => (
                    <SelectItem key={courier.code} value={courier.code}>
                      {courier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-[2] min-w-[300px]">
              <Label htmlFor="trackingInvoice" className="text-sm font-medium mb-2 block">운송장 번호</Label>
              <Input
                id="trackingInvoice"
                type="text"
                placeholder="운송장 번호 입력 (숫자만)"
                value={trackingInvoice}
                onChange={(e) => setTrackingInvoice(e.target.value.replace(/[^0-9]/g, ""))}
                className="font-mono"
              />
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Search className="mr-2 h-4 w-4" />
              배송 조회
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 스마트택배 배송 조회 결과 다이얼로그 */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-500" />
              배송 조회 결과
            </DialogTitle>
            <DialogDescription>
              {sweetTrackerCouriers.find(c => c.code === trackingCourier)?.name} - 운송장 번호: {trackingInvoice}
            </DialogDescription>
          </DialogHeader>
          {showTrackingResult && (
            <iframe
              src={`https://info.sweettracker.co.kr/tracking/5?t_key=${SWEET_TRACKER_API_KEY}&t_code=${trackingCourier}&t_invoice=${trackingInvoice}`}
              className="w-full h-[600px] border rounded-lg"
              title="배송 조회 결과"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingDialogOpen(false)}>
              닫기
            </Button>
            <Button
              onClick={() => {
                window.open(
                  `https://info.sweettracker.co.kr/tracking/5?t_key=${SWEET_TRACKER_API_KEY}&t_code=${trackingCourier}&t_invoice=${trackingInvoice}`,
                  "_blank"
                );
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              새 창에서 열기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 배송 연동 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDeliveryFilter("all")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 주문</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDeliveryFilter("linked")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">연동 완료</CardTitle>
            <Link2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.linked}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.linked / stats.total) * 100).toFixed(1) : 0}% 연동률
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDeliveryFilter("unlinked")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">미연동</CardTitle>
            <Unlink2 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unlinked}</div>
            <p className="text-xs text-muted-foreground">연동 필요</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDeliveryFilter("shipped")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">배송중</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.shipped}</div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
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
        onReset={handleResetSearch}
        filteredCount={filteredOrders.length}
        totalCount={orders.length}
        showOrderSourceFilter={true}
        orderSources={ALLOWED_ORDER_SOURCES}
        disableOrderSourceFilter={!!userPartner}
      />

      {/* 추가 검색 (운송장번호, 택배사 검색) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">배송 상태 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="주문번호, 수령인, 운송장번호, 택배사로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="연동 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="linked">연동 완료</SelectItem>
                <SelectItem value="unlinked">미연동</SelectItem>
                <SelectItem value="shipped">배송중</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 배송 정보 테이블 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle>배송 정보 목록</CardTitle>
                <CardDescription>
                  총 {filteredOrders.length}건 중 {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)}건 표시
                </CardDescription>
              </div>
              {selectedOrderIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-600">{selectedOrderIds.size}개 선택됨</span>
                  <Button 
                    onClick={handleBulkDelete} 
                    variant="destructive" 
                    size="sm"
                    disabled={deleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    선택 삭제
                  </Button>
                </div>
              )}
            </div>
            {/* 컬럼 설정 버튼 */}
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
                <DropdownMenuItem onClick={showAllColumns}>
                  모두 표시
                </DropdownMenuItem>
                <DropdownMenuItem onClick={resetColumns}>
                  기본값으로 초기화
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
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
                {visibleColumns.has("orderDate") && <TableHead>날짜</TableHead>}
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
                {visibleColumns.has("giftSent") && <TableHead>사은품발송</TableHead>}
                {visibleColumns.has("shippingFee") && <TableHead>배송비</TableHead>}
                {visibleColumns.has("courier") && <TableHead>택배사</TableHead>}
                {visibleColumns.has("trackingNumber") && <TableHead>운송장번호</TableHead>}
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.size + 2} className="h-24 text-center">
                    로딩중...
                  </TableCell>
                </TableRow>
              ) : paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.size + 2} className="h-24 text-center">
                    배송 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => {
                  const isLinked = order.courier && order.trackingNumber;
                  const trackingUrl = getTrackingUrl(order.courier, order.trackingNumber);
                  // 택배사 코드 매핑
                  const courierInfo = courierList.find(c => c.code === order.courier || c.name === order.courier);
                  const sweetCode = courierInfo?.sweetCode || "";
                  const isEditing = editingId === order.id;
                  
                  return (
                    <TableRow key={order.id} className={isEditing ? "bg-blue-50" : ""}>
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
                        <TableCell>{formatDate(order.orderDate)}</TableCell>
                      )}
                      
                      {/* 고객명 - 클릭시 조회 팝업 */}
                      {visibleColumns.has("recipientName") && (
                        <TableCell>
                          <button
                            onClick={() => {
                              setSelectedDialogOrder(order);
                              setDialogMode("view");
                              setViewDialogOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                          >
                            {order.recipientName || "-"}
                          </button>
                        </TableCell>
                      )}
                      
                      {/* 전화번호 */}
                      {visibleColumns.has("recipientPhone") && (
                        <TableCell className="text-xs">
                          {order.recipientPhone || "-"}
                        </TableCell>
                      )}
                      
                      {/* 이동통신 */}
                      {visibleColumns.has("recipientMobile") && (
                        <TableCell className="text-xs">
                          {order.recipientMobile || "-"}
                        </TableCell>
                      )}
                      
                      {/* 우편번호 */}
                      {visibleColumns.has("recipientZipCode") && (
                        <TableCell className="text-xs">
                          {order.recipientZipCode || "-"}
                        </TableCell>
                      )}
                      
                      {/* 주소 */}
                      {visibleColumns.has("recipientAddr") && (
                        <TableCell className="max-w-[200px]">
                          <span className="text-xs truncate block">
                            {order.recipientAddr || "-"}
                          </span>
                        </TableCell>
                      )}
                      
                      {/* 주문번호 */}
                      {visibleColumns.has("orderNumber") && (
                        <TableCell className="font-medium text-xs">
                          {order.orderNumber || "-"}
                        </TableCell>
                      )}
                      
                      {/* 상품명 및 수량 */}
                      {visibleColumns.has("productInfo") && (
                        <TableCell className="max-w-[150px]">
                          <span className="text-xs truncate block">
                            {order.productInfo || "-"}
                          </span>
                        </TableCell>
                      )}
                      
                      {/* 배송메시지 */}
                      {visibleColumns.has("deliveryMsg") && (
                        <TableCell className="max-w-[150px]">
                          <span className="text-xs truncate block">
                            {order.deliveryMsg || "-"}
                          </span>
                        </TableCell>
                      )}
                      
                      {/* 고객주문처명 */}
                      {visibleColumns.has("orderSource") && (
                        <TableCell className="text-xs">
                          {order.orderSource || "-"}
                        </TableCell>
                      )}
                      
                      {/* 단가 */}
                      {visibleColumns.has("basePrice") && (
                        <TableCell className="text-right text-xs">
                          {order.basePrice ? Number(order.basePrice).toLocaleString() : "-"}
                        </TableCell>
                      )}
                      
                      {/* 사은품발송 */}
                      {visibleColumns.has("giftSent") && (
                        <TableCell className="text-center text-xs">
                          {order.giftSent ? (
                            <Badge variant="default" className="text-xs">발송</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">미발송</Badge>
                          )}
                        </TableCell>
                      )}
                      
                      {/* 배송비 */}
                      {visibleColumns.has("shippingFee") && (
                        <TableCell className="text-right text-xs">
                          {order.shippingFee ? Number(order.shippingFee).toLocaleString() : "-"}
                        </TableCell>
                      )}
                      
                      {/* 택배사 - 인라인 편집 */}
                      {visibleColumns.has("courier") && (
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={editData.courier}
                              onValueChange={(value) =>
                                setEditData({ ...editData, courier: value })
                              }
                            >
                              <SelectTrigger className="w-[120px]">
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
                            <span className="text-xs">{order.courier || "-"}</span>
                          )}
                        </TableCell>
                      )}
                      
                      {/* 운송장번호 - 인라인 편집 */}
                      {visibleColumns.has("trackingNumber") && (
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editData.trackingNumber}
                              onChange={(e) =>
                                setEditData({ ...editData, trackingNumber: e.target.value })
                              }
                              className="w-[150px]"
                              placeholder="운송장번호 입력"
                            />
                          ) : order.trackingNumber ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs">{order.trackingNumber}</span>
                              {order.courier && order.trackingNumber && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={() => {
                                    if (sweetCode) {
                                      setTrackingCourier(sweetCode);
                                      setTrackingInvoice(order.trackingNumber || "");
                                      setShowTrackingResult(true);
                                      setTrackingDialogOpen(true);
                                    } else if (trackingUrl) {
                                      window.open(trackingUrl, "_blank");
                                    }
                                  }}
                                >
                                  <Search className="h-3 w-3 text-blue-500 hover:text-blue-700" />
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                      )}
                      
                      {/* 관리 */}
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveInlineEdit(order.id)}
                              disabled={saving}
                              className="h-8 w-8 p-0"
                            >
                              <Save className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                              disabled={saving}
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
                                setSelectedDialogOrder(order);
                                setDialogMode("edit");
                                setEditDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(order.id)}
                              className="h-8 w-8 p-0"
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

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                이전
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // 첫 페이지, 마지막 페이지, 현재 페이지 주변만 표시
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page}>...</span>;
                  }
                  return null;
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 배송 정보 편집 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>배송 정보 연동</DialogTitle>
            <DialogDescription>
              주문번호: {selectedOrder?.orderNumber || selectedOrder?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 수령인 정보 */}
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p><strong>수령인:</strong> {selectedOrder?.recipientName || "-"}</p>
              <p><strong>연락처:</strong> {selectedOrder?.recipientMobile || selectedOrder?.recipientPhone || "-"}</p>
              <p><strong>배송지:</strong> {selectedOrder?.recipientAddr || "-"}</p>
              {selectedOrder?.deliveryMsg && (
                <p><strong>배송메시지:</strong> {selectedOrder.deliveryMsg}</p>
              )}
            </div>

            {/* 택배사 선택 */}
            <div className="space-y-2">
              <Label htmlFor="courier">택배사</Label>
              <Select value={editCourier} onValueChange={setEditCourier}>
                <SelectTrigger>
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
            </div>

            {/* 운송장번호 입력 */}
            <div className="space-y-2">
              <Label htmlFor="trackingNumber">운송장번호</Label>
              <Input
                id="trackingNumber"
                placeholder="운송장번호 입력"
                value={editTrackingNumber}
                onChange={(e) => setEditTrackingNumber(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveDelivery} disabled={saving}>
              {saving ? "저장중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 조회/수정 팝업 다이얼로그 */}
      {selectedDialogOrder && (
        <>
          <EditOrderDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            mode="view"
            order={selectedDialogOrder}
            onSuccess={async () => {
              await fetchOrders();
              setViewDialogOpen(false);
            }}
          />
          <EditOrderDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            mode="edit"
            order={selectedDialogOrder}
            onSuccess={async () => {
              await fetchOrders();
              setEditDialogOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
}
