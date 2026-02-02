"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createCustomer } from "@/app/actions/customer";
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
import { Plus } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "저장 중..." : "고객 저장"}
    </Button>
  );
}

export function AddCustomerDialog() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<any>(null);

  async function action(formData: FormData) {
    const result = await createCustomer(null, formData);
    if (result?.success) {
      setOpen(false);
      setState(null);
    } else {
      setState(result);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> 고객 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>고객 추가</DialogTitle>
          <DialogDescription>
            새로운 고객을 CRM에 추가합니다. 완료되면 저장을 클릭하세요.
          </DialogDescription>
        </DialogHeader>
        <form action={action}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                이름
              </Label>
              <div className="col-span-3">
                <Input id="name" name="name" className="col-span-3" required />
                {state?.error?.name && (
                  <p className="text-sm text-red-500 mt-1">{state.error.name[0]}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                이메일
              </Label>
              <div className="col-span-3">
                <Input id="email" name="email" type="email" className="col-span-3" required />
                {state?.error?.email && (
                  <p className="text-sm text-red-500 mt-1">{state.error.email[0]}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                회사
              </Label>
              <Input id="company" name="company" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                전화번호
              </Label>
              <Input id="phone" name="phone" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
