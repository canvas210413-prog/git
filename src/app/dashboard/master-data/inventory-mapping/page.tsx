"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Package, Link2, Loader2 } from "lucide-react";
import {
  getInventoryMappings,
  createInventoryMapping,
  updateInventoryMapping,
  deleteInventoryMapping,
  getBaseProductsForMapping,
  getPartsForMapping,
  type InventoryMapping,
} from "@/app/actions/inventory-mapping";

// ============================================================================
// Types
// ============================================================================

interface BaseProduct {
  id: string;
  name: string;
  partnerCode: string | null;
}

interface Part {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
}

// ============================================================================
// Main Component
// ============================================================================

export default function InventoryMappingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mappings, setMappings] = useState<InventoryMapping[]>([]);
  const [products, setProducts] = useState<BaseProduct[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<InventoryMapping | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    productId: "",
    partIds: [] as string[],
    deductQty: 1,
    description: "",
  });

  // ============================================================================
  // Authorization Check
  // ============================================================================

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // @ts-ignore
    const userRole = session?.user?.role;
    if (userRole !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mappingsRes, productsRes, partsRes] = await Promise.all([
        getInventoryMappings(),
        getBaseProductsForMapping(),
        getPartsForMapping(),
      ]);

      if (mappingsRes.success && mappingsRes.data) {
        setMappings(mappingsRes.data);
      }
      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data);
      }
      if (partsRes.success && partsRes.data) {
        setParts(partsRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================================================
  // Loading and Authorization UI
  // ============================================================================

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // @ts-ignore
  const userRole = session?.user?.role;
  if (userRole !== "ADMIN") {
    return null; // Will be redirected by useEffect
  }

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleAdd = () => {
    setFormData({
      productId: "",
      partIds: [],
      deductQty: 1,
      description: "",
    });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (mapping: InventoryMapping) => {
    setSelectedMapping(mapping);
    setFormData({
      productId: mapping.productId,
      partIds: [mapping.partId],
      deductQty: mapping.deductQty,
      description: mapping.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 매핑을 삭제하시겠습니까?")) return;

    startTransition(async () => {
      const result = await deleteInventoryMapping(id);
      if (result.success) {
        setMappings(mappings.filter((m) => m.id !== id));
        alert("매핑이 삭제되었습니다.");
      } else {
        alert(`삭제 실패: ${result.error?.message}`);
      }
    });
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedProduct = products.find((p) => p.id === formData.productId);

    if (!selectedProduct || formData.partIds.length === 0) {
      alert("상품과 재고 파트를 선택해주세요.");
      return;
    }

    startTransition(async () => {
      const newMappings: InventoryMapping[] = [];
      let successCount = 0;
      let failCount = 0;

      // 선택된 각 파트에 대해 매핑 생성
      for (const partId of formData.partIds) {
        const selectedPart = parts.find((p) => p.id === partId);
        if (!selectedPart) continue;

        const result = await createInventoryMapping({
          productId: formData.productId,
          productName: selectedProduct.name,
          partId: partId,
          partName: selectedPart.name,
          deductQty: formData.deductQty,
          description: formData.description || undefined,
        });

        if (result.success && result.data) {
          newMappings.push(result.data);
          successCount++;
        } else {
          failCount++;
        }
      }

      if (newMappings.length > 0) {
        setMappings([...mappings, ...newMappings]);
      }

      setIsAddDialogOpen(false);

      if (failCount === 0) {
        alert(`${successCount}개의 매핑이 등록되었습니다.`);
      } else {
        alert(`${successCount}개 등록 성공, ${failCount}개 실패`);
      }
    });
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMapping) return;

    startTransition(async () => {
      const result = await updateInventoryMapping(selectedMapping.id, {
        deductQty: formData.deductQty,
        description: formData.description || undefined,
      });

      if (result.success && result.data) {
        setMappings(mappings.map((m) => (m.id === selectedMapping.id ? result.data! : m)));
        setIsEditDialogOpen(false);
        alert("매핑이 수정되었습니다.");
      } else {
        alert(`수정 실패: ${result.error?.message}`);
      }
    });
  };

  const handleToggleActive = async (mapping: InventoryMapping) => {
    startTransition(async () => {
      const result = await updateInventoryMapping(mapping.id, {
        isActive: !mapping.isActive,
      });

      if (result.success && result.data) {
        setMappings(mappings.map((m) => (m.id === mapping.id ? result.data! : m)));
      } else {
        alert(`상태 변경 실패: ${result.error?.message}`);
      }
    });
  };

  // ============================================================================
  // 상품별 그룹핑
  // ============================================================================

  const groupedMappings = mappings.reduce((acc, mapping) => {
    if (!acc[mapping.productName]) {
      acc[mapping.productName] = [];
    }
    acc[mapping.productName].push(mapping);
    return acc;
  }, {} as Record<string, InventoryMapping[]>);

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="상품-재고 매핑 관리"
        description="협력사 상품과 재고 파트를 매핑하여 주문 시 자동 재고 차감을 설정합니다."
      >
        <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          매핑 추가
        </Button>
      </PageHeader>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">총 매핑 수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{mappings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">매핑된 상품</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Object.keys(groupedMappings).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">활성 매핑</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {mappings.filter((m) => m.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">비활성 매핑</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-400">
              {mappings.filter((m) => !m.isActive).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 매핑 목록 (상품별 그룹) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            매핑 목록
          </CardTitle>
          <CardDescription>
            상품별로 그룹화된 재고 매핑 정보입니다. 주문 생성 시 매핑된 파트의 재고가 자동으로 차감됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedMappings).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>등록된 매핑이 없습니다.</p>
              <p className="text-sm mt-1">매핑 추가 버튼을 클릭하여 상품-재고 매핑을 등록하세요.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMappings).map(([productName, productMappings]) => (
                <div key={productName} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      {productName}
                    </h3>
                    <Badge variant="outline">{productMappings.length}개 파트</Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>재고 파트</TableHead>
                        <TableHead className="text-center">차감 수량</TableHead>
                        <TableHead className="text-center">상태</TableHead>
                        <TableHead>설명</TableHead>
                        <TableHead className="text-right">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productMappings.map((mapping) => (
                        <TableRow key={mapping.id}>
                          <TableCell className="font-medium">{mapping.partName}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{mapping.deductQty}개</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={mapping.isActive}
                              onCheckedChange={() => handleToggleActive(mapping)}
                              disabled={isPending}
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {mapping.description || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(mapping)}
                                disabled={isPending}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(mapping.id)}
                                disabled={isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 매핑 추가 Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>매핑 추가</DialogTitle>
            <DialogDescription>
              상품을 선택하고 재고 파트를 매핑하세요. 주문 시 해당 파트의 재고가 자동 차감됩니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>상품 선택 *</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상품을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                      {product.partnerCode && (
                        <span className="text-muted-foreground ml-2">
                          ({product.partnerCode})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>재고 파트 선택 * (다중 선택 가능)</Label>
              <div className="border rounded-md p-3 max-h-64 overflow-y-auto space-y-2">
                {parts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">재고 파트가 없습니다.</p>
                ) : (
                  parts.map((part) => (
                    <div key={part.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`part-${part.id}`}
                        checked={formData.partIds.includes(part.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, partIds: [...formData.partIds, part.id] });
                          } else {
                            setFormData({ 
                              ...formData, 
                              partIds: formData.partIds.filter((id) => id !== part.id) 
                            });
                          }
                        }}
                      />
                      <Label
                        htmlFor={`part-${part.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {part.name}
                        <span className="text-muted-foreground ml-2">
                          (재고: {part.quantity})
                        </span>
                      </Label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                선택한 파트: {formData.partIds.length}개
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deductQty">차감 수량</Label>
              <Input
                id="deductQty"
                type="number"
                min="1"
                value={formData.deductQty}
                onChange={(e) => setFormData({ ...formData, deductQty: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground">
                주문 1건당 차감할 수량을 입력하세요.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="예: 쉴드미니 유선 본체"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isPending}
              >
                취소
              </Button>
              <Button type="submit" disabled={isPending || !formData.productId || formData.partIds.length === 0}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                등록
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 매핑 수정 Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>매핑 수정</DialogTitle>
            <DialogDescription>
              {selectedMapping?.productName} → {selectedMapping?.partName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editDeductQty">차감 수량</Label>
              <Input
                id="editDeductQty"
                type="number"
                min="1"
                value={formData.deductQty}
                onChange={(e) => setFormData({ ...formData, deductQty: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDescription">설명 (선택)</Label>
              <Input
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="예: 쉴드미니 유선 본체"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isPending}
              >
                취소
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                저장
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
