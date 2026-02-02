"use server";

import { prisma } from "@/lib/prisma";

export async function getCustomersForSelect() {
  return await prisma.customer.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}
