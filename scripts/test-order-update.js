/**
 * 주문 업데이트 및 표시 테스트
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testOrderUpdate() {
  console.log("🧪 주문 업데이트 및 표시 테스트 시작...\n");

  try {
    // 1. 테스트 주문 2개 생성 (같은 전화번호)
    console.log("1️⃣ 같은 전화번호로 2개 주문 생성...");
    const testPhone = "010-9999-8888";
    
    const customer = await prisma.customer.create({
      data: {
        name: `테스트고객${Date.now()}`,
        email: `test${Date.now()}@test.com`,
        phone: testPhone,
      },
    });

    // 첫 번째 주문
    const order1 = await prisma.order.create({
      data: {
        customerId: customer.id,
        orderDate: new Date(),
        totalAmount: 53000,
        shippingFee: 3000,
        status: "PENDING",
        recipientName: "수취인1",
        recipientPhone: testPhone,
        recipientMobile: testPhone,
        recipientZipCode: "12345",
        recipientAddr: "서울시 강남구 테스트로 123",
        orderNumber: `TEST-${Date.now()}-1`,
        productInfo: "쉴드미니 프로 x 1개",
        deliveryMsg: "문 앞에 놓아주세요",
        orderSource: "자사몰",
        partner: "스몰닷",
        courier: "CJ대한통운",
        trackingNumber: "123456789012",
      },
    });

    console.log("✅ 첫 번째 주문 생성 성공!");
    console.log(`   - 주문 ID: ${order1.id}`);
    console.log(`   - 수취인명: ${order1.recipientName}`);
    console.log(`   - 수취인 전화: ${order1.recipientPhone}`);
    console.log(`   - 협력사: ${order1.partner}`);
    console.log(`   - 총액: ${order1.totalAmount}`);

    // 두 번째 주문 (같은 전화번호)
    const order2 = await prisma.order.create({
      data: {
        customerId: customer.id,
        orderDate: new Date(),
        totalAmount: 63000,
        shippingFee: 3000,
        status: "PROCESSING",
        recipientName: "수취인2",
        recipientPhone: testPhone,
        recipientMobile: testPhone,
        recipientZipCode: "54321",
        recipientAddr: "서울시 서초구 테스트로 456",
        orderNumber: `TEST-${Date.now()}-2`,
        productInfo: "쉴드미니 프로 x 2개",
        deliveryMsg: "경비실에 맡겨주세요",
        orderSource: "스마트스토어",
        partner: "그로트",
        courier: "로젠택배",
        trackingNumber: "210987654321",
      },
    });

    console.log("\n✅ 두 번째 주문 생성 성공!");
    console.log(`   - 주문 ID: ${order2.id}`);
    console.log(`   - 수취인명: ${order2.recipientName}`);
    console.log(`   - 수취인 전화: ${order2.recipientPhone} (재구매!)`);
    console.log(`   - 협력사: ${order2.partner}`);
    console.log(`   - 총액: ${order2.totalAmount}`);

    // 2. 주문 업데이트 테스트
    console.log("\n2️⃣ 주문 업데이트 테스트...");
    const updated = await prisma.order.update({
      where: { id: order1.id },
      data: {
        recipientName: "수취인1-수정됨",
        recipientPhone: "010-1111-2222",
        partner: "해피포즈",
        deliveryMsg: "업데이트된 메시지",
      },
    });

    console.log("✅ 주문 업데이트 성공!");
    console.log(`   - 수취인명: ${updated.recipientName}`);
    console.log(`   - 수취인 전화: ${updated.recipientPhone}`);
    console.log(`   - 협력사: ${updated.partner}`);
    console.log(`   - 배송메시지: ${updated.deliveryMsg}`);

    // 3. 재구매 확인 (같은 전화번호 주문 카운트)
    console.log("\n3️⃣ 재구매 확인...");
    const phoneOrders = await prisma.order.findMany({
      where: {
        OR: [
          { recipientPhone: testPhone },
          { recipientMobile: testPhone },
          { contactPhone: testPhone },
        ],
      },
    });

    console.log(`✅ 전화번호 ${testPhone}로 주문 ${phoneOrders.length}건`);
    console.log(`   ${phoneOrders.length >= 2 ? "→ 재구매 고객!" : "→ 신규 고객"}`);

    // 4. 정리
    console.log("\n4️⃣ 테스트 데이터 정리...");
    await prisma.order.delete({ where: { id: order1.id } });
    await prisma.order.delete({ where: { id: order2.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
    console.log("✅ 테스트 데이터 삭제 완료!");

    console.log("\n🎉 모든 테스트 완료!");
    console.log("\n📋 테스트 결과:");
    console.log("   ✅ 같은 전화번호로 2개 주문 생성");
    console.log("   ✅ 주문 업데이트");
    console.log("   ✅ 재구매 확인 (전화번호 기반)");
    console.log("   ✅ 데이터 정리");
    console.log("\n💡 이제 http://localhost:3000/dashboard/orders 에서 확인하세요:");
    console.log("   - 수취인명이 목록에 표시됨");
    console.log("   - 수취인 전화번호가 연락처에 표시됨");
    console.log("   - 주문금액 = 단가 + 배송비");
    console.log("   - 같은 전화번호 2회 주문 시 재구매 표시");

  } catch (error) {
    console.error("\n❌ 테스트 실패:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testOrderUpdate().catch(console.error);
