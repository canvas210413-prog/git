const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 모든 리뷰 관련 데이터 확인\n');

  // 1. Review 테이블 (쇼핑몰 리뷰 탭 + LLM 분석용)
  const allReviews = await prisma.review.findMany({
    orderBy: { date: 'desc' },
  });
  
  console.log(`📊 Review 테이블: ${allReviews.length}건`);
  console.log(`  - MALL: ${allReviews.filter(r => r.source === 'MALL').length}건`);
  console.log(`  - NAVER: ${allReviews.filter(r => r.source === 'NAVER').length}건`);

  // 2. Ticket 테이블의 네이버 리뷰 (고객리뷰관리 - 네이버 탭)
  const naverTickets = await prisma.ticket.findMany({
    where: {
      description: {
        startsWith: '[네이버 리뷰 -',
      },
    },
  });
  
  console.log(`\n📊 Ticket 테이블 (네이버 리뷰): ${naverTickets.length}건`);

  // 3. 전체 Ticket 중 리뷰 관련
  const allTickets = await prisma.ticket.findMany({
    where: {
      OR: [
        { description: { startsWith: '[네이버 리뷰 -' } },
        { description: { startsWith: '[쿠팡 리뷰 -' } },
      ],
    },
  });
  
  console.log(`\n📊 Ticket 테이블 (모든 리뷰): ${allTickets.length}건`);
  console.log(`  - 네이버: ${allTickets.filter(t => t.description.startsWith('[네이버 리뷰 -')).length}건`);
  console.log(`  - 쿠팡: ${allTickets.filter(t => t.description.startsWith('[쿠팡 리뷰 -')).length}건`);

  // 4. 고객리뷰관리 페이지 기준 총합
  console.log(`\n📊 고객리뷰관리 페이지 예상 총합:`);
  console.log(`  - 쇼핑몰 리뷰 탭 (Review - MALL): ${allReviews.filter(r => r.source === 'MALL').length}건`);
  console.log(`  - 네이버 탭 (Ticket): ${naverTickets.length}건`);
  console.log(`  - 합계: ${allReviews.filter(r => r.source === 'MALL').length + naverTickets.length}건`);

  // 5. LLM 분석 페이지 기준 (Review 테이블 전체)
  console.log(`\n📊 LLM 분석 페이지:`);
  console.log(`  - 현재 Review 테이블: ${allReviews.length}건`);
  console.log(`  - 필요한 총합: ${allReviews.filter(r => r.source === 'MALL').length + naverTickets.length}건`);
  console.log(`  - 차이: ${(allReviews.filter(r => r.source === 'MALL').length + naverTickets.length) - allReviews.length}건`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
