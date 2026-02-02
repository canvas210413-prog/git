"use server";

import { prisma } from "@/lib/prisma";
import { generateTicketResponse, TicketResponse } from "@/lib/ai";
import { revalidatePath } from "next/cache";

export async function getTickets() {
  try {
    const tickets = await prisma.ticket.findMany({
      include: { customer: true, assignedTo: true },
      orderBy: { createdAt: "desc" },
    });

    return tickets;
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    throw error;
  }
}

export async function getTicketStats() {
  try {
    const [total, open, inProgress, resolved] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { status: "RESOLVED" } }),
    ]);

    return { total, open, inProgress, resolved };
  } catch (error) {
    console.error("Failed to fetch ticket stats:", error);
    return { total: 0, open: 0, inProgress: 0, resolved: 0 };
  }
}

// ============================================================================
// AI-Powered Ticket Response Generation
// ============================================================================

export async function generateAIResponse(ticketId: string): Promise<{
  success: boolean;
  response?: TicketResponse;
  error?: string;
}> {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { customer: true },
    });

    if (!ticket) {
      return { success: false, error: "티켓을 찾을 수 없습니다." };
    }

    const response = await generateTicketResponse(
      ticket.subject,
      ticket.description || "",
      ticket.customer?.name
    );

    return { success: true, response };
  } catch (error) {
    console.error("AI Response Generation Failed:", error);
    return { success: false, error: "AI 응답 생성에 실패했습니다." };
  }
}

// ============================================================================
// Ticket Operations
// ============================================================================

export async function updateTicketStatus(
  ticketId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        ...(status === "RESOLVED" ? { closedAt: new Date() } : {}),
      },
    });

    revalidatePath("/dashboard/support");
    return { success: true };
  } catch (error) {
    console.error("Failed to update ticket status:", error);
    return { success: false, error: "상태 업데이트에 실패했습니다." };
  }
}

export async function addTicketComment(
  ticketId: string,
  content: string,
  isInternal: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.ticketComment.create({
      data: {
        ticketId,
        content,
        isInternal,
      },
    });

    revalidatePath("/dashboard/support");
    return { success: true };
  } catch (error) {
    console.error("Failed to add ticket comment:", error);
    return { success: false, error: "댓글 추가에 실패했습니다." };
  }
}

export async function getTicketById(ticketId: string) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
        assignedTo: true,
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return ticket;
  } catch (error) {
    console.error("Failed to fetch ticket:", error);
    return null;
  }
}