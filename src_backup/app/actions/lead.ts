"use server";

import { prisma } from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getLeads() {
  try {
    return await prisma.lead.findMany({
      include: {
        customer: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return [];
  }
}

export async function updateLeadStatus(leadId: string, newStatus: LeadStatus) {
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: newStatus },
    });
    revalidatePath("/dashboard/leads");
    return { success: true };
  } catch (error) {
    console.error("Failed to update lead status:", error);
    return { success: false, error: "Failed to update status" };
  }
}
