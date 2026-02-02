"use client";

import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { getOrderBadgeVariant, formatKoreanDate } from "@/lib/dashboard-utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { RecentActivity } from "@/types";

interface RecentOrdersProps {
  orders: RecentActivity["orders"];
  limit?: number;
}

export function RecentOrders({ orders, limit = 5 }: RecentOrdersProps) {
  const displayOrders = orders.slice(0, limit);

  if (displayOrders.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">최근 주문이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayOrders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between text-sm hover:bg-muted/50 rounded-lg p-2 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{order.customer.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatKoreanDate(order.createdAt)}
            </p>
          </div>
          <div className="text-right ml-4">
            <p className="font-medium">{formatNumber(order.totalAmount)}원</p>
            <Badge
              variant={getOrderBadgeVariant(order.status)}
              className="text-xs mt-1"
            >
              {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
