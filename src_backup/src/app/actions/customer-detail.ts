"use server";

import { prisma } from "@/lib/prisma";

export async function getCustomerDetail(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        tickets: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        leads: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        gifts: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        notes: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!customer) {
      return { error: "Customer not found" };
    }

    return { customer };
  } catch (error) {
    console.error("Failed to fetch customer detail:", error);
    throw error;
  }
}
