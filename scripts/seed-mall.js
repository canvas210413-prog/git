// 몰 테스트 데이터 시드 스크립트
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

// 비밀번호 해시 함수 (로그인과 동일한 방식)
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("🛒 몰 테스트 데이터 생성 시작...\n");

  // 1. 테스트 사용자 생성
  console.log("1. 테스트 사용자 생성...");
  const passwordHash = hashPassword("test1234");
  
  const testUser = await prisma.mallUser.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "테스트유저",
      passwordHash,
      grade: "GOLD",
      totalSpent: 250000,
      addresses: JSON.stringify([
        {
          id: "addr_1",
          name: "집",
          recipient: "홍길동",
          phone: "010-1234-5678",
          zipCode: "12345",
          address: "서울시 강남구 테헤란로 123",
          addressDetail: "456동 789호",
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "addr_2",
          name: "회사",
          recipient: "홍길동",
          phone: "010-1234-5678",
          zipCode: "54321",
          address: "서울시 서초구 서초대로 456",
          addressDetail: "10층 개발팀",
          isDefault: false,
          createdAt: new Date().toISOString(),
        },
      ]),
      emailNotification: true,
      smsNotification: true,
      marketingEmail: true,
      marketingSms: false,
    },
  });
  console.log(`   ✅ 사용자 생성: ${testUser.email} (ID: ${testUser.id})`);

  // 두 번째 테스트 사용자
  const testUser2 = await prisma.mallUser.upsert({
    where: { email: "user2@example.com" },
    update: {},
    create: {
      email: "user2@example.com",
      name: "김철수",
      passwordHash,
      grade: "SILVER",
      totalSpent: 80000,
      addresses: JSON.stringify([]),
      emailNotification: true,
      smsNotification: false,
      marketingEmail: false,
      marketingSms: false,
    },
  });
  console.log(`   ✅ 사용자 생성: ${testUser2.email} (ID: ${testUser2.id})`);

  // 2. 테스트 상품 생성
  console.log("\n2. 테스트 상품 생성...");
  const products = [
    {
      id: "prod_1",
      name: "미니쉴드 프리미엄 공기청정기",
      description: "초미세먼지 99.97% 제거! 4단계 필터 시스템으로 깨끗한 공기를 제공합니다. 저소음 설계로 수면 중에도 편안하게 사용 가능합니다.",
      price: 299000,
      originalPrice: 399000,
      stock: 100,
      category: "공기청정기",
      images: JSON.stringify(["https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop"]),
      isFeatured: true,
      viewCount: 1520,
      soldCount: 342,
      rating: 4.8,
      reviewCount: 156,
      isActive: true,
    },
    {
      id: "prod_2",
      name: "미니쉴드 HEPA 필터 (2팩)",
      description: "미니쉴드 공기청정기 전용 교체용 HEPA 필터입니다. 6개월마다 교체를 권장하며, H13 등급 필터로 초미세먼지까지 걸러냅니다.",
      price: 45000,
      originalPrice: 55000,
      stock: 500,
      category: "필터",
      images: JSON.stringify(["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop"]),
      isFeatured: true,
      viewCount: 890,
      soldCount: 628,
      rating: 4.9,
      reviewCount: 89,
      isActive: true,
    },
    {
      id: "prod_3",
      name: "미니쉴드 활성탄 탈취필터",
      description: "냄새 제거에 특화된 활성탄 필터입니다. 요리 냄새, 담배 냄새, 애완동물 냄새를 효과적으로 제거합니다.",
      price: 32000,
      originalPrice: 40000,
      stock: 300,
      category: "필터",
      images: JSON.stringify(["https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop"]),
      isFeatured: true,
      viewCount: 456,
      soldCount: 215,
      rating: 4.7,
      reviewCount: 67,
      isActive: true,
    },
    {
      id: "prod_4",
      name: "미니쉴드 차량용 공기청정기",
      description: "컴팩트한 차량 전용 공기청정기입니다. USB 전원으로 간편하게 사용하며, 운전 중에도 깨끗한 공기를 마실 수 있습니다.",
      price: 89000,
      originalPrice: 120000,
      stock: 200,
      category: "공기청정기",
      images: JSON.stringify(["https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop"]),
      isFeatured: true,
      viewCount: 678,
      soldCount: 189,
      rating: 4.6,
      reviewCount: 45,
      isActive: true,
    },
    {
      id: "prod_5",
      name: "미니쉴드 올인원 필터세트",
      description: "HEPA 필터 + 활성탄 필터 + 프리필터 세트 구성! 1년치 필터를 한 번에 구매하세요. 개별 구매 대비 20% 절약됩니다.",
      price: 99000,
      originalPrice: 125000,
      stock: 150,
      category: "필터",
      images: JSON.stringify(["https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop"]),
      isFeatured: true,
      viewCount: 345,
      soldCount: 98,
      rating: 4.8,
      reviewCount: 34,
      isActive: true,
    },
  ];

  for (const product of products) {
    await prisma.mallProduct.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
    console.log(`   ✅ 상품 생성: ${product.name}`);
  }

  // 3. 테스트 쿠폰 생성
  console.log("\n3. 테스트 쿠폰 생성...");
  const coupons = [
    {
      id: "coupon_1",
      code: "WELCOME2024",
      name: "신규 가입 10% 할인",
      description: "신규 회원 가입 시 사용 가능한 10% 할인 쿠폰입니다.",
      discountType: "PERCENT",
      discountValue: 10,
      minOrderAmount: 30000,
      maxDiscountAmount: 10000,
      validFrom: new Date(),
      validUntil: new Date("2025-12-31"),
      usageLimit: 1000,
      usedCount: 0,
      isActive: true,
    },
    {
      id: "coupon_2",
      code: "SUMMER5000",
      name: "여름 특별 5,000원 할인",
      description: "여름 시즌 특별 5,000원 할인 쿠폰입니다.",
      discountType: "FIXED",
      discountValue: 5000,
      minOrderAmount: 50000,
      maxDiscountAmount: null,
      validFrom: new Date(),
      validUntil: new Date("2025-08-31"),
      usageLimit: 500,
      usedCount: 0,
      isActive: true,
    },
    {
      id: "coupon_3",
      code: "VIP20",
      name: "VIP 회원 20% 할인",
      description: "VIP 회원 전용 20% 특별 할인 쿠폰입니다.",
      discountType: "PERCENT",
      discountValue: 20,
      minOrderAmount: 100000,
      maxDiscountAmount: 30000,
      validFrom: new Date(),
      validUntil: new Date("2025-12-31"),
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
    },
  ];

  for (const coupon of coupons) {
    await prisma.mallCoupon.upsert({
      where: { id: coupon.id },
      update: coupon,
      create: coupon,
    });
    console.log(`   ✅ 쿠폰 생성: ${coupon.name} (${coupon.code})`);
  }

  // 4. 사용자에게 쿠폰 지급
  console.log("\n4. 사용자 쿠폰 지급...");
  const userCoupons = [
    { id: "uc_1", userId: testUser.id, couponId: "coupon_1", isUsed: false, usedAt: null },
    { id: "uc_2", userId: testUser.id, couponId: "coupon_2", isUsed: false, usedAt: null },
    { id: "uc_3", userId: testUser.id, couponId: "coupon_3", isUsed: true, usedAt: new Date("2024-11-15") },
    { id: "uc_4", userId: testUser2.id, couponId: "coupon_1", isUsed: false, usedAt: null },
  ];

  for (const uc of userCoupons) {
    await prisma.mallUserCoupon.upsert({
      where: { 
        userId_couponId: {
          userId: uc.userId,
          couponId: uc.couponId
        }
      },
      update: { isUsed: uc.isUsed, usedAt: uc.usedAt },
      create: {
        id: uc.id,
        userId: uc.userId,
        couponId: uc.couponId,
        isUsed: uc.isUsed,
        usedAt: uc.usedAt,
      },
    });
  }
  console.log(`   ✅ 쿠폰 지급 완료`);

  // 5. 테스트 주문 생성
  console.log("\n5. 테스트 주문 생성...");
  const orders = [
    {
      id: "order_1",
      orderNumber: "20241215-143052-AB12",
      userId: testUser.id,
      customerName: testUser.name,
      customerEmail: testUser.email,
      customerPhone: "010-1234-5678",
      recipientName: "홍길동",
      recipientAddr: "[12345] 서울시 강남구 테헤란로 123 456동 789호",
      recipientZip: "12345",
      deliveryMsg: "부재시 경비실에 맡겨주세요",
      status: "DELIVERED",
      items: JSON.stringify([
        { productId: "prod_1", productName: "프리미엄 유기농 사과 세트", quantity: 1, price: 45000 },
        { productId: "prod_2", productName: "제주 감귤 박스", quantity: 2, price: 32000 },
      ]),
      subtotal: 109000,
      discountAmount: 5000,
      totalAmount: 104000,
      couponId: "coupon_2",
      couponCode: "SUMMER5000",
      trackingNumber: "1234567890123",
      courier: "CJ대한통운",
      shippedAt: new Date("2024-12-16"),
      deliveredAt: new Date("2024-12-18"),
      createdAt: new Date("2024-12-15"),
    },
    {
      id: "order_2",
      orderNumber: "20241220-101530-CD34",
      userId: testUser.id,
      customerName: testUser.name,
      customerEmail: testUser.email,
      customerPhone: "010-1234-5678",
      recipientName: "홍길동",
      recipientAddr: "[54321] 서울시 서초구 서초대로 456 10층 개발팀",
      recipientZip: "54321",
      deliveryMsg: "",
      status: "SHIPPING",
      items: JSON.stringify([
        { productId: "prod_3", productName: "한우 등심 세트", quantity: 1, price: 89000 },
      ]),
      subtotal: 89000,
      discountAmount: 0,
      totalAmount: 89000,
      couponId: null,
      couponCode: null,
      trackingNumber: "9876543210987",
      courier: "롯데택배",
      shippedAt: new Date("2024-12-21"),
      deliveredAt: null,
      createdAt: new Date("2024-12-20"),
    },
    {
      id: "order_3",
      orderNumber: "20241225-093012-EF56",
      userId: testUser.id,
      customerName: testUser.name,
      customerEmail: testUser.email,
      customerPhone: "010-1234-5678",
      recipientName: "홍길동",
      recipientAddr: "[12345] 서울시 강남구 테헤란로 123 456동 789호",
      recipientZip: "12345",
      deliveryMsg: "문 앞에 놓아주세요",
      status: "PENDING",
      items: JSON.stringify([
        { productId: "prod_4", productName: "유기농 현미 5kg", quantity: 2, price: 28000 },
        { productId: "prod_5", productName: "수제 김치 세트", quantity: 1, price: 35000 },
      ]),
      subtotal: 91000,
      discountAmount: 9100,
      totalAmount: 81900,
      couponId: "coupon_1",
      couponCode: "WELCOME2024",
      trackingNumber: null,
      courier: null,
      shippedAt: null,
      deliveredAt: null,
      createdAt: new Date("2024-12-25"),
    },
  ];

  for (const order of orders) {
    await prisma.mallOrder.upsert({
      where: { id: order.id },
      update: order,
      create: order,
    });
    console.log(`   ✅ 주문 생성: ${order.orderNumber} (${order.status})`);
  }

  // 6. 테스트 Q&A 생성
  console.log("\n6. 테스트 Q&A 생성...");
  const qnas = [
    {
      id: "qna_1",
      title: "배송 기간 문의드립니다",
      content: "사과 세트 주문하면 배송까지 얼마나 걸리나요? 선물용으로 준비하려고 합니다.",
      answer: "안녕하세요, 고객님. 사과 세트는 주문 후 2-3일 내로 배송됩니다. 선물포장도 가능하니 필요하시면 배송 메모에 남겨주세요.",
      status: "answered",
      category: "delivery",
      userId: testUser.id,
      productId: "prod_1",
      answeredAt: new Date("2024-12-10"),
      createdAt: new Date("2024-12-09"),
    },
    {
      id: "qna_2",
      title: "한우 등급 확인 가능한가요?",
      content: "1++ 등급이 맞는지 확인하고 싶습니다. 등급 인증서도 같이 보내주시나요?",
      answer: null,
      status: "pending",
      category: "product",
      userId: testUser.id,
      productId: "prod_3",
      answeredAt: null,
      createdAt: new Date("2024-12-20"),
    },
    {
      id: "qna_3",
      title: "교환/반품 절차 문의",
      content: "김치 세트 받았는데 맛이 기대와 달라서요. 교환이나 반품 가능한가요?",
      answer: "안녕하세요. 식품의 경우 단순 변심으로 인한 반품은 어렵습니다. 다만 품질에 문제가 있는 경우 사진과 함께 고객센터로 문의 주시면 교환 또는 환불 처리해 드리겠습니다.",
      status: "answered",
      category: "return",
      userId: testUser2.id,
      productId: "prod_5",
      answeredAt: new Date("2024-12-22"),
      createdAt: new Date("2024-12-21"),
    },
    {
      id: "qna_4",
      title: "쿠폰 적용 오류",
      content: "WELCOME2024 쿠폰이 적용이 안 됩니다. 확인 부탁드립니다.",
      answer: null,
      status: "pending",
      category: "general",
      userId: testUser2.id,
      productId: null,
      answeredAt: null,
      createdAt: new Date("2024-12-26"),
    },
  ];

  for (const qna of qnas) {
    await prisma.mallQnA.upsert({
      where: { id: qna.id },
      update: qna,
      create: qna,
    });
    console.log(`   ✅ Q&A 생성: ${qna.title} (${qna.status})`);
  }

  console.log("\n✨ 몰 테스트 데이터 생성 완료!\n");
  console.log("📋 테스트 계정 정보:");
  console.log("   이메일: test@example.com");
  console.log("   비밀번호: test1234\n");
  console.log("   이메일: user2@example.com");
  console.log("   비밀번호: test1234\n");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
