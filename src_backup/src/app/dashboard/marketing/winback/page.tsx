"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  RefreshCw, Send, Users, AlertTriangle, Clock, UserMinus,
  Heart, Gift, ArrowLeft, TrendingDown, Shield
} from "lucide-react";
import Link from "next/link";
import { getChurnRiskCustomers, sendWinbackCampaign, getCoupons } from "@/app/actions/marketing";

interface ChurnCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  segment: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  daysSinceLastOrder: number;
  churnRisk: string;
}

export default function WinbackPage() {
  const [customers, setCustomers] = useState<ChurnCustomer[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [dormantDays, setDormantDays] = useState("60");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersData, couponsData] = await Promise.all([
        getChurnRiskCustomers(parseInt(dormantDays)),
        getCoupons({ status: "active" }),
      ]);
      
      let filteredCustomers = customersData as ChurnCustomer[];
      if (riskFilter !== "ALL") {
        filteredCustomers = filteredCustomers.filter((c) => c.churnRisk === riskFilter);
      }
      
      setCustomers(filteredCustomers);
      setCoupons(couponsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dormantDays, riskFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(customers.map(c => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerId]);
    } else {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
    }
  };

  const handleSendCampaign = async () => {
    if (selectedCustomers.length === 0) return;

    setSending(true);
    try {
      const result = await sendWinbackCampaign(
        selectedCustomers,
        selectedCoupon || undefined
      );
      setSendResult(result);
      setSelectedCustomers([]);
    } catch (error) {
      console.error("Failed to send campaign:", error);
    } finally {
      setSending(false);
    }
  };

  const getSegmentBadgeColor = (segment: string) => {
    switch (segment) {
      case "VIP": return "bg-purple-100 text-purple-800";
      case "REGULAR": return "bg-blue-100 text-blue-800";
      case "NEW": return "bg-green-100 text-green-800";
      case "DORMANT": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "HIGH":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            높음
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800">
            <Shield className="h-3 w-3" />
            보통
          </Badge>
        );
      case "LOW":
        return (
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            낮음
          </Badge>
        );
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const highRiskCount = customers.filter(c => c.churnRisk === "HIGH").length;
  const mediumRiskCount = customers.filter(c => c.churnRisk === "MEDIUM").length;
  const potentialRevenue = customers.reduce((sum, c) => sum + (c.totalSpent / Math.max(c.orderCount, 1)), 0);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/marketing">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">이탈고객 재유입</h2>
            <p className="text-muted-foreground">
              휴면 및 이탈 위험 고객을 식별하고 재유입 캠페인을 진행합니다
            </p>
          </div>
        </div>
        <Button
          onClick={() => setSendDialogOpen(true)}
          disabled={selectedCustomers.length === 0}
        >
          <Heart className="mr-2 h-4 w-4" />
          재유입 캠페인 ({selectedCustomers.length}명)
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">이탈 위험 (높음)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{highRiskCount}명</div>
            <p className="text-xs text-red-700">
              90일 이상 미주문
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">이탈 위험 (보통)</CardTitle>
            <Shield className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{mediumRiskCount}명</div>
            <p className="text-xs text-yellow-700">
              60~90일 미주문
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 이탈 위험</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}명</div>
            <p className="text-xs text-muted-foreground">
              {dormantDays}일 이상 미주문
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">예상 복귀 매출</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₩{Math.round(potentialRevenue).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              평균 객단가 기준
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>필터 조건</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>미주문 기간</Label>
              <Select value={dormantDays} onValueChange={setDormantDays}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30일 이상</SelectItem>
                  <SelectItem value="60">60일 이상</SelectItem>
                  <SelectItem value="90">90일 이상</SelectItem>
                  <SelectItem value="120">120일 이상</SelectItem>
                  <SelectItem value="180">180일 이상</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>이탈 위험도</Label>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="HIGH">높음</SelectItem>
                  <SelectItem value="MEDIUM">보통</SelectItem>
                  <SelectItem value="LOW">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 고객 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>이탈 위험 고객</CardTitle>
          <CardDescription>
            재유입 캠페인을 진행할 고객을 선택하세요. 쿠폰 발급과 함께 진행하면 효과적입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>고객 목록을 불러오는 중...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>해당 조건에 맞는 이탈 위험 고객이 없습니다.</p>
              <p className="text-sm">좋은 소식이네요! 고객 관리가 잘 되고 있습니다.</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedCustomers.length === customers.length}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      />
                    </TableHead>
                    <TableHead>고객명</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>세그먼트</TableHead>
                    <TableHead>이탈 위험도</TableHead>
                    <TableHead>미주문 기간</TableHead>
                    <TableHead className="text-right">주문 횟수</TableHead>
                    <TableHead className="text-right">총 구매액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCustomers.includes(customer.id)}
                          onCheckedChange={(checked) => 
                            handleSelectCustomer(customer.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{customer.email}</div>
                          <div className="text-muted-foreground">{customer.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSegmentBadgeColor(customer.segment)}>
                          {customer.segment}
                        </Badge>
                      </TableCell>
                      <TableCell>{getRiskBadge(customer.churnRisk)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {customer.daysSinceLastOrder}일
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{customer.orderCount}회</TableCell>
                      <TableCell className="text-right">
                        ₩{customer.totalSpent.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 재유입 캠페인 다이얼로그 */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>재유입 캠페인 발송</DialogTitle>
            <DialogDescription>
              {selectedCustomers.length}명의 이탈 위험 고객에게 재유입 캠페인을 발송합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>함께 발급할 쿠폰 (선택사항)</Label>
              <Select value={selectedCoupon} onValueChange={setSelectedCoupon}>
                <SelectTrigger>
                  <SelectValue placeholder="쿠폰을 선택하세요 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">쿠폰 없이 발송</SelectItem>
                  {coupons.map((coupon) => (
                    <SelectItem key={coupon.id} value={coupon.id}>
                      {coupon.name} ({coupon.code}) - 
                      {coupon.discountType === "PERCENT" 
                        ? `${coupon.discountValue}%` 
                        : `${coupon.discountValue.toLocaleString()}원`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                쿠폰과 함께 발송하면 재유입률이 높아집니다
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">발송 대상 분석</h4>
              <div className="text-sm space-y-1">
                <p>• 총 {selectedCustomers.length}명</p>
                <p className="text-red-600">
                  • 높은 위험: {customers.filter(c => selectedCustomers.includes(c.id) && c.churnRisk === "HIGH").length}명
                </p>
                <p className="text-yellow-600">
                  • 보통 위험: {customers.filter(c => selectedCustomers.includes(c.id) && c.churnRisk === "MEDIUM").length}명
                </p>
                <p>
                  • 잠재 매출: ₩{Math.round(
                    customers
                      .filter(c => selectedCustomers.includes(c.id))
                      .reduce((sum, c) => sum + (c.totalSpent / Math.max(c.orderCount, 1)), 0)
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4" />
                발송 메시지 미리보기
              </h4>
              <p className="text-sm text-blue-700">
                "고객님, 오랜만이에요! 다시 만나서 반갑습니다. 
                {selectedCoupon && selectedCoupon !== "NONE" && 
                  " 특별한 혜택을 준비했습니다!"}
                "
              </p>
            </div>

            {sendResult && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">✓ 캠페인 발송 완료</h4>
                <p className="text-sm text-green-700">
                  {sendResult.sentCount}명에게 재유입 캠페인이 발송되었습니다.
                  {sendResult.coupon && (
                    <span className="block mt-1">
                      쿠폰: {sendResult.coupon.name} ({sendResult.coupon.code})
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSendCampaign} disabled={sending}>
              {sending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  발송 중...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  캠페인 발송
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
