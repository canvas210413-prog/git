import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "./kanban-card";
import { Lead, Customer } from "@prisma/client";

type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST";

interface KanbanColumnProps {
  id: LeadStatus;
  title: string;
  leads: (Lead & { customer: Customer | null })[];
  onDelete?: (id: string) => void;
}

export function KanbanColumn({ id, title, leads, onDelete }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className="flex flex-col w-80 min-w-[20rem] bg-muted/50 rounded-lg p-4 mr-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase">
          {title}
        </h3>
        <span className="bg-background text-xs font-medium px-2 py-0.5 rounded-full border">
          {leads.length}
        </span>
      </div>
      <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[150px]">
        {leads.map((lead) => (
          <KanbanCard key={lead.id} lead={lead} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
