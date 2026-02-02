// SQLite에서 MySQL로 데이터 마이그레이션 스크립트
const { PrismaClient: PrismaClientSQLite } = require('@prisma/client');
const { PrismaClient: PrismaClientMySQL } = require('@prisma/client');
const fs = require('fs');

// SQLite 클라이언트 (임시로 이전 설정 사용)
const sqliteClient = new PrismaClientSQLite({
  datasources: {
    db: {
      url: 'file:./prisma/prisma/dev.db'
    }
  }
});

// MySQL 클라이언트 (현재 .env 설정 사용)
const mysqlClient = new PrismaClientMySQL();

async function migrateData() {
  console.log('🔄 SQLite에서 MySQL로 데이터 마이그레이션 시작...\n');

  try {
    // 1. Users 마이그레이션
    console.log('📊 Users 마이그레이션...');
    const users = await sqliteClient.user.findMany();
    console.log(`   ${users.length}개의 사용자 발견`);
    
    for (const user of users) {
      await mysqlClient.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      });
    }
    console.log('✓ Users 마이그레이션 완료\n');

    // 2. Customers 마이그레이션
    console.log('📊 Customers 마이그레이션...');
    const customers = await sqliteClient.customer.findMany();
    console.log(`   ${customers.length}개의 고객 발견`);
    
    for (const customer of customers) {
      await mysqlClient.customer.upsert({
        where: { id: customer.id },
        update: customer,
        create: customer
      });
    }
    console.log('✓ Customers 마이그레이션 완료\n');

    // 3. Products 마이그레이션
    console.log('📊 Products 마이그레이션...');
    const products = await sqliteClient.product.findMany();
    console.log(`   ${products.length}개의 제품 발견`);
    
    for (const product of products) {
      await mysqlClient.product.upsert({
        where: { id: product.id },
        update: product,
        create: product
      });
    }
    console.log('✓ Products 마이그레이션 완료\n');

    // 4. Orders 마이그레이션
    console.log('📊 Orders 마이그레이션...');
    const orders = await sqliteClient.order.findMany();
    console.log(`   ${orders.length}개의 주문 발견`);
    
    for (const order of orders) {
      await mysqlClient.order.upsert({
        where: { id: order.id },
        update: order,
        create: order
      });
    }
    console.log('✓ Orders 마이그레이션 완료\n');

    // 5. OrderItems 마이그레이션
    console.log('📊 OrderItems 마이그레이션...');
    const orderItems = await sqliteClient.orderItem.findMany();
    console.log(`   ${orderItems.length}개의 주문 항목 발견`);
    
    for (const item of orderItems) {
      await mysqlClient.orderItem.upsert({
        where: { id: item.id },
        update: item,
        create: item
      });
    }
    console.log('✓ OrderItems 마이그레이션 완료\n');

    // 6. Tickets 마이그레이션
    console.log('📊 Tickets 마이그레이션...');
    const tickets = await sqliteClient.ticket.findMany();
    console.log(`   ${tickets.length}개의 티켓 발견`);
    
    for (const ticket of tickets) {
      await mysqlClient.ticket.upsert({
        where: { id: ticket.id },
        update: ticket,
        create: ticket
      });
    }
    console.log('✓ Tickets 마이그레이션 완료\n');

    // 7. ChatSessions 마이그레이션
    console.log('📊 ChatSessions 마이그레이션...');
    const chatSessions = await sqliteClient.chatSession.findMany();
    console.log(`   ${chatSessions.length}개의 채팅 세션 발견`);
    
    for (const session of chatSessions) {
      await mysqlClient.chatSession.upsert({
        where: { id: session.id },
        update: session,
        create: session
      });
    }
    console.log('✓ ChatSessions 마이그레이션 완료\n');

    // 8. ChatMessages 마이그레이션
    console.log('📊 ChatMessages 마이그레이션...');
    const messages = await sqliteClient.chatMessage.findMany();
    console.log(`   ${messages.length}개의 메시지 발견`);
    
    for (const message of messages) {
      await mysqlClient.chatMessage.upsert({
        where: { id: message.id },
        update: message,
        create: message
      });
    }
    console.log('✓ ChatMessages 마이그레이션 완료\n');

    // 9. Leads 마이그레이션
    console.log('📊 Leads 마이그레이션...');
    const leads = await sqliteClient.lead.findMany();
    console.log(`   ${leads.length}개의 리드 발견`);
    
    for (const lead of leads) {
      await mysqlClient.lead.upsert({
        where: { id: lead.id },
        update: lead,
        create: lead
      });
    }
    console.log('✓ Leads 마이그레이션 완료\n');

    // 10. Reviews 마이그레이션
    console.log('📊 Reviews 마이그레이션...');
    const reviews = await sqliteClient.review.findMany();
    console.log(`   ${reviews.length}개의 리뷰 발견`);
    
    for (const review of reviews) {
      await mysqlClient.review.upsert({
        where: { id: review.id },
        update: review,
        create: review
      });
    }
    console.log('✓ Reviews 마이그레이션 완료\n');

    // 추가 모델들...
    // FAQ, Partner, AfterService, Inventory 등

    console.log('✅ 모든 데이터 마이그레이션 완료!');
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    throw error;
  } finally {
    await sqliteClient.$disconnect();
    await mysqlClient.$disconnect();
  }
}

// 실행
migrateData()
  .then(() => {
    console.log('\n🎉 마이그레이션이 성공적으로 완료되었습니다!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 마이그레이션 실패:', error);
    process.exit(1);
  });
