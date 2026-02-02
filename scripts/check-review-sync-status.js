const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 현재 데이터 현황 분석 중...\n');

  // 1. Ticket 테이블의 네이버 리뷰 확인
  const naverReviewTickets = await prisma.ticket.findMany({
    where: {
      description: {
        startsWith: '[네이버 리뷰 -',
      },
    },
    include: {
      customer: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`📊 Ticket 테이블의 네이버 리뷰: ${naverReviewTickets.length}건`);

  // 2. Review 테이블 현황
  const totalReviews = await prisma.review.count();
  const naverReviews = await prisma.review.count({ where: { source: 'NAVER' } });
  const mallReviews = await prisma.review.count({ where: { source: 'MALL' } });

  console.log(`\n📈 Review 테이블 현황:`);
  console.log(`  - 총 리뷰: ${totalReviews}건`);
  console.log(`  - 쇼핑몰 리뷰: ${mallReviews}건`);
  console.log(`  - 네이버 리뷰: ${naverReviews}건`);

  // 3. 고객리뷰관리의 쇼핑몰 리뷰 (reviews 테이블 확인)
  const allReviews = await prisma.review.findMany({
    orderBy: { date: 'desc' },
  });

  console.log(`\n📋 Review 테이블 상세:`);
  console.log(`  - MALL: ${allReviews.filter(r => r.source === 'MALL').length}건`);
  console.log(`  - NAVER: ${allReviews.filter(r => r.source === 'NAVER').length}건`);
  console.log(`  - 기타: ${allReviews.filter(r => r.source !== 'MALL' && r.source !== 'NAVER').length}건`);

  // 4. 동기화 누락 확인
  console.log(`\n🔄 동기화 상태:`);
  console.log(`  - Ticket의 네이버 리뷰: ${naverReviewTickets.length}건`);
  console.log(`  - Review의 네이버 리뷰: ${naverReviews}건`);
  console.log(`  - 차이: ${naverReviewTickets.length - naverReviews}건`);

  if (naverReviewTickets.length > naverReviews) {
    console.log(`\n⚠️  ${naverReviewTickets.length - naverReviews}건의 티켓이 Review 테이블에 동기화되지 않았습니다.`);
  }

  // 5. 예상 총합
  console.log(`\n📊 예상 총 리뷰 수:`);
  console.log(`  - 쇼핑몰 리뷰 (MALL): ${mallReviews}건`);
  console.log(`  - 네이버 리뷰 (Ticket 기준): ${naverReviewTickets.length}건`);
  console.log(`  - 예상 총합: ${mallReviews + naverReviewTickets.length}건`);
}

main()
  .catch((e) => {
    console.error('❌ 에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
