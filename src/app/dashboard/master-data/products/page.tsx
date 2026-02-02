"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Package, Plus, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  getBaseProducts,
  createBaseProduct,
  updateBaseProduct,
  deleteBaseProduct,
  type BaseProductData,
} from "@/app/actions/base-products";

export default function MasterDataProductsPage() {
  const { data: session } = useSession();
  
  // 현재 사용자의 협력사 정보 (null이면 본사)
  const userPartner = (session?.user as { assignedPartner?: string | null })?.assignedPartner || null;
  
  const [products, setProducts] = useState<BaseProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BaseProductData | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<BaseProductData | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formUnitPrice, setFormUnitPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState("0");

  const [saving, setSaving] = useState(false);

  // 데이터 로드 (협력사별 필터링)
  useEffect(() => {
    loadProducts();
  }, [userPartner]);

  const loadProducts = async () => {
    setLoading(true);
    // 현재 사용자의 협력사에 맞는 상품만 조회
    const data = await getBaseProducts(userPartner);
    setProducts(data);
    setLoading(false);
  };

  // 다이얼로그 열기 - 신규
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName("");
    setFormUnitPrice("");
    setFormDescription("");
    setFormIsActive(true);
    setFormSortOrder("0");
    setIsDialogOpen(true);
  };

  // 다이얼로그 열기 - 수정
  const handleOpenEdit = (product: BaseProductData) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormUnitPrice(product.unitPrice.toString());
    setFormDescription(product.description || "");
    setFormIsActive(product.isActive);
    setFormSortOrder(product.sortOrder.toString());
    setIsDialogOpen(true);
  };

  // 저장
  const handleSave = async () => {
    if (!formName.trim() || !formUnitPrice) {
      alert("상품명과 단가는 필수입니다.");
      return;
    }

    setSaving(true);

    if (editingProduct) {
      // 수정
      const result = await updateBaseProduct({
        id: editingProduct.id,
        name: formName.trim(),
        unitPrice: parseFloat(formUnitPrice),
        description: formDescription.trim() || undefined,
        isActive: formIsActive,
        sortOrder: parseInt(formSortOrder) || 0,
      });

      if (result.success) {
        await loadProducts();
        setIsDialogOpen(false);
      } else {
        alert(result.error);
      }
    } else {
      // 신규 - 현재 사용자의 협력사 정보도 함께 저장
      const result = await createBaseProduct({
        name: formName.trim(),
        unitPrice: parseFloat(formUnitPrice),
        description: formDescription.trim() || undefined,
        isActive: formIsActive,
        sortOrder: parseInt(formSortOrder) || 0,
        partnerCode: userPartner,  // 협력사 정보 자동 저장
      });

      if (result.success) {
        await loadProducts();
        setIsDialogOpen(false);
      } else {
        alert(result.error);
      }
    }

    setSaving(false);
  };

  // 삭제 확인
  const handleDeleteConfirm = (product: BaseProductData) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // 삭제 실행
  const handleDelete = async () => {
    if (!deletingProduct) return;

    const result = await deleteBaseProduct(deletingProduct.id);
    if (result.success) {
      await loadProducts();
    } else {
      alert(result.error);
    }
    setIsDeleteDialogOpen(false);
    setDeletingProduct(null);
  };

  // 순서 변경
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    const newProducts = [...products];
    const temp = newProducts[index].sortOrder;
    newProducts[index].sortOrder = newProducts[index - 1].sortOrder;
    newProducts[index - 1].sortOrder = temp;
    [newProducts[index], newProducts[index - 1]] = [newProducts[index - 1], newProducts[index]];
    
    setProducts(newProducts);
    
    // 순서 저장
    await updateBaseProduct({ id: newProducts[index].id, sortOrder: newProducts[index].sortOrder });
    await updateBaseProduct({ id: newProducts[index - 1].id, sortOrder: newProducts[index - 1].sortOrder });
  };

  const handleMoveDown = async (index: number) => {
    if (index === products.length - 1) return;
    
    const newProducts = [...products];
    const temp = newProducts[index].sortOrder;
    newProducts[index].sortOrder = newProducts[index + 1].sortOrder;
    newProducts[index + 1].sortOrder = temp;
    [newProducts[index], newProducts[index + 1]] = [newProducts[index + 1], newProducts[index]];
    
    setProducts(newProducts);
    
    // 순서 저장
    await updateBaseProduct({ id: newProducts[index].id, sortOrder: newProducts[index].sortOrder });
    await updateBaseProduct({ id: newProducts[index + 1].id, sortOrder: newProducts[index + 1].sortOrder });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(value);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            기준정보 - 상품 관리
            {userPartner && (
              <span className="text-base font-normal text-muted-foreground">
                ({userPartner})
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {userPartner 
              ? `${userPartner}에서 사용할 상품명 및 단가를 관리합니다.`
              : "본사에서 사용할 상품명 및 단가를 관리합니다."}
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          상품 추가
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>상품 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 상품이 없습니다. 상품을 추가해주세요.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">순서</TableHead>
                  <TableHead>상품명</TableHead>
                  <TableHead className="text-right">단가</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead className="text-center">활성</TableHead>
                  <TableHead className="text-right w-32">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === products.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.unitPrice)}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {product.description || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={product.isActive ? "text-green-600" : "text-red-500"}>
                        {product.isActive ? "활성" : "비활성"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteConfirm(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 상품 추가/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "상품 수정" : "새 상품 추가"}
            </DialogTitle>
            <DialogDescription>
              주문 등록 시 선택할 수 있는 상품 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">상품명 및 수량 *</Label>
              <Input
                id="name"
                placeholder="예: 실드 무선 1개, 실드 유선 2개"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unitPrice">단가 (원) *</Label>
              <Input
                id="unitPrice"
                type="number"
                placeholder="예: 50000"
                value={formUnitPrice}
                onChange={(e) => setFormUnitPrice(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                placeholder="상품에 대한 추가 설명"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sortOrder">정렬 순서</Label>
              <Input
                id="sortOrder"
                type="number"
                placeholder="0"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
              <Label htmlFor="isActive">활성화 (주문 등록 시 선택 가능)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상품 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deletingProduct?.name}&quot; 상품을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
