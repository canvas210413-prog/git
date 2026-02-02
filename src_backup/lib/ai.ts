import OpenAI from "openai";

// Initialize OpenAI client
// Note: In a real app, you would use process.env.OPENAI_API_KEY
// For this demo, we'll simulate the AI response if no key is provided.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
  dangerouslyAllowBrowser: true, // Only for demo purposes if needed client-side, but we use server-side
});

export async function analyzeCustomerSegmentAI(customerData: any) {
  if (!process.env.OPENAI_API_KEY) {
    // Simulate AI analysis delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simple rule-based simulation
    const company = customerData.company?.toLowerCase() || "";
    const email = customerData.email?.toLowerCase() || "";

    if (company.includes("tech") || company.includes("inc") || company.includes("corp")) {
      return "Enterprise";
    } else if (email.includes("gmail") || email.includes("yahoo")) {
      return "Individual";
    } else if (customerData.status === "INACTIVE") {
      return "At-Risk";
    } else {
      return "SMB";
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a CRM expert. Analyze the customer data and assign one of the following segments: 'Enterprise', 'SMB', 'Individual', 'VIP', 'At-Risk'. Return only the segment name.",
        },
        {
          role: "user",
          content: JSON.stringify(customerData),
        },
      ],
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0].message.content || "Unknown";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "Error";
  }
}

export async function searchCRMWithAI(query: string) {
  if (!process.env.OPENAI_API_KEY) {
    // Simulation for demo
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes("customer") || lowerQuery.includes("find")) {
      return {
        type: "customer",
        filters: {
          status: "ACTIVE",
        },
        explanation: "Searching for active customers based on your query.",
      };
    }
    return {
      type: "general",
      explanation: "I understood your query but I'm in demo mode.",
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a CRM assistant. Convert the user's natural language query into a structured search intent.
          Return JSON format: { "type": "customer" | "lead" | "order", "filters": { ...prisma where clause... }, "explanation": "string" }
          Example: "Find active customers from Acme" -> { "type": "customer", "filters": { "status": "ACTIVE", "company": { "contains": "Acme" } }, "explanation": "Searching for active customers from Acme." }`,
        },
        {
          role: "user",
          content: query,
        },
      ],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content || "{}");
  } catch (error) {
    console.error("AI Search Error:", error);
    return null;
  }
}
