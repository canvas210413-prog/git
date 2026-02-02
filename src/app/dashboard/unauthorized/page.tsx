"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-[600px] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldAlert className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">접근 권한이 없습니다</CardTitle>
          <CardDescription>
            이 페이지에 접근할 수 있는 권한이 없습니다.
            <br />
            관리자에게 문의하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button onClick={() => router.push("/dashboard")} className="w-full">
            대시보드로 이동
          </Button>
          <Button onClick={() => router.back()} variant="outline" className="w-full">
            이전 페이지로
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
