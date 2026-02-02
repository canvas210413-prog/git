"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createUser } from "@/app/actions/users";
import { useFormState } from "react-dom";

const initialState: any = { message: null, errors: {} };

export function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createUser, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> 사용자 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>새 사용자 추가</DialogTitle>
          <DialogDescription>
            시스템에 접근할 수 있는 새 사용자를 등록합니다.
          </DialogDescription>
        </DialogHeader>
        <form action={async (formData) => {
          await formAction(formData);
          setOpen(false);
        }}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                이름
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="홍길동"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                이메일
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="user@example.com"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                비밀번호
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                className="col-span-3"
                required
                minLength={6}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                권한
              </Label>
              <Select name="role" defaultValue="USER">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="권한 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">일반 사용자 (User)</SelectItem>
                  <SelectItem value="MANAGER">매니저 (Manager)</SelectItem>
                  <SelectItem value="ADMIN">관리자 (Admin)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">생성</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
