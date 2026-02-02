const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.part.deleteMany({});
  console.log("Parts deleted:", result.count);
}

main().finally(() => prisma.$disconnect());
