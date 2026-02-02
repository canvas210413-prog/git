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
  RefreshCw, Send, Users, Calendar, Mail, Megaphone, 
  PartyPopper, Gift, ArrowLeft, Plus 
} from "lucide-react";
import Link from "next/link";
import { getEventTargetCustomers, sendEventNotification } from "@/app/actions/marketing";

interface EventCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  segment: string;
  orderCount: number;
  totalSpent: number;
}

interface EventInfo {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  eventType: string;
}

export default function EventPage() {
  const [customers, setCustomers] = useState<EventCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [segmentFilter, setSegmentFilter] = useState("ALL");
  const [minOrdersFilter, setMinOrdersFilter] = useState("");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);
  
  const [eventInfo, setEventInfo] = useState<EventInfo>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    eventType: "PROMOTION",
  });

  // 예시 이벤트 템플릿
  const eventTemplates = [
    {
      title: "겨울 시즌 SALE",
      description: "따뜻한 겨울을 위한 특별 할인! 전 품목 최대 50% 할인",
      eventType: "SALE",
    },
    {
      title: "신규 상품 출시",
      description: "2024년 신상품이 도착했습니다! 지금 바로 확인하세요",
      eventType: "NEW_ARRIVAL",
    },
    {
      title: "회원 감사 이벤트",
      description: "소중한 고객님께 드리는 특별한 혜택. 추가 적립금 지급!",
      eventType: "REWARD",
    },
    {
      title: "무료 배송 이벤트",
      description: "이번 주 한정! 전 주문 무료 배송 혜택",
      eventType: "FREE_SHIPPING",
    },
  ];

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const segment = segmentFilter === "ALL" ? undefined : segmentFilter;
      const minOrders = minOrdersFilter ? parseInt(minOrdersFilter) : undefined;
      const data = await getEventTargetCustomers(segment, minOrders);
      setCustomers(data);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [segmentFilter, minOrdersFilter]);

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

  const handleApplyTemplate = (template: typeof eventTemplates[0]) => {
    setEventInfo({
      ...eventInfo,
      title: template.title,
      description: template.description,
      eventType: template.eventType,
    });
  };

  const handleSendNotification = async () => {
    if (selectedCustomers.length === 0 || !eventInfo.title) return;

    setSending(true);
    try {
      const result = await sendEventNotification(selectedCustomers, {
        title: eventInfo.title,
        description: eventInfo.description,
        startDate: eventInfo.startDate,
        endDate: eventInfo.endDate,
      });
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

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "SALE": return <Gift className="h-4 w-4 text-red-500" />;
      case "NEW_ARRIVAL": return <PartyPopper className="h-4 w-4 text-blue-500" />;
      case "REWARD": return <Gift className="h-4 w-4 text-yellow-500" />;
      case "FREE_SHIPPING": return <Mail className="h-4 w-4 text-green-500" />;
      default: return <Megaphone className="h-4 w-4 text-gray-500" />;
    }
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
            <h2 className="text-3xl font-bold tracking-tight">이벤트 안내</h2>
            <p className="text-muted-foreground">
              프로모션, 신상품 출시, 이벤트 정보를 고객에게 알립니다
            </p>
          </div>
        </div>
        <Button
          onClick={() => setSendDialogOpen(true)}
          disabled={selectedCustomers.length === 0}
        >
          <Send className="mr-2 h-4 w-4" />
          이벤트 발송 ({selectedCustomers.length}명)
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 대상</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}명</div>
            <p className="text-xs text-muted-foreground">활성 고객</p>
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
            <p className="text-xs text-muted-foreground">프리미엄 대상</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">신규 고객</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.segment === "NEW").length}명
            </div>
            <p className="text-xs text-muted-foreground">웰컴 이벤트 대상</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">선택된 고객</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedCustomers.length}명</div>
            <p className="text-xs text-muted-foreground">발송 대상</p>
          </CardContent>
        </Card>
      </div>

      {/* 이벤트 템플릿 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5" />
            이벤트 템플릿
          </CardTitle>
          <CardDescription>
            미리 준비된 템플릿을 선택하거나 직접 이벤트를 작성하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {eventTemplates.map((template, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => handleApplyTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getEventTypeIcon(template.eventType)}
                    <span className="font-medium text-sm">{template.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>대상 고객 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>세그먼트</Label>
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="REGULAR">일반</SelectItem>
                  <SelectItem value="NEW">신규</SelectItem>
                  <SelectItem value="DORMANT">휴면</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>최소 주문 횟수</Label>
              <Input
                type="number"
                className="w-24"
                value={minOrdersFilter}
                onChange={(e) => setMinOrdersFilter(e.target.value)}
                placeholder="0"
              />
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
          <CardTitle>이벤트 대상 고객</CardTitle>
          <CardDescription>
            이벤트 알림을 받을 고객을 선택하세요
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
                    <TableHead className="text-right">주문 횟수</TableHead>
                    <TableHead className="text-right">총 구매 금액</TableHead>
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

      {/* 이벤트 발송 다이얼로그 */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>이벤트 알림 발송</DialogTitle>
            <DialogDescription>
              {selectedCustomers.length}명의 고객에게 이벤트 알림을 발송합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>이벤트 제목 *</Label>
              <Input
                value={eventInfo.title}
                onChange={(e) => setEventInfo({ ...eventInfo, title: e.target.value })}
                placeholder="이벤트 제목을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label>이벤트 내용</Label>
              <Textarea
                value={eventInfo.description}
                onChange={(e) => setEventInfo({ ...eventInfo, description: e.target.value })}
                rows={3}
                placeholder="이벤트 상세 내용을 입력하세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>시작일</Label>
                <Input
                  type="date"
                  value={eventInfo.startDate}
                  onChange={(e) => setEventInfo({ ...eventInfo, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>종료일</Label>
                <Input
                  type="date"
                  value={eventInfo.endDate}
                  onChange={(e) => setEventInfo({ ...eventInfo, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>이벤트 유형</Label>
              <Select
                value={eventInfo.eventType}
                onValueChange={(value) => setEventInfo({ ...eventInfo, eventType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROMOTION">프로모션</SelectItem>
                  <SelectItem value="SALE">세일</SelectItem>
                  <SelectItem value="NEW_ARRIVAL">신상품</SelectItem>
                  <SelectItem value="REWARD">리워드</SelectItem>
                  <SelectItem value="FREE_SHIPPING">무료배송</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">발송 미리보기</h4>
              <div className="text-sm space-y-1">
                <p className="font-medium">{eventInfo.title || "(제목 없음)"}</p>
                <p className="text-muted-foreground">{eventInfo.description || "(내용 없음)"}</p>
                {eventInfo.startDate && (
                  <p className="text-xs text-muted-foreground">
                    <Calendar className="inline h-3 w-3 mr-1" />
                    {eventInfo.startDate} ~ {eventInfo.endDate || "미정"}
                  </p>
                )}
              </div>
            </div>

            {sendResult && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">✓ 발송 완료</h4>
                <p className="text-sm text-green-700">
                  {sendResult.sentCount}명에게 이벤트 알림이 발송되었습니다.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={handleSendNotification} 
              disabled={sending || !eventInfo.title}
            >
              {sending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  발송 중...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  이벤트 발송
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
