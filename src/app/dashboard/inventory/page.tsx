import { getParts } from "@/app/actions/inventory";
import { InventoryGrid } from "@/components/inventory/inventory-grid";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import Link from "next/link";

export default async function InventoryPage() {
  let parts: any[] = [];

  try {
    parts = await getParts();
  } catch (error) {
    console.error("Error loading inventory:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">재고 관리</h2>
          <p className="text-muted-foreground">
            전체 부품 재고 현황 - 입고/출고 관리
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            총 {parts.length}개 품목
          </div>
          <Link href="/dashboard/inventory/logs">
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              변동 이력
            </Button>
          </Link>
        </div>
      </div>

      <InventoryGrid parts={parts} />
    </div>
  );
}
