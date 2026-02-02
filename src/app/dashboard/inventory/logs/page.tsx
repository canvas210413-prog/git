import { getAllInventoryLogs } from "@/app/actions/inventory";
import { InventoryLogsTable } from "@/components/inventory/inventory-logs-table";

export default async function InventoryLogsPage() {
  let logs: any[] = [];

  try {
    logs = await getAllInventoryLogs(1000);
  } catch (error) {
    console.error("Error loading inventory logs:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">재고 변동 이력</h2>
          <p className="text-muted-foreground">
            모든 입출고 및 재고 변경 내역을 확인하세요
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          총 {logs.length}건
        </div>
      </div>

      <InventoryLogsTable logs={logs} />
    </div>
  );
}
