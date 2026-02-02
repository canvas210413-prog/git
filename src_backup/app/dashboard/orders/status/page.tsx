"use client";

import { useEffect, useState } from "react";
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
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "대기중", color: "bg-gray-100 text-gray-800", icon: Clock },
  PROCESSING: { label: "처리중", color: "bg-blue-100 text-blue-800", icon: Package },
  SHIPPED: { label: "배송중", color: "bg-orange-100 text-orange-800", icon: Truck },
  DELIVERED: { label: "배송완료", color: "bg-green-100 text-green-800", icon: CheckCircle },
  CANCELLED: { label: "취소", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function OrderStatusPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
                <TableHead>주문일시</TableHead>
                <TableHead>고객명</TableHead>
                <TableHead>상품정보</TableHead>
                <TableHead>주문금액</TableHead>
                <TableHead>주문채널</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    로딩중...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    주문 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const statusInfo = statusConfig[order.status] || statusConfig.PENDING;
                  const StatusIcon = statusInfo.icon;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber || order.id.substring(0, 8)}
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
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.orderSource || "직접주문"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
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
              {/* 주문 상태 타임라인 */}
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                {Object.entries(statusConfig).slice(0, 4).map(([key, config], index) => {
                  const isActive = selectedOrder.status === key;
                  const isPast = Object.keys(statusConfig).indexOf(selectedOrder.status) > index;
                  const Icon = config.icon;
                  return (
                    <div key={key} className="flex flex-col items-center">
                      <div className={`p-2 rounded-full ${isActive ? "bg-primary text-primary-foreground" : isPast ? "bg-green-500 text-white" : "bg-muted"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-xs mt-1 ${isActive ? "font-bold" : ""}`}>{config.label}</span>
                    </div>
                  );
                })}
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
                    <p>{selectedOrder.courier || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">운송장번호</p>
                    <p className="font-mono">{selectedOrder.trackingNumber || "-"}</p>
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
