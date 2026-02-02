"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Clock, RefreshCcw, CheckCircle } from "lucide-react";
import Link from "next/link";

interface AfterServiceData {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

interface AfterServiceSectionProps {
  data?: AfterServiceData;
}

export function AfterServiceSection({ data }: AfterServiceSectionProps) {
  const stats = data || { total: 0, pending: 0, inProgress: 0, completed: 0 };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Link href="/dashboard/after-service">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 AS</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">총 AS 접수 건수</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/after-service">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">대기 중</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{stats.pending.toLocaleString()}</div>
            <p className="text-xs text-orange-600">처리 대기 AS</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/after-service">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">진행 중</CardTitle>
            <RefreshCcw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.inProgress.toLocaleString()}</div>
            <p className="text-xs text-blue-600">처리 중인 AS</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/after-service">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.completed.toLocaleString()}</div>
            <p className="text-xs text-green-600">처리 완료 AS</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
