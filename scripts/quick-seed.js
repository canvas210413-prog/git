const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  
  // Delete in correct order due to foreign key constraints
  await prisma.lead.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});
  
  console.log('✓ Cleared existing data');
  console.log('Creating sample data...');

  // Create customers
  const customer1 = await prisma.customer.create({
    data: {
      name: '김철수',
      email: 'kim@example.com',
      phone: '010-1234-5678',
      status: 'ACTIVE',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: '이영희',
      email: 'lee@example.com',
      phone: '010-2345-6789',
      status: 'ACTIVE',
    },
  });

  console.log('✓ Created 2 customers');

  // Create orders
  const order1 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      totalAmount: 350000,
      status: 'COMPLETED',
      createdAt: new Date('2024-11-01'),
    },
  });

  const order2 = await prisma.order.create({
    data: {
      customerId: customer2.id,
      totalAmount: 420000,
      status: 'COMPLETED',
      createdAt: new Date('2024-11-15'),
    },
  });

  const order3 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      totalAmount: 280000,
      status: 'PENDING',
      createdAt: new Date('2024-11-20'),
    },
  });

  console.log('✓ Created 3 orders');

  // Create tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      subject: '제품 문의',
      description: '미니 공기청정기 필터 교체 주기가 궁금합니다.',
      customerId: customer1.id,
      status: 'RESOLVED',
      priority: 'MEDIUM',
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      subject: '배송 지연',
      description: '주문한 제품이 아직 도착하지 않았습니다.',
      customerId: customer2.id,
      status: 'OPEN',
      priority: 'HIGH',
    },
  });

  console.log('✓ Created 2 tickets');

  // Create leads
  const lead1 = await prisma.lead.create({
    data: {
      title: '미니 공기청정기 구매 상담',
      description: '웹사이트를 통한 문의 - 박민수 (park@example.com, 010-3456-7890)',
      customerId: customer1.id,
      status: 'WON',
      value: 500000,
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      title: '대량 구매 문의',
      description: '추천을 통한 문의 - 정수연 (jung@example.com, 010-4567-8901)',
      customerId: customer2.id,
      status: 'CONTACTED',
      value: 300000,
    },
  });

  console.log('✓ Created 2 leads');

  console.log('\n✅ Sample data created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
