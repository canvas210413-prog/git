"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Target, 
  Calendar,
  BarChart2,
  TrendingUp,
  Users,
  Mail,
  Bell,
  RefreshCw,
  UserX,
  ShoppingCart,
  Megaphone,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  Send,
} from "lucide-react";
import Link from "next/link";
import { 
  getCampaigns, 
  createCampaign,
  updateCampaignStatus,
  getMarketingStats,
} from "@/app/actions/marketing";

interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  startDate: Date;
  endDate: Date;
  budget?: number;
  spent?: number;
  targetSegment?: string;
  roi?: number;
  createdAt: Date;
}

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    type: "PROMOTION",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    budget: 0,
    targetSegment: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [campaignsData, statsData] = await Promise.all([
        getCampaigns(),
        getMarketingStats(),
      ]);
      setCampaigns(campaignsData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load campaigns:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCampaign() {
    if (!newCampaign.name) {
      alert("캠페인 이름을 입력해주세요.");
      return;
    }

    setCreating(true);
    try {
      await createCampaign({
        name: newCampaign.name,
        description: newCampaign.description,
        type: newCampaign.type,
        startDate: new Date(newCampaign.startDate),
        endDate: new Date(newCampaign.endDate),
        budget: newCampaign.budget || undefined,
        targetSegment: newCampaign.targetSegment || undefined,
      });
      setIsCreateOpen(false);
      setNewCampaign({
        name: "",
        description: "",
        type: "PROMOTION",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        budget: 0,
        targetSegment: "",
      });
      loadData();
    } catch (error) {
      console.error("Failed to create campaign:", error);
      alert("캠페인 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(campaignId: string, newStatus: string) {
    try {
      await updateCampaignStatus(campaignId, newStatus);
      loadData();
    } catch (error) {
      console.error("Failed to update campaign status:", error);
      alert("상태 변경에 실패했습니다.");
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">기획중</Badge>;
      case "ACTIVE":
        return <Badge variant="default" className="bg-green-500">진행중</Badge>;
      case "PAUSED":
        return <Badge variant="outline">일시중지</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary">완료</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case "REPURCHASE":
        return <Badge variant="outline" className="border-blue-500 text-blue-600"><ShoppingCart className="h-3 w-3 mr-1" />재구매</Badge>;
      case "EVENT":
        return <Badge variant="outline" className="border-purple-500 text-purple-600"><Megaphone className="h-3 w-3 mr-1" />이벤트</Badge>;
      case "WINBACK":
        return <Badge variant="outline" className="border-orange-500 text-orange-600"><UserX className="h-3 w-3 mr-1" />재유입</Badge>;
      case "PROMOTION":
        return <Badge variant="outline" className="border-green-500 text-green-600"><Target className="h-3 w-3 mr-1" />프로모션</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  }

  const filteredCampaigns = campaigns.filter(c => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return c.status === "ACTIVE";
    if (activeTab === "draft") return c.status === "DRAFT";
    if (activeTab === "completed") return c.status === "COMPLETED";
    return true;
  });

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
          <Button variant="outline">맞춤 쿠폰 발급</Button>
        </Link>
        <Link href="/dashboard/marketing/campaign">
          <Button variant="default">캠페인</Button>
        </Link>
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">캠페인 관리</h2>
          <p className="text-muted-foreground">
            마케팅 캠페인을 생성하고 효과를 분석하세요
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              새 캠페인
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>새 캠페인 만들기</DialogTitle>
              <DialogDescription>
                마케팅 캠페인을 생성하세요
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">캠페인명</Label>
                <Input
                  className="col-span-3"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="여름 세일 캠페인"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">유형</Label>
                <Select
                  value={newCampaign.type}
                  onValueChange={(v) => setNewCampaign({ ...newCampaign, type: v })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROMOTION">프로모션</SelectItem>
                    <SelectItem value="REPURCHASE">재구매 알림</SelectItem>
                    <SelectItem value="EVENT">이벤트 안내</SelectItem>
                    <SelectItem value="WINBACK">이탈고객 재유입</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">설명</Label>
                <Textarea
                  className="col-span-3"
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  placeholder="캠페인 설명을 입력하세요"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">시작일</Label>
                <Input
                  type="date"
                  className="col-span-3"
                  value={newCampaign.startDate}
                  onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">종료일</Label>
                <Input
                  type="date"
                  className="col-span-3"
                  value={newCampaign.endDate}
                  onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">예산 (원)</Label>
                <Input
                  type="number"
                  className="col-span-3"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign({ ...newCampaign, budget: Number(e.target.value) })}
                  placeholder="1000000"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">타겟 세그먼트</Label>
                <Select
                  value={newCampaign.targetSegment || "ALL"}
                  onValueChange={(v) => setNewCampaign({ ...newCampaign, targetSegment: v === "ALL" ? "" : v })}
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
              <Button onClick={handleCreateCampaign} disabled={creating}>
                {creating ? "생성 중..." : "캠페인 생성"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 캠페인</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              진행중: {campaigns.filter(c => c.status === "ACTIVE").length}개
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 예산</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₩{campaigns.reduce((sum, c) => sum + (Number(c.budget) || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              집행: ₩{campaigns.reduce((sum, c) => sum + (Number(c.spent) || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {campaigns.length > 0 
                ? Math.round(campaigns.reduce((sum, c) => sum + (Number(c.roi) || 0), 0) / campaigns.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              투자 대비 수익률
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">쿠폰 사용</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsages || 0}회</div>
            <p className="text-xs text-muted-foreground">
              이번달: {stats?.thisMonthUsages || 0}회
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 캠페인 유형별 빠른 액션 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => {
          setNewCampaign({ ...newCampaign, type: "REPURCHASE", name: "재구매 유도 캠페인" });
          setIsCreateOpen(true);
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              재구매 알림
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              구매 후 일정 기간이 지난 고객에게 재구매를 유도
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-purple-300 transition-colors" onClick={() => {
          setNewCampaign({ ...newCampaign, type: "EVENT", name: "이벤트 안내 캠페인" });
          setIsCreateOpen(true);
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-purple-600" />
              이벤트 안내
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              특별 이벤트, 세일, 신상품 출시 안내
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-orange-300 transition-colors" onClick={() => {
          setNewCampaign({ ...newCampaign, type: "WINBACK", name: "휴면고객 재유입 캠페인", targetSegment: "DORMANT" });
          setIsCreateOpen(true);
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserX className="h-4 w-4 text-orange-600" />
              이탈고객 재유입
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              장기간 구매가 없는 휴면 고객 활성화
            </p>
          </CardContent>
        </Card>

        <Link href="/dashboard/marketing/analytics">
          <Card className="cursor-pointer hover:border-green-300 transition-colors h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-green-600" />
                캠페인 효과분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                캠페인별 ROI, 전환율, 매출 기여도 분석
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 캠페인 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>캠페인 목록</CardTitle>
          <CardDescription>모든 마케팅 캠페인을 관리하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">전체 ({campaigns.length})</TabsTrigger>
              <TabsTrigger value="active">진행중 ({campaigns.filter(c => c.status === "ACTIVE").length})</TabsTrigger>
              <TabsTrigger value="draft">기획중 ({campaigns.filter(c => c.status === "DRAFT").length})</TabsTrigger>
              <TabsTrigger value="completed">완료 ({campaigns.filter(c => c.status === "COMPLETED").length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>캠페인이 없습니다.</p>
                  <Button variant="link" onClick={() => setIsCreateOpen(true)}>
                    새 캠페인 만들기
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>캠페인명</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>기간</TableHead>
                      <TableHead>예산/집행</TableHead>
                      <TableHead>ROI</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            {campaign.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {campaign.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(campaign.type)}</TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{new Date(campaign.startDate).toLocaleDateString()}</p>
                            <p className="text-muted-foreground">~ {new Date(campaign.endDate).toLocaleDateString()}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {campaign.budget ? (
                            <div className="text-sm">
                              <p>₩{Number(campaign.budget).toLocaleString()}</p>
                              <div className="flex items-center gap-1">
                                <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary" 
                                    style={{ width: `${Math.min((Number(campaign.spent) / Number(campaign.budget)) * 100, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round((Number(campaign.spent || 0) / Number(campaign.budget)) * 100)}%
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${Number(campaign.roi) > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                            {campaign.roi ? `${campaign.roi}%` : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {campaign.status === "DRAFT" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStatusChange(campaign.id, "ACTIVE")}
                                title="시작"
                              >
                                <Play className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {campaign.status === "ACTIVE" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStatusChange(campaign.id, "PAUSED")}
                                title="일시중지"
                              >
                                <Pause className="h-4 w-4 text-orange-600" />
                              </Button>
                            )}
                            {campaign.status === "PAUSED" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStatusChange(campaign.id, "ACTIVE")}
                                title="재개"
                              >
                                <Play className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Link href={`/dashboard/marketing/analytics?campaignId=${campaign.id}`}>
                              <Button variant="ghost" size="icon" title="분석">
                                <BarChart2 className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
