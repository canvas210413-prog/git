import { getParts, getInventoryStats } from "@/app/actions/inventory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, TrendingDown } from "lucide-react";
import { AddPartDialog } from "@/components/inventory/add-part-dialog";
import { StockUpdateDialog } from "@/components/inventory/stock-update-dialog";
import { formatNumber } from "@/lib/utils";

export default async function InventoryPage() {
  let parts: any[] = [];
  let stats = { total: 0, lowStock: 0, totalValue: 0 };

  try {
    parts = await getParts();
    stats = await getInventoryStats();
  } catch (error) {
    console.error("Error loading inventory:", error);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">부품 재고 관리</h2>
          <p className="text-muted-foreground">
            미니 공기청정기 부품의 재고를 관리하고 재고 부족 상황을 모니터링합니다.
          </p>
        </div>
        <AddPartDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 부품 종류</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">재고 부족</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lowStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 재고 가치</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>부품명</TableHead>
              <TableHead>부품번호</TableHead>
              <TableHead>현재 재고</TableHead>
              <TableHead>최소 재고</TableHead>
              <TableHead>단가</TableHead>
              <TableHead>보관 위치</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  등록된 부품이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              parts.map((part) => {
                const isLowStock = part.quantity <= part.minStock;
                const stockPercentage = part.minStock > 0 
                  ? (part.quantity / part.minStock) * 100 
                  : 100;
                
                return (
                  <TableRow key={part.id}>
                    <TableCell className="font-medium">{part.name}</TableCell>
                    <TableCell>{part.partNumber}</TableCell>
                    <TableCell>
                      <span className={isLowStock ? "text-red-600 font-bold" : ""}>
                        {part.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{part.minStock}</TableCell>
                    <TableCell>{formatNumber(Number(part.unitPrice || 0))}</TableCell>
                    <TableCell>{part.location || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={isLowStock ? "destructive" : stockPercentage < 150 ? "default" : "outline"}>
                        {isLowStock ? "재고부족" : stockPercentage < 150 ? "정상" : "충분"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <StockUpdateDialog part={part} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
