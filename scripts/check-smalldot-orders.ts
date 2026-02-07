import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSmallDotOrders() {
  try {
    console.log('=== 2026-02-06 스몰닷 주문 확인 ===\n');
    
    const orders = await prisma.order.findMany({
      where: {
        orderSource: '스몰닷',
        orderDate: {
          gte: new Date('2026-02-06T00:00:00'),
          lt: new Date('2026-02-07T00:00:00')
        }
      },
      select: {
        id: true,
        orderSource: true,
        customerName: true,
        productInfo: true,
        quantity: true,
        basePrice: true,
        orderDate: true
      },
      orderBy: {
        orderDate: 'asc'
      }
    });
    
    console.log(`총 ${orders.length}개 주문:\n`);
    
    orders.forEach((order, index) => {
      console.log(`${index + 1}. 주문 ID: ${order.id}`);
      console.log(`   고객명: ${order.customerName}`);
      console.log(`   상품정보: "${order.productInfo}"`);
      console.log(`   수량: ${order.quantity}`);
      console.log(`   금액: ${order.basePrice}원`);
      console.log(`   주문일시: ${order.orderDate}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSmallDotOrders();
