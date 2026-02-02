const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateOrders() {
  console.log('=== 주문 데이터에 전화번호 업데이트 ===\n');
  
  // MallOrder에 customerName, customerPhone, customerEmail 추가
  const mallOrders = await prisma.mallOrder.findMany({
    include: { user: true },
  });
  
  console.log(`총 ${mallOrders.length}개의 MallOrder 업데이트 중...\n`);
  
  for (const order of mallOrders) {
    if (order.user) {
      await prisma.mallOrder.update({
        where: { id: order.id },
        data: {
          customerName: order.user.name || '쇼핑몰고객',
          customerEmail: order.user.email,
          customerPhone: order.user.phone,
        },
      });
      console.log(`✓ ${order.orderNumber}: ${order.user.name} (${order.user.phone})`);
    }
  }
  
  console.log('\n=== CRM Order의 customerPhone 업데이트 ===\n');
  
  // CRM Order의 customerPhone을 customer.phone으로 업데이트
  const crmOrders = await prisma.order.findMany({
    where: {
      OR: [
        { customerPhone: null },
        { customerPhone: '' },
      ],
    },
    include: { customer: true },
  });
  
  console.log(`총 ${crmOrders.length}개의 CRM Order 업데이트 중...\n`);
  
  for (const order of crmOrders) {
    if (order.customer.phone) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          customerPhone: order.customer.phone,
        },
      });
      console.log(`✓ ${order.orderNumber}: ${order.customer.name} (${order.customer.phone})`);
    }
  }
  
  console.log('\n✅ 업데이트 완료!');
  
  await prisma.$disconnect();
}

updateOrders().catch(e => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
