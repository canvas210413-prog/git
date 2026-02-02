const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Review 테이블 정리 시작...\n');

  // 1. 현재 Review 테이블 상태 확인
  const currentReviews = await prisma.review.count();
  console.log(`📊 현재 Review 테이블: ${currentReviews}건\n`);

  // 2. 모든 Review 삭제
  const deleted = await prisma.review.deleteMany({});
  console.log(`🗑️  삭제된 리뷰: ${deleted.count}건\n`);

  // 3. 삭제 후 확인
  const afterDelete = await prisma.review.count();
  console.log(`✅ Review 테이블 정리 완료: ${afterDelete}건 남음\n`);

  console.log('📝 이제 고객리뷰관리에서 쇼핑몰/네이버 탭의 데이터를 사용합니다.');
  console.log('   - 쇼핑몰 탭: Review 테이블 (source=MALL)');
  console.log('   - 네이버 탭: Ticket 테이블 (네이버 리뷰)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
