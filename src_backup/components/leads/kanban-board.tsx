"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { Lead, Customer, LeadStatus } from "@prisma/client";
import { updateLeadStatus, deleteLead } from "@/app/actions/leads";

interface KanbanBoardProps {
  initialLeads: (Lead & { customer: Customer | null })[];
}

const COLUMNS: { id: LeadStatus; title: string }[] = [
  { id: "NEW", title: "상품 조회 (Viewed)" },
  { id: "CONTACTED", title: "장바구니 (Cart)" },
  { id: "QUALIFIED", title: "주문서 작성 (Checkout)" },
  { id: "PROPOSAL", title: "결제 시도 (Payment)" },
  { id: "NEGOTIATION", title: "결제 실패 (Fail)" },
  { id: "WON", title: "구매 완료 (Purchased)" },
  { id: "LOST", title: "이탈 (Abandoned)" },
];

export function KanbanBoard({ initialLeads }: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

    const currentLead = leads.find((l) => l.id === leadId);

    if (currentLead && currentLead.status !== newStatus) {
      // Optimistic update
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, status: newStatus } : l
        )
      );

      // Server update
      const result = await updateLeadStatus(leadId, newStatus);
      if (!result.success) {
        // Revert on failure
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, status: currentLead.status } : l
          )
        );
      }
    }

    setActiveId(null);
  }

  async function handleDelete(leadId: string) {
    if (confirm("정말로 이 항목을 삭제하시겠습니까?")) {
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      await deleteLead(leadId);
    }
  }

  const activeLead = leads.find((l) => l.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100vh-200px)] overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            leads={leads.filter((l) => l.status === col.id)}
            onDelete={handleDelete}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? <KanbanCard lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
