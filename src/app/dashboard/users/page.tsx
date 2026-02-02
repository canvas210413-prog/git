"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Key,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  isLocked: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  assignedPartner: string | null;
  roles: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
}

// 협력사(고객주문처명) 목록
const PARTNER_OPTIONS = [
  { value: "ALL", label: "본사 (전체 접근)" },
  { value: "그로트", label: "그로트" },
  { value: "스몰닷", label: "스몰닷" },
  { value: "해피포즈", label: "해피포즈" },
  { value: "로켓그로스", label: "로켓그로스" },
];

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleIds: [] as string[],
    assignedPartner: "ALL", // 협력사 (ALL이면 본사 - 전체 접근)
  });

  // 데이터 로드
  const fetchData = async () => {
    setLoading(true);
    try {
      // 사용자 목록
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      // 역할 목록
      const rolesRes = await fetch("/api/roles");
      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setRoles(data.roles || []);
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

  // 필터링된 사용자
  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 사용자 생성
  const handleCreate = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          assignedPartner: formData.assignedPartner === "ALL" ? null : formData.assignedPartner,
        }),
      });

      if (res.ok) {
        alert("사용자가 생성되었습니다.");
        setCreateDialogOpen(false);
        setFormData({ name: "", email: "", password: "", roleIds: [], assignedPartner: "ALL" });
        fetchData();
      } else {
        const error = await res.json();
        alert(`생성 실패: ${error.message}`);
      }
    } catch (error) {
      console.error("사용자 생성 실패:", error);
      alert("사용자 생성 중 오류가 발생했습니다.");
    }
  };

  // 사용자 수정
  const handleUpdate = async () => {
    if (!selectedUser) return;

    try {
      console.log("Updating user:", selectedUser.id);
      console.log("Update data:", {
        ...formData,
        assignedPartner: formData.assignedPartner === "ALL" ? null : formData.assignedPartner,
      });

      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          assignedPartner: formData.assignedPartner === "ALL" ? null : formData.assignedPartner,
        }),
      });

      const data = await res.json();
      console.log("Response:", data);

      if (res.ok) {
        alert("사용자 정보가 수정되었습니다.");
        setEditDialogOpen(false);
        setSelectedUser(null);
        fetchData();
      } else {
        alert(`수정 실패: ${data.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("사용자 수정 실패:", error);
      alert(`사용자 수정 중 오류가 발생했습니다: ${error}`);
    }
  };

  // 사용자 비활성화
  const handleDeactivate = async (userId: string) => {
    if (!confirm("이 사용자를 비활성화하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("사용자가 비활성화되었습니다.");
        fetchData();
      } else {
        const error = await res.json();
        alert(`비활성화 실패: ${error.message}`);
      }
    } catch (error) {
      console.error("사용자 비활성화 실패:", error);
    }
  };

  // 계정 잠금 해제
  const handleUnlock = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/unlock`, {
        method: "POST",
      });

      if (res.ok) {
        alert("계정 잠금이 해제되었습니다.");
        fetchData();
      } else {
        alert("잠금 해제 실패");
      }
    } catch (error) {
      console.error("잠금 해제 실패:", error);
    }
  };

  // 수정 다이얼로그 열기
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      email: user.email,
      password: "",
      roleIds: user.roles.map((r) => r.id),
      assignedPartner: user.assignedPartner || "ALL",
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            사용자 관리
          </h1>
          <p className="text-gray-600 mt-1">시스템 사용자 및 권한 관리</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          새 사용자 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">잠긴 계정</CardTitle>
            <Lock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.isLocked).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">비활성 사용자</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => !u.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="이메일 또는 이름으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 사용자 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록 ({filteredUsers.length}명)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>협력사(주문처)</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>마지막 로그인</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge key={role.id} variant="outline">
                            {role.displayName}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">{user.role}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.assignedPartner ? (
                      <Badge className="bg-purple-100 text-purple-800">
                        {user.assignedPartner}
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800">
                        본사 (전체)
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.isActive ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          활성
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          비활성
                        </Badge>
                      )}
                      {user.isLocked && (
                        <Badge className="bg-red-100 text-red-800">
                          <Lock className="h-3 w-3 mr-1" />
                          잠김
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-gray-400" />
                        {format(new Date(user.lastLoginAt), "yyyy-MM-dd HH:mm", {
                          locale: ko,
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), "yyyy-MM-dd", { locale: ko })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user.isLocked && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnlock(user.id)}
                        >
                          <Unlock className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeactivate(user.id)}
                        disabled={!user.isActive}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 생성 다이얼로그 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>새 사용자 추가</DialogTitle>
            <DialogDescription>새로운 시스템 사용자를 생성합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>이름 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="홍길동"
              />
            </div>
            <div>
              <Label>이메일 *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@company.com"
              />
            </div>
            <div>
              <Label>비밀번호 *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="최소 6자 이상"
              />
            </div>
            <div>
              <Label>역할 선택</Label>
              <Select
                value={formData.roleIds[0] || ""}
                onValueChange={(val) => setFormData({ ...formData, roleIds: [val] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {role.displayName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>협력사(주문처) 할당</Label>
              <Select
                value={formData.assignedPartner}
                onValueChange={(val) => setFormData({ ...formData, assignedPartner: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="협력사 선택" />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                협력사를 선택하면 해당 주문처의 데이터만 접근 가능합니다.
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>사용자 정보 수정</DialogTitle>
            <DialogDescription>사용자 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>이름</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>이메일</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>역할 선택</Label>
              <Select
                value={formData.roleIds[0] || ""}
                onValueChange={(val) => setFormData({ ...formData, roleIds: [val] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {role.displayName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>협력사(주문처) 할당</Label>
              <Select
                value={formData.assignedPartner}
                onValueChange={(val) => setFormData({ ...formData, assignedPartner: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="협력사 선택" />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                협력사를 선택하면 해당 주문처의 데이터만 접근 가능합니다.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdate}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
