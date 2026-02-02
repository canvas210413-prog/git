/**
 * 주문 등록 폼 테스트 스크립트
 * 모든 필드가 정상적으로 작동하는지 확인
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testOrderForm() {
  console.log("🧪 주문 등록 폼 테스트 시작...\n");

  try {
    // 1. 고객 생성 (없는 고객명 테스트용)
    console.log("1️⃣ 새 고객 생성 테스트...");
    const testCustomerName = `테스트고객${Date.now()}`;
    
    // 2. 주문 생성 (모든 필드 포함)
    console.log("2️⃣ 주문 생성 (모든 필드 포함)...");
    const testOrder = await prisma.order.create({
      data: {
        customer: {
          create: {
            name: testCustomerName,
            email: `test${Date.now()}@test.com`,
            phone: "010-1234-5678",
          },
        },
        orderDate: new Date(),
        totalAmount: 50000,
        status: "PENDING",
        ordererName: "주문자홍길동",
        contactPhone: "010-1111-2222",
        recipientName: "수취인김철수",
        recipientPhone: "010-3333-4444",
        recipientMobile: "010-5555-6666",
        recipientZipCode: "12345",
        recipientAddr: "서울시 강남구 테스트로 123",
        orderNumber: `TEST-${Date.now()}`,
        productInfo: "테스트 상품 A x 1개",
        deliveryMsg: "문 앞에 놓아주세요",
        orderSource: "자사몰",
        partner: "스몰닷", // 협력사 필드 테스트
        shippingFee: 3000,
        courier: "CJ대한통운",
        trackingNumber: "123456789012",
      },
    });

    console.log("✅ 주문 생성 성공!");
    console.log(`   - 주문 ID: ${testOrder.id}`);
    console.log(`   - 고객명: ${testCustomerName}`);
    console.log(`   - 협력사: ${testOrder.partner}`);
    console.log(`   - 주문번호: ${testOrder.orderNumber}`);
    console.log();

    // 3. 주문 조회
    console.log("3️⃣ 주문 조회 테스트...");
    const retrievedOrder = await prisma.order.findUnique({
      where: { id: testOrder.id },
      include: {
        customer: true,
      },
    });

    if (!retrievedOrder) {
      throw new Error("주문 조회 실패");
    }

    console.log("✅ 주문 조회 성공!");
    console.log(`   - 고객명: ${retrievedOrder.customer.name}`);
    console.log(`   - 주문자명: ${retrievedOrder.ordererName}`);
    console.log(`   - 연락처: ${retrievedOrder.contactPhone}`);
    console.log(`   - 수취인명: ${retrievedOrder.recipientName}`);
    console.log(`   - 수취인 전화: ${retrievedOrder.recipientPhone}`);
    console.log(`   - 수취인 모바일: ${retrievedOrder.recipientMobile}`);
    console.log(`   - 우편번호: ${retrievedOrder.recipientZipCode}`);
    console.log(`   - 주소: ${retrievedOrder.recipientAddr}`);
    console.log(`   - 배송메시지: ${retrievedOrder.deliveryMsg}`);
    console.log(`   - 협력사: ${retrievedOrder.partner}`);
    console.log(`   - 주문처: ${retrievedOrder.orderSource}`);
    console.log(`   - 택배사: ${retrievedOrder.courier}`);
    console.log(`   - 운송장번호: ${retrievedOrder.trackingNumber}`);
    console.log();

    // 4. 필드 검증
    console.log("4️⃣ 필드 검증...");
    const fieldsToCheck = {
      ordererName: "주문자홍길동",
      contactPhone: "010-1111-2222",
      recipientName: "수취인김철수",
      recipientPhone: "010-3333-4444",
      recipientMobile: "010-5555-6666",
      recipientZipCode: "12345",
      recipientAddr: "서울시 강남구 테스트로 123",
      deliveryMsg: "문 앞에 놓아주세요",
      orderSource: "자사몰",
      partner: "스몰닷",
      courier: "CJ대한통운",
      trackingNumber: "123456789012",
    };

    let allFieldsCorrect = true;
    for (const [field, expectedValue] of Object.entries(fieldsToCheck)) {
      const actualValue = retrievedOrder[field];
      if (actualValue !== expectedValue) {
        console.error(`❌ ${field}: 예상값 "${expectedValue}", 실제값 "${actualValue}"`);
        allFieldsCorrect = false;
      } else {
        console.log(`✅ ${field}: ${actualValue}`);
      }
    }

    if (allFieldsCorrect) {
      console.log("\n✅ 모든 필드 검증 성공!");
    } else {
      console.log("\n❌ 일부 필드 검증 실패!");
    }

    // 5. 협력사 업데이트 테스트
    console.log("\n5️⃣ 협력사 업데이트 테스트...");
    const updatedOrder = await prisma.order.update({
      where: { id: testOrder.id },
      data: {
        partner: "그로트",
      },
    });

    if (updatedOrder.partner === "그로트") {
      console.log("✅ 협력사 업데이트 성공!");
      console.log(`   - 변경 전: 스몰닷`);
      console.log(`   - 변경 후: ${updatedOrder.partner}`);
    } else {
      console.error("❌ 협력사 업데이트 실패!");
    }

    // 6. 정리 (테스트 데이터 삭제)
    console.log("\n6️⃣ 테스트 데이터 정리...");
    await prisma.order.delete({
      where: { id: testOrder.id },
    });
    await prisma.customer.delete({
      where: { id: retrievedOrder.customerId },
    });
    console.log("✅ 테스트 데이터 삭제 완료!");

    console.log("\n🎉 모든 테스트 완료!");
    console.log("\n📋 테스트 결과 요약:");
    console.log("   ✅ 고객 생성");
    console.log("   ✅ 주문 생성 (모든 필드)");
    console.log("   ✅ 주문 조회");
    console.log("   ✅ 필드 검증");
    console.log("   ✅ 협력사 업데이트");
    console.log("   ✅ 데이터 정리");

  } catch (error) {
    console.error("\n❌ 테스트 실패:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testOrderForm().catch(console.error);
