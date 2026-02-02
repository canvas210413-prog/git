/**
 * 주문 업데이트 테스트
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testOrderUpdate() {
  console.log("🧪 주문 업데이트 테스트 시작...\n");

  try {
    // 1. 테스트 주문 생성
    console.log("1️⃣ 테스트 주문 생성...");
    
    const customer = await prisma.customer.create({
      data: {
        name: `테스트고객${Date.now()}`,
        email: `test${Date.now()}@test.com`,
        phone: "010-9999-9999",
      },
    });

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        orderDate: new Date(),
        totalAmount: 50000,
        shippingFee: 3000,
        status: "PENDING",
        recipientName: "원래이름",
        recipientPhone: "010-1111-1111",
        recipientZipCode: "12345",
        recipientAddr: "원래주소",
        orderNumber: `TEST-${Date.now()}`,
        productInfo: "원래상품",
        deliveryMsg: "원래메시지",
        orderSource: "자사몰",
        courier: "CJ대한통운",
        trackingNumber: "111111111111",
      },
    });

    console.log("✅ 테스트 주문 생성 완료!");
    console.log(`   - 주문 ID: ${order.id}`);
    console.log(`   - 수취인명: ${order.recipientName}`);
    console.log(`   - 수취인 전화: ${order.recipientPhone}`);
    console.log(`   - 주소: ${order.recipientAddr}`);
    console.log(`   - 상품: ${order.productInfo}`);

    // 2. 주문 업데이트
    console.log("\n2️⃣ 주문 업데이트...");
    
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        recipientName: "변경된이름",
        recipientPhone: "010-2222-2222",
        recipientAddr: "변경된주소",
        productInfo: "변경된상품",
        deliveryMsg: "변경된메시지",
        orderSource: "스몰닷",
        totalAmount: 60000,
        shippingFee: 4000,
      },
    });

    console.log("✅ 주문 업데이트 완료!");
    console.log(`   - 수취인명: ${updated.recipientName}`);
    console.log(`   - 수취인 전화: ${updated.recipientPhone}`);
    console.log(`   - 주소: ${updated.recipientAddr}`);
    console.log(`   - 상품: ${updated.productInfo}`);
    console.log(`   - 배송메시지: ${updated.deliveryMsg}`);
    console.log(`   - 고객주문처명: ${updated.orderSource}`);
    console.log(`   - 총액: ${updated.totalAmount}`);

    // 3. 업데이트 확인
    console.log("\n3️⃣ 업데이트 확인...");
    
    const verified = await prisma.order.findUnique({
      where: { id: order.id },
    });

    const checks = [
      { field: "수취인명", expected: "변경된이름", actual: verified?.recipientName },
      { field: "수취인 전화", expected: "010-2222-2222", actual: verified?.recipientPhone },
      { field: "주소", expected: "변경된주소", actual: verified?.recipientAddr },
      { field: "상품", expected: "변경된상품", actual: verified?.productInfo },
      { field: "배송메시지", expected: "변경된메시지", actual: verified?.deliveryMsg },
      { field: "고객주문처명", expected: "스몰닷", actual: verified?.orderSource },
      { field: "총액", expected: 60000, actual: Number(verified?.totalAmount) },
    ];

    let allPassed = true;
    checks.forEach(check => {
      const passed = check.expected === check.actual;
      console.log(`   ${passed ? "✅" : "❌"} ${check.field}: ${check.actual} ${passed ? "" : `(예상: ${check.expected})`}`);
      if (!passed) allPassed = false;
    });

    // 4. 정리
    console.log("\n4️⃣ 테스트 데이터 정리...");
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
    console.log("✅ 정리 완료!");

    if (allPassed) {
      console.log("\n🎉 모든 테스트 통과!");
    } else {
      console.log("\n⚠️ 일부 테스트 실패!");
    }

  } catch (error) {
    console.error("\n❌ 테스트 실패:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testOrderUpdate().catch(console.error);
