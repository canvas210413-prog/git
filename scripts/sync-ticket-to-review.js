const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Ticket 데이터를 Review 테이블로 동기화 시작...\n');

  // 1. 네이버 리뷰 티켓 찾기
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

  console.log(`📊 발견된 네이버 리뷰 티켓: ${naverReviewTickets.length}건`);

  if (naverReviewTickets.length === 0) {
    console.log('⚠️  동기화할 네이버 리뷰 티켓이 없습니다.');
    return;
  }

  let syncedCount = 0;
  let skippedCount = 0;

  for (const ticket of naverReviewTickets) {
    try {
      // 제목에서 평점 추출: [리뷰] 5점 - ...
      const ratingMatch = ticket.subject.match(/\[리뷰\]\s*(\d)점/);
      const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;

      // 제목에서 내용 미리보기 추출
      const contentPreview = ticket.subject.replace(/\[리뷰\]\s*\d점\s*-\s*/, '');

      // 설명에서 날짜 추출: [네이버 리뷰 - 25.12.18.]
      const dateMatch = ticket.description.match(/\[네이버 리뷰 - (.+?)\]/);
      let reviewDate = new Date();
      
      if (dateMatch) {
        const dateStr = dateMatch[1].replace(/\.$/, ''); // 마지막 점 제거
        const parts = dateStr.split('.');
        if (parts.length >= 3) {
          const year = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
          const month = parts[1].padStart(2, '0');
          const day = parts[2].padStart(2, '0');
          reviewDate = new Date(`${year}-${month}-${day}`);
        }
      }

      // 설명에서 실제 리뷰 내용 추출
      let content = ticket.description;
      content = content.replace(/\[네이버 리뷰 - .+?\]\s*/, '');
      content = content.replace(/평점: \d점\s*/, '');
      content = content.replace(/옵션: .+?\n/, '');
      content = content.replace(/내용: /, '');
      
      // ━━━ 구분선 이후 제거
      const separatorIndex = content.indexOf('━━━');
      if (separatorIndex !== -1) {
        content = content.substring(0, separatorIndex).trim();
      }

      // 중복 체크: source='NAVER'이고 동일한 내용이 있는지
      const existingReview = await prisma.review.findFirst({
        where: {
          source: 'NAVER',
          content: content,
          authorName: ticket.customer.name,
        },
      });

      if (existingReview) {
        skippedCount++;
        console.log(`⏭️  스킵: ${ticket.customer.name} - 이미 존재함`);
        continue;
      }

      // Review 테이블에 저장
      await prisma.review.create({
        data: {
          productId: 'naver-smartstore',
          productName: '네이버 스마트스토어 상품',
          rating: rating,
          content: content || contentPreview,
          authorName: ticket.customer.name,
          source: 'NAVER',
          date: reviewDate,
        },
      });

      syncedCount++;
      console.log(`✅ 동기화: ${ticket.customer.name} (${rating}점) - ${reviewDate.toISOString().split('T')[0]}`);
    } catch (error) {
      console.error(`❌ 오류 (티켓 ID: ${ticket.id}):`, error.message);
    }
  }

  console.log('\n📊 동기화 완료:');
  console.log(`  - 성공: ${syncedCount}건`);
  console.log(`  - 스킵: ${skippedCount}건`);
  console.log(`  - 총: ${naverReviewTickets.length}건`);

  // 최종 Review 테이블 현황
  const totalReviews = await prisma.review.count();
  const naverReviews = await prisma.review.count({ where: { source: 'NAVER' } });
  const mallReviews = await prisma.review.count({ where: { source: 'MALL' } });

  console.log('\n📈 Review 테이블 현황:');
  console.log(`  - 총 리뷰: ${totalReviews}건`);
  console.log(`  - 쇼핑몰 리뷰: ${mallReviews}건`);
  console.log(`  - 네이버 리뷰: ${naverReviews}건`);
}

main()
  .catch((e) => {
    console.error('❌ 에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
