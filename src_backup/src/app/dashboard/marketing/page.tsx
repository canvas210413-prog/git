import { getCampaigns, getMarketingStats, getCoupons } from "@/app/actions/marketing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, BarChart2, Calendar, Ticket, Users, TrendingUp, Target, Gift, Send, RefreshCw, Mail, UserMinus } from "lucide-react";
import Link from "next/link";

export default async function MarketingPage() {
  let campaigns, stats, coupons;
  
  try {
    [campaigns, stats, coupons] = await Promise.all([
      getCampaigns(),
      getMarketingStats(),
      getCoupons({ status: "active" }),
    ]);
  } catch (error) {
    console.error("Failed to load marketing data:", error);
    campaigns = [];
    stats = {
      totalCoupons: 0,
      activeCoupons: 0,
      totalUsages: 0,
      thisMonthUsages: 0,
      activeCampaigns: 0,
      totalDiscount: 0,
    };
    coupons = [];
  }

  return (
    <div className="space-y-8">
      {/* 마케팅 자동화 기능 메뉴 */}
      <Card>
        <CardHeader>
          <CardTitle>마케팅 자동화</CardTitle>
          <CardDescription>자동화된 마케팅 기능을 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <Link href="/dashboard/marketing/coupon/issue">
              <Card className="cursor-pointer hover:border-blue-400 transition-colors h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="p-3 bg-blue-100 rounded-full mb-3">
                    <Gift className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="font-medium">맞춤 쿠폰 발송</span>
                  <span className="text-xs text-muted-foreground mt-1">세그먼트별 쿠폰 발급</span>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/dashboard/marketing/repurchase">
              <Card className="cursor-pointer hover:border-green-400 transition-colors h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="p-3 bg-green-100 rounded-full mb-3">
                    <RefreshCw className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="font-medium">재구매 알림</span>
                  <span className="text-xs text-muted-foreground mt-1">미주문 고객 알림</span>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/dashboard/marketing/event">
              <Card className="cursor-pointer hover:border-purple-400 transition-colors h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="p-3 bg-purple-100 rounded-full mb-3">
                    <Mail className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="font-medium">이벤트 안내</span>
                  <span className="text-xs text-muted-foreground mt-1">프로모션 알림</span>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/dashboard/marketing/winback">
              <Card className="cursor-pointer hover:border-red-400 transition-colors h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="p-3 bg-red-100 rounded-full mb-3">
                    <UserMinus className="h-6 w-6 text-red-600" />
                  </div>
                  <span className="font-medium">이탈고객 재유입</span>
                  <span className="text-xs text-muted-foreground mt-1">휴면 고객 관리</span>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/dashboard/marketing/analytics">
              <Card className="cursor-pointer hover:border-orange-400 transition-colors h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="p-3 bg-orange-100 rounded-full mb-3">
                    <BarChart2 className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="font-medium">캠페인 효과 분석</span>
                  <span className="text-xs text-muted-foreground mt-1">ROI 및 성과 분석</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">마케팅 자동화</h2>
          <p className="text-muted-foreground">
            쿠폰 발급, 캠페인 관리, 고객 타겟팅을 자동화하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/marketing/coupon">
            <Button variant="outline">
              <Ticket className="mr-2 h-4 w-4" />
              쿠폰 관리
            </Button>
          </Link>
          <Link href="/dashboard/marketing/coupon/issue">
            <Button>
              <Send className="mr-2 h-4 w-4" />
              쿠폰 발급
            </Button>
          </Link>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 쿠폰</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCoupons}</div>
            <p className="text-xs text-muted-foreground">
              전체 {stats.totalCoupons}개 중
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 쿠폰 사용</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthUsages}회</div>
            <p className="text-xs text-muted-foreground">
              총 {stats.totalUsages}회 사용됨
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 할인 금액</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₩{stats.totalDiscount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              누적 할인 금액
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행 중 캠페인</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              활성 캠페인
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 퀵 액션 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/marketing/coupon">
          <Card className="cursor-pointer hover:border-blue-300 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-blue-600" />
                쿠폰 관리
              </CardTitle>
              <CardDescription>
                쿠폰 생성, 수정, 삭제 및 사용 현황 확인
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats.activeCoupons}개의 활성 쿠폰이 있습니다
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/marketing/coupon/issue">
          <Card className="cursor-pointer hover:border-green-300 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-600" />
                맞춤 쿠폰 발급
              </CardTitle>
              <CardDescription>
                세그먼트/조건 기반 자동 쿠폰 발급
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                VIP, 신규, 휴면 고객에게 타겟 발급
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/marketing/campaign">
          <Card className="cursor-pointer hover:border-purple-300 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                캠페인 관리
              </CardTitle>
              <CardDescription>
                마케팅 캠페인 생성 및 성과 측정
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats.activeCampaigns}개의 캠페인 진행 중
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 활성 쿠폰 미리보기 */}
      {coupons.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>활성 쿠폰</CardTitle>
              <CardDescription>현재 사용 가능한 쿠폰 목록</CardDescription>
            </div>
            <Link href="/dashboard/marketing/coupon">
              <Button variant="outline" size="sm">전체 보기</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {coupons.slice(0, 5).map((coupon: any) => (
                <div key={coupon.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded">
                      <Ticket className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{coupon.name}</p>
                      <code className="text-xs bg-muted px-1 rounded">{coupon.code}</code>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {coupon.discountType === "PERCENT" 
                        ? `${coupon.discountValue}% 할인` 
                        : `${coupon.discountValue.toLocaleString()}원 할인`
                      }
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {coupon.usedCount}/{coupon.usageLimit || "∞"} 사용됨
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 캠페인 목록 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>캠페인</CardTitle>
            <CardDescription>마케팅 캠페인 현황</CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> 캠페인 생성
          </Button>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>등록된 캠페인이 없습니다.</p>
              <p className="text-sm">새 캠페인을 만들어 보세요!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign: any) => (
                <Card key={campaign.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {campaign.name}
                    </CardTitle>
                    <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"}>
                      {campaign.status === "ACTIVE" ? "진행중" : 
                       campaign.status === "DRAFT" ? "기획중" : "종료됨"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {new Date(campaign.startDate).toLocaleDateString()} ~ {new Date(campaign.endDate).toLocaleDateString()}
                      </div>
                      {campaign.budget && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">예산</p>
                            <p className="text-lg font-bold">₩{Number(campaign.budget).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">ROI</p>
                            <div className="flex items-center text-green-600">
                              <BarChart2 className="mr-1 h-4 w-4" />
                              <span className="text-lg font-bold">{campaign.roi}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {campaign.budget && (
                        <div className="pt-2">
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${Math.min((Number(campaign.spent) / Number(campaign.budget)) * 100, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-right mt-1 text-muted-foreground">
                            {Math.round((Number(campaign.spent) / Number(campaign.budget)) * 100)}% 집행됨
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}