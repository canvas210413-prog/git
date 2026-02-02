import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, TrendingDown, Users, ShoppingCart, 
  DollarSign, Star, Clock, MessageSquare, Wrench,
  ArrowUp, ArrowDown, Minus, ThumbsUp, ThumbsDown, Building2
} from "lucide-react";
import { getPerformanceKPIs, getTopProductsByReviews, getCurrentUserPartnerInfo, getRecentReviews } from "@/app/actions/performance";
import { formatNumber, formatPercent } from "@/lib/utils";
import { PageHeader, Section } from "@/components/common";

interface ChangeIndicatorProps {
  value: number;
  isPositiveGood?: boolean;
}

function ChangeIndicator({ value, isPositiveGood = true }: ChangeIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  const color = isNeutral 
    ? "text-gray-500" 
    : (isPositive === isPositiveGood ? "text-green-600" : "text-red-600");
  
  const Icon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);
  
  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{Math.abs(value).toFixed(1)}%</span>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  colorClass: string;
  description?: string;
  isPositiveGood?: boolean;
}

function KPICard({ title, value, change, icon, colorClass, description, isPositiveGood = true }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-full ${colorClass}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        <div className="flex items-center gap-2 mt-2">
          <ChangeIndicator value={change} isPositiveGood={isPositiveGood} />
          <span className="text-xs text-muted-foreground">전 기간 대비</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function KPIDashboardPage() {
  const partnerInfo = await getCurrentUserPartnerInfo();
  const kpis = await getPerformanceKPIs("today");
  const topProducts = await getTopProductsByReviews(5);
  
  const isPartner = !!partnerInfo.assignedPartner;
  const isAdmin = !isPartner; // 관리자(슈퍼유저)
  const displayPartnerName = partnerInfo.assignedPartner || "전체 (본사)";
  
  // 관리자만 최근 리뷰 조회
  const recentReviews = isAdmin ? await getRecentReviews(5) : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="성과 KPI 대시보드"
        description="주문, 리뷰, CS 티켓 등 실시간 성과 지표를 확인하세요."
      />

      {/* 협력사 정보 표시 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">조회 범위</p>
              <p className="font-semibold text-blue-800">
                {isPartner ? `협력사: ${displayPartnerName}` : "전체 데이터 (관리자)"}
              </p>
            </div>
            <Badge variant={isPartner ? "secondary" : "default"} className="ml-auto">
              {isPartner ? "협력사" : "관리자"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 핵심 KPI */}
      <Section title="핵심 성과 지표">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="매출"
            value={`₩${formatNumber(kpis.revenue.current)}`}
            change={kpis.revenue.change}
            icon={<DollarSign className="h-5 w-5" />}
            colorClass="bg-green-100 text-green-600"
            description="오늘 총 매출액"
          />
          <KPICard
            title="주문 건수"
            value={formatNumber(kpis.orders.current)}
            change={kpis.orders.change}
            icon={<ShoppingCart className="h-5 w-5" />}
            colorClass="bg-blue-100 text-blue-600"
            description="오늘 총 주문"
          />
          <KPICard
            title="신규 고객"
            value={formatNumber(kpis.newCustomers.current)}
            change={kpis.newCustomers.change}
            icon={<Users className="h-5 w-5" />}
            colorClass="bg-purple-100 text-purple-600"
            description="오늘 가입한 고객"
          />
          <KPICard
            title="평균 주문액"
            value={`₩${formatNumber(Math.round(kpis.metrics.avgOrderValue))}`}
            change={0}
            icon={<DollarSign className="h-5 w-5" />}
            colorClass="bg-orange-100 text-orange-600"
            description="건당 평균 금액"
          />
        </div>
      </Section>

      {/* 고객 리뷰 */}
      <Section title="고객 리뷰 분석">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <KPICard
            title="리뷰 수"
            value={formatNumber(kpis.reviews.current)}
            change={kpis.reviews.change}
            icon={<MessageSquare className="h-5 w-5" />}
            colorClass="bg-yellow-100 text-yellow-600"
            description="오늘 작성된 리뷰"
          />
          <KPICard
            title="평균 평점"
            value={kpis.reviews.avgRating.toFixed(1)}
            change={0}
            icon={<Star className="h-5 w-5" />}
            colorClass="bg-yellow-100 text-yellow-600"
            description="5.0 만점 기준"
          />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">긍정 리뷰</CardTitle>
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <ThumbsUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.reviews.sentiment.positive}</div>
              <p className="text-xs text-muted-foreground mt-1">
                전체의 {kpis.reviews.current > 0 ? formatPercent((kpis.reviews.sentiment.positive / kpis.reviews.current) * 100) : "0%"}
              </p>
              <Progress 
                value={kpis.reviews.current > 0 ? (kpis.reviews.sentiment.positive / kpis.reviews.current) * 100 : 0} 
                className="mt-2 h-2" 
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">부정 리뷰</CardTitle>
              <div className="p-2 rounded-full bg-red-100 text-red-600">
                <ThumbsDown className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.reviews.sentiment.negative}</div>
              <p className="text-xs text-muted-foreground mt-1">
                전체의 {kpis.reviews.current > 0 ? formatPercent((kpis.reviews.sentiment.negative / kpis.reviews.current) * 100) : "0%"}
              </p>
              <Progress 
                value={kpis.reviews.current > 0 ? (kpis.reviews.sentiment.negative / kpis.reviews.current) * 100 : 0} 
                className="mt-2 h-2 [&>div]:bg-red-500" 
              />
            </CardContent>
          </Card>
        </div>

        {/* 관리자 전용: 평점 분포 및 최근 리뷰 */}
        {isAdmin && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* 리뷰 평점 분포 */}
            <Card>
              <CardHeader>
                <CardTitle>평점 분포</CardTitle>
                <CardDescription>별점별 리뷰 개수</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = kpis.reviews.distribution.find(d => d.rating === rating)?.count || 0;
                  const percent = kpis.reviews.current > 0 ? (count / kpis.reviews.current) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{rating}</span>
                      </div>
                      <div className="flex-1">
                        <Progress value={percent} className="h-2" />
                      </div>
                      <div className="text-sm text-muted-foreground w-12 text-right">{count}개</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* 최근 리뷰 */}
            <Card>
              <CardHeader>
                <CardTitle>최근 리뷰</CardTitle>
                <CardDescription>최근 작성된 고객 리뷰</CardDescription>
              </CardHeader>
              <CardContent>
                {recentReviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    최근 리뷰가 없습니다
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentReviews.map((review) => (
                      <div key={review.id} className="border-b pb-3 last:border-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${
                                  i < review.rating 
                                    ? "fill-yellow-400 text-yellow-400" 
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          {review.sentiment && (
                            <Badge 
                              variant={
                                review.sentiment === "positive" 
                                  ? "default" 
                                  : review.sentiment === "negative" 
                                    ? "destructive" 
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {review.sentiment === "positive" ? "긍정" : review.sentiment === "negative" ? "부정" : "중립"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mb-1">{review.productName}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{review.content}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{review.authorName || "익명"}</span>
                          <span>·</span>
                          <span>{new Date(review.createdAt).toLocaleDateString("ko-KR")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Section>

      {/* CS 운영 */}
      <Section title="CS 운영 현황">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="CS 티켓"
            value={formatNumber(kpis.tickets.current)}
            change={kpis.tickets.change}
            icon={<MessageSquare className="h-5 w-5" />}
            colorClass="bg-indigo-100 text-indigo-600"
            description="오늘 접수된 티켓"
          />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">해결률</CardTitle>
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercent(kpis.tickets.resolutionRate)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.tickets.resolved}건 / {kpis.tickets.current}건 해결
              </p>
              <Progress value={kpis.tickets.resolutionRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
          <KPICard
            title="평균 처리 시간"
            value={`${kpis.tickets.avgResolutionHours}시간`}
            change={0}
            icon={<Clock className="h-5 w-5" />}
            colorClass="bg-cyan-100 text-cyan-600"
            description="티켓 해결까지"
            isPositiveGood={false}
          />
          <KPICard
            title="A/S 접수"
            value={formatNumber(kpis.afterService.current)}
            change={kpis.afterService.change}
            icon={<Wrench className="h-5 w-5" />}
            colorClass="bg-orange-100 text-orange-600"
            description="오늘 A/S 요청"
            isPositiveGood={false}
          />
        </div>
      </Section>

      {/* 상위 제품 */}
      {topProducts.length > 0 && (
        <Section title="리뷰 많은 제품 TOP 5">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name || "제품명 없음"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{product.avgRating.toFixed(1)}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          · {product.reviewCount}개 리뷰
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{product.reviewCount}개</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Section>
      )}

      {/* 고객 만족도 */}
      <Section title="고객 만족도">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="relative w-40 h-40 mx-auto mb-4">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-secondary"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${kpis.metrics.customerSatisfaction * 4.4} 440`}
                      className="text-yellow-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{Math.round(kpis.metrics.customerSatisfaction)}%</span>
                    <span className="text-sm text-muted-foreground">만족도</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  리뷰 평점 {kpis.reviews.avgRating.toFixed(1)}/5.0 기준
                </p>
                <p className="text-lg font-semibold mt-2">
                  {kpis.metrics.customerSatisfaction >= 80 
                    ? "🎉 우수" 
                    : kpis.metrics.customerSatisfaction >= 60 
                      ? "👍 양호" 
                      : "⚠️ 개선 필요"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
