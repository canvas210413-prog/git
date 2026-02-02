"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Trash2, 
  RotateCcw, 
  Package, 
  Wrench, 
  AlertTriangle,
  Clock,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { PageHeader } from "@/components/common";
import { StatCard, StatGrid } from "@/components/common/stat-card";
import { formatNumber } from "@/lib/utils";
import {
  getTrashItems,
  getTrashStats,
  restoreOrder,
  restoreAfterService,
  restoreMultipleItems,
  permanentlyDelete,
  emptyTrash
} from "@/app/actions/trash";

// ============================================================================
// Types
// ============================================================================

interface TrashItem {
  id: string;
  originalId: string;
  originalTable: string;
  originalData: any;
  deletedBy: string | null;
  deletedByName: string | null;
  deleteReason: string | null;
  displayTitle: string | null;
  displayInfo: string | null;
  expiresAt: string;
  createdAt: string;
}

interface TrashStats {
  total: number;
  byTable: Record<string, number>;
  expiringToday: number;
  expiringThisWeek: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getTableLabel = (table: string): string => {
  const labels: Record<string, string> = {
    Order: "주문",
    AfterService: "AS",
    MallOrder: "몰주문"
  };
  return labels[table] || table;
};

const getTableIcon = (table: string) => {
  switch (table) {
    case "Order":
    case "MallOrder":
      return <Package className="h-4 w-4" />;
    case "AfterService":
      return <Wrench className="h-4 w-4" />;
    default:
      return <Trash2 className="h-4 w-4" />;
  }
};

const getTableColor = (table: string): string => {
  const colors: Record<string, string> = {
    Order: "bg-blue-100 text-blue-800",
    AfterService: "bg-purple-100 text-purple-800",
    MallOrder: "bg-green-100 text-green-800"
  };
  return colors[table] || "bg-gray-100 text-gray-800";
};

// ============================================================================
// Main Component
// ============================================================================

export default function TrashPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [stats, setStats] = useState<TrashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<TrashItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 데이터 로드
  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsResult, statsResult] = await Promise.all([
        getTrashItems(tableFilter === "all" ? undefined : tableFilter),
        getTrashStats()
      ]);

      if (itemsResult.success && itemsResult.data) {
        setItems(itemsResult.data as any);
      }
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error("Error fetching trash data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableFilter]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

  // 전체 선택
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedItems.map(item => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // 개별 선택
  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  // 단일 복구
  const handleRestore = async (item: TrashItem) => {
    try {
      let result;
      if (item.originalTable === "Order") {
        result = await restoreOrder(item.id);
      } else if (item.originalTable === "AfterService") {
        result = await restoreAfterService(item.id);
      }

      if (result?.success) {
        alert("✅ 복구되었습니다.");
        fetchData();
      } else {
        alert(`❌ 복구 실패: ${result?.error?.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Restore error:", error);
      alert("❌ 복구 중 오류가 발생했습니다.");
    }
  };

  // 선택 복구
  const handleRestoreSelected = async () => {
    if (selectedIds.size === 0) {
      alert("복구할 항목을 선택해주세요.");
      return;
    }

    if (!confirm(`선택한 ${selectedIds.size}개 항목을 복구하시겠습니까?`)) {
      return;
    }

    try {
      const result = await restoreMultipleItems(Array.from(selectedIds));
      if (result.success) {
        alert(`✅ ${result.data?.restoredCount || 0}개 항목이 복구되었습니다.`);
        setSelectedIds(new Set());
        fetchData();
      } else {
        alert(`❌ 복구 실패: ${result.error?.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Restore selected error:", error);
      alert("❌ 복구 중 오류가 발생했습니다.");
    }
  };

  // 단일 영구 삭제
  const handlePermanentDelete = async (id: string) => {
    try {
      const result = await permanentlyDelete(id);
      if (result.success) {
        alert("✅ 영구 삭제되었습니다.");
        fetchData();
      } else {
        alert(`❌ 삭제 실패: ${result.error?.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Permanent delete error:", error);
      alert("❌ 삭제 중 오류가 발생했습니다.");
    }
  };

  // 휴지통 비우기
  const handleEmptyTrash = async () => {
    try {
      const result = await emptyTrash(tableFilter === "all" ? undefined : tableFilter);
      if (result.success) {
        alert(`✅ ${result.data?.deletedCount || 0}개 항목이 영구 삭제되었습니다.`);
        setSelectedIds(new Set());
        fetchData();
      } else {
        alert(`❌ 삭제 실패: ${result.error?.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Empty trash error:", error);
      alert("❌ 휴지통 비우기 중 오류가 발생했습니다.");
    }
  };

  // 상세 보기
  const openDetail = (item: TrashItem) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="휴지통"
        description="삭제된 데이터가 30일간 보관됩니다. 복구하거나 영구 삭제할 수 있습니다."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="default" size="sm" onClick={handleRestoreSelected}>
              <RotateCcw className="h-4 w-4 mr-2" />
              선택 복구 ({selectedIds.size})
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={items.length === 0}>
                <Trash2 className="h-4 w-4 mr-2" />
                휴지통 비우기
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>휴지통을 비우시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  {tableFilter === "all" 
                    ? `모든 항목(${items.length}개)이 영구 삭제됩니다.`
                    : `${getTableLabel(tableFilter)} 항목(${items.length}개)이 영구 삭제됩니다.`
                  }
                  <br />
                  <span className="text-red-600 font-medium">⚠️ 이 작업은 되돌릴 수 없습니다.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleEmptyTrash} className="bg-red-600 hover:bg-red-700">
                  영구 삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PageHeader>

      {/* 통계 카드 */}
      {stats && (
        <StatGrid columns={4}>
          <StatCard
            title="전체 항목"
            value={formatNumber(stats.total)}
            icon="trash"
          />
          <StatCard
            title="주문"
            value={formatNumber(stats.byTable["Order"] || 0)}
            icon="package"
            variant="info"
          />
          <StatCard
            title="AS"
            value={formatNumber(stats.byTable["AfterService"] || 0)}
            icon="wrench"
            variant="warning"
          />
          <StatCard
            title="7일 내 만료"
            value={formatNumber(stats.expiringThisWeek)}
            icon="alert-triangle"
            variant="danger"
          />
        </StatGrid>
      )}

      {/* 필터 및 테이블 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>삭제된 항목</CardTitle>
            <CardDescription>
              {items.length}개의 항목이 휴지통에 있습니다.
            </CardDescription>
          </div>
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="유형 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="Order">주문</SelectItem>
              <SelectItem value="AfterService">AS</SelectItem>
              <SelectItem value="MallOrder">몰주문</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">로딩 중...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Trash2 className="h-12 w-12 mb-4 opacity-50" />
              <p>휴지통이 비어있습니다.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedIds.size === paginatedItems.length && paginatedItems.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-[100px]">유형</TableHead>
                      <TableHead>제목</TableHead>
                      <TableHead>정보</TableHead>
                      <TableHead>삭제자</TableHead>
                      <TableHead>삭제일</TableHead>
                      <TableHead>만료일</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((item) => {
                      const expiresAt = new Date(item.expiresAt);
                      const isExpiringSoon = expiresAt <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(item.id)}
                              onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge className={getTableColor(item.originalTable)}>
                              <span className="flex items-center gap-1">
                                {getTableIcon(item.originalTable)}
                                {getTableLabel(item.originalTable)}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => openDetail(item)}
                              className="font-medium text-left hover:text-primary hover:underline cursor-pointer transition-colors"
                            >
                              {item.displayTitle || item.originalId.slice(0, 8)}
                            </button>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {item.displayInfo || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.deletedByName || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(item.createdAt), "MM/dd HH:mm", { locale: ko })}
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm ${isExpiringSoon ? "text-red-600 font-medium" : ""}`}>
                              {formatDistanceToNow(expiresAt, { addSuffix: true, locale: ko })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDetail(item)}
                                title="상세 보기"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRestore(item)}
                                title="복구"
                                className="text-green-600 hover:text-green-700"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="영구 삭제"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>영구 삭제</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      "{item.displayTitle}"을(를) 영구 삭제하시겠습니까?
                                      <br />
                                      <span className="text-red-600 font-medium">⚠️ 이 작업은 되돌릴 수 없습니다.</span>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handlePermanentDelete(item.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      영구 삭제
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {startIndex + 1} - {Math.min(startIndex + itemsPerPage, items.length)} / {items.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {detailItem && getTableIcon(detailItem.originalTable)}
              {detailItem?.displayTitle || "상세 정보"}
            </DialogTitle>
            <DialogDescription>
              삭제된 데이터의 상세 정보를 확인하고 복구할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          {detailItem && (
            <div className="space-y-6">
              {/* 기본 정보 카드 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge className={getTableColor(detailItem.originalTable)}>
                      {getTableLabel(detailItem.originalTable)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      삭제일: {format(new Date(detailItem.createdAt), "yyyy년 MM월 dd일 HH:mm", { locale: ko })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">삭제자</label>
                      <p className="text-sm">{detailItem.deletedByName || "알 수 없음"}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        만료일
                      </label>
                      <p className="text-sm">
                        {format(new Date(detailItem.expiresAt), "yyyy년 MM월 dd일", { locale: ko })}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({formatDistanceToNow(new Date(detailItem.expiresAt), { addSuffix: true, locale: ko })})
                        </span>
                      </p>
                    </div>
                  </div>
                  {detailItem.deleteReason && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">삭제 사유</label>
                      <p className="text-sm bg-muted p-3 rounded-md">{detailItem.deleteReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 데이터 내용 카드 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">데이터 내용</CardTitle>
                  <CardDescription>복구 시 아래 정보가 그대로 복원됩니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  {detailItem.originalTable === "Order" ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">주문번호</label>
                          <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {detailItem.originalData.orderNumber || "-"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">주문일</label>
                          <p className="text-sm">
                            {detailItem.originalData.orderDate 
                              ? format(new Date(detailItem.originalData.orderDate), "yyyy-MM-dd HH:mm", { locale: ko })
                              : "-"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">고객명</label>
                          <p className="text-sm">{detailItem.originalData.recipientName || detailItem.originalData.customerName || "-"}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">연락처</label>
                          <p className="text-sm">{detailItem.originalData.recipientPhone || detailItem.originalData.customerPhone || "-"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">상품 정보</label>
                        <p className="text-sm bg-muted p-3 rounded-md">
                          {detailItem.originalData.productInfo || detailItem.originalData.productName || "-"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">배송 주소</label>
                        <p className="text-sm bg-muted p-3 rounded-md">
                          {detailItem.originalData.recipientAddr || detailItem.originalData.shippingAddr || "-"}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">주문금액</label>
                          <p className="text-sm font-semibold">
                            ₩{Number(detailItem.originalData.totalAmount || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">상태</label>
                          <Badge variant="outline">{detailItem.originalData.status || "-"}</Badge>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">주문처</label>
                          <p className="text-sm">{detailItem.originalData.orderSource || "-"}</p>
                        </div>
                      </div>
                      {detailItem.originalData.trackingNumber && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">택배사</label>
                            <p className="text-sm">{detailItem.originalData.courier || "-"}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">운송장번호</label>
                            <p className="text-sm font-mono">{detailItem.originalData.trackingNumber}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : detailItem.originalTable === "AfterService" ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">AS번호</label>
                          <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {detailItem.originalData.asNumber || detailItem.originalData.ticketNumber || "-"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">접수일</label>
                          <p className="text-sm">
                            {detailItem.originalData.receivedAt 
                              ? format(new Date(detailItem.originalData.receivedAt), "yyyy-MM-dd HH:mm", { locale: ko })
                              : "-"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">고객명</label>
                          <p className="text-sm">{detailItem.originalData.customerName || "-"}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">연락처</label>
                          <p className="text-sm">{detailItem.originalData.customerPhone || "-"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">제품명</label>
                        <p className="text-sm bg-muted p-3 rounded-md">
                          {detailItem.originalData.productName || "-"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">유형</label>
                          <Badge variant="outline">{detailItem.originalData.type || "-"}</Badge>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">상태</label>
                          <Badge variant="outline">{detailItem.originalData.status || "-"}</Badge>
                        </div>
                      </div>
                      {detailItem.originalData.description && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">내용</label>
                          <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                            {detailItem.originalData.description}
                          </p>
                        </div>
                      )}
                      {detailItem.originalData.resolution && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">수리 내역</label>
                          <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                            {detailItem.originalData.resolution}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">원본 데이터</label>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-[300px] overflow-y-auto">
                        {JSON.stringify(detailItem.originalData, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 경고 메시지 */}
              <div className="flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    복구 시 주의사항
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    • 복구하면 새로운 ID로 데이터가 생성됩니다.<br />
                    • 관련 데이터(주문 항목 등)도 함께 복구됩니다.<br />
                    • 만료일({format(new Date(detailItem.expiresAt), "MM월 dd일", { locale: ko })}) 이후에는 자동으로 영구 삭제됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              닫기
            </Button>
            {detailItem && (
              <Button onClick={() => { handleRestore(detailItem); setIsDetailOpen(false); }} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                복구하기
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
