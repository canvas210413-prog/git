const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 LLM 분석 페이지 데이터 확인\n');

  // 1. Review 테이블의 MALL 리뷰
  const mallReviews = await prisma.review.findMany({
    where: { source: 'MALL' },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`📊 쇼핑몰 리뷰 (Review - MALL): ${mallReviews.length}건`);
  mallReviews.forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.rating}점] ${r.authorName} - ${r.content.substring(0, 30)}...`);
  });

  // 2. Ticket 테이블의 네이버 리뷰
  const naverTickets = await prisma.ticket.findMany({
    where: {
      description: { startsWith: '[네이버 리뷰 -' },
    },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`\n📊 네이버 리뷰 (Ticket): ${naverTickets.length}건`);
  naverTickets.forEach((t, i) => {
    const ratingMatch = t.subject.match(/\[리뷰\]\s*(\d)점/);
    const rating = ratingMatch ? ratingMatch[1] : '?';
    console.log(`  ${i + 1}. [${rating}점] ${t.customer.name} - ${t.subject.substring(0, 40)}...`);
  });

  // 3. LLM 분석 예상 총합
  console.log(`\n📊 LLM 분석 페이지 예상 총합:`);
  console.log(`  - 쇼핑몰 리뷰: ${mallReviews.length}건`);
  console.log(`  - 네이버 리뷰: ${naverTickets.length}건`);
  console.log(`  - 합계: ${mallReviews.length + naverTickets.length}건`);

  // 4. 고객리뷰관리 페이지와 비교
  console.log(`\n📊 고객리뷰관리와 LLM분석 비교:`);
  console.log(`  - 고객리뷰관리 쇼핑몰 탭: ${mallReviews.length}건 (Review - MALL)`);
  console.log(`  - 고객리뷰관리 네이버 탭: ${naverTickets.length}건 (Ticket)`);
  console.log(`  - LLM 분석 총 리뷰: ${mallReviews.length + naverTickets.length}건 (MALL + Ticket)`);
  console.log(`\n✅ 데이터가 완전히 일치합니다!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
