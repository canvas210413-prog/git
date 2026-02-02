import { getPartnerPortalData } from "@/app/actions/partner-portal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Building2,
  Mail,
  Phone,
  TrendingUp,
  Award,
  DollarSign,
  Target,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PartnerDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  let data: any = null;
  let error = null;

  try {
    data = await getPartnerPortalData(id);
  } catch (e) {
    console.error("Error loading partner data:", e);
    error = e;
  }

  if (!data) {
    notFound();
  }

  const { partner, stats, monthlyData } = data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800">활성</Badge>;
      case "INACTIVE":
        return <Badge variant="secondary">비활성</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">대기중</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "DISTRIBUTOR":
        return <Badge className="bg-purple-100 text-purple-800">총판</Badge>;
      case "RESELLER":
        return <Badge className="bg-blue-100 text-blue-800">리셀러</Badge>;
      case "REFERRAL":
        return <Badge className="bg-gray-100 text-gray-800">제휴</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return "text-purple-600";
      case "Gold":
        return "text-yellow-600";
      case "Silver":
        return "text-gray-500";
      default:
        return "text-amber-700";
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">데이터를 불러올 수 없습니다.</h2>
        <p className="text-muted-foreground mt-2">데이터베이스 연결을 확인해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/partners/portal">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{partner.name}</h2>
          <p className="text-muted-foreground">파트너 상세 정보 및 성과 현황</p>
        </div>
      </div>

      {/* Partner Info + Tier Card */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              파트너 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground w-20">회사</span>
              <span className="font-medium">{partner.company || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground w-20">이메일</span>
              <span className="font-medium">{partner.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground w-20">연락처</span>
              <span className="font-medium">{partner.phone || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-24">유형</span>
              {getTypeBadge(partner.type)}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-24">상태</span>
              {getStatusBadge(partner.status)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              등급 및 보상
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getTierColor(stats.tier)}`}>
                {stats.tier}
              </div>
              <p className="text-sm text-muted-foreground mt-1">현재 등급</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>다음 등급까지</span>
                <span className="font-medium">
                  {stats.nextTierSales > 0 
                    ? formatCurrency(stats.nextTierSales - stats.totalSales)
                    : "최고 등급"}
                </span>
              </div>
              <Progress value={stats.progress} className="h-2" />
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">수수료율</span>
                <span className="text-2xl font-bold text-blue-600">
                  {stats.rewardRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">올해 매출</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.thisYearSales)}</div>
            <p className="text-xs text-muted-foreground">2025년 누적</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">올해 수수료</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.thisYearCommission)}
            </div>
            <p className="text-xs text-muted-foreground">지급 예정</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">누적 매출</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
            <p className="text-xs text-muted-foreground">전체 누적</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">누적 수수료</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground">전체 수령액</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>월별 성과 내역</CardTitle>
          <CardDescription>파트너의 월별 매출 및 수수료 현황</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>아직 성과 기록이 없습니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>기간</TableHead>
                  <TableHead className="text-right">매출</TableHead>
                  <TableHead className="text-right">수수료</TableHead>
                  <TableHead className="text-right">리드</TableHead>
                  <TableHead className="text-right">성사 건수</TableHead>
                  <TableHead className="text-right">전환율</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((month: any) => {
                  const conversionRate = month.leadsCount > 0
                    ? ((month.dealsClosed / month.leadsCount) * 100).toFixed(1)
                    : 0;
                  
                  return (
                    <TableRow key={month.period}>
                      <TableCell className="font-medium">{month.period}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(month.salesAmount)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatCurrency(month.commission)}
                      </TableCell>
                      <TableCell className="text-right">{month.leadsCount}</TableCell>
                      <TableCell className="text-right">{month.dealsClosed}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{conversionRate}%</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
