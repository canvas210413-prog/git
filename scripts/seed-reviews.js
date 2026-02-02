const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 리뷰 샘플 데이터 생성 시작...');

  // 기존 리뷰 삭제
  await prisma.review.deleteMany({});
  console.log('✅ 기존 리뷰 데이터 삭제 완료');

  // 쇼핑몰 리뷰 샘플
  const mallReviews = [
    {
      productName: '코프로젝트 비염케어',
      rating: 5,
      content: '아이 비염이 정말 좋아졌어요! 매일 사용하고 있습니다.',
      authorName: '김지현',
      source: 'MALL',
      date: new Date('2025-12-20'),
    },
    {
      productName: '코프로젝트 비염케어',
      rating: 4,
      content: '효과는 있는데 소리가 조금 큰 것 같아요.',
      authorName: '이민수',
      source: 'MALL',
      date: new Date('2025-12-25'),
    },
    {
      productName: '코프로젝트 비염케어',
      rating: 5,
      content: '배송도 빠르고 제품도 만족스럽습니다!',
      authorName: '박서연',
      source: 'MALL',
      date: new Date('2026-01-05'),
    },
    {
      productName: '코프로젝트 비염케어',
      rating: 3,
      content: '가격대비 괜찮은 것 같아요. 더 써봐야 알 것 같습니다.',
      authorName: '정우진',
      source: 'MALL',
      date: new Date('2026-01-08'),
    },
    {
      productName: '코프로젝트 비염케어',
      rating: 5,
      content: '아이가 좋아해요. 코 청소하기 싫어했는데 이건 재미있어하네요.',
      authorName: '최은영',
      source: 'MALL',
      date: new Date('2026-01-10'),
    },
  ];

  // 네이버 리뷰 샘플
  const naverReviews = [
    {
      productName: '코프로젝트 비염케어',
      rating: 5,
      content: '스토어PICK👶 매일 하던 아기 코청소가 편해졌어요!',
      authorName: 'mymy***',
      source: 'NAVER',
      date: new Date('2025-12-18'),
    },
    {
      productName: '코프로젝트 비염케어',
      rating: 5,
      content: '6살,4살 아이키우는 집 필수템! 강추합니다',
      authorName: 'dahy*****',
      source: 'NAVER',
      date: new Date('2025-12-22'),
    },
    {
      productName: '코프로젝트 비염케어',
      rating: 4,
      content: '생각보다 효과가 좋네요. 다만 충전이 자주 필요해요.',
      authorName: 'hong****',
      source: 'NAVER',
      date: new Date('2025-12-28'),
    },
    {
      productName: '코프로젝트 비염케어',
      rating: 5,
      content: '비염으로 고생하는 아이에게 큰 도움이 됩니다!',
      authorName: 'park***',
      source: 'NAVER',
      date: new Date('2026-01-03'),
    },
    {
      productName: '코프로젝트 비염케어',
      rating: 4,
      content: '디자인이 예쁘고 사용하기 편해요. 아이도 잘 써요.',
      authorName: 'kim*****',
      source: 'NAVER',
      date: new Date('2026-01-07'),
    },
  ];

  // 쇼핑몰 리뷰 생성
  for (const review of mallReviews) {
    await prisma.review.create({
      data: review,
    });
  }
  console.log(`✅ 쇼핑몰 리뷰 ${mallReviews.length}건 생성 완료`);

  // 네이버 리뷰 생성
  for (const review of naverReviews) {
    await prisma.review.create({
      data: review,
    });
  }
  console.log(`✅ 네이버 리뷰 ${naverReviews.length}건 생성 완료`);

  const totalCount = await prisma.review.count();
  console.log(`\n🎉 총 ${totalCount}건의 리뷰 데이터 생성 완료!`);
}

main()
  .catch((e) => {
    console.error('❌ 에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
