"use server";

import { prisma } from "@/lib/prisma";

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