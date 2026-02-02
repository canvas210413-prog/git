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
  Package,
  HelpCircle,
  BookOpen,
  Shield,
  Zap,
  Eye,
  Settings,
  CheckCircle2,
  Pencil,
  Save
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateOrder } from "@/app/actions/orders";

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
  recipientName: string | null;
  recipientPhone: string | null;
  errorType: string;
  errorMessage: string;
  field: string;
  severity: "error" | "warning";
  details?: string;
}

interface DuplicateGroup {
  key: string; // "고객명_전화번호" 형식
  recipientName: string;
  recipientPhone: string;
  orders: Order[];
}

export default function OrderValidationPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [validationFilter, setValidationFilter] = useState("all");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [showGuideDialog, setShowGuideDialog] = useState(false);
  
  // 수정 다이얼로그 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingError, setEditingError] = useState<ValidationError | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editFormData, setEditFormData] = useState<{
    orderDate: string;
    orderNumber: string;
    recipientName: string;
    recipientPhone: string;
    recipientMobile: string;
    recipientZipCode: string;
    recipientAddr: string;
    productInfo: string;
    deliveryMsg: string;
    orderSource: string;
    basePrice: number;
    shippingFee: number;
    courier: string;
    trackingNumber: string;
  }>({
    orderDate: "",
    orderNumber: "",
    recipientName: "",
    recipientPhone: "",
    recipientMobile: "",
    recipientZipCode: "",
    recipientAddr: "",
    productInfo: "",
    deliveryMsg: "",
    orderSource: "",
    basePrice: 0,
    shippingFee: 0,
    courier: "",
    trackingNumber: "",
  });
  const [saving, setSaving] = useState(false);
  
  // 해당 주문의 모든 오류 필드 목록 가져오기
  const getErrorFieldsForOrder = (orderId: string): string[] => {
    return validationErrors
      .filter(e => e.orderId === orderId)
      .map(e => e.field);
  };

  // 주문 데이터 가져오기 (협력사별 필터링 적용)
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orders", {
        credentials: "include", // 세션 쿠키 전달 (협력사 필터링용)
      });
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

  // 주문 데이터 검증 (핵심 3가지만)
  const validateOrders = (orderData: Order[]) => {
    const errors: ValidationError[] = [];

    // 전화번호 형식 정규식
    const phoneRegex = /^0\d{1,2}-\d{3,4}-\d{4}$/; // 일반전화: 02-1234-5678, 031-123-4567
    const mobileRegex = /^01[0-9]-\d{3,4}-\d{4}$/; // 휴대전화: 010-1234-5678
    const virtualNumberRegex = /^05(?:0[1-9]|10)-\d{3,4}-\d{4}$/; // 안심번호: 0501-1234-5678 ~ 0510-1234-5678

    orderData.forEach((order) => {
      const recipientName = order.recipientName || null;
      const recipientPhone = order.recipientPhone || order.recipientMobile || null;

      // 1. 전화번호 검증 (NULL, 빈값, 형식 오류)
      const hasPhone = order.recipientPhone && order.recipientPhone.trim() !== "";
      const hasMobile = order.recipientMobile && order.recipientMobile.trim() !== "";
      
      if (!hasPhone && !hasMobile) {
        // 전화번호가 아예 없는 경우
        errors.push({
          orderId: order.id,
          recipientName: recipientName,
          recipientPhone: null,
          errorType: "missing_phone",
          errorMessage: "전화번호가 없습니다",
          field: "recipientPhone",
          severity: "error",
          details: "배송을 위해 연락처가 필요합니다",
        });
      } else {
        // 전화번호는 있지만 형식 검증
        let hasValidPhone = false;
        
        if (hasPhone) {
          const cleanPhone = order.recipientPhone!.trim();
          if (phoneRegex.test(cleanPhone) || mobileRegex.test(cleanPhone) || virtualNumberRegex.test(cleanPhone)) {
            hasValidPhone = true;
          } else {
            errors.push({
              orderId: order.id,
              recipientName: recipientName,
              recipientPhone: order.recipientPhone,
              errorType: "invalid_phone_format",
              errorMessage: "전화번호 형식이 올바르지 않습니다",
              field: "recipientPhone",
              severity: "error",
              details: `입력값: "${order.recipientPhone}" / 올바른 형식: 02-1234-5678, 010-1234-5678, 0501-1234-5678`,
            });
          }
        }
        
        if (hasMobile && !hasValidPhone) {
          const cleanMobile = order.recipientMobile!.trim();
          if (phoneRegex.test(cleanMobile) || mobileRegex.test(cleanMobile) || virtualNumberRegex.test(cleanMobile)) {
            hasValidPhone = true;
          } else {
            errors.push({
              orderId: order.id,
              recipientName: recipientName,
              recipientPhone: order.recipientMobile,
              errorType: "invalid_phone_format",
              errorMessage: "휴대전화 형식이 올바르지 않습니다",
              field: "recipientMobile",
              severity: "error",
              details: `입력값: "${order.recipientMobile}" / 올바른 형식: 010-1234-5678, 0501-1234-5678`,
            });
          }
        }
      }

      // 2. 배송 주소 없음 (빈 문자열도 체크)
      const hasAddress = order.recipientAddr && order.recipientAddr.trim() !== "";
      
      if (!hasAddress) {
        errors.push({
          orderId: order.id,
          recipientName: recipientName,
          recipientPhone: recipientPhone,
          errorType: "missing_address",
          errorMessage: "배송주소가 없습니다",
          field: "recipientAddr",
          severity: "error",
          details: "배송을 위해 주소가 필요합니다",
        });
      }
    });

    setValidationErrors(errors);
    setDuplicateGroups([]);
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

  // 수정 다이얼로그 열기
  const openEditDialog = (error: ValidationError) => {
    const order = orders.find(o => o.id === error.orderId);
    if (!order) return;
    
    setEditingError(error);
    setEditingOrder(order);
    setEditFormData({
      orderDate: order.orderDate ? new Date(order.orderDate).toISOString().split("T")[0] : "",
      orderNumber: order.orderNumber || "",
      recipientName: order.recipientName || "",
      recipientPhone: order.recipientPhone || "",
      recipientMobile: order.recipientMobile || "",
      recipientZipCode: order.recipientZipCode || "",
      recipientAddr: order.recipientAddr || "",
      productInfo: order.productInfo || "",
      deliveryMsg: order.deliveryMsg || "",
      orderSource: order.orderSource || "",
      basePrice: order.unitPrice || 0,
      shippingFee: order.shippingFee || 0,
      courier: order.courier || "",
      trackingNumber: order.trackingNumber || "",
    });
    setEditDialogOpen(true);
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    
    setSaving(true);
    try {
      const basePrice = Number(editFormData.basePrice) || 0;
      const shippingFee = Number(editFormData.shippingFee) || 0;
      const totalAmount = basePrice + shippingFee;
      
      const result = await updateOrder(editingOrder.id, {
        orderDate: editFormData.orderDate,
        orderNumber: editFormData.orderNumber || null,
        recipientName: editFormData.recipientName || null,
        recipientPhone: editFormData.recipientPhone || null,
        recipientMobile: editFormData.recipientMobile || null,
        recipientZipCode: editFormData.recipientZipCode || null,
        recipientAddr: editFormData.recipientAddr || null,
        productInfo: editFormData.productInfo || null,
        deliveryMsg: editFormData.deliveryMsg || null,
        orderSource: editFormData.orderSource || null,
        basePrice: basePrice,
        shippingFee: shippingFee,
        totalAmount: totalAmount,
        courier: editFormData.courier || null,
        trackingNumber: editFormData.trackingNumber || null,
      });

      if (result.success) {
        alert("✅ 수정이 완료되었습니다.");
        setEditDialogOpen(false);
        setEditingError(null);
        setEditingOrder(null);
        // 데이터 새로고침
        await fetchOrders();
      } else {
        alert(`❌ 수정 실패: ${result.error?.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("❌ 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 필터링된 오류 목록
  const filteredErrors = validationErrors.filter((error) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!(error.recipientName?.toLowerCase().includes(term) ||
            error.recipientPhone?.toLowerCase().includes(term) ||
            error.errorMessage.toLowerCase().includes(term))) {
        return false;
      }
    }
    if (validationFilter === "errors") return error.severity === "error";
    if (validationFilter === "warnings") return error.severity === "warning";
    if (validationFilter === "duplicates") return error.errorType === "duplicate";
    if (validationFilter === "missing") return error.errorType === "missing_required" || error.errorType === "missing_optional";
    if (validationFilter === "format") return error.errorType === "invalid_format";
    if (validationFilter === "inconsistent") return error.errorType === "inconsistent_data";
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowGuideDialog(true)}>
            <HelpCircle className="mr-2 h-4 w-4" />
            가이드 보기
          </Button>
          <Button onClick={fetchOrders} disabled={loading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            재검증
          </Button>
        </div>
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
                placeholder="고객명, 전화번호, 오류 내용으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => fetchOrders()}
              disabled={loading}
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>



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
                <TableHead className="w-[100px]">심각도</TableHead>
                <TableHead>고객명</TableHead>
                <TableHead>전화번호</TableHead>
                <TableHead>오류유형</TableHead>
                <TableHead>오류내용</TableHead>
                <TableHead>필드</TableHead>
                <TableHead>상세</TableHead>
                <TableHead className="w-[80px]">수정</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    검증중...
                  </TableCell>
                </TableRow>
              ) : filteredErrors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
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
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                          <XCircle className="mr-1 h-3 w-3" />
                          오류
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          경고
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{error.recipientName || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{error.recipientPhone || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getErrorIcon(error.errorType)}
                        <span className="text-sm">
                          {error.errorType === "missing_required" && "필수정보 누락"}
                          {error.errorType === "missing_optional" && "권장정보 누락"}
                          {error.errorType === "duplicate" && "중복 의심"}
                          {error.errorType === "invalid_format" && "형식 오류"}
                          {error.errorType === "invalid_data" && "데이터 오류"}
                          {error.errorType === "inconsistent_data" && "불일치"}
                          {!["missing_required", "missing_optional", "duplicate", "invalid_format", "invalid_data", "inconsistent_data"].includes(error.errorType) && error.errorType}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">{error.errorMessage}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {error.field}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      {error.details && (
                        <span className="text-xs text-muted-foreground">{error.details}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(error)}
                        className="h-8 px-2"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        수정
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 📖 사용 가이드 다이얼로그 */}
      <Dialog open={showGuideDialog} onOpenChange={setShowGuideDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <HelpCircle className="h-6 w-6 text-blue-500" />
              주문 오류 검증 시스템 가이드
            </DialogTitle>
            <DialogDescription>
              초보자도 쉽게 따라할 수 있는 단계별 사용 안내입니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 개요 */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  시스템 개요
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>이 시스템은 주문 데이터의 <strong>무결성을 자동으로 검증</strong>하여 
                배송 오류, 정산 문제를 사전에 방지합니다.</p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="flex items-center gap-2 p-2 bg-red-100 rounded">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-xs"><strong>오류</strong>: 즉시 수정 필요</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-yellow-100 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-xs"><strong>경고</strong>: 확인 권장</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 1: 검증 실행 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">1</span>
                  검증 실행하기
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p>페이지 접속 시 자동으로 검증이 실행됩니다. 수동 재검증이 필요하면 <strong>[재검증]</strong> 버튼을 클릭하세요.</p>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <p className="font-medium">📌 검증 시점:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>페이지 접속 시 자동 검증</li>
                    <li>새 주문 데이터 추가 후</li>
                    <li>외부 데이터 연동 후</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: 대시보드 이해 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">2</span>
                  대시보드 읽기
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p>상단의 5개 카드에서 전체 검증 현황을 한눈에 파악할 수 있습니다.</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <div className="p-2 bg-white rounded border text-center">
                      <Package className="h-4 w-4 mx-auto mb-1" />
                      <strong>전체 주문</strong>
                    </div>
                    <div className="p-2 bg-green-50 rounded border border-green-200 text-center">
                      <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-500" />
                      <strong className="text-green-600">정상</strong>
                    </div>
                    <div className="p-2 bg-red-50 rounded border border-red-200 text-center">
                      <XCircle className="h-4 w-4 mx-auto mb-1 text-red-500" />
                      <strong className="text-red-600">오류</strong>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded border border-yellow-200 text-center">
                      <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                      <strong className="text-yellow-600">경고</strong>
                    </div>
                    <div className="p-2 bg-orange-50 rounded border border-orange-200 text-center">
                      <Copy className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                      <strong className="text-orange-600">중복</strong>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">💡 각 카드를 클릭하면 해당 유형만 필터링됩니다.</p>
              </CardContent>
            </Card>

            {/* Step 3: 오류 유형 */}
            <Card className="border-orange-200 bg-orange-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-sm flex items-center justify-center">3</span>
                  오류 유형 이해하기
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-2 bg-white rounded border">
                    <User className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium">필수정보 누락</p>
                      <p className="text-xs text-muted-foreground">수령인 이름, 연락처, 주소 등 필수 항목이 비어있음</p>
                      <p className="text-xs text-red-600">→ 고객에게 연락하여 정보 확인 필요</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 bg-white rounded border">
                    <Copy className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium">주문번호 중복</p>
                      <p className="text-xs text-muted-foreground">동일한 주문번호가 여러 건 존재</p>
                      <p className="text-xs text-red-600">→ 중복 주문 확인 후 불필요한 건 삭제</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 bg-white rounded border">
                    <FileWarning className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium">형식 오류</p>
                      <p className="text-xs text-muted-foreground">전화번호, 우편번호 등 형식이 올바르지 않음</p>
                      <p className="text-xs text-yellow-600">→ 데이터 형식 수정 필요</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 bg-white rounded border">
                    <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium">금액 오류</p>
                      <p className="text-xs text-muted-foreground">주문 금액이 0원이거나 비정상적인 값</p>
                      <p className="text-xs text-red-600">→ 정산 오류 방지를 위해 즉시 수정</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 bg-white rounded border">
                    <Package className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium">배송정보 누락</p>
                      <p className="text-xs text-muted-foreground">배송에 필요한 주소 정보가 불완전</p>
                      <p className="text-xs text-red-600">→ 배송 전 주소 정보 보완 필요</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 4: 검색 및 필터 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">4</span>
                  검색 및 필터 사용하기
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <p className="font-medium">📌 검색 방법:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <strong>주문번호 검색</strong>: 특정 주문의 오류 확인</li>
                    <li>• <strong>드롭다운 필터</strong>: 오류/경고/중복/누락 유형별 조회</li>
                    <li>• <strong>상단 카드 클릭</strong>: 해당 상태 빠른 필터</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Step 5: 중복 주문 처리 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">5</span>
                  중복 주문 처리하기
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p>중복 주문이 발견되면 하단의 <strong>중복 주문 그룹</strong> 섹션에서 상세 내용을 확인할 수 있습니다.</p>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <p className="font-medium">📌 중복 처리 방법:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>중복 그룹 아코디언을 클릭하여 상세 정보 확인</li>
                    <li>주문 날짜, 금액, 고객 정보를 비교</li>
                    <li>실제 주문인지 중복 입력인지 판단</li>
                    <li>불필요한 주문은 주문 관리에서 삭제 처리</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* 유용한 팁 */}
            <Card className="border-green-200 bg-green-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  유용한 팁
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="space-y-2 text-muted-foreground">
                  <li>✅ <strong>정기 검증</strong>: 매일 아침 출근 후 한 번씩 검증하면 문제를 빠르게 발견할 수 있습니다.</li>
                  <li>✅ <strong>오류 우선 처리</strong>: 경고보다 오류(빨간색)를 먼저 처리하세요.</li>
                  <li>✅ <strong>외부 연동 후 검증</strong>: 엑셀 업로드, API 연동 후에는 반드시 재검증하세요.</li>
                  <li>✅ <strong>중복 주의</strong>: 중복 주문은 이중 배송, 이중 정산 문제를 일으킵니다.</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowGuideDialog(false)}>
              이해했습니다!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-500" />
              주문 정보 수정
            </DialogTitle>
            <DialogDescription>
              오류가 있는 항목은 빨간색으로 표시됩니다. 해당 항목을 수정 후 저장하세요.
            </DialogDescription>
          </DialogHeader>

          {editingOrder && (
            <div className="space-y-6">
              {/* 오류 요약 알림 */}
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertTitle className="text-sm text-red-700">오류 항목</AlertTitle>
                <AlertDescription className="text-xs text-red-600">
                  {validationErrors
                    .filter(e => e.orderId === editingOrder.id)
                    .map(e => e.errorMessage)
                    .join(', ')}
                </AlertDescription>
              </Alert>

              {/* 날짜 및 주문번호 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderDate">날짜</Label>
                  <Input
                    id="orderDate"
                    type="date"
                    value={editFormData.orderDate}
                    onChange={(e) => setEditFormData({ ...editFormData, orderDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">주문번호</Label>
                  <Input
                    id="orderNumber"
                    placeholder="ORD-2023-001"
                    value={editFormData.orderNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, orderNumber: e.target.value })}
                  />
                </div>
              </div>

              {/* 고객 정보 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">고객 정보</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">고객명</Label>
                    <Input
                      id="recipientName"
                      placeholder="홍길동"
                      value={editFormData.recipientName}
                      onChange={(e) => setEditFormData({ ...editFormData, recipientName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientPhone" className={getErrorFieldsForOrder(editingOrder.id).includes("recipientPhone") ? "text-red-600 font-bold" : ""}>
                      전화번호 {getErrorFieldsForOrder(editingOrder.id).includes("recipientPhone") && <span className="text-red-500">⚠</span>}
                    </Label>
                    <Input
                      id="recipientPhone"
                      type="tel"
                      placeholder="010-5555-5555"
                      value={editFormData.recipientPhone}
                      onChange={(e) => setEditFormData({ ...editFormData, recipientPhone: e.target.value })}
                      className={getErrorFieldsForOrder(editingOrder.id).includes("recipientPhone") ? "border-red-500 border-2 bg-red-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientMobile" className={getErrorFieldsForOrder(editingOrder.id).includes("recipientMobile") ? "text-red-600 font-bold" : ""}>
                      이동통신 {getErrorFieldsForOrder(editingOrder.id).includes("recipientMobile") && <span className="text-red-500">⚠</span>}
                    </Label>
                    <Input
                      id="recipientMobile"
                      type="tel"
                      placeholder="010-5555-5555"
                      value={editFormData.recipientMobile}
                      onChange={(e) => setEditFormData({ ...editFormData, recipientMobile: e.target.value })}
                      className={getErrorFieldsForOrder(editingOrder.id).includes("recipientMobile") ? "border-red-500 border-2 bg-red-50" : ""}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientZipCode">우편번호</Label>
                    <Input
                      id="recipientZipCode"
                      placeholder="12345"
                      value={editFormData.recipientZipCode}
                      onChange={(e) => setEditFormData({ ...editFormData, recipientZipCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-3">
                    <Label htmlFor="recipientAddr" className={getErrorFieldsForOrder(editingOrder.id).includes("recipientAddr") ? "text-red-600 font-bold" : ""}>
                      주소 {getErrorFieldsForOrder(editingOrder.id).includes("recipientAddr") && <span className="text-red-500">⚠</span>}
                    </Label>
                    <Input
                      id="recipientAddr"
                      placeholder="서울시 성동구 00동"
                      value={editFormData.recipientAddr}
                      onChange={(e) => setEditFormData({ ...editFormData, recipientAddr: e.target.value })}
                      className={getErrorFieldsForOrder(editingOrder.id).includes("recipientAddr") ? "border-red-500 border-2 bg-red-50" : ""}
                    />
                  </div>
                </div>
              </div>

              {/* 상품 정보 */}
              <div className="space-y-2">
                <Label htmlFor="productInfo">상품 정보</Label>
                <Input
                  id="productInfo"
                  placeholder="상품명 / 옵션 / 수량"
                  value={editFormData.productInfo}
                  onChange={(e) => setEditFormData({ ...editFormData, productInfo: e.target.value })}
                  className="bg-gray-50"
                />
              </div>

              {/* 고객주문처명 */}
              <div className="space-y-2">
                <Label htmlFor="orderSource">고객주문처명</Label>
                <Select
                  value={editFormData.orderSource}
                  onValueChange={(value) => setEditFormData({ ...editFormData, orderSource: value })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="본사">본사</SelectItem>
                    <SelectItem value="로켓그로스">로켓그로스</SelectItem>
                    <SelectItem value="그로트">그로트</SelectItem>
                    <SelectItem value="스몰닷">스몰닷</SelectItem>
                    <SelectItem value="해피포즈">해피포즈</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 금액 및 배송 정보 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">단가</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    value={editFormData.basePrice}
                    onChange={(e) => setEditFormData({ ...editFormData, basePrice: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingFee">배송비</Label>
                  <Select
                    value={String(editFormData.shippingFee)}
                    onValueChange={(value) => setEditFormData({ ...editFormData, shippingFee: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0원</SelectItem>
                      <SelectItem value="3000">3,000원</SelectItem>
                      <SelectItem value="5000">5,000원</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courier" className={getErrorFieldsForOrder(editingOrder.id).includes("trackingNumber") ? "text-red-600 font-bold" : ""}>
                    택배사 {getErrorFieldsForOrder(editingOrder.id).includes("trackingNumber") && <span className="text-red-500">⚠</span>}
                  </Label>
                  <Select
                    value={editFormData.courier}
                    onValueChange={(value) => setEditFormData({ ...editFormData, courier: value })}
                  >
                    <SelectTrigger className={getErrorFieldsForOrder(editingOrder.id).includes("trackingNumber") ? "border-red-500 border-2 bg-red-50" : ""}>
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CJ대한통운">CJ대한통운</SelectItem>
                      <SelectItem value="한진택배">한진택배</SelectItem>
                      <SelectItem value="롯데택배">롯데택배</SelectItem>
                      <SelectItem value="로젠택배">로젠택배</SelectItem>
                      <SelectItem value="우체국택배">우체국택배</SelectItem>
                      <SelectItem value="경동택배">경동택배</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trackingNumber" className={getErrorFieldsForOrder(editingOrder.id).includes("trackingNumber") ? "text-red-600 font-bold" : ""}>
                    운송장번호 {getErrorFieldsForOrder(editingOrder.id).includes("trackingNumber") && <span className="text-red-500">⚠</span>}
                  </Label>
                  <Input
                    id="trackingNumber"
                    placeholder="123456789"
                    value={editFormData.trackingNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, trackingNumber: e.target.value })}
                    className={getErrorFieldsForOrder(editingOrder.id).includes("trackingNumber") ? "border-red-500 border-2 bg-red-50" : ""}
                  />
                </div>
              </div>

              {/* 배송메세지 */}
              <div className="space-y-2">
                <Label htmlFor="deliveryMsg">배송메세지</Label>
                <Textarea
                  id="deliveryMsg"
                  placeholder="문 앞에 놓아주세요"
                  value={editFormData.deliveryMsg}
                  onChange={(e) => setEditFormData({ ...editFormData, deliveryMsg: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingError(null);
                setEditingOrder(null);
              }}
            >
              취소
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                  저장중...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  저장
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
