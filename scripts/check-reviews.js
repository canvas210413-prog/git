const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reviews = await prisma.review.findMany({
    orderBy: { date: 'desc' },
  });

  console.log('\n📊 Review 테이블 데이터 확인:\n');
  reviews.forEach((r, i) => {
    console.log(`${i + 1}. [${r.source}] ${r.rating}점 - ${r.authorName}`);
    console.log(`   내용: ${r.content.substring(0, 50)}...`);
    console.log(`   날짜: ${r.date.toISOString().split('T')[0]}\n`);
  });

  console.log(`\n총 ${reviews.length}건의 리뷰`);
  console.log(`- 쇼핑몰 리뷰: ${reviews.filter(r => r.source === 'MALL').length}건`);
  console.log(`- 네이버 리뷰: ${reviews.filter(r => r.source === 'NAVER').length}건`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
