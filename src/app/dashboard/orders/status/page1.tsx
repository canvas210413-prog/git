"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle,
  Search,
  RefreshCcw,
  Filter,
  Eye,
  MapPin,
  Home
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateOrderDeliveryStatus } from "@/app/actions/delivery";

interface Order {
  id: string;
  orderNumber: string | null;
  orderDate: string;
  status: string;
  totalAmount: number;
  orderSource: string | null;
  productInfo: string | null;
  recipientName: string | null;
  recipientAddr: string | null;
  courier: string | null;
  trackingNumber: string | null;
  deliveryStatus: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

// 배송 상태 5단계 정의
const DELIVERY_STATUS_STEPS = [
  { key: "PICKED_UP", label: "상품인수", icon: Package },
  { key: "IN_TRANSIT", label: "상품이동중", icon: Truck },
  { key: "ARRIVED", label: "배송지도착", icon: MapPin },
  { key: "OUT_FOR_DELIVERY", label: "배송출발", icon: Home },
  { key: "DELIVERED", label: "배송완료", icon: CheckCircle },
];

const deliveryStatusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "대기", className: "bg-gray-100 text-gray-600" },
  PICKED_UP: { label: "상품인수", className: "bg-blue-100 text-blue-700" },
  IN_TRANSIT: { label: "상품이동중", className: "bg-indigo-100 text-indigo-700" },
  ARRIVED: { label: "배송지도착", className: "bg-purple-100 text-purple-700" },
  OUT_FOR_DELIVERY: { label: "배송출발", className: "bg-orange-100 text-orange-700" },
  DELIVERED: { label: "배송완료", className: "bg-green-100 text-green-700" },
};

// 배송 소요일 계산 함수
function calculateDeliveryDays(orderDate: string, deliveredAt?: string | null): number | null {
  if (!deliveredAt) return null;
  
  const order = new Date(orderDate);
  const delivered = new Date(deliveredAt);
  const diffTime = Math.abs(delivered.getTime() - order.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// 소요일 색상 표시 컴포넌트
function DeliveryDaysBadge({ days }: { days: number | null }) {
  if (days === null) {
    return <span className="text-gray-400 text-xs">-</span>;
  }
  
  let colorClass = "bg-green-100 text-green-700";
  if (days === 2) {
    colorClass = "bg-yellow-100 text-yellow-700";
  } else if (days >= 3) {
    colorClass = "bg-red-100 text-red-700";
  }
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colorClass}`}>
      {days}일
    </span>
  );
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "대기중", color: "bg-gray-100 text-gray-800", icon: Clock },
  PROCESSING: { label: "처리중", color: "bg-blue-100 text-blue-800", icon: Package },
  SHIPPED: { label: "배송중", color: "bg-orange-100 text-orange-800", icon: Truck },
  DELIVERED: { label: "배송완료", color: "bg-green-100 text-green-800", icon: CheckCircle },
  CANCELLED: { label: "취소", color: "bg-red-100 text-red-800", icon: XCircle },
};

// 배송 상태 셀 컴포넌트
function DeliveryStatusCell({ status }: { status: string | null }) {
  if (!status || status === "PENDING") {
    return <span className="text-gray-400 text-xs">미등록</span>;
  }

  const currentIndex = DELIVERY_STATUS_STEPS.findIndex(s => s.key === status);
  const config = deliveryStatusConfig[status] || deliveryStatusConfig.PENDING;
  
  return (
    <div className="flex flex-col gap-1">
      {/* 진행 아이콘 */}
      <div className="flex items-center gap-0.5">
        {DELIVERY_STATUS_STEPS.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;
          
          return (
            <div key={step.key} className="flex items-center">
              <div
                className={`${isCompleted ? 'text-blue-600' : 'text-gray-300'}`}
                title={step.label}
              >
                <Icon className={`h-3.5 w-3.5 ${isCurrent ? 'animate-pulse' : ''}`} />
              </div>
              {index < DELIVERY_STATUS_STEPS.length - 1 && (
                <div 
                  className={`w-1.5 h-0.5 mx-0.5 ${
                    index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* 상태 뱃지 */}
      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    </div>
  );
}

// 배송 상태 타임라인 (다이얼로그용)
function DeliveryStatusTimeline({ status }: { status: string | null }) {
  const currentIndex = status ? DELIVERY_STATUS_STEPS.findIndex(s => s.key === status) : -1;
  
  return (
    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
      {DELIVERY_STATUS_STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const Icon = step.icon;
        
        return (
          <div key={step.key} className="flex flex-col items-center relative">
            {/* 연결선 */}
            {index > 0 && (
              <div 
                className={`absolute right-1/2 top-5 w-full h-0.5 -translate-y-1/2 ${
                  index <= currentIndex ? 'bg-blue-500' : 'bg-gray-200'
                }`}
                style={{ width: 'calc(100% + 2rem)', right: '50%' }}
              />
            )}
            {/* 아이콘 */}
            <div 
              className={`relative z-10 p-2 rounded-full ${
                isCurrent 
                  ? 'bg-blue-500 text-white ring-4 ring-blue-200' 
                  : isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-400'
              }`}
            >
              <Icon className={`h-5 w-5 ${isCurrent ? 'animate-pulse' : ''}`} />
            </div>
            {/* 라벨 */}
            <span className={`text-xs mt-2 font-medium ${
              isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
            }`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderStatusPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 주문 데이터 가져오기
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orders");
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

  useEffect(() => {
    fetchOrders();
  }, []);

  // 필터링
  useEffect(() => {
    let result = orders;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          order.orderNumber?.toLowerCase().includes(term) ||
          order.customer.name.toLowerCase().includes(term) ||
          order.recipientName?.toLowerCase().includes(term) ||
          order.productInfo?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(result);
  }, [searchTerm, statusFilter, orders]);

  // 상태별 통계
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    processing: orders.filter((o) => o.status === "PROCESSING").length,
    shipped: orders.filter((o) => o.status === "SHIPPED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleSyncDelivery = async (orderId: string) => {
    startTransition(async () => {
      const result = await updateOrderDeliveryStatus(orderId);
      
      if (result.success) {
        alert("✅ 배송 정보가 업데이트되었습니다");
        fetchOrders();
      } else {
        alert("❌ " + (result.error || "배송 정보 조회 실패"));
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">주문 상태 확인</h2>
          <p className="text-muted-foreground">
            실시간 주문 진행상황을 조회하고 고객에게 안내합니다.
          </p>
        </div>
        <Button onClick={fetchOrders} disabled={loading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {/* 상태별 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("all")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 주문</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("PENDING")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기중</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("PROCESSING")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">처리중</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("SHIPPED")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">배송중</CardTitle>
            <Truck className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.shipped}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("DELIVERED")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">배송완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">주문 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="주문번호, 고객명, 수령인, 상품명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="PENDING">대기중</SelectItem>
                <SelectItem value="PROCESSING">처리중</SelectItem>
                <SelectItem value="SHIPPED">배송중</SelectItem>
                <SelectItem value="DELIVERED">배송완료</SelectItem>
                <SelectItem value="CANCELLED">취소</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 주문 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>주문 목록</CardTitle>
          <CardDescription>
            총 {filteredOrders.length}건의 주문이 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>주문번호</TableHead>
                <TableHead>출처</TableHead>
                <TableHead>주문일시</TableHead>
                <TableHead>고객명</TableHead>
                <TableHead>상품정보</TableHead>
                <TableHead>택배사/송장</TableHead>
                <TableHead>배송일</TableHead>
                <TableHead>도착일</TableHead>
                <TableHead>소요일</TableHead>
                <TableHead>배송상태</TableHead>
                <TableHead>주문상태</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-24 text-center">
                    로딩중...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-24 text-center">
                    주문 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const statusInfo = statusConfig[order.status] || statusConfig.PENDING;
                  const StatusIcon = statusInfo.icon;
                  const isMallOrder = order.id.startsWith("mall_") || order.orderSource === "MALL";
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber || order.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={isMallOrder 
                            ? "bg-purple-50 text-purple-700 border-purple-200" 
                            : "bg-blue-50 text-blue-700 border-blue-200"
                          }
                        >
                          {isMallOrder ? "쇼핑몰" : order.orderSource || "CRM"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{order.customer.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {order.recipientName && `수령: ${order.recipientName}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {order.productInfo || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{order.courier || "-"}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {order.trackingNumber || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {order.shippedAt 
                            ? new Date(order.shippedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {order.deliveredAt 
                            ? new Date(order.deliveredAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DeliveryDaysBadge days={calculateDeliveryDays(order.orderDate, order.deliveredAt)} />
                      </TableCell>
                      <TableCell>
                        <DeliveryStatusCell status={order.deliveryStatus} />
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {order.courier && order.trackingNumber && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleSyncDelivery(order.id)}
                              disabled={isPending}
                              title="배송정보 연동"
                            >
                              <RefreshCcw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 주문 상세 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>주문 상세 정보</DialogTitle>
            <DialogDescription>
              주문번호: {selectedOrder?.orderNumber || selectedOrder?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* 배송 상태 타임라인 (5단계) */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  배송 진행 상태
                </h4>
                <DeliveryStatusTimeline status={selectedOrder.deliveryStatus} />
              </div>

              {/* 주문 상태 */}
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">주문 상태:</span>
                <Badge className={statusConfig[selectedOrder.status]?.color || "bg-gray-100"}>
                  {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                </Badge>
              </div>

              {/* 주문 정보 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">주문일시</p>
                  <p>{formatDate(selectedOrder.orderDate)}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">주문금액</p>
                  <p className="font-bold">{formatCurrency(selectedOrder.totalAmount)}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">주문채널</p>
                  <p>{selectedOrder.orderSource || "직접주문"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">상품정보</p>
                  <p>{selectedOrder.productInfo || "-"}</p>
                </div>
              </div>

              {/* 고객 정보 */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">고객 정보</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">주문자</p>
                    <p>{selectedOrder.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">연락처</p>
                    <p>{selectedOrder.customer.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">이메일</p>
                    <p>{selectedOrder.customer.email}</p>
                  </div>
                </div>
              </div>

              {/* 배송 정보 */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">배송 정보</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">수령인</p>
                    <p>{selectedOrder.recipientName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">배송지</p>
                    <p>{selectedOrder.recipientAddr || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">택배사</p>
                    <p className="font-medium">{selectedOrder.courier || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">운송장번호</p>
                    <p className="font-mono text-blue-600">{selectedOrder.trackingNumber || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
