import { getAllPartnersForPortal } from "@/app/actions/partner-portal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Building2,
  TrendingUp,
  Award,
  Eye,
  DollarSign,
  UserCheck,
  UserX,
} from "lucide-react";
import Link from "next/link";

export default async function PartnerPortalPage() {
  let partners: any[] = [];
  let error = null;

  try {
    partners = await getAllPartnersForPortal();
  } catch (e) {
    console.error("Error loading partners:", e);
    error = e;
  }

  const activePartners = partners.filter((p) => p.status === "ACTIVE").length;
  const inactivePartners = partners.filter((p) => p.status !== "ACTIVE").length;
  const totalSales = partners.reduce((sum, p) => sum + p.latestSales, 0);

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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">파트너 포털</h2>
        <p className="text-muted-foreground">
          파트너사 현황을 관리하고 개별 파트너의 성과를 확인합니다.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 파트너</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners.length}</div>
            <p className="text-xs text-muted-foreground">등록된 파트너사</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 파트너</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activePartners}</div>
            <p className="text-xs text-muted-foreground">현재 활동중인 파트너</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">비활성 파트너</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactivePartners}</div>
            <p className="text-xs text-muted-foreground">비활성 상태</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">파트너 총 매출</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="flex gap-2">
        <Link href="/dashboard/partners">
          <Button variant="outline">파트너 관리</Button>
        </Link>
        <Link href="/dashboard/partners/performance">
          <Button variant="outline">성과 분석</Button>
        </Link>
        <Link href="/dashboard/partners/education">
          <Button variant="outline">교육 및 가이드</Button>
        </Link>
      </div>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            파트너 목록
          </CardTitle>
          <CardDescription>
            등록된 모든 파트너사의 현황과 최근 실적을 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>등록된 파트너가 없습니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>파트너명</TableHead>
                  <TableHead>회사</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">최근 매출</TableHead>
                  <TableHead className="text-right">수수료</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>{partner.company || "-"}</TableCell>
                    <TableCell>{partner.email}</TableCell>
                    <TableCell>{getTypeBadge(partner.type)}</TableCell>
                    <TableCell>{getStatusBadge(partner.status)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(partner.latestSales)}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(partner.latestCommission)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/partners/portal/${partner.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          상세
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tier Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            파트너 등급 안내
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-amber-600" />
                <span className="font-semibold">Bronze</span>
              </div>
              <p className="text-sm text-muted-foreground">2천만원 미만</p>
              <p className="text-sm font-medium text-blue-600">수수료 5%</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="font-semibold">Silver</span>
              </div>
              <p className="text-sm text-muted-foreground">2천만원 ~ 5천만원</p>
              <p className="text-sm font-medium text-blue-600">수수료 7%</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="font-semibold">Gold</span>
              </div>
              <p className="text-sm text-muted-foreground">5천만원 ~ 1억원</p>
              <p className="text-sm font-medium text-blue-600">수수료 10%</p>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="font-semibold">Platinum</span>
              </div>
              <p className="text-sm text-muted-foreground">1억원 이상</p>
              <p className="text-sm font-medium text-blue-600">수수료 15%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
