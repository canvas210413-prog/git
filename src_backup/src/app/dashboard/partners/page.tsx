import { getPartners, getPartnerStats } from '@/app/actions/partners';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, Briefcase } from 'lucide-react';

export default async function PartnersPage() {
  const partners = await getPartners();
  const stats = await getPartnerStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">파트너 포털</h1>
        <p className="text-muted-foreground">
          파트너 현황 및 성과를 관리합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 파트너</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPartners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 파트너</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePartners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출 기여</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₩{stats.totalSales.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수수료 지급</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₩{stats.totalCommission.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>파트너 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    회사명
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    담당자
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    유형
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    상태
                  </th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                    최근 실적 (매출)
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {partners.map((partner) => (
                  <tr
                    key={partner.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle font-medium">
                      {partner.company || partner.name}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span>{partner.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {partner.email}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        {partner.type}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          partner.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : partner.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {partner.status}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right">
                      {partner.performances[0]
                        ? `₩${Number(partner.performances[0].salesAmount).toLocaleString()}`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
