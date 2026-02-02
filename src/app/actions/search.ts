"use server";

import { prisma } from "@/lib/prisma";
import { searchCRMWithAI } from "@/lib/ai";

export async function performGlobalSearch(query: string) {
  if (!query || query.trim().length === 0) return { results: [] };

  // 1. Get AI interpretation
  const intent = await searchCRMWithAI(query);

  if (!intent) return { results: [], message: "Could not understand query." };

  let results = [];

  // 2. Execute Query based on intent
  try {
    if (intent.type === "customer") {
      results = await prisma.customer.findMany({
        where: intent.filters || {},
        take: 5,
      });
    } else if (intent.type === "lead") {
      results = await prisma.lead.findMany({
        where: intent.filters || {},
        take: 5,
        include: { customer: true },
      });
    } else {
      // Fallback: Simple text search across customers
      results = await prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { company: { contains: query } },
          ],
        },
        take: 5,
      });
      intent.type = "customer"; // Default to customer for display
    }
  } catch (e) {
    console.error("Search execution failed", e);
    return { results: [], message: "Failed to execute search." };
  }

  return {
    results,
    intent,
  };
}
