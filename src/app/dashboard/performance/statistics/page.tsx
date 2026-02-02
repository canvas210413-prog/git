"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Package,
  Truck,
  Wrench,
  Calendar,
  Building2,
  RefreshCcw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { 
  getStatistics, 
  getDailyCumulativeData,
  type StatisticsData, 
  type DailyOrderStats,
  type CumulativeStats,
  type ASStats,
} from "@/app/actions/statistics";

// 숫자 포맷팅
function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num));
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('ko-KR', { 
    style: 'currency', 
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(num);
}

// 날짜 기간 프리셋
type DatePreset = 'today' | 'week' | 'month' | 'quarter' | 'custom';

function getPresetDates(preset: DatePreset): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  switch (preset) {
    case 'today':
      return { 
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0), 
        end 
      };
    case 'week':
      const weekStart = new Date(end);
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      return { start: weekStart, end };
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: monthStart, end };
    case 'quarter':
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);
      return { start: quarterStart, end };
    default:
      return { 
        start: new Date(now.getFullYear(), now.getMonth(), 1), 
        end 
      };
  }
}

// 차트 색상
const COLORS = {
  '그로트': '#8884d8',
  '해피포즈': '#82ca9d',
  '스몰닷': '#ffc658',
  '자사몰': '#ff7300',
  '미지정': '#a4a4a4',
  '전체': '#2563eb',
};

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatisticsData | null>(null);
  const [chartData, setChartData] = useState<{ date: string; partner: string; cumulativeAmount: number }[]>([]);
  
  // 날짜 필터
  const [datePreset, setDatePreset] = useState<DatePreset>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // 협력사 필터 (본사용)
  const [selectedPartner, setSelectedPartner] = useState<string>('all');

  // 초기 날짜 설정
  useEffect(() => {
    const { start, end } = getPresetDates('month');
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  // 데이터 조회
  const fetchData = async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      const [statsData, cumulativeData] = await Promise.all([
        getStatistics(start, end),
        getDailyCumulativeData(start, end),
      ]);
      
      setData(statsData);
      setChartData(cumulativeData);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate]);

  // 날짜 프리셋 변경
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const { start, end } = getPresetDates(preset);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  // 필터링된 일자별 통계
  const filteredDailyOrders = useMemo(() => {
    if (!data) return [];
    if (selectedPartner === 'all') return data.dailyOrders;
    return data.dailyOrders.filter(d => d.partner === selectedPartner);
  }, [data, selectedPartner]);

  // 일자별 합계 계산 (전체 표시용)
  const dailySummary = useMemo(() => {
    if (!data) return [];
    
    const summaryMap = new Map<string, { 
      date: string; 
      orderCount: number; 
      basePriceTotal: number; 
      shippingFeeTotal: number;
      totalAmount: number;
    }>();
    
    const ordersToUse = selectedPartner === 'all' ? data.dailyOrders : filteredDailyOrders;
    
    ordersToUse.forEach(order => {
      if (summaryMap.has(order.date)) {
        const existing = summaryMap.get(order.date)!;
        existing.orderCount += order.orderCount;
        existing.basePriceTotal += order.basePriceTotal;
        existing.shippingFeeTotal += order.shippingFeeTotal;
        existing.totalAmount += order.totalAmount;
      } else {
        summaryMap.set(order.date, {
          date: order.date,
          orderCount: order.orderCount,
          basePriceTotal: order.basePriceTotal,
          shippingFeeTotal: order.shippingFeeTotal,
          totalAmount: order.totalAmount,
        });
      }
    });
    
    return Array.from(summaryMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [data, filteredDailyOrders, selectedPartner]);

  // 그래프 데이터 변환
  const lineChartData = useMemo(() => {
    if (!chartData.length) return [];
    
    // 날짜별로 그룹화
    const dateMap = new Map<string, Record<string, number>>();
    
    chartData.forEach(item => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, {});
      }
      dateMap.get(item.date)![item.partner] = item.cumulativeAmount;
    });
    
    return Array.from(dateMap.entries()).map(([date, partners]) => ({
      date,
      ...partners,
    }));
  }, [chartData]);

  // 협력사 목록
  const partners = useMemo(() => {
    if (!data) return [];
    return data.cumulativeByPartner.map(c => c.partner);
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            협력사 통계
          </h2>
          <p className="text-muted-foreground">
            {data?.isHeadquarters 
              ? "전체 협력사의 주문 및 A/S 통계를 확인합니다" 
              : `${data?.currentPartner || ''} 주문 및 A/S 통계를 확인합니다`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={data?.isHeadquarters ? "default" : "secondary"} className="text-sm py-1">
            <Building2 className="h-3 w-3 mr-1" />
            {data?.isHeadquarters ? "본사" : data?.currentPartner}
          </Badge>
        </div>
      </div>

      {/* 날짜 필터 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            조회 기간 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            {/* 프리셋 버튼 */}
            <div className="flex gap-2">
              <Button 
                variant={datePreset === 'today' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handlePresetChange('today')}
              >
                오늘
              </Button>
              <Button 
                variant={datePreset === 'week' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handlePresetChange('week')}
              >
                최근 7일
              </Button>
              <Button 
                variant={datePreset === 'month' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handlePresetChange('month')}
              >
                이번 달
              </Button>
              <Button 
                variant={datePreset === 'quarter' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handlePresetChange('quarter')}
              >
                이번 분기
              </Button>
              <Button 
                variant={datePreset === 'custom' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handlePresetChange('custom')}
              >
                직접 설정
              </Button>
            </div>
            
            {/* 날짜 입력 */}
            <div className="flex items-center gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">시작일</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="w-40"
                />
              </div>
              <span className="mt-5">~</span>
              <div>
                <Label className="text-xs text-muted-foreground">종료일</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="w-40"
                />
              </div>
            </div>

            {/* 본사: 협력사 필터 */}
            {data?.isHeadquarters && (
              <div>
                <Label className="text-xs text-muted-foreground">협력사 선택</Label>
                <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {partners.map(partner => (
                      <SelectItem key={partner} value={partner}>{partner}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Button onClick={fetchData} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 주문 건수</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(data?.totalCumulative.orderCount || 0)}건
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">단가 합계</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(data?.totalCumulative.basePriceTotal || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">택배비 합계</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(data?.totalCumulative.shippingFeeTotal || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 A/S 접수</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(data?.totalASStats.totalCount || 0)}건
            </div>
            <p className="text-xs text-muted-foreground">
              완료: {data?.totalASStats.completedCount || 0}건
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">일자별 통계</TabsTrigger>
          <TabsTrigger value="cumulative">누적 통계</TabsTrigger>
          <TabsTrigger value="as">A/S 통계</TabsTrigger>
          <TabsTrigger value="chart">누적 그래프</TabsTrigger>
        </TabsList>

        {/* 일자별 통계 */}
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>일자별 주문 통계</CardTitle>
              <CardDescription>
                선택한 기간의 일자별 주문 현황을 확인합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead className="text-right">주문 건수</TableHead>
                    <TableHead className="text-right">단가 합계</TableHead>
                    <TableHead className="text-right">택배비</TableHead>
                    <TableHead className="text-right">총 금액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        조회된 데이터가 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    dailySummary.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.date}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.orderCount)}건</TableCell>
                        <TableCell className="text-right text-blue-600">{formatCurrency(row.basePriceTotal)}</TableCell>
                        <TableCell className="text-right text-orange-600">{formatCurrency(row.shippingFeeTotal)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(row.totalAmount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* 본사: 협력사별 일자별 상세 */}
          {data?.isHeadquarters && selectedPartner === 'all' && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>협력사별 일자별 상세</CardTitle>
                <CardDescription>
                  각 협력사의 일자별 주문 현황을 확인합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>협력사</TableHead>
                      <TableHead className="text-right">주문 건수</TableHead>
                      <TableHead className="text-right">단가 합계</TableHead>
                      <TableHead className="text-right">택배비</TableHead>
                      <TableHead className="text-right">총 금액</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.dailyOrders.slice().reverse().map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" style={{ 
                            borderColor: COLORS[row.partner as keyof typeof COLORS] || '#888',
                            color: COLORS[row.partner as keyof typeof COLORS] || '#888',
                          }}>
                            {row.partner}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(row.orderCount)}건</TableCell>
                        <TableCell className="text-right text-blue-600">{formatCurrency(row.basePriceTotal)}</TableCell>
                        <TableCell className="text-right text-orange-600">{formatCurrency(row.shippingFeeTotal)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(row.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 누적 통계 */}
        <TabsContent value="cumulative">
          <Card>
            <CardHeader>
              <CardTitle>기간 누적 통계</CardTitle>
              <CardDescription>
                선택한 기간의 협력사별 누적 현황을 확인합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>협력사</TableHead>
                    <TableHead className="text-right">주문 건수</TableHead>
                    <TableHead className="text-right">단가 합계</TableHead>
                    <TableHead className="text-right">택배비</TableHead>
                    <TableHead className="text-right">총 금액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.cumulativeByPartner.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Badge style={{ 
                          backgroundColor: COLORS[row.partner as keyof typeof COLORS] || '#888',
                          color: 'white',
                        }}>
                          {row.partner}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(row.orderCount)}건</TableCell>
                      <TableCell className="text-right text-blue-600">{formatCurrency(row.basePriceTotal)}</TableCell>
                      <TableCell className="text-right text-orange-600">{formatCurrency(row.shippingFeeTotal)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(row.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                  {/* 합계 행 */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>전체 합계</TableCell>
                    <TableCell className="text-right">{formatNumber(data?.totalCumulative.orderCount || 0)}건</TableCell>
                    <TableCell className="text-right text-blue-600">{formatCurrency(data?.totalCumulative.basePriceTotal || 0)}</TableCell>
                    <TableCell className="text-right text-orange-600">{formatCurrency(data?.totalCumulative.shippingFeeTotal || 0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data?.totalCumulative.totalAmount || 0)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* A/S 통계 */}
        <TabsContent value="as">
          <Card>
            <CardHeader>
              <CardTitle>A/S 접수 통계</CardTitle>
              <CardDescription>
                선택한 기간의 A/S 접수 현황을 확인합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>협력사</TableHead>
                    <TableHead className="text-right">총 접수</TableHead>
                    <TableHead className="text-right">대기</TableHead>
                    <TableHead className="text-right">진행중</TableHead>
                    <TableHead className="text-right">완료</TableHead>
                    <TableHead className="text-right">취소</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.asStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        조회된 A/S 데이터가 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {data?.asStats.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Badge style={{ 
                              backgroundColor: COLORS[row.partner as keyof typeof COLORS] || '#888',
                              color: 'white',
                            }}>
                              {row.partner}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{formatNumber(row.totalCount)}건</TableCell>
                          <TableCell className="text-right text-yellow-600">{formatNumber(row.pendingCount)}건</TableCell>
                          <TableCell className="text-right text-blue-600">{formatNumber(row.inProgressCount)}건</TableCell>
                          <TableCell className="text-right text-green-600">{formatNumber(row.completedCount)}건</TableCell>
                          <TableCell className="text-right text-gray-500">{formatNumber(row.cancelledCount)}건</TableCell>
                        </TableRow>
                      ))}
                      {/* 합계 행 */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>전체 합계</TableCell>
                        <TableCell className="text-right">{formatNumber(data?.totalASStats.totalCount || 0)}건</TableCell>
                        <TableCell className="text-right text-yellow-600">{formatNumber(data?.totalASStats.pendingCount || 0)}건</TableCell>
                        <TableCell className="text-right text-blue-600">{formatNumber(data?.totalASStats.inProgressCount || 0)}건</TableCell>
                        <TableCell className="text-right text-green-600">{formatNumber(data?.totalASStats.completedCount || 0)}건</TableCell>
                        <TableCell className="text-right text-gray-500">{formatNumber(data?.totalASStats.cancelledCount || 0)}건</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* A/S 막대 그래프 */}
          {data?.asStats && data.asStats.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>A/S 현황 차트</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.asStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="partner" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="pendingCount" name="대기" fill="#eab308" stackId="a" />
                      <Bar dataKey="inProgressCount" name="진행중" fill="#3b82f6" stackId="a" />
                      <Bar dataKey="completedCount" name="완료" fill="#22c55e" stackId="a" />
                      <Bar dataKey="cancelledCount" name="취소" fill="#9ca3af" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 누적 그래프 */}
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>누적 금액 그래프</CardTitle>
              <CardDescription>
                선택한 기간의 일자별 누적 매출을 확인합니다 (단가 기준)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                {lineChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    조회된 데이터가 없습니다
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value.slice(5)} // MM-DD 형식
                      />
                      <YAxis 
                        tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `날짜: ${label}`}
                      />
                      <Legend />
                      {partners.map(partner => (
                        <Line
                          key={partner}
                          type="monotone"
                          dataKey={partner}
                          name={partner}
                          stroke={COLORS[partner as keyof typeof COLORS] || '#888'}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* 협력사별 누적 막대 그래프 */}
          {data?.cumulativeByPartner && data.cumulativeByPartner.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>협력사별 누적 매출 비교</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.cumulativeByPartner}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="partner" />
                      <YAxis tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="basePriceTotal" name="단가 합계" fill="#3b82f6" />
                      <Bar dataKey="shippingFeeTotal" name="택배비" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
