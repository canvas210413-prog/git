"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingBag,
  Search,
  MoreHorizontal,
  Eye,
  Loader2,
  Truck,
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Calendar,
} from "lucide-react";

interface MallOrder {
  id: string;
  orderNumber: string;
  userId: number;
  user?: {
    id: number;
    email: string;
    name: string;
    phone: string | null;
  };
  status: string;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  items: string;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  shippingMemo: string | null;
  trackingNumber: string | null;
  courier: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const ORDER_STATUSES = [
  { value: "PENDING", label: "결제대기", color: "bg-yellow-500" },
  { value: "PAID", label: "결제완료", color: "bg-blue-500" },
  { value: "PREPARING", label: "상품준비중", color: "bg-indigo-500" },
  { value: "SHIPPED", label: "배송중", color: "bg-purple-500" },
  { value: "DELIVERED", label: "배송완료", color: "bg-green-500" },
  { value: "CANCELLED", label: "취소", color: "bg-red-500" },
  { value: "REFUNDED", label: "환불완료", color: "bg-gray-500" },
];

const COURIERS = [
  "CJ대한통운",
  "한진택배",
  "롯데택배",
  "우체국택배",
  "로젠택배",
  "경동택배",
];

export default function MallOrdersPage() {
  const [orders, setOrders] = useState<MallOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<MallOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // 배송 정보 폼
  const [shippingForm, setShippingForm] = useState({
    courier: "",
    trackingNumber: "",
  });

  // 주문 목록 조회
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);
      
      const response = await fetch(`/api/mall/admin/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 주문 상태 변경
  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/mall/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status });
        }
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  // 배송 정보 저장
  const handleShippingSave = async () => {
    if (!selectedOrder || !shippingForm.courier || !shippingForm.trackingNumber) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/mall/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courier: shippingForm.courier,
          trackingNumber: shippingForm.trackingNumber,
          status: "SHIPPED",
          shippedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        fetchOrders();
        setIsShippingOpen(false);
        setShippingForm({ courier: "", trackingNumber: "" });
      }
    } catch (error) {
      console.error("Failed to save shipping info:", error);
    } finally {
      setSaving(false);
    }
  };

  // 상세 보기
  const handleViewDetail = (order: MallOrder) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  // 배송 등록 모달 열기
  const handleOpenShipping = (order: MallOrder) => {
    setSelectedOrder(order);
    setShippingForm({
      courier: order.courier || "",
      trackingNumber: order.trackingNumber || "",
    });
    setIsShippingOpen(true);
  };

  // 주문 아이템 파싱
  const parseItems = (items: string): any[] => {
    try {
      return JSON.parse(items);
    } catch {
      return [];
    }
  };

  // 날짜 포맷
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 상태별 배지
  const getStatusBadge = (status: string) => {
    const statusInfo = ORDER_STATUSES.find(s => s.value === status);
    return (
      <Badge className={`${statusInfo?.color || "bg-gray-500"} text-white`}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  // 통계
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "PENDING").length,
    paid: orders.filter(o => o.status === "PAID").length,
    shipped: orders.filter(o => o.status === "SHIPPED").length,
    delivered: orders.filter(o => o.status === "DELIVERED").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">쇼핑몰 주문 관리</h1>
          <p className="text-muted-foreground">쇼핑몰 주문을 관리합니다.</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">전체 주문</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">결제대기</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">결제완료</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">배송중</p>
                <p className="text-2xl font-bold">{stats.shipped}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">배송완료</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="주문번호, 주문자명으로 검색..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="주문 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 주문 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>주문 목록</CardTitle>
          <CardDescription>총 {orders.length}개의 주문</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mb-4" />
              <p>주문이 없습니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>주문번호</TableHead>
                  <TableHead>주문자</TableHead>
                  <TableHead>상품</TableHead>
                  <TableHead className="text-right">결제금액</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead>주문일시</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const items = parseItems(order.items);
                  const itemSummary = items.length > 0 
                    ? `${items[0].productName || items[0].name || '상품'}${items.length > 1 ? ` 외 ${items.length - 1}건` : ""}`
                    : "-";
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.shippingName || order.user?.name || "-"}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.shippingPhone || order.user?.phone || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">{itemSummary}</div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {order.totalAmount.toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetail(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              상세보기
                            </DropdownMenuItem>
                            {(order.status === "PAID" || order.status === "PREPARING") && (
                              <DropdownMenuItem onClick={() => handleOpenShipping(order)}>
                                <Truck className="h-4 w-4 mr-2" />
                                배송등록
                              </DropdownMenuItem>
                            )}
                            {order.status === "SHIPPED" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, "DELIVERED")}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                배송완료처리
                              </DropdownMenuItem>
                            )}
                            {(order.status === "PENDING" || order.status === "PAID") && (
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleStatusChange(order.id, "CANCELLED")}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                주문취소
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 주문 상세 모달 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>주문 상세</DialogTitle>
            <DialogDescription>
              주문번호: {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* 주문 상태 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">주문 상태:</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 주문 상품 */}
              <div>
                <h4 className="font-semibold mb-2">주문 상품</h4>
                <div className="border rounded-lg divide-y">
                  {parseItems(selectedOrder.items).map((item: any, index: number) => (
                    <div key={index} className="p-3 flex items-center gap-4">
                      {item.image && (
                        <img src={item.image} alt={item.productName || item.name} className="w-16 h-16 object-cover rounded" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{item.productName || item.name || '상품'}</div>
                        <div className="text-sm text-muted-foreground">
                          {(item.price || 0).toLocaleString()}원 × {item.quantity}개
                        </div>
                      </div>
                      <div className="font-medium">
                        {((item.price || 0) * (item.quantity || 1)).toLocaleString()}원
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 결제 정보 */}
              <div>
                <h4 className="font-semibold mb-2">결제 정보</h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">상품금액</span>
                    <span>{(selectedOrder.totalAmount - (selectedOrder.shippingFee || 0) + (selectedOrder.discountAmount || 0)).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">배송비</span>
                    <span>{(selectedOrder.shippingFee || 0).toLocaleString()}원</span>
                  </div>
                  {(selectedOrder.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>할인</span>
                      <span>-{(selectedOrder.discountAmount || 0).toLocaleString()}원</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>총 결제금액</span>
                    <span>{selectedOrder.totalAmount.toLocaleString()}원</span>
                  </div>
                </div>
              </div>

              {/* 배송 정보 */}
              <div>
                <h4 className="font-semibold mb-2">배송 정보</h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex">
                    <span className="w-20 text-muted-foreground">받는분</span>
                    <span>{selectedOrder.shippingName || "-"}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 text-muted-foreground">연락처</span>
                    <span>{selectedOrder.shippingPhone || "-"}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 text-muted-foreground">주소</span>
                    <span>{selectedOrder.shippingAddress || "-"}</span>
                  </div>
                  {selectedOrder.shippingMemo && (
                    <div className="flex">
                      <span className="w-20 text-muted-foreground">배송메모</span>
                      <span>{selectedOrder.shippingMemo}</span>
                    </div>
                  )}
                  {selectedOrder.courier && (
                    <div className="flex pt-2 border-t mt-2">
                      <span className="w-20 text-muted-foreground">택배사</span>
                      <span>{selectedOrder.courier}</span>
                    </div>
                  )}
                  {selectedOrder.trackingNumber && (
                    <div className="flex">
                      <span className="w-20 text-muted-foreground">송장번호</span>
                      <span className="font-mono">{selectedOrder.trackingNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 일시 정보 */}
              <div>
                <h4 className="font-semibold mb-2">처리 일시</h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex">
                    <span className="w-24 text-muted-foreground">주문일시</span>
                    <span>{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  {selectedOrder.paidAt && (
                    <div className="flex">
                      <span className="w-24 text-muted-foreground">결제일시</span>
                      <span>{formatDate(selectedOrder.paidAt)}</span>
                    </div>
                  )}
                  {selectedOrder.shippedAt && (
                    <div className="flex">
                      <span className="w-24 text-muted-foreground">발송일시</span>
                      <span>{formatDate(selectedOrder.shippedAt)}</span>
                    </div>
                  )}
                  {selectedOrder.deliveredAt && (
                    <div className="flex">
                      <span className="w-24 text-muted-foreground">배송완료</span>
                      <span>{formatDate(selectedOrder.deliveredAt)}</span>
                    </div>
                  )}
                  {selectedOrder.cancelledAt && (
                    <div className="flex text-red-600">
                      <span className="w-24">취소일시</span>
                      <span>{formatDate(selectedOrder.cancelledAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 배송 등록 모달 */}
      <Dialog open={isShippingOpen} onOpenChange={setIsShippingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>배송 정보 등록</DialogTitle>
            <DialogDescription>
              송장번호를 입력하면 자동으로 배송중 상태로 변경됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">택배사</label>
              <Select
                value={shippingForm.courier}
                onValueChange={(value) => setShippingForm({ ...shippingForm, courier: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="택배사 선택" />
                </SelectTrigger>
                <SelectContent>
                  {COURIERS.map((courier) => (
                    <SelectItem key={courier} value={courier}>
                      {courier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">송장번호</label>
              <Input
                value={shippingForm.trackingNumber}
                onChange={(e) => setShippingForm({ ...shippingForm, trackingNumber: e.target.value })}
                placeholder="송장번호를 입력하세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShippingOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={handleShippingSave} 
              disabled={saving || !shippingForm.courier || !shippingForm.trackingNumber}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
