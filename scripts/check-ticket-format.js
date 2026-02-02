const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Ticket 데이터 형식 확인...\n');
  
  const tickets = await prisma.ticket.findMany({
    where: {
      description: {
        startsWith: '[네이버 리뷰 -'
      }
    },
    take: 5,
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`📊 네이버 리뷰 티켓: ${tickets.length}건\n`);
  
  tickets.forEach((ticket, index) => {
    console.log(`${index + 1}. ID: ${ticket.id}`);
    console.log(`   Description: ${ticket.description.substring(0, 200)}`);
    console.log(`   Created: ${ticket.createdAt}\n`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
