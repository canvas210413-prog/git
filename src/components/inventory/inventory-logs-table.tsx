"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/utils";
import { 
  ArrowUp, 
  ArrowDown, 
  Settings, 
  Package 
} from "lucide-react";

interface InventoryLog {
  id: string;
  type: string;
  quantity: number;
  beforeQty: number;
  afterQty: number;
  reason?: string;
  relatedPartName?: string;
  createdAt: Date;
  part: {
    name: string;
    partNumber: string;
  };
}

interface InventoryLogsTableProps {
  logs: InventoryLog[];
}

export function InventoryLogsTable({ logs }: InventoryLogsTableProps) {
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'IN':
        return { 
          label: '입고', 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: ArrowUp 
        };
      case 'OUT':
        return { 
          label: '출고', 
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: ArrowDown 
        };
      case 'ADJUST':
        return { 
          label: '조정', 
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Settings 
        };
      case 'AUTO_DEDUCT':
        return { 
          label: '자동차감', 
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: Package 
        };
      default:
        return { 
          label: type, 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Package 
        };
    }
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">재고 변동 이력이 없습니다</p>
          <p className="text-sm text-muted-foreground">
            재고 입출고가 발생하면 이곳에 기록됩니다
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  일시
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  구분
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  부품명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  부품번호
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  변경수량
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  변경전
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  변경후
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  사유
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => {
                const typeInfo = getTypeInfo(log.type);
                const Icon = typeInfo.icon;
                
                return (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(new Date(log.createdAt), 'long')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge 
                        variant="outline" 
                        className={`${typeInfo.color} border`}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {typeInfo.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {log.part.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                      {log.part.partNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <span className={log.quantity > 0 ? 'text-blue-600 font-semibold' : 'text-orange-600 font-semibold'}>
                        {log.quantity > 0 ? '+' : ''}{formatNumber(log.quantity)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-muted-foreground">
                      {formatNumber(log.beforeQty)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      {formatNumber(log.afterQty)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div>
                        {log.reason}
                        {log.relatedPartName && (
                          <span className="text-xs block mt-1 text-blue-600">
                            관련: {log.relatedPartName}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
