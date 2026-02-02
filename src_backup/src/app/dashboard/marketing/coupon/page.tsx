"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Ticket, 
  Users, 
  TrendingUp, 
  Calendar,
  Copy,
  Trash2,
  Edit,
  RefreshCw,
  Gift,
  Target,
} from "lucide-react";
import Link from "next/link";
import { 
  getCoupons, 
  createCoupon, 
  deleteCoupon, 
  generateCouponCode,
  getMarketingStats,
  updateCoupon,
} from "@/app/actions/marketing";

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usagePerCustomer: number;
  usedCount: number;
  targetSegment?: string;
  isActive: boolean;
  usageCount: number;
}

export default function CouponPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // 새 쿠폰 폼 상태
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "PERCENT" as "PERCENT" | "FIXED",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    usageLimit: 0,
    usagePerCustomer: 1,
    targetSegment: "",
  });

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    setLoading(true);
    try {
      const [couponsData, statsData] = await Promise.all([
        getCoupons({ status: filter }),
        getMarketingStats(),
      ]);
      setCoupons(couponsData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load coupons:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateCode() {
    const code = await generateCouponCode("PROMO");
    setNewCoupon({ ...newCoupon, code });
  }

  async function handleCreateCoupon() {
    if (!newCoupon.code || !newCoupon.name) {
      alert("쿠폰 코드와 이름을 입력해주세요.");
      return;
    }

    setCreating(true);
    try {
      await createCoupon({
        ...newCoupon,
        validFrom: new Date(newCoupon.validFrom),
        validUntil: new Date(newCoupon.validUntil),
        minOrderAmount: newCoupon.minOrderAmount || undefined,
        maxDiscountAmount: newCoupon.maxDiscountAmount || undefined,
        usageLimit: newCoupon.usageLimit || undefined,
        targetSegment: newCoupon.targetSegment || undefined,
      });
      setIsCreateOpen(false);
      setNewCoupon({
        code: "",
        name: "",
        description: "",
        discountType: "PERCENT",
        discountValue: 10,
        minOrderAmount: 0,
        maxDiscountAmount: 0,
        validFrom: new Date().toISOString().split("T")[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        usageLimit: 0,
        usagePerCustomer: 1,
        targetSegment: "",
      });
      loadData();
    } catch (error) {
      console.error("Failed to create coupon:", error);
      alert("쿠폰 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteCoupon(id: string) {
    if (!confirm("정말 이 쿠폰을 삭제하시겠습니까?")) return;
    
    try {
      await deleteCoupon(id);
      loadData();
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      alert("쿠폰 삭제에 실패했습니다.");
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      await updateCoupon(id, { isActive: !currentActive });
      loadData();
    } catch (error) {
      console.error("Failed to update coupon:", error);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert("쿠폰 코드가 복사되었습니다.");
  }

  function getStatusBadge(coupon: Coupon) {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);
    
    if (!coupon.isActive) {
      return <Badge variant="secondary">비활성</Badge>;
    }
    if (validUntil < now) {
      return <Badge variant="destructive">만료됨</Badge>;
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return <Badge variant="outline">소진</Badge>;
    }
    return <Badge className="bg-green-500">활성</Badge>;
  }

  function formatDiscount(coupon: Coupon) {
    if (coupon.discountType === "PERCENT") {
      return `${coupon.discountValue}%`;
    }
    return `${coupon.discountValue.toLocaleString()}원`;
  }

  return (
    <div className="space-y-6">
      {/* 네비게이션 */}
      <div className="flex space-x-2">
        <Link href="/dashboard/marketing">
          <Button variant="outline">마케팅 개요</Button>
        </Link>
        <Link href="/dashboard/marketing/coupon">
          <Button variant="default">쿠폰 관리</Button>
        </Link>
        <Link href="/dashboard/marketing/coupon/issue">
          <Button variant="outline">맞춤 쿠폰 발급</Button>
        </Link>
        <Link href="/dashboard/marketing/campaign">
          <Button variant="outline">캠페인</Button>
        </Link>
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">쿠폰 관리</h2>
          <p className="text-muted-foreground">
            쿠폰을 생성하고 관리하세요
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              새 쿠폰 만들기
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 쿠폰 만들기</DialogTitle>
              <DialogDescription>
                할인 쿠폰을 생성합니다. 생성 후 고객에게 발급할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">쿠폰 코드</Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="code"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    placeholder="PROMO-XXXXXX"
                  />
                  <Button type="button" variant="outline" onClick={handleGenerateCode}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">쿠폰명</Label>
                <Input
                  id="name"
                  className="col-span-3"
                  value={newCoupon.name}
                  onChange={(e) => setNewCoupon({ ...newCoupon, name: e.target.value })}
                  placeholder="신규 가입 10% 할인"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">설명</Label>
                <Input
                  id="description"
                  className="col-span-3"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  placeholder="쿠폰 설명 (선택)"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">할인 유형</Label>
                <Select
                  value={newCoupon.discountType}
                  onValueChange={(v) => setNewCoupon({ ...newCoupon, discountType: v as "PERCENT" | "FIXED" })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">정률 할인 (%)</SelectItem>
                    <SelectItem value="FIXED">정액 할인 (원)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discountValue" className="text-right">할인 값</Label>
                <Input
                  id="discountValue"
                  type="number"
                  className="col-span-3"
                  value={newCoupon.discountValue}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minOrderAmount" className="text-right">최소 주문금액</Label>
                <Input
                  id="minOrderAmount"
                  type="number"
                  className="col-span-3"
                  value={newCoupon.minOrderAmount}
                  onChange={(e) => setNewCoupon({ ...newCoupon, minOrderAmount: Number(e.target.value) })}
                  placeholder="0 = 제한 없음"
                />
              </div>
              {newCoupon.discountType === "PERCENT" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="maxDiscountAmount" className="text-right">최대 할인금액</Label>
                  <Input
                    id="maxDiscountAmount"
                    type="number"
                    className="col-span-3"
                    value={newCoupon.maxDiscountAmount}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscountAmount: Number(e.target.value) })}
                    placeholder="0 = 제한 없음"
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="validFrom" className="text-right">시작일</Label>
                <Input
                  id="validFrom"
                  type="date"
                  className="col-span-3"
                  value={newCoupon.validFrom}
                  onChange={(e) => setNewCoupon({ ...newCoupon, validFrom: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="validUntil" className="text-right">종료일</Label>
                <Input
                  id="validUntil"
                  type="date"
                  className="col-span-3"
                  value={newCoupon.validUntil}
                  onChange={(e) => setNewCoupon({ ...newCoupon, validUntil: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="usageLimit" className="text-right">총 사용 한도</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  className="col-span-3"
                  value={newCoupon.usageLimit}
                  onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: Number(e.target.value) })}
                  placeholder="0 = 무제한"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="usagePerCustomer" className="text-right">1인당 사용</Label>
                <Input
                  id="usagePerCustomer"
                  type="number"
                  className="col-span-3"
                  value={newCoupon.usagePerCustomer}
                  onChange={(e) => setNewCoupon({ ...newCoupon, usagePerCustomer: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">타겟 세그먼트</Label>
                <Select
                  value={newCoupon.targetSegment || "ALL"}
                  onValueChange={(v) => setNewCoupon({ ...newCoupon, targetSegment: v === "ALL" ? "" : v })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="전체 고객" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체 고객</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="REGULAR">일반</SelectItem>
                    <SelectItem value="NEW">신규</SelectItem>
                    <SelectItem value="DORMANT">휴면</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreateCoupon} disabled={creating}>
                {creating ? "생성 중..." : "쿠폰 생성"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 쿠폰</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCoupons}</div>
              <p className="text-xs text-muted-foreground">
                활성: {stats.activeCoupons}개
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 사용 횟수</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsages}</div>
              <p className="text-xs text-muted-foreground">
                이번 달: {stats.thisMonthUsages}회
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 할인 금액</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalDiscount.toLocaleString()}원
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">진행 중 캠페인</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          전체
        </Button>
        <Button
          variant={filter === "active" ? "default" : "outline"}
          onClick={() => setFilter("active")}
        >
          활성
        </Button>
        <Button
          variant={filter === "expired" ? "default" : "outline"}
          onClick={() => setFilter("expired")}
        >
          만료/비활성
        </Button>
      </div>

      {/* 쿠폰 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>쿠폰 목록</CardTitle>
          <CardDescription>
            생성된 쿠폰을 관리하고 사용 현황을 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              로딩 중...
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>등록된 쿠폰이 없습니다.</p>
              <p className="text-sm">새 쿠폰을 만들어 보세요!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상태</TableHead>
                  <TableHead>쿠폰 코드</TableHead>
                  <TableHead>쿠폰명</TableHead>
                  <TableHead>할인</TableHead>
                  <TableHead>사용/한도</TableHead>
                  <TableHead>유효기간</TableHead>
                  <TableHead>타겟</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>{getStatusBadge(coupon)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{coupon.name}</p>
                        {coupon.description && (
                          <p className="text-xs text-muted-foreground">{coupon.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-blue-600">
                        {formatDiscount(coupon)}
                      </span>
                      {coupon.minOrderAmount && coupon.minOrderAmount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {coupon.minOrderAmount.toLocaleString()}원 이상
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={coupon.usageLimit && coupon.usedCount >= coupon.usageLimit ? "text-red-500" : ""}>
                        {coupon.usedCount}
                      </span>
                      <span className="text-muted-foreground">
                        /{coupon.usageLimit || "∞"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(coupon.validFrom).toLocaleDateString()}</p>
                        <p className="text-muted-foreground">
                          ~ {new Date(coupon.validUntil).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {coupon.targetSegment ? (
                        <Badge variant="outline">{coupon.targetSegment}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">전체</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                        >
                          {coupon.isActive ? "🔴" : "🟢"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
