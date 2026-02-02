"use client";

import { Badge } from "@/components/ui/badge";
import { getTicketBadgeVariant } from "@/lib/dashboard-utils";
import { TICKET_STATUS_LABELS } from "@/lib/constants";
import type { RecentActivity } from "@/types";

interface RecentTicketsProps {
  tickets: RecentActivity["tickets"];
  limit?: number;
}

export function RecentTickets({ tickets, limit = 5 }: RecentTicketsProps) {
  const displayTickets = tickets.slice(0, limit);

  if (displayTickets.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">최근 티켓이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayTickets.map((ticket) => (
        <div
          key={ticket.id}
          className="flex items-center justify-between text-sm hover:bg-muted/50 rounded-lg p-2 transition-colors"
        >
          <div className="flex-1 min-w-0 mr-4">
            <p className="font-medium truncate">{ticket.subject}</p>
            <p className="text-xs text-muted-foreground">
              {ticket.customer.name}
            </p>
          </div>
          <Badge
            variant={getTicketBadgeVariant(ticket.status)}
            className="text-xs shrink-0"
          >
            {TICKET_STATUS_LABELS[ticket.status as keyof typeof TICKET_STATUS_LABELS] || ticket.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
