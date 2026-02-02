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
  AlertTriangle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Order {
  id: string;
  orderNumber: string | null;
  orderDate: string;
  status: string;
  totalAmount: number;
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

// 택배사 목록
const courierList = [
  { code: "CJ", name: "CJ대한통운", trackingUrl: "https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=" },
  { code: "HANJIN", name: "한진택배", trackingUrl: "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mession-open&wblnum=" },
  { code: "LOTTE", name: "롯데택배", trackingUrl: "https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=" },
  { code: "LOGEN", name: "로젠택배", trackingUrl: "https://www.ilogen.com/web/personal/trace/" },
  { code: "POST", name: "우체국택배", trackingUrl: "https://service.epost.go.kr/trace.RetrieveDomRi498.comm?displayHeader=N&sid1=" },
  { code: "GSP", name: "GS편의점택배", trackingUrl: "https://www.cvsnet.co.kr/invoice/tracking.do?invoice_no=" },
  { code: "KDEXP", name: "경동택배", trackingUrl: "https://kdexp.com/basicNew498.kd?barcode=" },
  { code: "DAESIN", name: "대신택배", trackingUrl: "https://www.ds3211.co.kr/freight/internalFreightSearch.ht?billno=" },
];

export default function DeliveryIntegrationPage() {
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

  // 주문 데이터 가져오기 (배송중 또는 배송 관련 상태)
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
          order.recipientName?.toLowerCase().includes(term) ||
          order.trackingNumber?.toLowerCase().includes(term) ||
          order.courier?.toLowerCase().includes(term)
      );
    }

    if (deliveryFilter === "linked") {
      result = result.filter((order) => order.courier && order.trackingNumber);
    } else if (deliveryFilter === "unlinked") {
      result = result.filter((order) => !order.courier || !order.trackingNumber);
    } else if (deliveryFilter === "shipped") {
      result = result.filter((order) => order.status === "SHIPPED");
    }

    setFilteredOrders(result);
  }, [searchTerm, deliveryFilter, orders]);

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

  const handleSaveDelivery = async () => {
    if (!selectedOrder) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courier: editCourier,
          trackingNumber: editTrackingNumber,
          status: editCourier && editTrackingNumber ? "SHIPPED" : selectedOrder.status,
        }),
      });

      if (response.ok) {
        await fetchOrders();
        setDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to update delivery info:", error);
    } finally {
      setSaving(false);
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
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">배송 정보 연동</h2>
          <p className="text-muted-foreground">
            주문별 택배사 및 운송장 정보를 관리하고 실시간 배송 추적을 연동합니다.
          </p>
        </div>
        <Button onClick={fetchOrders} disabled={loading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">배송 정보 검색</CardTitle>
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
          <CardTitle>배송 정보 목록</CardTitle>
          <CardDescription>
            총 {filteredOrders.length}건의 주문 배송 정보
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>주문번호</TableHead>
                <TableHead>주문일</TableHead>
                <TableHead>수령인</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>배송지</TableHead>
                <TableHead>택배사</TableHead>
                <TableHead>운송장번호</TableHead>
                <TableHead>연동상태</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    로딩중...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    배송 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const isLinked = order.courier && order.trackingNumber;
                  const trackingUrl = getTrackingUrl(order.courier, order.trackingNumber);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber || order.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell>{order.recipientName || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          {order.recipientPhone && <span>{order.recipientPhone}</span>}
                          {order.recipientMobile && <span>{order.recipientMobile}</span>}
                          {!order.recipientPhone && !order.recipientMobile && "-"}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 mt-1 flex-shrink-0 text-muted-foreground" />
                          <span className="text-xs truncate">
                            {order.recipientZipCode && `[${order.recipientZipCode}] `}
                            {order.recipientAddr || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.courier || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {order.trackingNumber ? (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs">{order.trackingNumber}</span>
                            {trackingUrl && (
                              <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 text-blue-500 hover:text-blue-700" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isLinked ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            연동완료
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-800">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            미연동
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleEditDelivery(order)}>
                          연동
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
    </div>
  );
}
