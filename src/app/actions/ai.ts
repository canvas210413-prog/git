"use server";

import { prisma } from "@/lib/prisma";
import { analyzeCustomerSegmentAI } from "@/lib/ai";
import { revalidatePath } from "next/cache";

export async function analyzeCustomer(customerId: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        orders: true,
        tickets: true,
      },
    });

    if (!customer) {
      return { success: false, error: "Customer not found" };
    }

    // Prepare data for AI
    const customerData = {
      name: customer.name,
      email: customer.email,
      company: customer.company,
      status: customer.status,
      orderCount: customer.orders.length,
      ticketCount: customer.tickets.length,
      // Add total spend calculation if needed
    };

    const segment = await analyzeCustomerSegmentAI(customerData);

    await prisma.customer.update({
      where: { id: customerId },
      data: { segment },
    });

    revalidatePath("/dashboard/customers");
    return { success: true, segment };
  } catch (error) {
    console.error("Analysis failed:", error);
    return { success: false, error: "Analysis failed" };
  }
}
