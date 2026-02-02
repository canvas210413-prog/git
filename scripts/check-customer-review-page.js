const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 고객리뷰관리 페이지 데이터 분석 중...\n');

  // 1. 쇼핑몰 리뷰 (고객리뷰관리 - 쇼핑몰 리뷰 탭)
  const mallReviews = await prisma.review.findMany({
    where: {
      source: 'MALL',
    },
    orderBy: { date: 'desc' },
  });

  console.log(`📊 쇼핑몰 리뷰 탭: ${mallReviews.length}건`);
  mallReviews.forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.rating}점] ${r.authorName} - ${r.content.substring(0, 30)}...`);
  });

  // 2. 네이버 리뷰 (고객리뷰관리 - 네이버 탭)
  const naverTickets = await prisma.ticket.findMany({
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

  console.log(`\n📊 네이버 탭 (Ticket 기반): ${naverTickets.length}건`);
  naverTickets.forEach((t, i) => {
    // 평점 추출
    const ratingMatch = t.subject.match(/\[리뷰\]\s*(\d)점/);
    const rating = ratingMatch ? ratingMatch[1] : '?';
    console.log(`  ${i + 1}. [${rating}점] ${t.customer.name} - ${t.subject.substring(0, 40)}...`);
  });

  // 3. Review 테이블의 NAVER 리뷰
  const naverReviewsInDb = await prisma.review.findMany({
    where: {
      source: 'NAVER',
    },
    orderBy: { date: 'desc' },
  });

  console.log(`\n📊 Review 테이블의 NAVER 리뷰: ${naverReviewsInDb.length}건`);
  naverReviewsInDb.forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.rating}점] ${r.authorName} - ${r.content.substring(0, 30)}...`);
  });

  // 4. 총합
  console.log(`\n📊 총합:`);
  console.log(`  - 고객리뷰관리 쇼핑몰 리뷰: ${mallReviews.length}건`);
  console.log(`  - 고객리뷰관리 네이버 탭: ${naverTickets.length}건`);
  console.log(`  - 합계: ${mallReviews.length + naverTickets.length}건`);
  console.log(`\n  - Review 테이블 총 리뷰: ${mallReviews.length + naverReviewsInDb.length}건`);
  console.log(`  - 차이: ${(mallReviews.length + naverTickets.length) - (mallReviews.length + naverReviewsInDb.length)}건`);
}

main()
  .catch((e) => {
    console.error('❌ 에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
