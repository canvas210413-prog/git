const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  console.log('=== CRM Order 데이터 샘플 ===\n');
  
  const orders = await prisma.order.findMany({
    take: 5,
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });
  
  if (orders.length === 0) {
    console.log('주문 데이터가 없습니다.');
  } else {
    orders.forEach((order, index) => {
      console.log(`[${index + 1}] 주문번호: ${order.orderNumber}`);
      console.log(`    고객명: ${order.customerName || order.customer.name}`);
      console.log(`    연락처(customerPhone): ${order.customerPhone || '없음'}`);
      console.log(`    고객전화(customer.phone): ${order.customer.phone || '없음'}`);
      console.log('');
    });
  }
  
  console.log('\n=== MallOrder 데이터 샘플 ===\n');
  
  const mallOrders = await prisma.mallOrder.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });
  
  if (mallOrders.length === 0) {
    console.log('쇼핑몰 주문 데이터가 없습니다.');
  } else {
    mallOrders.forEach((order, index) => {
      console.log(`[${index + 1}] 주문번호: ${order.orderNumber}`);
      console.log(`    고객명: ${order.customerName || '없음'}`);
      console.log(`    연락처: ${order.customerPhone || '없음'}`);
      console.log('');
    });
  }
  
  await prisma.$disconnect();
}

checkOrders().catch(e => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
