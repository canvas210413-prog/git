"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Activity, Users, AlertTriangle, TrendingDown, Clock,
  Mail, Gift, UserMinus, ArrowRight, RefreshCw
} from "lucide-react";

interface ChurnRiskCustomer {
  id: string;
  name: string;
  email: string;
  segment: string;
  lastOrderDate: string;
  daysSinceOrder: number;
  totalSpent: number;
  riskScore: number;
  riskLevel: "critical" | "high" | "medium";
  riskFactors: string[];
}

export default function ChurnAlertsPage() {
  const [alertEnabled, setAlertEnabled] = useState(true);

  const [stats] = useState({
    totalAtRisk: 48,
    critical: 12,
    high: 18,
    medium: 18,
    potentialLoss: 15800000,
  });

  const [customers] = useState<ChurnRiskCustomer[]>([
    {
      id: "1",
      name: "김영희",
      email: "kim***@gmail.com",
      segment: "VIP",
      lastOrderDate: "2025-09-15",
      daysSinceOrder: 79,
      totalSpent: 2850000,
      riskScore: 92,
      riskLevel: "critical",
      riskFactors: ["90일 미주문 임박", "구매 빈도 감소", "최근 불만 문의"],
    },
    {
      id: "2",
      name: "이철수",
      email: "lee***@naver.com",
      segment: "VIP",
      lastOrderDate: "2025-09-28",
      daysSinceOrder: 66,
      totalSpent: 1920000,
      riskScore: 85,
      riskLevel: "critical",
      riskFactors: ["60일 이상 미주문", "평점 하락 리뷰"],
    },
    {
      id: "3",
      name: "박민수",
      email: "park***@gmail.com",
      segment: "REGULAR",
      lastOrderDate: "2025-10-10",
      daysSinceOrder: 54,
      totalSpent: 580000,
      riskScore: 72,
      riskLevel: "high",
      riskFactors: ["구매 주기 이탈", "장바구니 이탈 증가"],
    },
    {
      id: "4",
      name: "최지현",
      email: "choi***@daum.net",
      segment: "REGULAR",
      lastOrderDate: "2025-10-22",
      daysSinceOrder: 42,
      totalSpent: 420000,
      riskScore: 58,
      riskLevel: "medium",
      riskFactors: ["구매 빈도 감소"],
    },
  ]);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "critical": return <Badge variant="destructive">매우 높음</Badge>;
      case "high": return <Badge className="bg-orange-500">높음</Badge>;
      default: return <Badge className="bg-yellow-500">보통</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-600";
    return "text-yellow-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">고객 이탈 위험 알림</h2>
          <p className="text-muted-foreground">AI가 이탈 위험이 높은 고객을 예측합니다</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={alertEnabled} onCheckedChange={setAlertEnabled} />
            <Label>알림 활성화</Label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">이탈 위험 고객</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAtRisk}명</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">매우 높음</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{stats.critical}명</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">높음</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.high}명</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">보통</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{stats.medium}명</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">예상 손실</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₩{(stats.potentialLoss / 10000).toLocaleString()}만</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>이탈 위험 고객 목록</CardTitle>
          <CardDescription>위험도 순으로 정렬됩니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>고객명</TableHead>
                <TableHead>세그먼트</TableHead>
                <TableHead>마지막 주문</TableHead>
                <TableHead>총 구매액</TableHead>
                <TableHead>위험 점수</TableHead>
                <TableHead>위험도</TableHead>
                <TableHead>위험 요인</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell><Badge variant="outline">{customer.segment}</Badge></TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{customer.lastOrderDate}</div>
                      <div className="text-muted-foreground">{customer.daysSinceOrder}일 전</div>
                    </div>
                  </TableCell>
                  <TableCell>₩{customer.totalSpent.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`text-xl font-bold ${getScoreColor(customer.riskScore)}`}>
                      {customer.riskScore}
                    </span>
                  </TableCell>
                  <TableCell>{getRiskBadge(customer.riskLevel)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {customer.riskFactors.map((factor, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{factor}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline"><Mail className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline"><Gift className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
