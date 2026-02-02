"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  Lock,
  Eye,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Permission {
  id: string;
  resource: string;
  action: string;
  displayName: string;
  description: string | null;
  category: string | null;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  permissions: Permission[];
}

// 카테고리 정보 (UI 표시용)
const CATEGORY_INFO: Record<string, { displayName: string; description: string }> = {
  '메인': { displayName: '메인', description: '대시보드' },
  '고객 상담': { displayName: '고객 상담', description: 'AI 챗봇, 상담 내역, 담당자 연결, 우선순위' },
  '주문 관리': { displayName: '주문 관리', description: '통합조회, 상태확인, 배송연동, 오류검증' },
  '고객 리뷰 관리': { displayName: '고객 리뷰 관리', description: '자동수집, LLM분류, 불만알림, 요약리포트' },
  'AS 관리': { displayName: 'AS 관리', description: '접수관리, KPI대시보드, LLM인사이트' },
  '마케팅 자동화': { displayName: '마케팅 자동화', description: '쿠폰, 재구매알림, 이벤트, 이탈고객, 캠페인분석' },
  '성과 관리': { displayName: '성과 관리', description: 'KPI, 고객분석, 문의분석, 채널비교' },
  '알림 및 모니터링': { displayName: '알림 및 모니터링', description: '주문급증, 이탈위험 감지' },
  '보고서 생성': { displayName: '보고서 생성', description: 'LLM 인사이트 리포트' },
  '운영 관리': { displayName: '운영 관리', description: '재고, 파트너, 쇼핑몰' },
  '기준정보': { displayName: '기준정보', description: '상품 관리' },
  '분석': { displayName: '분석', description: '성과 분석 및 리포트 (레거시)' },
  '시스템': { displayName: '시스템', description: '사용자 및 권한 관리' }
};

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    permissionIds: [] as string[],
  });

  // 데이터 로드
  const fetchData = async () => {
    setLoading(true);
    try {
      const rolesRes = await fetch("/api/roles");
      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setRoles(data.roles || []);
      }

      const permsRes = await fetch("/api/permissions");
      if (permsRes.ok) {
        const data = await permsRes.json();
        setPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 카테고리별 권한 그룹화
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const category = perm.category || "기타";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // 역할 생성
  const handleCreate = async () => {
    if (!formData.name || !formData.displayName) {
      alert("역할명과 표시명을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setCreateDialogOpen(false);
        setFormData({
          name: "",
          displayName: "",
          description: "",
          permissionIds: [],
        });
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "역할 생성 실패");
      }
    } catch (error) {
      console.error("역할 생성 실패:", error);
      alert("역할 생성 중 오류가 발생했습니다.");
    }
  };

  // 역할 수정
  const handleUpdate = async () => {
    if (!selectedRole) return;

    console.log('수정할 데이터:', formData);

    try {
      const res = await fetch(`/api/roles/${selectedRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log('서버 응답:', data);

      if (res.ok) {
        setEditDialogOpen(false);
        fetchData();
        alert('역할이 성공적으로 수정되었습니다.');
      } else {
        console.error('수정 실패:', data);
        alert(`역할 수정 실패: ${data.message || data.error || JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error("역할 수정 실패:", error);
      alert(`역할 수정 중 오류가 발생했습니다: ${error}`);
    }
  };

  // 역할 삭제
  const handleDelete = async (roleId: string) => {
    if (!confirm("정말 이 역할을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "역할 삭제 실패");
      }
    } catch (error) {
      console.error("역할 삭제 실패:", error);
      alert("역할 삭제 중 오류가 발생했습니다.");
    }
  };

  // 수정 다이얼로그 열기
  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || "",
      permissionIds: role.permissions.map((p) => p.id),
    });
    setEditDialogOpen(true);
  };

  // 상세보기 다이얼로그 열기
  const openViewDialog = (role: Role) => {
    setSelectedRole(role);
    setViewDialogOpen(true);
  };

  // 권한 토글
  const togglePermission = (permId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter((id) => id !== permId)
        : [...prev.permissionIds, permId],
    }));
  };

  // 카테고리 전체 선택/해제
  const toggleCategory = (categoryPerms: Permission[]) => {
    const categoryIds = categoryPerms.map(p => p.id);
    const allSelected = categoryIds.every(id => formData.permissionIds.includes(id));
    
    setFormData((prev) => ({
      ...prev,
      permissionIds: allSelected
        ? prev.permissionIds.filter(id => !categoryIds.includes(id))
        : [...new Set([...prev.permissionIds, ...categoryIds])]
    }));
  };

  if (loading) {
    return <div className="p-8">로딩 중...</div>;
  }

  const stats = {
    total: roles.length,
    system: roles.filter((r) => r.isSystem).length,
    custom: roles.filter((r) => !r.isSystem).length,
    active: roles.filter((r) => r.isActive).length,
  };

  return (
    <div className="p-8 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            역할 및 권한 관리
          </h1>
          <p className="text-gray-500 mt-1">
            사용자 역할과 페이지 접근 권한을 관리합니다
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          새 역할 생성
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              전체 역할
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}개</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              시스템 역할
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.system}개</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              커스텀 역할
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.custom}개</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              활성 역할
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.active}개</div>
          </CardContent>
        </Card>
      </div>

      {/* 역할 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>역할 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>역할명</TableHead>
                <TableHead>표시명</TableHead>
                <TableHead>설명</TableHead>
                <TableHead className="text-center">권한 수</TableHead>
                <TableHead className="text-center">사용자 수</TableHead>
                <TableHead className="text-center">상태</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-mono font-semibold">
                    {role.name}
                    {role.isSystem && (
                      <Lock className="inline h-3 w-3 ml-2 text-blue-600" />
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">{role.displayName}</TableCell>
                  <TableCell className="text-gray-600 max-w-xs truncate">
                    {role.description || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{role.permissions.length}개</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      {role.userCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {role.isActive ? (
                      <Badge className="bg-green-500">활성</Badge>
                    ) : (
                      <Badge variant="secondary">비활성</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openViewDialog(role)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(role.id)}
                      disabled={role.isSystem || role.userCount > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 생성 다이얼로그 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 역할 생성</DialogTitle>
            <DialogDescription>
              새로운 역할을 생성하고 접근 권한을 설정합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>역할명 (영문, 대문자_언더스코어)</Label>
              <Input
                placeholder="예: SALES_MANAGER"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div>
              <Label>표시명</Label>
              <Input
                placeholder="예: 영업 매니저"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
              />
            </div>
            <div>
              <Label>설명</Label>
              <Textarea
                placeholder="역할에 대한 설명을 입력하세요"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label>페이지 접근 권한</Label>
              <p className="text-sm text-gray-500 mb-3">
                이 역할이 접근할 수 있는 페이지를 선택하세요
              </p>
              <ScrollArea className="h-[350px] border rounded-lg p-4">
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([category, perms]) => {
                    const categoryIds = perms.map(p => p.id);
                    const allSelected = categoryIds.every(id => 
                      formData.permissionIds.includes(id)
                    );
                    const someSelected = categoryIds.some(id => 
                      formData.permissionIds.includes(id)
                    );

                    return (
                      <div key={category} className="border-b pb-3">
                        {/* 카테고리 헤더 */}
                        <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded">
                          <Checkbox
                            id={`cat-create-${category}`}
                            checked={allSelected}
                            onCheckedChange={() => toggleCategory(perms)}
                            className="data-[state=checked]:bg-blue-600"
                          />
                          <label
                            htmlFor={`cat-create-${category}`}
                            className="font-semibold text-sm cursor-pointer flex-1"
                          >
                            {CATEGORY_INFO[category]?.displayName || category}
                          </label>
                          <span className="text-xs text-gray-500">
                            {someSelected ? `${categoryIds.filter(id => 
                              formData.permissionIds.includes(id)).length}/` : ''}
                            {perms.length}개
                          </span>
                        </div>

                        {/* 개별 권한 */}
                        <div className="pl-8 space-y-2">
                          {perms.map((perm) => (
                            <div key={perm.id} className="flex items-start gap-2">
                              <Checkbox
                                id={`create-${perm.id}`}
                                checked={formData.permissionIds.includes(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`create-${perm.id}`}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {perm.displayName}
                                </label>
                                {perm.description && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {perm.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              <p className="text-sm text-gray-500 mt-2">
                선택된 권한: {formData.permissionIds.length}개
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreate}>생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>역할 정보 수정</DialogTitle>
            <DialogDescription>
              역할 정보와 접근 권한을 수정합니다
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div>
                <Label>역할명</Label>
                <Input value={formData.name} disabled className="bg-gray-50" />
                {selectedRole.isSystem && (
                  <p className="text-xs text-blue-600 mt-1">
                    <Lock className="h-3 w-3 inline mr-1" />
                    시스템 역할
                  </p>
                )}
              </div>
              <div>
                <Label>표시명</Label>
                <Input
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>설명</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>페이지 접근 권한</Label>
                <p className="text-sm text-gray-500 mb-3">
                  접근할 수 있는 페이지를 선택하세요
                </p>
                <ScrollArea className="h-[350px] border rounded-lg p-4">
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([category, perms]) => {
                      const categoryIds = perms.map(p => p.id);
                      const allSelected = categoryIds.every(id => 
                        formData.permissionIds.includes(id)
                      );
                      const someSelected = categoryIds.some(id => 
                        formData.permissionIds.includes(id)
                      );

                      return (
                        <div key={category} className="border-b pb-3">
                          {/* 카테고리 헤더 */}
                          <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded">
                            <Checkbox
                              id={`cat-edit-${category}`}
                              checked={allSelected}
                              onCheckedChange={() => toggleCategory(perms)}
                              className="data-[state=checked]:bg-blue-600"
                            />
                            <label
                              htmlFor={`cat-edit-${category}`}
                              className="font-semibold text-sm cursor-pointer flex-1"
                            >
                              {CATEGORY_INFO[category]?.displayName || category}
                            </label>
                            <span className="text-xs text-gray-500">
                              {someSelected ? `${categoryIds.filter(id => 
                                formData.permissionIds.includes(id)).length}/` : ''}
                              {perms.length}개
                            </span>
                          </div>

                          {/* 개별 권한 */}
                          <div className="pl-8 space-y-2">
                            {perms.map((perm) => (
                              <div key={perm.id} className="flex items-start gap-2">
                                <Checkbox
                                  id={`edit-${perm.id}`}
                                  checked={formData.permissionIds.includes(perm.id)}
                                  onCheckedChange={() => togglePermission(perm.id)}
                                />
                                <div className="flex-1">
                                  <label
                                    htmlFor={`edit-${perm.id}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {perm.displayName}
                                  </label>
                                  {perm.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {perm.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <p className="text-sm text-gray-500 mt-2">
                  선택된 권한: {formData.permissionIds.length}개
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdate}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 상세보기 다이얼로그 */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>역할 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>역할명</Label>
                  <p className="font-mono font-semibold">{selectedRole.name}</p>
                </div>
                <div>
                  <Label>표시명</Label>
                  <p className="font-semibold">{selectedRole.displayName}</p>
                </div>
              </div>
              <div>
                <Label>설명</Label>
                <p className="text-gray-700">{selectedRole.description || "-"}</p>
              </div>
              <div>
                <Label>접근 가능한 페이지 ({selectedRole.permissions.length}개)</Label>
                <ScrollArea className="h-[300px] border rounded-lg p-4 mt-2">
                  <div className="space-y-3">
                    {Object.entries(
                      selectedRole.permissions.reduce((acc, perm) => {
                        const category = perm.category || "기타";
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(perm);
                        return acc;
                      }, {} as Record<string, Permission[]>)
                    ).map(([category, perms]) => (
                      <div key={category}>
                        <h4 className="font-semibold text-sm text-blue-600 mb-2">
                          {CATEGORY_INFO[category]?.displayName || category}
                        </h4>
                        <div className="space-y-1 pl-4">
                          {perms.map((perm) => (
                            <div key={perm.id} className="text-sm flex items-start gap-2">
                              <span className="text-green-600 mt-0.5">✓</span>
                              <div>
                                <div className="font-medium">{perm.displayName}</div>
                                {perm.description && (
                                  <div className="text-xs text-gray-500">{perm.description}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <Label className="text-xs text-gray-500">시스템 역할</Label>
                  <p>{selectedRole.isSystem ? "예" : "아니오"}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">활성 상태</Label>
                  <p>{selectedRole.isActive ? "활성" : "비활성"}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
