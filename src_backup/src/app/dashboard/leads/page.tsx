import { getLeads } from "@/app/actions/leads";
import { KanbanBoard } from "@/components/leads/kanban-board";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";

export default async function LeadsPage() {
  let leads: any[] = [];
  let error = null;

  try {
    const result = await getLeads();
    leads = result.leads;
  } catch (e) {
    console.error("Error loading leads:", e);
    error = e;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">데이터를 불러올 수 없습니다.</h2>
        <p className="text-muted-foreground mt-2">데이터베이스 연결을 확인해주세요.</p>
        <pre className="mt-4 p-4 bg-slate-100 rounded text-left text-xs overflow-auto max-w-lg mx-auto">
          {String(error)}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between flex-none">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">구매 여정 및 주문 관리</h2>
          <p className="text-muted-foreground">
            고객의 상품 조회부터 구매 완료까지의 여정을 추적하고 이탈을 방지합니다.
          </p>
        </div>
        <AddLeadDialog />
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard initialLeads={leads} />
      </div>
    </div>
  );
}
