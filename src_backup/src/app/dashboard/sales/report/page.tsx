"use client";

import { useEffect, useState } from "react";
import { getSalesReport } from "@/app/actions/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import Link from "next/link";

export default function SalesReportPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    orderSource: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getSalesReport(filters);
      setOrders(data);
    } catch (error) {
      console.error("Failed to load sales report:", error);
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

  const formatCurrency = (val: number | null) => {
    return val ? `₩${val.toLocaleString()}` : "-";
  };

  const formatPercent = (val: number | null) => {
    return val ? `${val.toFixed(1)}%` : "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2">
        <Link href="/dashboard/sales">
          <Button variant="outline">개요</Button>
        </Link>
        <Link href="/dashboard/sales/report">
          <Button variant="default">매출 상세 현황</Button>
        </Link>
        <Link href="/dashboard/sales/channel-stats">
          <Button variant="outline">채널별 분석</Button>
        </Link>
        <Link href="/dashboard/sales/period-stats">
          <Button variant="outline">기간별 성과</Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">매출 상세 현황</h2>
          <p className="text-muted-foreground">
            판매채널별 상세 매출 내역 및 수익성 분석
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          엑셀 다운로드
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>필터 검색</CardTitle>
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
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="orderSource" className="text-sm font-medium">판매채널</label>
              <Input
                type="text"
                id="orderSource"
                name="orderSource"
                placeholder="예: 쿠팡, 네이버"
                value={filters.orderSource}
                onChange={handleFilterChange}
              />
            </div>
            <Button onClick={applyFilters}>조회</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="whitespace-nowrap">판매채널</TableHead>
                  <TableHead className="whitespace-nowrap">날짜</TableHead>
                  <TableHead className="whitespace-nowrap">수취인명</TableHead>
                  <TableHead className="min-w-[200px]">상품명</TableHead>
                  <TableHead className="text-right whitespace-nowrap">수량</TableHead>
                  <TableHead className="text-right whitespace-nowrap">합계</TableHead>
                  <TableHead className="text-right whitespace-nowrap">공급가</TableHead>
                  <TableHead className="text-right whitespace-nowrap">부가세</TableHead>
                  <TableHead className="text-right whitespace-nowrap">단가</TableHead>
                  <TableHead className="text-right whitespace-nowrap">원가</TableHead>
                  <TableHead className="text-right whitespace-nowrap">배송비</TableHead>
                  <TableHead className="text-right whitespace-nowrap">수수료</TableHead>
                  <TableHead className="text-right whitespace-nowrap">마진</TableHead>
                  <TableHead className="text-right whitespace-nowrap">마진률</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center h-24">
                      데이터를 불러오는 중입니다...
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center h-24">
                      데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.orderSource}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{order.recipientName}</TableCell>
                      <TableCell className="text-xs">{order.productInfo}</TableCell>
                      <TableCell className="text-right">1</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(order.supplyPrice)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(order.vat)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(order.unitPrice)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(order.costPrice)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(order.shippingFee)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(order.commission)}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">{formatCurrency(order.margin)}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">{formatPercent(order.marginRate)}</TableCell>
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
