const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMarketing() {
  console.log('🎟️  쿠폰 시드 데이터 생성 중...');
  
  // 기존 쿠폰 삭제
  await prisma.coupon.deleteMany({});
  console.log('기존 쿠폰 삭제 완료');
  
  const now = new Date();
  const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const twoMonthsLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  
  const coupons = [
    {
      code: 'WELCOME10',
      name: '신규 가입 10% 할인',
      description: '첫 구매 고객 전용 할인 쿠폰',
      discountType: 'PERCENT',
      discountValue: 10,
      minOrderAmount: 50000,
      maxDiscountAmount: 10000,
      validFrom: now,
      validUntil: oneMonthLater,
      usageLimit: 100,
      usagePerCustomer: 1,
      targetSegment: 'NEW',
      isActive: true,
    },
    {
      code: 'VIP20',
      name: 'VIP 고객 20% 할인',
      description: 'VIP 고객 전용 특별 할인',
      discountType: 'PERCENT',
      discountValue: 20,
      minOrderAmount: 100000,
      maxDiscountAmount: 30000,
      validFrom: now,
      validUntil: twoMonthsLater,
      usageLimit: 50,
      usagePerCustomer: 2,
      targetSegment: 'VIP',
      isActive: true,
    },
    {
      code: 'COMEBACK5000',
      name: '휴면 고객 5,000원 할인',
      description: '30일 이상 미주문 고객 복귀 혜택',
      discountType: 'FIXED',
      discountValue: 5000,
      minOrderAmount: 30000,
      validFrom: now,
      validUntil: oneMonthLater,
      usageLimit: 200,
      usagePerCustomer: 1,
      targetSegment: 'DORMANT',
      isActive: true,
    },
    {
      code: 'WINTER2024',
      name: '겨울 시즌 15% 할인',
      description: '전체 고객 겨울 프로모션',
      discountType: 'PERCENT',
      discountValue: 15,
      minOrderAmount: 80000,
      maxDiscountAmount: 20000,
      validFrom: now,
      validUntil: twoMonthsLater,
      usageLimit: 500,
      usagePerCustomer: 1,
      isActive: true,
    },
    {
      code: 'FREESHIP',
      name: '무료 배송 쿠폰',
      description: '배송비 3,000원 할인',
      discountType: 'FIXED',
      discountValue: 3000,
      validFrom: now,
      validUntil: oneMonthLater,
      usagePerCustomer: 3,
      isActive: true,
    },
  ];
  
  await prisma.coupon.createMany({ data: coupons });
  console.log('✅ 쿠폰 5개 생성 완료!');
  
  // 캠페인 생성
  await prisma.campaign.deleteMany({});
  
  const campaigns = [
    {
      name: '신규 가입 환영 캠페인',
      description: '신규 가입 고객에게 환영 쿠폰 자동 발급',
      type: 'COUPON',
      status: 'ACTIVE',
      targetSegment: 'NEW',
      startDate: now,
      endDate: twoMonthsLater,
      sentCount: 45,
      openCount: 32,
      convertCount: 12,
    },
    {
      name: 'VIP 고객 감사 이벤트',
      description: 'VIP 고객 대상 특별 할인 프로모션',
      type: 'COUPON',
      status: 'ACTIVE',
      targetSegment: 'VIP',
      budget: 5000000,
      spent: 1200000,
      roi: 280,
      startDate: now,
      endDate: oneMonthLater,
      sentCount: 30,
      openCount: 28,
      convertCount: 15,
    },
    {
      name: '휴면 고객 재활성화',
      description: '30일 이상 미주문 고객 복귀 유도',
      type: 'COUPON',
      status: 'ACTIVE',
      targetSegment: 'DORMANT',
      budget: 2000000,
      spent: 500000,
      roi: 150,
      startDate: now,
      endDate: twoMonthsLater,
      sentCount: 120,
      openCount: 45,
      convertCount: 8,
    },
  ];
  
  await prisma.campaign.createMany({ data: campaigns });
  console.log('✅ 캠페인 3개 생성 완료!');
  
  console.log('🎉 마케팅 시드 데이터 생성 완료!');
}

seedMarketing()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
