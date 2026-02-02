import { getCategoryStats, getCategories } from "@/app/actions/categories";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  FolderTree, 
  Package, 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  Boxes
} from "lucide-react";
import Link from "next/link";

export default async function CategoryMenuPage() {
  let categoryStats: any[] = [];
  let error = null;

  try {
    categoryStats = await getCategoryStats();
  } catch (e) {
    console.error("Error loading category stats:", e);
    error = e;
  }

  const totalProducts = categoryStats.reduce((sum, cat) => sum + cat.productCount, 0);
  const totalRevenue = categoryStats.reduce((sum, cat) => sum + cat.totalRevenue, 0);
  const totalStock = categoryStats.reduce((sum, cat) => sum + cat.totalStock, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
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
        <h2 className="text-3xl font-bold tracking-tight">카테고리 메뉴 관리</h2>
        <p className="text-muted-foreground">
          제품 카테고리별 분류 및 관리를 통해 제품 정보를 체계화합니다.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 카테고리</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.length}개</div>
            <p className="text-xs text-muted-foreground">활성 카테고리</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 상품 수</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts.toLocaleString()}개</div>
            <p className="text-xs text-muted-foreground">등록된 전체 상품</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 재고</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock.toLocaleString()}개</div>
            <p className="text-xs text-muted-foreground">전체 재고량</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">카테고리 총 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">누적 매출</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            카테고리별 현황
          </CardTitle>
          <CardDescription>
            각 카테고리의 상품 수, 재고, 매출 현황을 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoryStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>등록된 카테고리가 없습니다.</p>
              <p className="text-sm mt-2">상품을 등록하면 카테고리가 자동으로 생성됩니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>카테고리명</TableHead>
                  <TableHead className="text-right">상품 수</TableHead>
                  <TableHead className="text-right">총 재고</TableHead>
                  <TableHead className="text-right">평균 가격</TableHead>
                  <TableHead className="text-right">총 매출</TableHead>
                  <TableHead className="text-right">매출 비중</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryStats.map((category) => {
                  const revenueShare = totalRevenue > 0 
                    ? (category.totalRevenue / totalRevenue * 100).toFixed(1) 
                    : 0;
                  
                  return (
                    <TableRow key={category.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FolderTree className="h-4 w-4 text-blue-500" />
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{category.productCount}개</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {category.totalStock.toLocaleString()}개
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(category.avgPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(category.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${revenueShare}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12">
                            {revenueShare}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Category Cards Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">카테고리 상세</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categoryStats.map((category) => (
            <Card key={category.name} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-blue-500" />
                    {category.name}
                  </CardTitle>
                  <Badge variant="outline">{category.productCount}개 상품</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">재고</span>
                    <span className="font-medium">{category.totalStock.toLocaleString()}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">평균 가격</span>
                    <span className="font-medium">{formatCurrency(category.avgPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">매출</span>
                    <span className="font-medium text-blue-600">{formatCurrency(category.totalRevenue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
