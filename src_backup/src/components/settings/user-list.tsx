"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Shield, Trash2 } from "lucide-react";
import { updateUserRole, deleteUser } from "@/app/actions/users";

interface UserListProps {
  users: any[];
}

export function UserList({ users }: UserListProps) {
  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateUserRole(userId, newRole);
  };

  const handleDelete = async (userId: string) => {
    if (confirm("정말로 이 사용자를 삭제하시겠습니까?")) {
      await deleteUser(userId);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-red-500">관리자</Badge>;
      case "MANAGER":
        return <Badge className="bg-blue-500">매니저</Badge>;
      default:
        return <Badge variant="secondary">사용자</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>이메일</TableHead>
            <TableHead>권한</TableHead>
            <TableHead>가입일</TableHead>
            <TableHead className="text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell>
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">메뉴 열기</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>작업</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => navigator.clipboard.writeText(user.email)}
                    >
                      이메일 복사
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>권한 변경</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, "USER")}>
                      <Shield className="mr-2 h-4 w-4" /> 일반 사용자
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, "MANAGER")}>
                      <Shield className="mr-2 h-4 w-4 text-blue-500" /> 매니저
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, "ADMIN")}>
                      <Shield className="mr-2 h-4 w-4 text-red-500" /> 관리자
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> 사용자 삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
