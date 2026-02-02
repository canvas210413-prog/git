"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Pencil, Trash2 } from "lucide-react";
import { updateCustomer, deleteCustomer } from "@/app/actions/customer";
import { useFormState } from "react-dom";

interface CustomerActionsProps {
  customer: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
    status: string;
  };
}

const initialState = { message: null, errors: {} };

export function CustomerActions({ customer }: CustomerActionsProps) {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();
  const [state, formAction] = useFormState(updateCustomer, initialState);

  const handleDelete = async () => {
    if (confirm("정말로 이 고객을 삭제하시겠습니까?")) {
      await deleteCustomer(customer.id);
      router.push("/dashboard/customers");
      router.refresh();
    }
  };

  return (
    <div className="flex gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            수정
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>고객 정보 수정</DialogTitle>
            <DialogDescription>
              고객의 기본 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <form action={async (formData) => {
            await formAction(formData);
            setOpen(false);
          }}>
            <input type="hidden" name="id" value={customer.id} />
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  이름
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={customer.name}
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
                  defaultValue={customer.email}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company" className="text-right">
                  플랫폼
                </Label>
                <Input
                  id="company"
                  name="company"
                  defaultValue={customer.company || ""}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  전화번호
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={customer.phone || ""}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  상태
                </Label>
                <Select name="status" defaultValue={customer.status}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">활성</SelectItem>
                    <SelectItem value="INACTIVE">비활성</SelectItem>
                    <SelectItem value="ARCHIVED">보관됨</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Button variant="destructive" size="sm" onClick={handleDelete}>
        <Trash2 className="mr-2 h-4 w-4" />
        삭제
      </Button>
    </div>
  );
}
