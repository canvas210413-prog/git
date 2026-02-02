"use client";

import { useEffect, useState } from "react";
import { getPeriodStats } from "@/app/actions/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PeriodStatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getPeriodStats(filters);
      setStats(data);
    } catch (error) {
      console.error("Failed to load period stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    loadData();
  };

  const formatCurrency = (val: number) => {
    return `₩${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2">
        <Link href="/dashboard/sales">
          <Button variant="outline">개요</Button>
        </Link>
        <Link href="/dashboard/sales/report">
          <Button variant="outline">매출 상세 현황</Button>
        </Link>
        <Link href="/dashboard/sales/channel-stats">
          <Button variant="outline">채널별 분석</Button>
        </Link>
        <Link href="/dashboard/sales/period-stats">
          <Button variant="default">기간별 성과</Button>
        </Link>
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight">기간별 성과 분석</h2>
        <p className="text-muted-foreground">
          전월, 당월, 연간 누적 재무 성과 비교
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기간 설정 (당월 실적 기준)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="startDate" className="text-sm font-medium">시작일</label>
              <Input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="endDate" className="text-sm font-medium">종료일</label>
              <Input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
            <Button onClick={applyFilters}>조회</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {filters.startDate || filters.endDate ? "선택 기간 매출" : "당월 매출"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : formatCurrency(stats?.currentMonth?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              전월 대비 {stats && stats.lastMonth.total > 0 
                ? ((stats.currentMonth.total - stats.lastMonth.total) / stats.lastMonth.total * 100).toFixed(1) 
                : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {filters.startDate || filters.endDate ? "선택 기간 순이익" : "당월 순이익(마진)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? "-" : formatCurrency(stats?.currentMonth?.margin || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              마진율 {stats && stats.currentMonth.supplyPrice > 0
                ? (stats.currentMonth.margin / stats.currentMonth.supplyPrice * 100).toFixed(1)
                : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">연간 누적 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : formatCurrency(stats?.year?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              총 주문 {stats?.year?.orderCount || 0}건
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기간별 상세 손익 계산서</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[150px]">구분</TableHead>
                  <TableHead className="text-right">공급가</TableHead>
                  <TableHead className="text-right">부가세</TableHead>
                  <TableHead className="text-right">합계(매출)</TableHead>
                  <TableHead className="text-right">원가</TableHead>
                  <TableHead className="text-right">배송비</TableHead>
                  <TableHead className="text-right">수수료</TableHead>
                  <TableHead className="text-right font-bold text-blue-600">마진(순이익)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      데이터를 불러오는 중입니다...
                    </TableCell>
                  </TableRow>
                ) : !stats ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    <TableRow>
                      <TableCell className="font-medium">전월 실적</TableCell>
                      <TableCell className="text-right">{formatCurrency(stats.lastMonth.supplyPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(stats.lastMonth.vat)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(stats.lastMonth.total)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(stats.lastMonth.costPrice)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(stats.lastMonth.shippingFee)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(stats.lastMonth.commission)}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">{formatCurrency(stats.lastMonth.margin)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        {filters.startDate || filters.endDate ? "선택 기간 실적" : "당월 실적"}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(stats.currentMonth.supplyPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(stats.currentMonth.vat)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(stats.currentMonth.total)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(stats.currentMonth.costPrice)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(stats.currentMonth.shippingFee)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(stats.currentMonth.commission)}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">{formatCurrency(stats.currentMonth.margin)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/20 font-medium">
                      <TableCell className="font-bold">연간 누계</TableCell>
                      <TableCell className="text-right">{formatCurrency(stats.year.supplyPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(stats.year.vat)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(stats.year.total)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(stats.year.costPrice)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(stats.year.shippingFee)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(stats.year.commission)}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">{formatCurrency(stats.year.margin)}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
