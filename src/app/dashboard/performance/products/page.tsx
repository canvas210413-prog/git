"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  TrendingUp,
  ShoppingCart,
  Search,
  RefreshCw,
  BarChart3,
  Calendar,
  Eye,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Building,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { PageHeader } from "@/components/common";
import { StatCard, StatGrid } from "@/components/common/stat-card";
import { formatNumber } from "@/lib/utils";
import {
  getPartnerProductStats,
  getPartnerProductOrderDetails,
  getCurrentUserInfo,
  type PartnerProductStats,
  type ProductOrderDetail,
} from "@/app/actions/partner-product-stats";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ============================================================================
// Types
// ============================================================================

type SortField = "partner" | "productName" | "quantity" | "orderCount" | "totalAmount" | "lastOrderDate";
type SortDirection = "asc" | "desc";

interface UserInfo {
  isAdmin: boolean;
  assignedPartner: string | null;
}

// ============================================================================
// Main Component
// ============================================================================

export default function ProductPerformancePage() {
  const [stats, setStats] = useState<PartnerProductStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [userInfo, setUserInfo] = useState<UserInfo>({ isAdmin: true, assignedPartner: null });
  
  // 정렬
  const [sortField, setSortField] = useState<SortField>("orderCount");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  
  // 상세 다이얼로그
  const [selectedStat, setSelectedStat] = useState<PartnerProductStats | null>(null);
  const [orderDetails, setOrderDetails] = useState<ProductOrderDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 데이터 로드
  const fetchStats = async () => {
    setLoading(true);
    try {
      let dateFrom: Date | undefined;
      let dateTo: Date | undefined;
      
      if (dateRange === "7days") {
        dateFrom = subDays(new Date(), 7);
      } else if (dateRange === "30days") {
        dateFrom = subDays(new Date(), 30);
      } else if (dateRange === "thisMonth") {
        dateFrom = startOfMonth(new Date());
        dateTo = endOfMonth(new Date());
      } else if (dateRange === "lastMonth") {
        const lastMonth = subMonths(new Date(), 1);
        dateFrom = startOfMonth(lastMonth);
        dateTo = endOfMonth(lastMonth);
      }

      const result = await getPartnerProductStats(partnerFilter, dateFrom, dateTo);
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // 사용자 정보 로드
  useEffect(() => {
    const fetchUserInfo = async () => {
      const result = await getCurrentUserInfo();
      if (result.success && result.data) {
        setUserInfo(result.data);
      }
    };
    fetchUserInfo();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [partnerFilter, dateRange]);

  // 상세 보기
  const openDetail = async (stat: PartnerProductStats) => {
    setSelectedStat(stat);
    setIsDetailOpen(true);
    setDetailsLoading(true);
    
    try {
      const result = await getPartnerProductOrderDetails(
        stat.partner,
        stat.productName,
        stat.quantity
      );
      if (result.success && result.data) {
        // id를 orderId로 매핑
        const mappedData = result.data.map(order => ({
          ...order,
          orderId: order.id,
          totalAmount: Number(order.totalAmount),
        }));
        setOrderDetails(mappedData);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  // 필터링 및 정렬된 데이터
  const filteredAndSortedStats = useMemo(() => {
    let filtered = stats;
    
    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) =>
        s.partner.toLowerCase().includes(query) ||
        s.productName.toLowerCase().includes(query)
      );
    }
    
    // 정렬
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "partner":
          comparison = a.partner.localeCompare(b.partner);
          break;
        case "productName":
          comparison = a.productName.localeCompare(b.productName);
          break;
        case "quantity":
          comparison = a.quantity - b.quantity;
          break;
        case "orderCount":
          comparison = a.orderCount - b.orderCount;
          break;
        case "totalAmount":
          comparison = a.totalAmount - b.totalAmount;
          break;
        case "lastOrderDate":
          const dateA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
          const dateB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    return filtered;
  }, [stats, searchQuery, sortField, sortDirection]);

  // 정렬 토글
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // 정렬 아이콘
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDirection === "asc" 
      ? <ChevronUp className="h-3 w-3 ml-1" />
      : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  // 통계 요약
  const summary = useMemo(() => {
    const partnerSet = new Set(stats.map(s => s.partner));
    const totalCombinations = stats.length;
    const totalOrders = stats.reduce((sum, s) => sum + s.orderCount, 0);
    const totalAmount = stats.reduce((sum, s) => sum + s.totalAmount, 0);
    
    return { totalPartners: partnerSet.size, totalCombinations, totalOrders, totalAmount };
  }, [stats]);

  // 협력사별 그룹화 (차트용)
  const partnerSummary = useMemo(() => {
    const partnerMap = new Map<string, { orderCount: number; amount: number }>();
    
    stats.forEach((stat) => {
      if (partnerMap.has(stat.partner)) {
        const existing = partnerMap.get(stat.partner)!;
        existing.orderCount += stat.orderCount;
        existing.amount += stat.totalAmount;
      } else {
        partnerMap.set(stat.partner, {
          orderCount: stat.orderCount,
          amount: stat.totalAmount,
        });
      }
    });
    
    return Array.from(partnerMap.entries())
      .map(([partner, data]) => ({ partner, ...data }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);
  }, [stats]);

  const maxPartnerOrders = partnerSummary.length > 0 ? partnerSummary[0].orderCount : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="협력사별 상품 주문 현황"
        description={
          userInfo.isAdmin
            ? "고객주문처명(협력사)별로 상품명과 수량 조합의 주문건수를 분석합니다."
            : `${userInfo.assignedPartner || "본인"} 협력사의 상품명과 수량 조합 주문건수를 분석합니다.`
        }
      >
        <div className="flex items-center gap-2">
          {!userInfo.isAdmin && userInfo.assignedPartner && (
            <Badge variant="secondary" className="text-sm">
              {userInfo.assignedPartner} 전용
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>
      </PageHeader>

      {/* 통계 카드 */}
      <StatGrid columns={4}>
        <StatCard
          title="협력사 수"
          value={formatNumber(summary.totalPartners)}
          description="주문이 있는 협력사"
          icon="building"
        />
        <StatCard
          title="상품-수량 조합"
          value={formatNumber(summary.totalCombinations)}
          description="고유한 조합 수"
          icon="package"
          variant="info"
        />
        <StatCard
          title="총 주문 건수"
          value={formatNumber(summary.totalOrders)}
          icon="shopping-cart"
          variant="success"
        />
        <StatCard
          title="총 매출"
          value={`₩${formatNumber(Math.round(summary.totalAmount / 10000))}만`}
          icon="trending-up"
          variant="warning"
        />
      </StatGrid>

      {/* 협력사별 주문 현황 */}
      {partnerSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              협력사별 주문 현황 TOP 5
            </CardTitle>
            <CardDescription>주문 건수 기준 상위 5개 협력사</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {partnerSummary.map((item, index) => (
                <div key={item.partner} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium">{item.partner}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {item.orderCount}건
                      </span>
                      <span className="text-sm font-semibold">
                        ₩{formatNumber(Math.round(item.amount))}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${(item.orderCount / maxPartnerOrders) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 필터 및 테이블 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              협력사별 상품명-수량 조합 주문 현황
            </CardTitle>
            <CardDescription>
              {filteredAndSortedStats.length}개 조합
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-[200px]">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="협력사/상품명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={partnerFilter} onValueChange={setPartnerFilter} disabled={!userInfo.isAdmin}>
              <SelectTrigger className="w-[130px]">
                <Building className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="headquarters">본사/자사몰</SelectItem>
                <SelectItem value="그로트">그로트</SelectItem>
                <SelectItem value="스몰닷">스몰닷</SelectItem>
                <SelectItem value="해피포즈">해피포즈</SelectItem>
                <SelectItem value="로켓그로스">로켓그로스</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[130px]">
                <Calendar className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 기간</SelectItem>
                <SelectItem value="7days">최근 7일</SelectItem>
                <SelectItem value="30days">최근 30일</SelectItem>
                <SelectItem value="thisMonth">이번 달</SelectItem>
                <SelectItem value="lastMonth">지난 달</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">로딩 중...</span>
            </div>
          ) : filteredAndSortedStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Package className="h-12 w-12 mb-4 opacity-50" />
              <p>주문 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center hover:text-foreground"
                        onClick={() => toggleSort("partner")}
                      >
                        협력사
                        <SortIcon field="partner" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center hover:text-foreground"
                        onClick={() => toggleSort("productName")}
                      >
                        상품명
                        <SortIcon field="productName" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        className="flex items-center justify-end hover:text-foreground w-full"
                        onClick={() => toggleSort("quantity")}
                      >
                        수량
                        <SortIcon field="quantity" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        className="flex items-center justify-end hover:text-foreground w-full"
                        onClick={() => toggleSort("orderCount")}
                      >
                        주문 건수
                        <SortIcon field="orderCount" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        className="flex items-center justify-end hover:text-foreground w-full"
                        onClick={() => toggleSort("totalAmount")}
                      >
                        총 매출
                        <SortIcon field="totalAmount" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center hover:text-foreground"
                        onClick={() => toggleSort("lastOrderDate")}
                      >
                        최근 주문
                        <SortIcon field="lastOrderDate" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedStats.map((stat, index) => (
                    <TableRow key={`${stat.partner}_${stat.productName}_${stat.quantity}`}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <Badge variant={stat.partner === "본사" ? "outline" : "secondary"}>
                          {stat.partner}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {stat.productName}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-blue-600">
                          {formatNumber(stat.quantity)}개
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold">
                          {formatNumber(stat.orderCount)}건
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-green-600">
                          ₩{formatNumber(Math.round(stat.totalAmount))}
                        </span>
                      </TableCell>
                      <TableCell>
                        {stat.lastOrderDate ? (
                          <span className="text-sm">
                            {format(new Date(stat.lastOrderDate), "MM/dd HH:mm", { locale: ko })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetail(stat)}
                          title="상세 보기"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상세 다이얼로그 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {selectedStat?.partner} - {selectedStat?.productName} ({selectedStat?.quantity}개)
            </DialogTitle>
            <DialogDescription>
              이 조합의 주문 내역입니다. (최대 100건)
            </DialogDescription>
          </DialogHeader>
          
          {selectedStat && (
            <div className="space-y-4">
              {/* 요약 */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">주문 건수</span>
                      <p className="font-semibold text-lg text-blue-600">
                        {formatNumber(selectedStat.orderCount)}건
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">총 매출</span>
                      <p className="font-semibold text-lg text-green-600">
                        ₩{formatNumber(Math.round(selectedStat.totalAmount))}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">최근 주문</span>
                      <p className="font-semibold text-lg">
                        {selectedStat.lastOrderDate
                          ? format(new Date(selectedStat.lastOrderDate), "MM/dd HH:mm", { locale: ko })
                          : "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* 주문 목록 */}
              {detailsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">로딩 중...</span>
                </div>
              ) : orderDetails.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">주문 내역이 없습니다.</p>
              ) : (
                <div className="rounded-md border max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>주문번호</TableHead>
                        <TableHead>주문일</TableHead>
                        <TableHead>고객명</TableHead>
                        <TableHead>주문처</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead className="text-right">금액</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderDetails.map((order) => (
                        <TableRow key={order.orderId}>
                          <TableCell className="font-mono text-xs">
                            {order.orderNumber || order.orderId.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(order.orderDate), "MM/dd HH:mm", { locale: ko })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {order.recipientName || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.orderSource || "자사몰"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.status === "DELIVERED" ? "default" : "secondary"}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ₩{formatNumber(Math.round(order.totalAmount))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
