"use client";

import { useEffect, useState } from "react";
import { getSalesStatsByChannel } from "@/app/actions/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChannelStatsPage() {
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
      const data = await getSalesStatsByChannel(filters);
      setStats(data);
    } catch (error) {
      console.error("Failed to load channel stats:", error);
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

  const chartData = stats ? Object.entries(stats).map(([channel, data]: [string, any]) => ({
    name: channel,
    revenue: data.totalSales,
    orders: data.totalOrders
  })) : [];

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
          <Button variant="default">채널별 분석</Button>
        </Link>
        <Link href="/dashboard/sales/period-stats">
          <Button variant="outline">기간별 성과</Button>
        </Link>
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight">판매채널별 분석</h2>
        <p className="text-muted-foreground">
          채널별 판매량 및 매출 성과 분석
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기간 설정</CardTitle>
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>채널별 매출액</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="revenue" name="매출액" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>채널별 주문건수</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" name="주문건수" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>채널별 상세 판매 현황</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>판매채널</TableHead>
                  <TableHead className="text-right">누적 판매량</TableHead>
                  <TableHead className="text-right">쉴드</TableHead>
                  <TableHead className="text-right">쉴드 유선전용</TableHead>
                  <TableHead className="text-right">미니</TableHead>
                  <TableHead className="text-right">거치대</TableHead>
                  <TableHead className="text-right">매출 누계</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      데이터를 불러오는 중입니다...
                    </TableCell>
                  </TableRow>
                ) : !stats ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(stats).map(([channel, data]: [string, any]) => (
                    <TableRow key={channel}>
                      <TableCell className="font-medium">{channel}</TableCell>
                      <TableCell className="text-right">{data.totalOrders.toLocaleString()}건</TableCell>
                      <TableCell className="text-right">{data.products.shield.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{data.products.shieldWired.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{data.products.mini.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{data.products.stand.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(data.totalSales)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
