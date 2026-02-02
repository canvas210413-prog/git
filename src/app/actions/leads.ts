"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateLeadSchema = z.object({
  title: z.string().min(1, "상품명은 필수입니다"),
  value: z.coerce.number().min(0, "금액은 0 이상이어야 합니다"),
  status: z.string(),
  customerName: z.string().min(1, "고객명은 필수입니다"), // Simplified for demo: just name
});

export async function getLeads() {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        customer: true,
        assignedTo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return { leads };
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    throw error;
  }
}

export async function updateLeadStatus(leadId: string, status: string) {
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: status as any },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update lead status:", error);
    throw error;
  }
}

export async function createLead(prevState: any, formData: FormData) {
  const validatedFields = CreateLeadSchema.safeParse({
    title: formData.get("title"),
    value: formData.get("value"),
    status: formData.get("status"),
    customerName: formData.get("customerName"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    // For demo purposes, we'll try to find a customer by name or create a dummy one if DB is up
    // In a real app, we would select from existing customers
    let customerId = "";
    
    const existingCustomer = await prisma.customer.findFirst({
      where: { name: validatedFields.data.customerName }
    });

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const newCustomer = await prisma.customer.create({
        data: {
          name: validatedFields.data.customerName,
          email: `guest_${Date.now()}@example.com`,
          status: "ACTIVE"
        }
      });
      customerId = newCustomer.id;
    }

    await prisma.lead.create({
      data: {
        title: validatedFields.data.title,
        value: validatedFields.data.value,
        status: validatedFields.data.status as any,
        customerId: customerId,
      },
    });

    revalidatePath("/dashboard/leads");
    return { success: true };
  } catch (error) {
    console.error("Failed to create lead:", error);
    return { message: "Failed to create lead" };
  }
}

export async function deleteLead(id: string) {
  try {
    await prisma.lead.delete({
      where: { id },
    });
    revalidatePath("/dashboard/leads");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete lead:", error);
    throw error;
  }
}
