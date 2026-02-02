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
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  RefreshCcw,
  AlertCircle,
  FileWarning,
  Copy,
  User,
  Phone,
  MapPin,
  Package
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

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
  unitPrice: number | null;
  shippingFee: number | null;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

interface ValidationError {
  orderId: string;
  orderNumber: string;
  errorType: string;
  errorMessage: string;
  field: string;
  severity: "error" | "warning";
}

interface DuplicateGroup {
  orderNumber: string;
  orders: Order[];
}

export default function OrderValidationPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [validationFilter, setValidationFilter] = useState("all");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);

  // 주문 데이터 가져오기
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        validateOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // 주문 데이터 검증
  const validateOrders = (orderData: Order[]) => {
    const errors: ValidationError[] = [];
    const orderNumberMap = new Map<string, Order[]>();

    orderData.forEach((order) => {
      const orderNum = order.orderNumber || order.id.substring(0, 8);

      // 1. 필수 필드 검증
      if (!order.recipientName) {
        errors.push({
          orderId: order.id,
          orderNumber: orderNum,
          errorType: "missing_field",
          errorMessage: "수령인 이름이 없습니다",
          field: "recipientName",
          severity: "error",
        });
      }

      if (!order.recipientPhone && !order.recipientMobile) {
        errors.push({
          orderId: order.id,
          orderNumber: orderNum,
          errorType: "missing_field",
          errorMessage: "수령인 연락처가 없습니다",
          field: "recipientPhone",
          severity: "error",
        });
      }

      if (!order.recipientAddr) {
        errors.push({
          orderId: order.id,
          orderNumber: orderNum,
          errorType: "missing_field",
          errorMessage: "배송 주소가 없습니다",
          field: "recipientAddr",
          severity: "error",
        });
      }

      if (!order.productInfo) {
        errors.push({
          orderId: order.id,
          orderNumber: orderNum,
          errorType: "missing_field",
          errorMessage: "상품 정보가 없습니다",
          field: "productInfo",
          severity: "warning",
        });
      }

      // 2. 금액 검증
      if (order.totalAmount <= 0) {
        errors.push({
          orderId: order.id,
          orderNumber: orderNum,
          errorType: "invalid_amount",
          errorMessage: "주문 금액이 0원 이하입니다",
          field: "totalAmount",
          severity: "error",
        });
      }

      // 3. 배송중인데 운송장 없음
      if (order.status === "SHIPPED" && (!order.courier || !order.trackingNumber)) {
        errors.push({
          orderId: order.id,
          orderNumber: orderNum,
          errorType: "shipping_info",
          errorMessage: "배송중 상태이나 운송장 정보가 없습니다",
          field: "trackingNumber",
          severity: "warning",
        });
      }

      // 4. 주문번호 중복 체크를 위한 맵 구성
      if (order.orderNumber) {
        const existing = orderNumberMap.get(order.orderNumber) || [];
        existing.push(order);
        orderNumberMap.set(order.orderNumber, existing);
      }

      // 5. 우편번호 형식 검증
      if (order.recipientZipCode && !/^\d{5}$/.test(order.recipientZipCode)) {
        errors.push({
          orderId: order.id,
          orderNumber: orderNum,
          errorType: "invalid_format",
          errorMessage: "우편번호 형식이 올바르지 않습니다 (5자리 숫자)",
          field: "recipientZipCode",
          severity: "warning",
        });
      }

      // 6. 전화번호 형식 검증
      const phoneRegex = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
      if (order.recipientPhone && !phoneRegex.test(order.recipientPhone.replace(/-/g, ''))) {
        errors.push({
          orderId: order.id,
          orderNumber: orderNum,
          errorType: "invalid_format",
          errorMessage: "전화번호 형식이 올바르지 않습니다",
          field: "recipientPhone",
          severity: "warning",
        });
      }
    });

    // 중복 주문번호 검출
    const duplicates: DuplicateGroup[] = [];
    orderNumberMap.forEach((orderList, orderNumber) => {
      if (orderList.length > 1) {
        duplicates.push({ orderNumber, orders: orderList });
        orderList.forEach((order) => {
          errors.push({
            orderId: order.id,
            orderNumber: orderNumber,
            errorType: "duplicate",
            errorMessage: `주문번호 중복 (${orderList.length}건)`,
            field: "orderNumber",
            severity: "error",
          });
        });
      }
    });

    setValidationErrors(errors);
    setDuplicateGroups(duplicates);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 통계 계산
  const stats = {
    total: orders.length,
    valid: orders.length - new Set(validationErrors.filter(e => e.severity === "error").map(e => e.orderId)).size,
    errors: new Set(validationErrors.filter(e => e.severity === "error").map(e => e.orderId)).size,
    warnings: new Set(validationErrors.filter(e => e.severity === "warning").map(e => e.orderId)).size,
    duplicates: duplicateGroups.reduce((sum, g) => sum + g.orders.length, 0),
  };

  // 필터링된 오류 목록
  const filteredErrors = validationErrors.filter((error) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!error.orderNumber.toLowerCase().includes(term) && 
          !error.errorMessage.toLowerCase().includes(term)) {
        return false;
      }
    }
    if (validationFilter === "errors") return error.severity === "error";
    if (validationFilter === "warnings") return error.severity === "warning";
    if (validationFilter === "duplicates") return error.errorType === "duplicate";
    if (validationFilter === "missing") return error.errorType === "missing_field";
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case "missing_field": return <User className="h-4 w-4" />;
      case "duplicate": return <Copy className="h-4 w-4" />;
      case "invalid_format": return <FileWarning className="h-4 w-4" />;
      case "invalid_amount": return <AlertCircle className="h-4 w-4" />;
      case "shipping_info": return <Package className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">주문 오류 검증</h2>
          <p className="text-muted-foreground">
            주문 데이터의 무결성을 검증하고 오류를 사전에 발견합니다.
          </p>
        </div>
        <Button onClick={fetchOrders} disabled={loading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          재검증
        </Button>
      </div>

      {/* 검증 결과 요약 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setValidationFilter("all")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 주문</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-green-200" onClick={() => setValidationFilter("all")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">정상</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.valid / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-red-200" onClick={() => setValidationFilter("errors")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오류</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
            <p className="text-xs text-muted-foreground">즉시 수정 필요</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-yellow-200" onClick={() => setValidationFilter("warnings")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">경고</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
            <p className="text-xs text-muted-foreground">확인 권장</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-purple-200" onClick={() => setValidationFilter("duplicates")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">중복</CardTitle>
            <Copy className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.duplicates}</div>
            <p className="text-xs text-muted-foreground">{duplicateGroups.length}개 그룹</p>
          </CardContent>
        </Card>
      </div>

      {/* 검증 결과 알림 */}
      {stats.errors > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류 발견</AlertTitle>
          <AlertDescription>
            {stats.errors}건의 주문에서 필수 정보 누락 또는 데이터 오류가 발견되었습니다. 
            배송 전 수정이 필요합니다.
          </AlertDescription>
        </Alert>
      )}

      {duplicateGroups.length > 0 && (
        <Alert className="border-purple-200 bg-purple-50">
          <Copy className="h-4 w-4 text-purple-600" />
          <AlertTitle className="text-purple-800">중복 주문번호 발견</AlertTitle>
          <AlertDescription className="text-purple-700">
            {duplicateGroups.length}개의 주문번호가 중복으로 등록되어 있습니다. 
            중복 주문 여부를 확인해주세요.
          </AlertDescription>
        </Alert>
      )}

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">오류 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="주문번호, 오류 내용으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={validationFilter} onValueChange={setValidationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="오류 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="errors">오류만</SelectItem>
                <SelectItem value="warnings">경고만</SelectItem>
                <SelectItem value="duplicates">중복만</SelectItem>
                <SelectItem value="missing">필수정보 누락</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 중복 주문 그룹 (아코디언) */}
      {duplicateGroups.length > 0 && validationFilter !== "errors" && validationFilter !== "warnings" && validationFilter !== "missing" && (
        <Card>
          <CardHeader>
            <CardTitle>중복 주문번호 상세</CardTitle>
            <CardDescription>
              동일한 주문번호로 등록된 주문들입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {duplicateGroups.map((group, index) => (
                <AccordionItem key={index} value={`dup-${index}`}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-purple-100 text-purple-800">
                        {group.orders.length}건 중복
                      </Badge>
                      <span className="font-mono">{group.orderNumber}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>주문일</TableHead>
                          <TableHead>고객명</TableHead>
                          <TableHead>상품정보</TableHead>
                          <TableHead>금액</TableHead>
                          <TableHead>상태</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}</TableCell>
                            <TableCell>{formatDate(order.orderDate)}</TableCell>
                            <TableCell>{order.customer.name}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{order.productInfo}</TableCell>
                            <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{order.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* 오류 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>검증 오류 목록</CardTitle>
          <CardDescription>
            총 {filteredErrors.length}건의 검증 항목
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>심각도</TableHead>
                <TableHead>주문번호</TableHead>
                <TableHead>오류 유형</TableHead>
                <TableHead>상세 내용</TableHead>
                <TableHead>필드</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    검증중...
                  </TableCell>
                </TableRow>
              ) : filteredErrors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {validationFilter === "all" ? (
                      <div className="flex flex-col items-center gap-2 text-green-600">
                        <CheckCircle className="h-8 w-8" />
                        <span>모든 주문 데이터가 정상입니다!</span>
                      </div>
                    ) : (
                      "해당 조건에 맞는 오류가 없습니다."
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredErrors.map((error, index) => (
                  <TableRow key={`${error.orderId}-${index}`}>
                    <TableCell>
                      {error.severity === "error" ? (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="mr-1 h-3 w-3" />
                          오류
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          경고
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{error.orderNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getErrorIcon(error.errorType)}
                        <span className="text-sm">
                          {error.errorType === "missing_field" && "필수정보 누락"}
                          {error.errorType === "duplicate" && "주문번호 중복"}
                          {error.errorType === "invalid_format" && "형식 오류"}
                          {error.errorType === "invalid_amount" && "금액 오류"}
                          {error.errorType === "shipping_info" && "배송정보 누락"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{error.errorMessage}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {error.field}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
