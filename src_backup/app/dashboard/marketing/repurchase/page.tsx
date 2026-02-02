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
import { RefreshCw, Send, Users, Calendar, Clock, Filter, Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getRepurchaseTargetCustomers, sendRepurchaseNotifications } from "@/app/actions/marketing";

interface RepurchaseCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  segment: string;
  lastOrderDate: string;
  lastOrderAmount: number;
  lastOrderProduct: string;
  daysSinceOrder: number;
}

export default function RepurchasePage() {
  const [customers, setCustomers] = useState<RepurchaseCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [daysSinceOrder, setDaysSinceOrder] = useState("30");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState(
    "고객님, 안녕하세요! 지난번 구매에 만족하셨나요? 재구매 시 특별 할인 혜택을 드립니다. 지금 방문해보세요!"
  );
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await getRepurchaseTargetCustomers(parseInt(daysSinceOrder));
      setCustomers(data);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [daysSinceOrder]);

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

  const handleSendNotification = async () => {
    if (selectedCustomers.length === 0) return;

    setSending(true);
    try {
      const result = await sendRepurchaseNotifications(selectedCustomers, notificationMessage);
      setSendResult(result);
      setSelectedCustomers([]);
    } catch (error) {
      console.error("Failed to send notifications:", error);
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

  const getDaysBadgeColor = (days: number) => {
    if (days > 60) return "destructive";
    if (days > 45) return "secondary";
    return "outline";
  };

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
            <h2 className="text-3xl font-bold tracking-tight">재구매 알림</h2>
            <p className="text-muted-foreground">
              일정 기간 주문이 없는 고객에게 재구매 유도 알림을 발송합니다
            </p>
          </div>
        </div>
        <Button
          onClick={() => setSendDialogOpen(true)}
          disabled={selectedCustomers.length === 0}
        >
          <Send className="mr-2 h-4 w-4" />
          알림 발송 ({selectedCustomers.length}명)
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">재구매 대상</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}명</div>
            <p className="text-xs text-muted-foreground">
              {daysSinceOrder}일 이상 미주문
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP 고객</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.segment === "VIP").length}명
            </div>
            <p className="text-xs text-muted-foreground">
              우선 관리 필요
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 미주문 기간</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.length > 0
                ? Math.round(customers.reduce((sum, c) => sum + c.daysSinceOrder, 0) / customers.length)
                : 0}일
            </div>
            <p className="text-xs text-muted-foreground">
              마지막 주문 후 경과일
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">선택된 고객</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedCustomers.length}명</div>
            <p className="text-xs text-muted-foreground">
              알림 발송 대상
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            필터 조건
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>마지막 주문 후</Label>
              <Select value={daysSinceOrder} onValueChange={setDaysSinceOrder}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">14일 이상</SelectItem>
                  <SelectItem value="30">30일 이상</SelectItem>
                  <SelectItem value="45">45일 이상</SelectItem>
                  <SelectItem value="60">60일 이상</SelectItem>
                  <SelectItem value="90">90일 이상</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={loadCustomers} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 고객 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>재구매 대상 고객</CardTitle>
          <CardDescription>
            선택한 고객에게 재구매 유도 알림을 발송할 수 있습니다
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
              <p>해당 조건에 맞는 고객이 없습니다.</p>
              <p className="text-sm">필터 조건을 변경해보세요.</p>
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
                    <TableHead>마지막 주문일</TableHead>
                    <TableHead>미주문 기간</TableHead>
                    <TableHead className="text-right">마지막 주문 금액</TableHead>
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
                      <TableCell>
                        {customer.lastOrderDate
                          ? new Date(customer.lastOrderDate).toLocaleDateString("ko-KR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getDaysBadgeColor(customer.daysSinceOrder)}>
                          <Clock className="mr-1 h-3 w-3" />
                          {customer.daysSinceOrder}일
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ₩{customer.lastOrderAmount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 알림 발송 다이얼로그 */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>재구매 알림 발송</DialogTitle>
            <DialogDescription>
              {selectedCustomers.length}명의 고객에게 재구매 유도 알림을 발송합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>알림 메시지</Label>
              <Textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={4}
                placeholder="알림 메시지를 입력하세요..."
              />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">발송 대상</h4>
              <div className="text-sm text-muted-foreground">
                <p>• 총 {selectedCustomers.length}명</p>
                <p>• VIP: {customers.filter(c => selectedCustomers.includes(c.id) && c.segment === "VIP").length}명</p>
                <p>• 일반: {customers.filter(c => selectedCustomers.includes(c.id) && c.segment !== "VIP").length}명</p>
              </div>
            </div>

            {sendResult && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">✓ 발송 완료</h4>
                <p className="text-sm text-green-700">
                  {sendResult.sentCount}명에게 알림이 발송되었습니다.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSendNotification} disabled={sending}>
              {sending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  발송 중...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  알림 발송
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
