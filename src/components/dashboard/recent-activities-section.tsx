import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentOrders } from "./recent-orders";
import { RecentTickets } from "./recent-tickets";
import type { RecentActivity } from "@/types";

interface RecentActivitiesSectionProps {
  activities: RecentActivity;
}

export function RecentActivitiesSection({ activities }: RecentActivitiesSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">최근 주문</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentOrders orders={activities.orders} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">최근 CS 티켓</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentTickets tickets={activities.tickets} />
        </CardContent>
      </Card>
    </div>
  );
}
