"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { History, ArrowUp, ArrowDown, RefreshCw, Settings } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface StockLog {
  id: string;
  partId: string;
  type: string;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  reason: string | null;
  relatedPartId: string | null;
  relatedPartName: string | null;
  userId: string | null;
  userName: string | null;
  createdAt: Date;
  part: {
    name: string;
    partNumber: string;
  };
}

interface StockHistoryProps {
  logs: StockLog[];
  parts: { id: string; name: string }[];
}

export function StockHistory({ logs: initialLogs, parts }: StockHistoryProps) {
  const [logs, setLogs] = useState<StockLog[]>(initialLogs);
  const [selectedPart, setSelectedPart] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  const fetchLogs = async (partId?: string) => {
    setLoading(true);
    try {
      const url = partId && partId !== "all" 
        ? `/api/inventory/logs?partId=${partId}` 
        : `/api/inventory/logs`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("로그 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePartChange = (value: string) => {
    setSelectedPart(value);
    fetchLogs(value === "all" ? undefined : value);
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case "IN":
        return { 
          label: "입고", 
          color: "bg-blue-500 text-white",
          icon: <ArrowUp className="h-3 w-3" />
        };
      case "OUT":
        return { 
          label: "출고", 
          color: "bg-orange-500 text-white",
          icon: <ArrowDown className="h-3 w-3" />
        };
      case "AUTO":
        return { 
          label: "자동차감", 
          color: "bg-purple-500 text-white",
          icon: <Settings className="h-3 w-3" />
        };
      case "ADJUST":
        return { 
          label: "조정", 
          color: "bg-gray-500 text-white",
          icon: <RefreshCw className="h-3 w-3" />
        };
      default:
        return { 
          label: type, 
          color: "bg-gray-500 text-white",
          icon: null
        };
    }
  };

  const filteredLogs = selectedPart === "all" 
    ? logs 
    : logs.filter(log => log.partId === selectedPart);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle>재고 변동 이력</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPart} onValueChange={handlePartChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="부품 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {parts.map((part) => (
                  <SelectItem key={part.id} value={part.id}>
                    {part.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(selectedPart === "all" ? undefined : selectedPart)}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">일시</TableHead>
                <TableHead>부품명</TableHead>
                <TableHead className="w-[100px]">구분</TableHead>
                <TableHead className="text-right w-[80px]">변경 전</TableHead>
                <TableHead className="text-right w-[80px]">변경량</TableHead>
                <TableHead className="text-right w-[80px]">변경 후</TableHead>
                <TableHead>사유</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    재고 변동 이력이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const typeInfo = getTypeInfo(log.type);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatDate(new Date(log.createdAt), "long")}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>{log.part.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {log.part.partNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${typeInfo.color} flex items-center gap-1 w-fit`}>
                          {typeInfo.icon}
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {log.beforeQuantity}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${
                        log.quantity > 0 ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {log.quantity > 0 ? '+' : ''}{log.quantity}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {log.afterQuantity}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{log.reason || '-'}</div>
                        {log.relatedPartName && (
                          <div className="text-xs text-muted-foreground mt-1">
                            관련: {log.relatedPartName}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
