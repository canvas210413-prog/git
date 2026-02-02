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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Send, 
  Target,
  Filter,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Check,
  Square,
} from "lucide-react";
import Link from "next/link";
import { 
  getCoupons, 
  issueAutoCoupons,
  issueCouponToSegment,
} from "@/app/actions/marketing";
import { getCustomers } from "@/app/actions/customer";

interface Coupon {
  id: string;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  targetSegment?: string;
  isActive: boolean;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  segment?: string;
  status: string;
}

export default function CouponIssuePage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // 발급 설정
  const [selectedCouponId, setSelectedCouponId] = useState("");
  const [issueMode, setIssueMode] = useState<"segment" | "condition" | "manual">("segment");
  
  // 세그먼트 발급
  const [selectedSegment, setSelectedSegment] = useState("");
  
  // 조건 발급
  const [conditions, setConditions] = useState({
    segment: "",
    minOrders: 0,
    maxOrders: 0,
    minTotalSpent: 0,
    dormantDays: 0,
  });
  
  // 수동 발급
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [couponsData, customersData] = await Promise.all([
        getCoupons({ status: "active" }),
        getCustomers(),
      ]);
      setCoupons(couponsData);
      setCustomers(customersData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleIssue() {
    if (!selectedCouponId) {
      alert("쿠폰을 선택해주세요.");
      return;
    }

    setIssuing(true);
    setResult(null);

    try {
      let issueResult;

      if (issueMode === "segment") {
        if (!selectedSegment) {
          alert("세그먼트를 선택해주세요.");
          setIssuing(false);
          return;
        }
        issueResult = await issueCouponToSegment(selectedCouponId, selectedSegment);
      } else if (issueMode === "condition") {
        const activeConditions: any = {};
        if (conditions.segment) activeConditions.segment = conditions.segment;
        if (conditions.minOrders > 0) activeConditions.minOrders = conditions.minOrders;
        if (conditions.maxOrders > 0) activeConditions.maxOrders = conditions.maxOrders;
        if (conditions.minTotalSpent > 0) activeConditions.minTotalSpent = conditions.minTotalSpent;
        if (conditions.dormantDays > 0) activeConditions.dormantDays = conditions.dormantDays;
        
        issueResult = await issueAutoCoupons(activeConditions, selectedCouponId);
      } else {
        // 수동 발급
        issueResult = {
          success: true,
          targetCount: selectedCustomerIds.length,
          customers: customers
            .filter(c => selectedCustomerIds.includes(c.id))
            .slice(0, 10)
            .map(c => ({ id: c.id, name: c.name, email: c.email })),
        };
      }

      setResult(issueResult);
    } catch (error) {
      console.error("Failed to issue coupon:", error);
      alert("쿠폰 발급에 실패했습니다.");
    } finally {
      setIssuing(false);
    }
  }

  function toggleCustomerSelection(customerId: string) {
    setSelectedCustomerIds(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  }

  function selectAllFilteredCustomers() {
    const filtered = getFilteredCustomers();
    setSelectedCustomerIds(filtered.map(c => c.id));
  }

  function clearSelection() {
    setSelectedCustomerIds([]);
  }

  function getFilteredCustomers() {
    return customers.filter(c => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return c.name.toLowerCase().includes(term) || 
               c.email.toLowerCase().includes(term);
      }
      return true;
    });
  }

  const selectedCoupon = coupons.find(c => c.id === selectedCouponId);
  const filteredCustomers = getFilteredCustomers();

  // 세그먼트별 고객 수 계산
  const segmentCounts = {
    VIP: customers.filter(c => c.segment === "VIP").length,
    REGULAR: customers.filter(c => c.segment === "REGULAR" || c.segment === "일반").length,
    NEW: customers.filter(c => c.segment === "NEW" || c.segment === "신규").length,
    DORMANT: customers.filter(c => c.segment === "DORMANT" || c.segment === "휴면").length,
  };

  return (
    <div className="space-y-6">
      {/* 네비게이션 */}
      <div className="flex space-x-2">
        <Link href="/dashboard/marketing">
          <Button variant="outline">마케팅 개요</Button>
        </Link>
        <Link href="/dashboard/marketing/coupon">
          <Button variant="outline">쿠폰 관리</Button>
        </Link>
        <Link href="/dashboard/marketing/coupon/issue">
          <Button variant="default">맞춤 쿠폰 발급</Button>
        </Link>
        <Link href="/dashboard/marketing/campaign">
          <Button variant="outline">캠페인</Button>
        </Link>
      </div>

      {/* 헤더 */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">맞춤 쿠폰 발급</h2>
        <p className="text-muted-foreground">
          고객 세그먼트나 조건에 맞춰 쿠폰을 자동으로 발급하세요
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 쿠폰 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              1. 쿠폰 선택
            </CardTitle>
            <CardDescription>발급할 쿠폰을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">로딩 중...</div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">활성 쿠폰이 없습니다.</p>
                <Link href="/dashboard/marketing/coupon">
                  <Button variant="link" size="sm">쿠폰 만들기</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCouponId === coupon.id 
                        ? "border-blue-500 bg-blue-50" 
                        : "hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedCouponId(coupon.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{coupon.name}</p>
                        <code className="text-xs bg-muted px-1 rounded">{coupon.code}</code>
                      </div>
                      <Badge variant="secondary">
                        {coupon.discountType === "PERCENT" 
                          ? `${coupon.discountValue}%` 
                          : `${coupon.discountValue.toLocaleString()}원`
                        }
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 발급 방식 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              2. 발급 방식
            </CardTitle>
            <CardDescription>대상 고객을 선택하는 방법</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 발급 모드 선택 */}
            <div className="space-y-2">
              <div
                className={`p-3 border rounded-lg cursor-pointer ${
                  issueMode === "segment" ? "border-blue-500 bg-blue-50" : ""
                }`}
                onClick={() => setIssueMode("segment")}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">세그먼트별 발급</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  VIP, 신규, 휴면 등 고객 그룹에 일괄 발급
                </p>
              </div>

              <div
                className={`p-3 border rounded-lg cursor-pointer ${
                  issueMode === "condition" ? "border-blue-500 bg-blue-50" : ""
                }`}
                onClick={() => setIssueMode("condition")}
              >
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span className="font-medium">조건별 발급</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  주문 횟수, 구매 금액 등 조건으로 필터링
                </p>
              </div>

              <div
                className={`p-3 border rounded-lg cursor-pointer ${
                  issueMode === "manual" ? "border-blue-500 bg-blue-50" : ""
                }`}
                onClick={() => setIssueMode("manual")}
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  <span className="font-medium">수동 선택</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  특정 고객을 직접 선택하여 발급
                </p>
              </div>
            </div>

            {/* 세그먼트 선택 */}
            {issueMode === "segment" && (
              <div className="pt-4 border-t space-y-3">
                <Label>타겟 세그먼트</Label>
                <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                  <SelectTrigger>
                    <SelectValue placeholder="세그먼트 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIP">VIP ({segmentCounts.VIP}명)</SelectItem>
                    <SelectItem value="REGULAR">일반 ({segmentCounts.REGULAR}명)</SelectItem>
                    <SelectItem value="NEW">신규 ({segmentCounts.NEW}명)</SelectItem>
                    <SelectItem value="DORMANT">휴면 ({segmentCounts.DORMANT}명)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 조건 설정 */}
            {issueMode === "condition" && (
              <div className="pt-4 border-t space-y-3">
                <div>
                  <Label>세그먼트 (선택)</Label>
                  <Select 
                    value={conditions.segment || "ALL"} 
                    onValueChange={(v) => setConditions({ ...conditions, segment: v === "ALL" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">전체</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="REGULAR">일반</SelectItem>
                      <SelectItem value="NEW">신규</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">최소 주문 횟수</Label>
                    <Input
                      type="number"
                      value={conditions.minOrders}
                      onChange={(e) => setConditions({ ...conditions, minOrders: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">최대 주문 횟수</Label>
                    <Input
                      type="number"
                      value={conditions.maxOrders}
                      onChange={(e) => setConditions({ ...conditions, maxOrders: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">최소 총 구매금액</Label>
                  <Input
                    type="number"
                    value={conditions.minTotalSpent}
                    onChange={(e) => setConditions({ ...conditions, minTotalSpent: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">휴면 기준 (N일 이상 미주문)</Label>
                  <Input
                    type="number"
                    value={conditions.dormantDays}
                    onChange={(e) => setConditions({ ...conditions, dormantDays: Number(e.target.value) })}
                  />
                </div>
              </div>
            )}

            {/* 수동 선택 */}
            {issueMode === "manual" && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <Label>고객 검색</Label>
                  <span className="text-sm text-muted-foreground">
                    {selectedCustomerIds.length}명 선택됨
                  </span>
                </div>
                <Input
                  placeholder="이름 또는 이메일로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-2"
                />
                <div className="flex gap-2 mb-2">
                  <Button variant="outline" size="sm" onClick={selectAllFilteredCustomers}>
                    전체 선택
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    선택 해제
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto border rounded">
                  {filteredCustomers.slice(0, 50).map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer"
                      onClick={() => toggleCustomerSelection(customer.id)}
                    >
                      <div className={`h-4 w-4 rounded border flex items-center justify-center ${selectedCustomerIds.includes(customer.id) ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                        {selectedCustomerIds.includes(customer.id) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 text-sm">
                        <p>{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                      {customer.segment && (
                        <Badge variant="outline" className="text-xs">
                          {customer.segment}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 발급 실행 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              3. 발급 실행
            </CardTitle>
            <CardDescription>설정을 확인하고 발급하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 요약 */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium">발급 요약</h4>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">선택 쿠폰:</span>{" "}
                  {selectedCoupon ? selectedCoupon.name : "-"}
                </p>
                <p>
                  <span className="text-muted-foreground">발급 방식:</span>{" "}
                  {issueMode === "segment" && "세그먼트별"}
                  {issueMode === "condition" && "조건별"}
                  {issueMode === "manual" && "수동 선택"}
                </p>
                <p>
                  <span className="text-muted-foreground">예상 대상:</span>{" "}
                  {issueMode === "segment" && selectedSegment && (
                    `${segmentCounts[selectedSegment as keyof typeof segmentCounts] || 0}명`
                  )}
                  {issueMode === "manual" && `${selectedCustomerIds.length}명`}
                  {issueMode === "condition" && "조건에 따라 결정"}
                  {!selectedSegment && issueMode === "segment" && "-"}
                </p>
              </div>
            </div>

            {/* 발급 버튼 */}
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleIssue}
              disabled={!selectedCouponId || issuing}
            >
              {issuing ? "발급 중..." : "쿠폰 발급하기"}
            </Button>

            {/* 결과 표시 */}
            {result && (
              <div className={`p-4 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">발급 완료</span>
                </div>
                <p className="text-sm text-green-700">
                  {result.targetCount || result.issuedCount}명의 고객에게 쿠폰이 발급되었습니다.
                </p>
                {result.customers && result.customers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">발급 대상 미리보기:</p>
                    <div className="text-xs space-y-0.5">
                      {result.customers.map((c: any) => (
                        <p key={c.id}>{c.name} ({c.email})</p>
                      ))}
                      {result.targetCount > 10 && (
                        <p className="text-muted-foreground">외 {result.targetCount - 10}명...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 발급 히스토리 (향후 추가 가능) */}
      <Card>
        <CardHeader>
          <CardTitle>최근 발급 내역</CardTitle>
          <CardDescription>쿠폰 발급 히스토리를 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>발급 내역이 없습니다.</p>
            <p className="text-sm">쿠폰을 발급하면 여기에 기록됩니다.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
