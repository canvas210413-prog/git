"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  MoreHorizontal,
  Eye,
  Loader2,
  Crown,
  ShoppingBag,
  Gift,
  Mail,
  Calendar,
  RefreshCw,
  Edit,
  UserCog,
} from "lucide-react";

interface MallUser {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  grade: string;
  totalSpent: number;
  addresses: any[];
  emailNotification: boolean;
  smsNotification: boolean;
  marketingEmail: boolean;
  marketingSms: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    orders: number;
    coupons: number;
  };
}

const GRADES = [
  { value: "BRONZE", label: "브론즈", color: "bg-orange-700" },
  { value: "SILVER", label: "실버", color: "bg-slate-400" },
  { value: "GOLD", label: "골드", color: "bg-yellow-500" },
  { value: "VIP", label: "VIP", color: "bg-purple-500" },
];

export default function MallUsersPage() {
  const [users, setUsers] = useState<MallUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<MallUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isGradeEditOpen, setIsGradeEditOpen] = useState(false);
  const [newGrade, setNewGrade] = useState("");
  const [saving, setSaving] = useState(false);

  // 회원 목록 조회
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (gradeFilter !== "all") params.append("grade", gradeFilter);
      
      const response = await fetch(`/api/mall/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, gradeFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 등급 변경
  const handleGradeChange = async () => {
    if (!selectedUser || !newGrade) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/mall/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: newGrade }),
      });

      if (response.ok) {
        fetchUsers();
        setIsGradeEditOpen(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Failed to update grade:", error);
    } finally {
      setSaving(false);
    }
  };

  // 상세 보기
  const handleViewDetail = (user: MallUser) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  // 등급 수정 모달 열기
  const handleOpenGradeEdit = (user: MallUser) => {
    setSelectedUser(user);
    setNewGrade(user.grade);
    setIsGradeEditOpen(true);
  };

  // 날짜 포맷
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // 등급 배지
  const getGradeBadge = (grade: string) => {
    const gradeInfo = GRADES.find(g => g.value === grade);
    return (
      <Badge className={`${gradeInfo?.color || "bg-gray-500"} text-white`}>
        {grade === "VIP" && <Crown className="h-3 w-3 mr-1" />}
        {gradeInfo?.label || grade}
      </Badge>
    );
  };

  // 통계
  const stats = {
    total: users.length,
    bronze: users.filter(u => u.grade === "BRONZE").length,
    silver: users.filter(u => u.grade === "SILVER").length,
    gold: users.filter(u => u.grade === "GOLD").length,
    vip: users.filter(u => u.grade === "VIP").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">회원 관리</h1>
          <p className="text-muted-foreground">쇼핑몰 회원을 관리합니다.</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">전체 회원</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">브론즈</p>
                <p className="text-2xl font-bold">{stats.bronze}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-200 rounded-lg">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">실버</p>
                <p className="text-2xl font-bold">{stats.silver}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">골드</p>
                <p className="text-2xl font-bold">{stats.gold}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Crown className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">VIP</p>
                <p className="text-2xl font-bold">{stats.vip}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="이름, 이메일, 전화번호로 검색..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="회원 등급" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 등급</SelectItem>
                {GRADES.map((grade) => (
                  <SelectItem key={grade.value} value={grade.value}>
                    {grade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchUsers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 회원 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>회원 목록</CardTitle>
          <CardDescription>총 {users.length}명의 회원</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Users className="h-12 w-12 mb-4" />
              <p>회원이 없습니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>회원정보</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead className="text-center">등급</TableHead>
                  <TableHead className="text-right">누적 구매</TableHead>
                  <TableHead className="text-center">주문수</TableHead>
                  <TableHead className="text-center">마케팅 동의</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.phone ? (
                        <span className="text-sm font-medium text-slate-700">{user.phone}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">미등록</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {getGradeBadge(user.grade)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {(user.totalSpent || 0).toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-center">
                      {user._count?.orders || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        {user.marketingEmail && <Badge variant="outline" className="text-xs">이메일</Badge>}
                        {user.marketingSms && <Badge variant="outline" className="text-xs">SMS</Badge>}
                        {!user.marketingEmail && !user.marketingSms && <span className="text-muted-foreground text-xs">없음</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetail(user)}>
                            <Eye className="h-4 w-4 mr-2" />
                            상세보기
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenGradeEdit(user)}>
                            <Crown className="h-4 w-4 mr-2" />
                            등급변경
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 회원 상세 모달 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>회원 상세</DialogTitle>
            <DialogDescription>
              회원 ID: {selectedUser?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {/* 기본 정보 */}
              <div>
                <h4 className="font-semibold mb-2">기본 정보</h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-lg">{selectedUser.name}</div>
                      <div className="flex items-center gap-2">
                        {getGradeBadge(selectedUser.grade)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{selectedUser.phone || "연락처 미등록"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>가입일: {formatDate(selectedUser.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 배송지 */}
              {selectedUser.addresses && selectedUser.addresses.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">배송지 ({selectedUser.addresses.length})</h4>
                  <div className="space-y-2">
                    {selectedUser.addresses.slice(0, 3).map((addr: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{addr.name}</span>
                          {addr.isDefault && <Badge variant="outline" className="text-xs">기본</Badge>}
                        </div>
                        <div className="text-muted-foreground">
                          {addr.recipient} · [{addr.zipCode}] {addr.address} {addr.addressDetail}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 구매 정보 */}
              <div>
                <h4 className="font-semibold mb-2">구매 정보</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedUser._count?.orders || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">주문수</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(selectedUser.totalSpent || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">누적구매(원)</div>
                  </div>
                </div>
              </div>

              {/* 알림 설정 */}
              <div>
                <h4 className="font-semibold mb-2">알림 설정</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={selectedUser.emailNotification ? "default" : "secondary"}>
                    주문 이메일 {selectedUser.emailNotification ? "동의" : "거부"}
                  </Badge>
                  <Badge variant={selectedUser.smsNotification ? "default" : "secondary"}>
                    주문 SMS {selectedUser.smsNotification ? "동의" : "거부"}
                  </Badge>
                  <Badge variant={selectedUser.marketingEmail ? "default" : "secondary"}>
                    마케팅 이메일 {selectedUser.marketingEmail ? "동의" : "거부"}
                  </Badge>
                  <Badge variant={selectedUser.marketingSms ? "default" : "secondary"}>
                    마케팅 SMS {selectedUser.marketingSms ? "동의" : "거부"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 등급 변경 모달 */}
      <Dialog open={isGradeEditOpen} onOpenChange={setIsGradeEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>회원 등급 변경</DialogTitle>
            <DialogDescription>
              {selectedUser?.name}님의 등급을 변경합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">현재 등급:</span>
              {selectedUser && getGradeBadge(selectedUser.grade)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">변경할 등급</label>
              <Select value={newGrade} onValueChange={setNewGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="등급 선택" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((grade) => (
                    <SelectItem key={grade.value} value={grade.value}>
                      {grade.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGradeEditOpen(false)}>
              취소
            </Button>
            <Button onClick={handleGradeChange} disabled={saving || !newGrade}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              변경
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
