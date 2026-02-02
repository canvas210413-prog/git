const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Review 테이블의 고아 NAVER 리뷰 찾기...\n');
  
  // 1. Review 테이블의 모든 NAVER 리뷰 가져오기
  const naverReviews = await prisma.review.findMany({
    where: {
      source: 'NAVER'
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`📊 Review 테이블 NAVER 리뷰: ${naverReviews.length}건\n`);
  
  // 2. Ticket 테이블의 모든 네이버 리뷰 가져오기
  const tickets = await prisma.ticket.findMany({
    where: {
      description: {
        startsWith: '[네이버 리뷰 -'
      }
    }
  });
  
  console.log(`📊 Ticket 테이블 네이버 리뷰: ${tickets.length}건\n`);
  
  // 3. Ticket에 없는 Review 찾기
  const ticketAuthors = new Set(
    tickets.map(t => {
      const match = t.description.match(/\[네이버 리뷰 - (.+?)\]/);
      return match ? match[1] : null;
    }).filter(Boolean)
  );
  
  const orphanReviews = naverReviews.filter(
    review => !ticketAuthors.has(review.authorName)
  );
  
  console.log(`🔍 Ticket에 없는 Review (고아 리뷰): ${orphanReviews.length}건\n`);
  
  if (orphanReviews.length > 0) {
    console.log('📋 고아 리뷰 상세:\n');
    orphanReviews.forEach((review, index) => {
      console.log(`${index + 1}. ${review.authorName} - ⭐${review.rating}`);
      console.log(`   내용: ${review.content.substring(0, 50)}...`);
      console.log(`   생성일: ${review.createdAt}`);
      console.log(`   ID: ${review.id}\n`);
    });
  }
  
  // 4. 역으로 Review에 없는 Ticket 찾기
  const reviewAuthors = new Set(naverReviews.map(r => r.authorName));
  
  const orphanTickets = tickets.filter(t => {
    const match = t.description.match(/\[네이버 리뷰 - (.+?)\]/);
    const author = match ? match[1] : null;
    return author && !reviewAuthors.has(author);
  });
  
  console.log(`\n🔍 Review에 없는 Ticket (역 고아): ${orphanTickets.length}건\n`);
  
  if (orphanTickets.length > 0) {
    console.log('📋 역 고아 티켓 상세:\n');
    orphanTickets.forEach((ticket, index) => {
      const match = ticket.description.match(/\[네이버 리뷰 - (.+?)\] (.+)/);
      const author = match ? match[1] : '알 수 없음';
      const content = match ? match[2] : ticket.description;
      
      console.log(`${index + 1}. ${author}`);
      console.log(`   내용: ${content.substring(0, 50)}...`);
      console.log(`   생성일: ${ticket.createdAt}`);
      console.log(`   ID: ${ticket.id}\n`);
    });
  }
  
  console.log('\n📊 요약:');
  console.log(`  Review NAVER: ${naverReviews.length}건`);
  console.log(`  Ticket 네이버: ${tickets.length}건`);
  console.log(`  차이: ${naverReviews.length - tickets.length}건`);
  console.log(`  Ticket 없는 Review: ${orphanReviews.length}건`);
  console.log(`  Review 없는 Ticket: ${orphanTickets.length}건`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
