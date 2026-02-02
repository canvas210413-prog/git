/**
 * 주문 업데이트 전체 필드 테스트
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testAllFields() {
  console.log("🧪 주문 업데이트 전체 필드 테스트 시작...\n");

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
        orderDate: new Date("2026-01-13T00:00:00.000Z"),
        totalAmount: "50000",
        shippingFee: "3000",
        basePrice: "45000",
        additionalFee: "2000",
        status: "PENDING",
        recipientName: "원래이름",
        recipientPhone: "010-1111-1111",
        recipientMobile: "010-1111-1111",
        recipientZipCode: "12345",
        recipientAddr: "원래주소",
        orderNumber: `TEST-${Date.now()}`,
        productInfo: "원래상품",
        deliveryMsg: "원래메시지",
        orderSource: "자사몰",
        courier: "CJ대한통운",
        trackingNumber: "111111111111",
        ordererName: "주문자명",
        contactPhone: "010-2222-2222",
      },
    });

    console.log("✅ 테스트 주문 생성 완료!");
    console.log(`   - 주문 ID: ${order.id}`);

    // 2. 모든 필드 업데이트 (Decimal 필드들을 문자열로)
    console.log("\n2️⃣ 모든 필드 업데이트 (Decimal 문자열)...");
    
    const updateData = {
      orderDate: new Date("2026-01-14T00:00:00.000Z"),
      totalAmount: "60000", // Decimal -> 문자열
      shippingFee: "4000", // Decimal -> 문자열
      basePrice: "54000", // Decimal -> 문자열
      additionalFee: "2000", // Decimal -> 문자열
      status: "PROCESSING",
      recipientName: "변경된이름",
      recipientPhone: "010-3333-3333",
      recipientMobile: "010-4444-4444",
      recipientZipCode: "54321",
      recipientAddr: "변경된주소",
      orderNumber: `UPDATED-${Date.now()}`,
      productInfo: "변경된상품",
      deliveryMsg: "변경된메시지",
      orderSource: "스몰닷",
      courier: "로젠택배",
      trackingNumber: "999999999999",
      ordererName: "변경된주문자",
      contactPhone: "010-5555-5555",
    };

    console.log("📤 전송 데이터:", JSON.stringify(updateData, null, 2));

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    console.log("\n✅ 주문 업데이트 완료!");

    // 3. 업데이트 확인
    console.log("\n3️⃣ 업데이트 확인...");
    
    const verified = await prisma.order.findUnique({
      where: { id: order.id },
    });

    const checks = [
      { field: "orderDate", expected: "2026-01-14", actual: verified?.orderDate?.toISOString().split('T')[0] },
      { field: "totalAmount", expected: "60000", actual: verified?.totalAmount?.toString() },
      { field: "shippingFee", expected: "4000", actual: verified?.shippingFee?.toString() },
      { field: "basePrice", expected: "54000", actual: verified?.basePrice?.toString() },
      { field: "additionalFee", expected: "2000", actual: verified?.additionalFee?.toString() },
      { field: "status", expected: "PROCESSING", actual: verified?.status },
      { field: "recipientName", expected: "변경된이름", actual: verified?.recipientName },
      { field: "recipientPhone", expected: "010-3333-3333", actual: verified?.recipientPhone },
      { field: "recipientMobile", expected: "010-4444-4444", actual: verified?.recipientMobile },
      { field: "recipientZipCode", expected: "54321", actual: verified?.recipientZipCode },
      { field: "recipientAddr", expected: "변경된주소", actual: verified?.recipientAddr },
      { field: "productInfo", expected: "변경된상품", actual: verified?.productInfo },
      { field: "deliveryMsg", expected: "변경된메시지", actual: verified?.deliveryMsg },
      { field: "orderSource", expected: "스몰닷", actual: verified?.orderSource },
      { field: "courier", expected: "로젠택배", actual: verified?.courier },
      { field: "trackingNumber", expected: "999999999999", actual: verified?.trackingNumber },
      { field: "ordererName", expected: "변경된주문자", actual: verified?.ordererName },
      { field: "contactPhone", expected: "010-5555-5555", actual: verified?.contactPhone },
    ];

    let allPassed = true;
    checks.forEach(check => {
      const passed = check.expected === check.actual;
      console.log(`   ${passed ? "✅" : "❌"} ${check.field}: ${check.actual} ${passed ? "" : `(예상: ${check.expected})`}`);
      if (!passed) allPassed = false;
    });

    // 4. 숫자로 업데이트 시도 (에러 확인)
    console.log("\n4️⃣ 숫자로 업데이트 시도 (에러 체크)...");
    
    try {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          totalAmount: 70000, // 숫자로 시도
        },
      });
      console.log("   ⚠️ 숫자 업데이트 성공 (예상 외)");
    } catch (error) {
      console.log(`   ✅ 예상된 에러 발생: ${error.message.substring(0, 100)}...`);
    }

    // 5. 정리
    console.log("\n5️⃣ 테스트 데이터 정리...");
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
    console.log("✅ 정리 완료!");

    if (allPassed) {
      console.log("\n🎉 모든 테스트 통과!");
      console.log("\n📋 결론:");
      console.log("   - Decimal 필드는 반드시 문자열로 전송해야 합니다");
      console.log("   - 업데이트할 필드: totalAmount, shippingFee, basePrice, additionalFee");
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

testAllFields().catch(console.error);
