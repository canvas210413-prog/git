const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reviews = await prisma.review.findMany({ 
    orderBy: { date: 'desc' } 
  });
  
  console.log('📊 Review 테이블 전체:', reviews.length, '건\n');
  
  const bySource = {};
  reviews.forEach(r => {
    bySource[r.source || 'NULL'] = (bySource[r.source || 'NULL'] || 0) + 1;
  });
  
  console.log('source별 분포:');
  Object.entries(bySource).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}건`);
  });

  // 최근 10개 리뷰 출력
  console.log('\n📋 최근 10개 리뷰:');
  reviews.slice(0, 10).forEach((r, i) => {
    console.log(`${i + 1}. [${r.source}] ${r.rating}점 - ${r.authorName}: ${r.content.substring(0, 30)}...`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
