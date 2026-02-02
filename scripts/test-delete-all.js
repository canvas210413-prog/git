/**
 * 전체 삭제 테스트
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testDeleteAll() {
  console.log("🧪 전체 삭제 테스트 시작...\n");

  try {
    // 1. 현재 주문 수 확인
    console.log("1️⃣ 현재 주문 수 확인...");
    const orderCount = await prisma.order.count();
    const mallOrderCount = await prisma.mallOrder.count();
    console.log(`   - Order: ${orderCount}건`);
    console.log(`   - MallOrder: ${mallOrderCount}건`);
    console.log(`   - 총: ${orderCount + mallOrderCount}건`);

    if (orderCount + mallOrderCount === 0) {
      console.log("\n⚠️ 삭제할 주문이 없습니다. 테스트 데이터를 생성합니다...");
      
      // 테스트 고객 생성
      const customer = await prisma.customer.create({
        data: {
          name: "테스트고객",
          email: "test@test.com",
          phone: "010-1111-1111",
        },
      });

      // 테스트 주문 3개 생성
      await prisma.order.createMany({
        data: [
          {
            customerId: customer.id,
            orderDate: new Date(),
            totalAmount: "10000",
            status: "PENDING",
            recipientName: "수취인1",
          },
          {
            customerId: customer.id,
            orderDate: new Date(),
            totalAmount: "20000",
            status: "PENDING",
            recipientName: "수취인2",
          },
          {
            customerId: customer.id,
            orderDate: new Date(),
            totalAmount: "30000",
            status: "PENDING",
            recipientName: "수취인3",
          },
        ],
      });

      console.log("✅ 테스트 데이터 3건 생성 완료");
    }

    // 2. 전체 삭제 실행
    console.log("\n2️⃣ 전체 삭제 실행...");
    const [orderResult, mallOrderResult] = await Promise.all([
      prisma.order.deleteMany({}),
      prisma.mallOrder.deleteMany({}),
    ]);

    console.log(`   ✅ Order 삭제: ${orderResult.count}건`);
    console.log(`   ✅ MallOrder 삭제: ${mallOrderResult.count}건`);
    console.log(`   ✅ 총 삭제: ${orderResult.count + mallOrderResult.count}건`);

    // 3. 삭제 확인
    console.log("\n3️⃣ 삭제 확인...");
    const remainingOrders = await prisma.order.count();
    const remainingMallOrders = await prisma.mallOrder.count();
    console.log(`   - Order: ${remainingOrders}건`);
    console.log(`   - MallOrder: ${remainingMallOrders}건`);
    console.log(`   - 총: ${remainingOrders + remainingMallOrders}건`);

    if (remainingOrders === 0 && remainingMallOrders === 0) {
      console.log("\n🎉 전체 삭제 성공!");
    } else {
      console.log("\n⚠️ 일부 주문이 남아있습니다!");
    }

  } catch (error) {
    console.error("\n❌ 테스트 실패:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteAll().catch(console.error);
