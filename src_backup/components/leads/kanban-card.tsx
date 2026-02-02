import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead, Customer } from "@prisma/client";
import { X } from "lucide-react";

interface KanbanCardProps {
  lead: Lead & { customer: Customer | null };
  onDelete?: (id: string) => void;
}

export function KanbanCard({ lead, onDelete }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3 cursor-grab active:cursor-grabbing group relative"
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
          <CardTitle className="text-sm font-medium leading-none">
            {lead.title}
          </CardTitle>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(lead.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xs text-muted-foreground mb-2">
            {lead.customer?.name || "Unknown Customer"}
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[10px]">
              {lead.value ? `₩${Number(lead.value).toLocaleString()}` : "-"}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {new Date(lead.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
