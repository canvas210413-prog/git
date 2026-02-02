"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

interface QuickLinksCardProps {
  links?: QuickLink[];
}

const DEFAULT_LINKS: QuickLink[] = [
  { href: "/dashboard/customers", label: "고객 관리" },
  { href: "/dashboard/orders", label: "주문 관리" },
  { href: "/dashboard/inventory", label: "재고 관리" },
  { href: "/dashboard/support", label: "고객 지원" },
];

export function QuickLinksCard({ links = DEFAULT_LINKS }: QuickLinksCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">빠른 이동</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2 flex-wrap">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Button variant="outline" size="sm" className="gap-2">
              {link.icon}
              {link.label}
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
