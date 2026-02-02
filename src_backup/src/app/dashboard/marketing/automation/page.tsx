"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Zap, 
  ShoppingCart,
  UserX,
  Bell,
  Mail,
  MessageSquare,
  Gift,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { 
  getAutomationRules, 
  createAutomationRule, 
  toggleAutomationRule,
  getRepurchaseTargetCustomers,
  getChurnRiskCustomers,
  sendRepurchaseNotifications,
  sendWinbackCampaign,
  updateCustomerSegments,
  getCoupons,
} from "@/app/actions/marketing";

interface AutomationRule {
  id: string;
  name: string;
  description?: string | null;
  triggerType: string;
  triggerCondition?: string | null;
  actionType: string;
  actionConfig?: string | null;
  isActive: boolean;
  lastRunAt?: Date | null;
  createdAt: Date;
}

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("rules");

  // 즉시 실행 상태
  const [repurchaseCustomers, setRepurchaseCustomers] = useState<any[]>([]);
  const [churnCustomers, setChurnCustomers] = useState<any[]>([]);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    triggerType: "REPURCHASE_REMINDER",
    triggerDays: 30,
    actionType: "SEND_NOTIFICATION",
    couponId: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [rulesData, couponsData] = await Promise.all([
        getAutomationRules(),
        getCoupons({ status: "active" }),
      ]);
      setRules(rulesData);
      setCoupons(couponsData);
    } catch (error) {
      console.error("Failed to load automation data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRule() {
    if (!newRule.name) {
      alert("규칙 이름을 입력해주세요.");
      return;
    }

    setCreating(true);
    try {
      await createAutomationRule({
        name: newRule.name,
        description: newRule.description,
        triggerType: newRule.triggerType,
        triggerCondition: { days: newRule.triggerDays },
        actionType: newRule.actionType,
        actionConfig: newRule.couponId ? { couponId: newRule.couponId } : undefined,
      });
      setIsCreateOpen(false);
      setNewRule({
        name: "",
        description: "",
        triggerType: "REPURCHASE_REMINDER",
        triggerDays: 30,
        actionType: "SEND_NOTIFICATION",
        couponId: "",
      });
      loadData();
    } catch (error) {
      console.error("Failed to create rule:", error);
      alert("규칙 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleRule(id: string, isActive: boolean) {
    try {
      await toggleAutomationRule(id, !isActive);
      loadData();
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  }

  // 재구매 대상 조회
  async function loadRepurchaseTargets(days: number = 30) {
    setExecuting(true);
    try {
      const customers = await getRepurchaseTargetCustomers(days);
      setRepurchaseCustomers(customers);
    } catch (error) {
      console.error("Failed to load repurchase targets:", error);
    } finally {
      setExecuting(false);
    }
  }

  // 이탈 위험 고객 조회
  async function loadChurnRiskCustomers(days: number = 60) {
    setExecuting(true);
    try {
      const customers = await getChurnRiskCustomers(days);
      setChurnCustomers(customers);
    } catch (error) {
      console.error("Failed to load churn risk customers:", error);
    } finally {
      setExecuting(false);
    }
  }

  // 재구매 알림 발송
  async function executeRepurchaseNotification() {
    if (repurchaseCustomers.length === 0) {
      alert("대상 고객이 없습니다.");
      return;
    }

    setExecuting(true);
    try {
      const result = await sendRepurchaseNotifications(
        repurchaseCustomers.map(c => c.id)
      );
      setExecutionResult(result);
    } catch (error) {
      console.error("Failed to send notifications:", error);
      alert("알림 발송에 실패했습니다.");
    } finally {
      setExecuting(false);
    }
  }

  // 이탈고객 재유입 발송
  async function executeWinbackCampaign(couponId?: string) {
    if (churnCustomers.length === 0) {
      alert("대상 고객이 없습니다.");
      return;
    }

    setExecuting(true);
    try {
      const result = await sendWinbackCampaign(
        churnCustomers.map(c => c.id),
        couponId
      );
      setExecutionResult(result);
    } catch (error) {
      console.error("Failed to send winback campaign:", error);
      alert("캠페인 발송에 실패했습니다.");
    } finally {
      setExecuting(false);
    }
  }

  // 세그먼트 업데이트
  async function executeSegmentUpdate() {
    setExecuting(true);
    try {
      const result = await updateCustomerSegments();
      setExecutionResult(result);
    } catch (error) {
      console.error("Failed to update segments:", error);
      alert("세그먼트 업데이트에 실패했습니다.");
    } finally {
      setExecuting(false);
    }
  }

  function getTriggerTypeName(type: string) {
    switch (type) {
      case "REPURCHASE_REMINDER": return "재구매 알림";
      case "CHURN_PREVENTION": return "이탈 방지";
      case "BIRTHDAY": return "생일 축하";
      case "FIRST_ORDER": return "첫 주문 후";
      case "VIP_UPGRADE": return "VIP 승급";
      default: return type;
    }
  }

  function getActionTypeName(type: string) {
    switch (type) {
      case "SEND_NOTIFICATION": return "알림 발송";
      case "SEND_COUPON": return "쿠폰 발급";
      case "SEND_EMAIL": return "이메일 발송";
      case "SEND_SMS": return "SMS 발송";
      default: return type;
    }
  }

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
        <Link href="/dashboard/marketing/campaign">
          <Button variant="outline">캠페인</Button>
        </Link>
        <Link href="/dashboard/marketing/automation">
          <Button variant="default">자동화</Button>
        </Link>
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">마케팅 자동화</h2>
          <p className="text-muted-foreground">
            재구매 알림, 이탈 방지, 자동 쿠폰 발급 등 자동화 규칙을 관리하세요
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              새 규칙
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>자동화 규칙 만들기</DialogTitle>
              <DialogDescription>
                조건에 따라 자동으로 실행될 마케팅 규칙을 설정하세요
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">규칙명</Label>
                <Input
                  className="col-span-3"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="30일 재구매 알림"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">트리거</Label>
                <Select
                  value={newRule.triggerType}
                  onValueChange={(v) => setNewRule({ ...newRule, triggerType: v })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REPURCHASE_REMINDER">재구매 알림</SelectItem>
                    <SelectItem value="CHURN_PREVENTION">이탈 방지</SelectItem>
                    <SelectItem value="FIRST_ORDER">첫 주문 후</SelectItem>
                    <SelectItem value="VIP_UPGRADE">VIP 승급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">기준일</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    type="number"
                    value={newRule.triggerDays}
                    onChange={(e) => setNewRule({ ...newRule, triggerDays: Number(e.target.value) })}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">일 후</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">액션</Label>
                <Select
                  value={newRule.actionType}
                  onValueChange={(v) => setNewRule({ ...newRule, actionType: v })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEND_NOTIFICATION">알림 발송</SelectItem>
                    <SelectItem value="SEND_COUPON">쿠폰 발급</SelectItem>
                    <SelectItem value="SEND_EMAIL">이메일 발송</SelectItem>
                    <SelectItem value="SEND_SMS">SMS 발송</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newRule.actionType === "SEND_COUPON" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">쿠폰</Label>
                  <Select
                    value={newRule.couponId || "NONE"}
                    onValueChange={(v) => setNewRule({ ...newRule, couponId: v === "NONE" ? "" : v })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="쿠폰 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">쿠폰 선택</SelectItem>
                      {coupons.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">설명</Label>
                <Textarea
                  className="col-span-3"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="규칙에 대한 설명"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreateRule} disabled={creating}>
                {creating ? "생성 중..." : "규칙 생성"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">자동화 규칙</TabsTrigger>
          <TabsTrigger value="repurchase">재구매 알림</TabsTrigger>
          <TabsTrigger value="winback">이탈고객 재유입</TabsTrigger>
          <TabsTrigger value="segment">세그먼트 관리</TabsTrigger>
        </TabsList>

        {/* 자동화 규칙 탭 */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>등록된 자동화 규칙</CardTitle>
              <CardDescription>조건이 충족되면 자동으로 실행됩니다</CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>등록된 자동화 규칙이 없습니다.</p>
                  <Button variant="link" onClick={() => setIsCreateOpen(true)}>
                    새 규칙 만들기
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>규칙명</TableHead>
                      <TableHead>트리거</TableHead>
                      <TableHead>액션</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>마지막 실행</TableHead>
                      <TableHead className="text-right">활성화</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rule.name}</p>
                            {rule.description && (
                              <p className="text-xs text-muted-foreground">{rule.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getTriggerTypeName(rule.triggerType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getActionTypeName(rule.actionType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.isActive ? "default" : "secondary"}>
                            {rule.isActive ? "활성" : "비활성"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {rule.lastRunAt 
                            ? new Date(rule.lastRunAt).toLocaleString()
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={() => handleToggleRule(rule.id, rule.isActive)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 재구매 알림 탭 */}
        <TabsContent value="repurchase" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:border-blue-300" onClick={() => loadRepurchaseTargets(30)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  30일 미구매
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">마지막 주문 후 30일 경과 고객</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-orange-300" onClick={() => loadRepurchaseTargets(60)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  60일 미구매
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">마지막 주문 후 60일 경과 고객</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-red-300" onClick={() => loadRepurchaseTargets(90)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  90일 미구매
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">마지막 주문 후 90일 경과 고객</p>
              </CardContent>
            </Card>
          </div>

          {repurchaseCustomers.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>재구매 대상 고객</CardTitle>
                  <CardDescription>{repurchaseCustomers.length}명의 고객이 대상입니다</CardDescription>
                </div>
                <Button onClick={executeRepurchaseNotification} disabled={executing}>
                  <Bell className="mr-2 h-4 w-4" />
                  {executing ? "발송 중..." : "알림 발송"}
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>고객명</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>세그먼트</TableHead>
                      <TableHead>마지막 주문</TableHead>
                      <TableHead>경과일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repurchaseCustomers.slice(0, 20).map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{customer.segment || "-"}</Badge>
                        </TableCell>
                        <TableCell>{customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={customer.daysSinceOrder > 60 ? "destructive" : "secondary"}>
                            {customer.daysSinceOrder}일
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 이탈고객 재유입 탭 */}
        <TabsContent value="winback" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:border-yellow-300" onClick={() => loadChurnRiskCustomers(60)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserX className="h-4 w-4 text-yellow-600" />
                  이탈 위험 (60일+)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">60일 이상 미주문 고객</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-orange-300" onClick={() => loadChurnRiskCustomers(90)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserX className="h-4 w-4 text-orange-600" />
                  휴면 고객 (90일+)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">90일 이상 미주문 고객</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-red-300" onClick={() => loadChurnRiskCustomers(180)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserX className="h-4 w-4 text-red-600" />
                  장기 휴면 (180일+)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">180일 이상 미주문 고객</p>
              </CardContent>
            </Card>
          </div>

          {churnCustomers.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>이탈 위험 고객</CardTitle>
                  <CardDescription>{churnCustomers.length}명의 고객이 대상입니다</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select onValueChange={(v) => executeWinbackCampaign(v === "NONE" ? undefined : v)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="쿠폰과 함께 발송" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">쿠폰 없이 발송</SelectItem>
                      {coupons.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => executeWinbackCampaign()} disabled={executing}>
                    <Gift className="mr-2 h-4 w-4" />
                    {executing ? "발송 중..." : "재유입 캠페인"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>고객명</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>총 주문</TableHead>
                      <TableHead>총 구매액</TableHead>
                      <TableHead>미주문 기간</TableHead>
                      <TableHead>위험도</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {churnCustomers.slice(0, 20).map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.orderCount}건</TableCell>
                        <TableCell>₩{customer.totalSpent.toLocaleString()}</TableCell>
                        <TableCell>{customer.daysSinceLastOrder}일</TableCell>
                        <TableCell>
                          <Badge variant={
                            customer.churnRisk === "HIGH" ? "destructive" :
                            customer.churnRisk === "MEDIUM" ? "outline" : "secondary"
                          }>
                            {customer.churnRisk === "HIGH" ? "높음" :
                             customer.churnRisk === "MEDIUM" ? "중간" : "낮음"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 세그먼트 관리 탭 */}
        <TabsContent value="segment" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>고객 세그먼트 자동 분류</CardTitle>
                <CardDescription>
                  주문 이력, 구매 금액 등을 기반으로 고객을 자동 분류합니다
                </CardDescription>
              </div>
              <Button onClick={executeSegmentUpdate} disabled={executing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${executing ? "animate-spin" : ""}`} />
                {executing ? "업데이트 중..." : "세그먼트 업데이트"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 border rounded-lg bg-purple-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">VIP</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    총 구매액 50만원 이상 또는 주문 5회 이상
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">일반</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    활동 중인 일반 고객
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="font-medium">신규</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    가입 30일 이내, 주문 이력 없음
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">휴면</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    60일 이상 주문 없음
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {executionResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  실행 결과
                </CardTitle>
              </CardHeader>
              <CardContent>
                {executionResult.updated && (
                  <div className="grid gap-2 md:grid-cols-4">
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm font-medium">VIP 업데이트</p>
                      <p className="text-2xl font-bold">{executionResult.updated.VIP}명</p>
                    </div>
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm font-medium">일반 업데이트</p>
                      <p className="text-2xl font-bold">{executionResult.updated.REGULAR}명</p>
                    </div>
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm font-medium">신규 업데이트</p>
                      <p className="text-2xl font-bold">{executionResult.updated.NEW}명</p>
                    </div>
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm font-medium">휴면 업데이트</p>
                      <p className="text-2xl font-bold">{executionResult.updated.DORMANT}명</p>
                    </div>
                  </div>
                )}
                {executionResult.sentCount !== undefined && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-800">
                      {executionResult.sentCount}명에게 발송 완료
                    </p>
                    {executionResult.coupon && (
                      <p className="text-sm text-green-700 mt-1">
                        쿠폰: {executionResult.coupon.name} ({executionResult.coupon.code})
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
