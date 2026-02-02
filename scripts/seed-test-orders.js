/**
 * 테스트 주문 데이터 생성
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedTestOrders() {
  console.log("🌱 테스트 주문 데이터 생성 시작...\n");

  try {
    // 테스트 고객 찾기 또는 생성
    console.log("1️⃣ 테스트 고객 확인...");
    let customer = await prisma.customer.findUnique({
      where: { email: "test@example.com" },
    });
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: "테스트 고객",
          email: "test@example.com",
          phone: "010-1234-5678",
        },
      });
      console.log(`   ✅ 새 고객 생성: ${customer.name}`);
    } else {
      console.log(`   ✅ 기존 고객 사용: ${customer.name}`);
    }

    // 10개의 Order 생성
    console.log("\n2️⃣ Order 10건 생성...");
    const orders = [];
    for (let i = 1; i <= 10; i++) {
      const order = await prisma.order.create({
        data: {
          customerId: customer.id,
          orderDate: new Date(),
          totalAmount: (10000 * i).toString(),
          shippingFee: "3000",
          status: "PENDING",
          recipientName: `수취인${i}`,
          recipientPhone: `010-${1000 + i}-${2000 + i}`,
          recipientAddr: `서울시 강남구 테스트로 ${i}`,
          orderNumber: `TEST-ORDER-${Date.now()}-${i}`,
          productInfo: `테스트상품${i}`,
          orderSource: i % 2 === 0 ? "자사몰" : "스몰닷",
        },
      });
      orders.push(order);
    }
    console.log(`   ✅ Order ${orders.length}건 생성 완료`);

    // 10개의 MallOrder 생성
    console.log("\n3️⃣ MallOrder 10건 생성...");
    const mallOrders = [];
    for (let i = 1; i <= 10; i++) {
      const mallOrder = await prisma.mallOrder.create({
        data: {
          orderNumber: `MALL-${Date.now()}-${i}`,
          customerName: `쇼핑몰고객${i}`,
          customerEmail: `mall${i}@example.com`,
          customerPhone: `010-${3000 + i}-${4000 + i}`,
          totalAmount: (15000 * i).toString(),
          subtotal: (12000 * i).toString(),
          shippingFee: "3000",
          status: "PAID",
          recipientName: `쇼핑몰수취인${i}`,
          recipientAddr: `서울시 강남구 쇼핑로 ${i}`,
          items: JSON.stringify([{ productName: `쇼핑상품${i}`, quantity: 1 }]),
        },
      });
      mallOrders.push(mallOrder);
    }
    console.log(`   ✅ MallOrder ${mallOrders.length}건 생성 완료`);

    // 결과 요약
    console.log("\n4️⃣ 생성 완료!");
    const totalOrders = await prisma.order.count();
    const totalMallOrders = await prisma.mallOrder.count();
    console.log(`   - Order: ${totalOrders}건`);
    console.log(`   - MallOrder: ${totalMallOrders}건`);
    console.log(`   - 총: ${totalOrders + totalMallOrders}건`);

    console.log("\n🎉 테스트 데이터 생성 완료!");
    console.log("\n📝 다음 단계:");
    console.log("   1. http://localhost:3000/dashboard/orders 접속");
    console.log("   2. 전체 지우기 버튼 클릭");
    console.log("   3. 확인 대화상자에서 OK 클릭");
    console.log("   4. 두 번째 확인 대화상자에서 OK 클릭");
    console.log("   5. 모든 주문이 삭제되는지 확인");

  } catch (error) {
    console.error("\n❌ 데이터 생성 실패:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestOrders().catch(console.error);
