// 통합 시드 데이터 - 주문 기준으로 모든 테이블 연동
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시드 데이터 생성 시작...\n');

  // 1. 사용자 생성
  console.log('👤 사용자 생성 중...');
  const hashedPassword = await bcrypt.hash('admin1234', 10);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@company.co.kr' },
      update: { password: hashedPassword },
      create: {
        email: 'admin@company.co.kr',
        name: '관리자',
        password: hashedPassword,
        role: 'ADMIN',
        isOnline: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager@company.co.kr' },
      update: {},
      create: {
        email: 'manager@company.co.kr',
        name: '김매니저',
        password: hashedPassword,
        role: 'MANAGER',
        isOnline: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'cs1@company.co.kr' },
      update: {},
      create: {
        email: 'cs1@company.co.kr',
        name: '이상담',
        password: hashedPassword,
        role: 'CS_AGENT',
        isOnline: true,
        maxChats: 5,
      },
    }),
    prisma.user.upsert({
      where: { email: 'cs2@company.co.kr' },
      update: {},
      create: {
        email: 'cs2@company.co.kr',
        name: '박상담',
        password: hashedPassword,
        role: 'CS_AGENT',
        isOnline: false,
        maxChats: 5,
      },
    }),
    prisma.user.upsert({
      where: { email: 'staff@company.co.kr' },
      update: {},
      create: {
        email: 'staff@company.co.kr',
        name: '최직원',
        password: hashedPassword,
        role: 'USER',
      },
    }),
  ]);
  console.log(`  ✓ ${users.length}명의 사용자 생성 완료`);

  // 2. 고객 생성
  console.log('👥 고객 생성 중...');
  const customerData = [
    { name: '홍길동', email: 'hong@example.com', phone: '010-1234-5678', company: '(주)홍길동상사', segment: 'VIP', status: 'ACTIVE' },
    { name: '김영희', email: 'kim@example.com', phone: '010-2345-6789', company: '영희테크', segment: 'VIP', status: 'ACTIVE' },
    { name: '이철수', email: 'lee@example.com', phone: '010-3456-7890', company: '철수산업', segment: 'New', status: 'ACTIVE' },
    { name: '박민수', email: 'park@example.com', phone: '010-4567-8901', company: null, segment: 'At-Risk', status: 'ACTIVE' },
    { name: '정수진', email: 'jung@example.com', phone: '010-5678-9012', company: '수진컴퍼니', segment: 'VIP', status: 'ACTIVE' },
    { name: '최동훈', email: 'choi@example.com', phone: '010-6789-0123', company: '동훈물산', segment: 'New', status: 'ACTIVE' },
    { name: '강서연', email: 'kang@example.com', phone: '010-7890-1234', company: null, segment: 'New', status: 'ACTIVE' },
    { name: '윤지민', email: 'yoon@example.com', phone: '010-8901-2345', company: '지민엔터프라이즈', segment: 'VIP', status: 'ACTIVE' },
    { name: '장하늘', email: 'jang@example.com', phone: '010-9012-3456', company: null, segment: 'At-Risk', status: 'INACTIVE' },
    { name: '송미래', email: 'song@example.com', phone: '010-0123-4567', company: '미래테크놀로지', segment: 'New', status: 'ACTIVE' },
  ];

  const customers = await Promise.all(
    customerData.map(c =>
      prisma.customer.upsert({
        where: { email: c.email },
        update: {},
        create: {
          ...c,
          address: `서울시 강남구 테헤란로 ${Math.floor(Math.random() * 500)}`,
        },
      })
    )
  );
  console.log(`  ✓ ${customers.length}명의 고객 생성 완료`);

  // 3. 상품 생성
  console.log('📦 상품 생성 중...');
  const productData = [
    { name: '쉴드미니 베이직', sku: 'SM-BASIC-001', price: 89000, stock: 150, category: '공기청정기' },
    { name: '쉴드미니 프로', sku: 'SM-PRO-001', price: 129000, stock: 100, category: '공기청정기' },
    { name: '쉴드미니 맥스', sku: 'SM-MAX-001', price: 189000, stock: 50, category: '공기청정기' },
    { name: '쉴드미니 필터 (3개입)', sku: 'SM-FILTER-003', price: 29000, stock: 500, category: '필터' },
    { name: '쉴드미니 필터 (6개입)', sku: 'SM-FILTER-006', price: 49000, stock: 300, category: '필터' },
    { name: '쉴드미니 케이스 화이트', sku: 'SM-CASE-WHT', price: 15000, stock: 200, category: '액세서리' },
    { name: '쉴드미니 케이스 블랙', sku: 'SM-CASE-BLK', price: 15000, stock: 200, category: '액세서리' },
    { name: '쉴드미니 차량용 어댑터', sku: 'SM-CAR-001', price: 19000, stock: 100, category: '액세서리' },
    { name: '쉴드미니 스탠드', sku: 'SM-STAND-001', price: 25000, stock: 150, category: '액세서리' },
    { name: '쉴드미니 프리미엄 세트', sku: 'SM-SET-PREM', price: 219000, stock: 30, category: '세트상품' },
  ];

  const products = await Promise.all(
    productData.map(p =>
      prisma.product.upsert({
        where: { sku: p.sku },
        update: { isActive: true, isFeatured: true },
        create: {
          ...p,
          description: `${p.name} - 고품질 제품입니다.`,
          isActive: true,
          isFeatured: true,
        },
      })
    )
  );
  console.log(`  ✓ ${products.length}개의 상품 생성 완료`);

  // 4. 주문 생성 (핵심 - 모든 데이터의 기준)
  console.log('🛒 주문 생성 중...');
  const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const shippingStatuses = ['PREPARING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'];
  
  const orders = [];
  for (let i = 0; i < 50; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const orderDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // 최근 90일
    const orderSources = ['자사몰', '네이버', '쿠팡', '11번가', '직접주문'];
    
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${i.toString().padStart(4, '0')}`,
        customerId: customer.id,
        orderDate,
        totalAmount: Number(product.price) * quantity,
        status,
        orderSource: orderSources[Math.floor(Math.random() * orderSources.length)],
        productInfo: JSON.stringify([{ productId: product.id, name: product.name, quantity, price: Number(product.price) }]),
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        shippingAddr: `서울시 강남구 테헤란로 ${Math.floor(Math.random() * 500)}번지`,
        shippingMethod: ['일반배송', '빠른배송', '특급배송'][Math.floor(Math.random() * 3)],
        shippingFee: [0, 3000, 5000][Math.floor(Math.random() * 3)],
        recipientName: customer.name,
        recipientPhone: customer.phone,
        shippingStatus: status === 'DELIVERED' ? 'DELIVERED' : status === 'SHIPPED' ? shippingStatuses[Math.floor(Math.random() * 3)] : 'PREPARING',
        trackingNumber: status !== 'PENDING' ? `${Math.floor(Math.random() * 9000000000) + 1000000000}` : null,
        productName: product.name,
        quantity,
        basePrice: product.price,
        staffName: users[Math.floor(Math.random() * users.length)].name,
        notes: Math.random() > 0.7 ? '선물포장 요청' : null,
        items: {
          create: {
            productId: product.id,
            quantity,
            price: product.price,
          },
        },
      },
    });
    orders.push(order);
  }
  console.log(`  ✓ ${orders.length}개의 주문 생성 완료`);

  // 5. 티켓 생성 (주문과 연동)
  console.log('🎫 티켓 생성 중...');
  const ticketSubjects = [
    '배송이 늦어요', '상품 교환 요청', '환불 문의', '상품 불량', 
    '사용방법 문의', '결제 오류', '배송지 변경', '상품 추가 문의'
  ];
  
  const tickets = [];
  for (let i = 0; i < 30; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const subject = ticketSubjects[Math.floor(Math.random() * ticketSubjects.length)];
    const ticketStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const status = ticketStatuses[Math.floor(Math.random() * ticketStatuses.length)];
    
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-${Date.now()}-${i.toString().padStart(4, '0')}`,
        subject,
        description: `${customer.name}님의 ${subject}에 대한 문의입니다.`,
        status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        category: ['INQUIRY', 'COMPLAINT', 'TECHNICAL', 'BILLING'][Math.floor(Math.random() * 4)],
        customerId: customer.id,
        assignedToId: users[Math.floor(Math.random() * users.length)].id,
        resolvedAt: status === 'RESOLVED' || status === 'CLOSED' ? new Date() : null,
        response: status === 'RESOLVED' ? '문제가 해결되었습니다. 감사합니다.' : null,
      },
    });
    tickets.push(ticket);
  }
  console.log(`  ✓ ${tickets.length}개의 티켓 생성 완료`);

  // 6. A/S 서비스 생성 (주문과 연동)
  console.log('🔧 A/S 서비스 생성 중...');
  const asTypes = ['REPAIR', 'EXCHANGE', 'REFUND', 'WARRANTY'];
  const asStatuses = ['RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  
  const afterServices = [];
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
  
  for (let i = 0; i < 20; i++) {
    const order = deliveredOrders[i % deliveredOrders.length] || orders[i % orders.length];
    const customer = customers.find(c => c.id === order.customerId) || customers[0];
    const asStatus = asStatuses[Math.floor(Math.random() * asStatuses.length)];
    
    const as = await prisma.afterService.create({
      data: {
        asNumber: `AS-${Date.now()}-${i.toString().padStart(4, '0')}`,
        ticketNumber: `TKT-AS-${i.toString().padStart(4, '0')}`,
        customerId: customer.id,
        customerName: customer.name,
        orderId: order.id,
        type: asTypes[Math.floor(Math.random() * asTypes.length)],
        issueType: ['불량', '파손', '기능오류', '소음'][Math.floor(Math.random() * 4)],
        status: asStatus,
        priority: ['LOW', 'NORMAL', 'HIGH', 'URGENT'][Math.floor(Math.random() * 4)],
        description: '제품 이상으로 인한 A/S 접수',
        productName: order.productName,
        serialNumber: `SN-${Math.floor(Math.random() * 1000000)}`,
        symptom: '제품이 정상 작동하지 않습니다.',
        diagnosis: asStatus !== 'RECEIVED' ? '내부 부품 교체 필요' : null,
        resolution: asStatus === 'COMPLETED' ? '부품 교체 완료' : null,
        assignedToId: users[Math.floor(Math.random() * users.length)].id,
        serviceDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        completedAt: asStatus === 'COMPLETED' ? new Date() : null,
        estimatedCost: Math.floor(Math.random() * 50000) + 10000,
        actualCost: asStatus === 'COMPLETED' ? Math.floor(Math.random() * 40000) + 10000 : null,
      },
    });
    afterServices.push(as);
  }
  console.log(`  ✓ ${afterServices.length}개의 A/S 생성 완료`);

  // 7. 리드 생성 (고객과 연동)
  console.log('📈 리드 생성 중...');
  const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
  
  const leads = [];
  for (let i = 0; i < 25; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = leadStatuses[Math.floor(Math.random() * leadStatuses.length)];
    
    const lead = await prisma.lead.create({
      data: {
        customerId: customer.id,
        title: `${customer.company || customer.name} 대량 구매 문의`,
        description: `${customer.name}님께서 대량 구매에 관심을 보이셨습니다.`,
        value: Math.floor(Math.random() * 10000000) + 500000,
        status,
        source: ['WEBSITE', 'REFERRAL', 'COLD_CALL', 'CAMPAIGN'][Math.floor(Math.random() * 4)],
        assignedToId: users[Math.floor(Math.random() * users.length)].id,
      },
    });
    leads.push(lead);
  }
  console.log(`  ✓ ${leads.length}개의 리드 생성 완료`);

  // 8. 채팅 세션 생성 (고객과 연동)
  console.log('💬 채팅 세션 생성 중...');
  const chatStatuses = ['WAITING', 'ACTIVE', 'CLOSED'];
  const channels = ['WEB', 'MOBILE', 'KAKAO'];
  
  const chatSessions = [];
  for (let i = 0; i < 15; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = chatStatuses[Math.floor(Math.random() * chatStatuses.length)];
    const csAgent = users.find(u => u.role === 'CS_AGENT');
    
    const session = await prisma.chatSession.create({
      data: {
        customerId: customer.id,
        assignedToId: status !== 'WAITING' ? (csAgent?.id || users[0].id) : null,
        status,
        channel: channels[Math.floor(Math.random() * channels.length)],
        priority: Math.floor(Math.random() * 10),
        endedAt: status === 'CLOSED' ? new Date() : null,
        messages: {
          create: [
            {
              content: `안녕하세요, ${customer.name}입니다. 문의드립니다.`,
              senderType: 'CUSTOMER',
              senderId: customer.id,
            },
            ...(status !== 'WAITING' ? [{
              content: '안녕하세요! 무엇을 도와드릴까요?',
              senderType: 'AGENT',
              senderId: csAgent?.id || users[0].id,
            }] : []),
          ],
        },
      },
    });
    chatSessions.push(session);
  }
  console.log(`  ✓ ${chatSessions.length}개의 채팅 세션 생성 완료`);

  // 9. 캠페인 생성
  console.log('📢 캠페인 생성 중...');
  const campaignData = [
    { name: '신년 프로모션', type: 'EMAIL', status: 'COMPLETED', budget: 5000000 },
    { name: '봄맞이 세일', type: 'SMS', status: 'ACTIVE', budget: 3000000 },
    { name: 'VIP 고객 감사 이벤트', type: 'EMAIL', status: 'ACTIVE', budget: 2000000 },
    { name: '신제품 출시 알림', type: 'SOCIAL', status: 'DRAFT', budget: 1000000 },
    { name: '여름 휴가 특별전', type: 'EVENT', status: 'DRAFT', budget: 8000000 },
  ];

  const campaigns = await Promise.all(
    campaignData.map(c =>
      prisma.campaign.create({
        data: {
          ...c,
          description: `${c.name} 캠페인입니다.`,
          startDate: c.status !== 'DRAFT' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : null,
          endDate: c.status === 'COMPLETED' ? new Date() : null,
          spent: c.status === 'COMPLETED' ? c.budget * 0.9 : c.status === 'ACTIVE' ? c.budget * 0.5 : 0,
          roi: c.status === 'COMPLETED' ? 1.5 : null,
          targetCount: Math.floor(Math.random() * 5000) + 1000,
          sentCount: c.status !== 'DRAFT' ? Math.floor(Math.random() * 4000) + 500 : 0,
          openRate: c.status !== 'DRAFT' ? Math.random() * 30 + 20 : null,
          clickRate: c.status !== 'DRAFT' ? Math.random() * 10 + 5 : null,
        },
      })
    )
  );
  console.log(`  ✓ ${campaigns.length}개의 캠페인 생성 완료`);

  // 10. 파트너 생성
  console.log('🤝 파트너 생성 중...');
  const partnerData = [
    { name: '서울총판', email: 'seoul@partner.com', company: '서울종합물류', type: 'DISTRIBUTOR', region: '서울' },
    { name: '경기대리점', email: 'gyeonggi@partner.com', company: '경기유통', type: 'RESELLER', region: '경기' },
    { name: '부산지사', email: 'busan@partner.com', company: '부산물산', type: 'DISTRIBUTOR', region: '부산' },
    { name: '온라인몰파트너', email: 'online@partner.com', company: '이커머스코리아', type: 'AFFILIATE', region: '전국' },
    { name: '제주대리점', email: 'jeju@partner.com', company: '제주상사', type: 'RESELLER', region: '제주' },
  ];

  const partners = await Promise.all(
    partnerData.map(p =>
      prisma.partner.upsert({
        where: { email: p.email },
        update: {},
        create: {
          ...p,
          phone: `02-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
          status: 'ACTIVE',
          commission: Math.random() * 10 + 5,
        },
      })
    )
  );
  console.log(`  ✓ ${partners.length}개의 파트너 생성 완료`);

  // 11. 부품/재고 생성
  console.log('🔩 부품/재고 생성 중...');
  const partData = [
    { name: 'HEPA 필터', sku: 'PART-HEPA-001', price: 15000, stock: 500, minStock: 100 },
    { name: '모터 유닛', sku: 'PART-MOTOR-001', price: 35000, stock: 200, minStock: 50 },
    { name: '전원 어댑터', sku: 'PART-POWER-001', price: 12000, stock: 300, minStock: 80 },
    { name: 'LED 표시등', sku: 'PART-LED-001', price: 5000, stock: 1000, minStock: 200 },
    { name: '케이스 상판', sku: 'PART-CASE-TOP', price: 8000, stock: 150, minStock: 30 },
    { name: '케이스 하판', sku: 'PART-CASE-BTM', price: 8000, stock: 150, minStock: 30 },
    { name: '팬 블레이드', sku: 'PART-FAN-001', price: 3000, stock: 400, minStock: 100 },
    { name: 'PCB 메인보드', sku: 'PART-PCB-001', price: 45000, stock: 80, minStock: 20 },
  ];

  const parts = await Promise.all(
    partData.map(p =>
      prisma.part.upsert({
        where: { sku: p.sku },
        update: {},
        create: {
          ...p,
          description: `${p.name} 교체용 부품`,
          location: `창고 ${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}-${Math.floor(Math.random() * 10) + 1}`,
          category: 'SPARE_PART',
        },
      })
    )
  );
  console.log(`  ✓ ${parts.length}개의 부품 생성 완료`);

  // 12. 지식베이스 생성
  console.log('📚 지식베이스 생성 중...');
  const articleData = [
    { title: '쉴드미니 초기 설정 방법', category: 'MANUAL', content: '1. 전원을 연결합니다.\n2. 버튼을 3초간 누릅니다.\n3. LED가 파란색으로 변하면 설정 완료입니다.' },
    { title: '필터 교체 주기 안내', category: 'MAINTENANCE', content: '필터는 3개월마다 교체하는 것을 권장합니다. 사용 환경에 따라 더 자주 교체가 필요할 수 있습니다.' },
    { title: '배송 정책 안내', category: 'POLICY', content: '주문 후 1-3일 내 배송됩니다. 도서산간 지역은 추가 배송비가 발생할 수 있습니다.' },
    { title: 'A/S 접수 방법', category: 'SERVICE', content: '고객센터(1588-0000)로 전화하시거나 웹사이트에서 A/S를 접수하실 수 있습니다.' },
    { title: '제품 보증 정책', category: 'WARRANTY', content: '본 제품은 구매일로부터 1년간 무상 A/S가 제공됩니다. 소모품(필터)은 보증 대상에서 제외됩니다.' },
  ];

  const articles = await Promise.all(
    articleData.map(a =>
      prisma.knowledgeArticle.create({
        data: {
          ...a,
          tags: a.category.toLowerCase(),
          viewCount: Math.floor(Math.random() * 1000),
        },
      })
    )
  );
  console.log(`  ✓ ${articles.length}개의 지식베이스 문서 생성 완료`);

  // 13. FAQ 생성
  console.log('❓ FAQ 생성 중...');
  const faqData = [
    { question: '배송은 얼마나 걸리나요?', answer: '일반배송은 2-3일, 빠른배송은 1-2일 소요됩니다.', category: '배송' },
    { question: '반품/교환은 어떻게 하나요?', answer: '상품 수령 후 7일 이내 고객센터로 연락주시면 됩니다.', category: '반품/교환' },
    { question: '필터는 언제 교체해야 하나요?', answer: '일반적으로 3개월마다 교체를 권장합니다.', category: '제품문의' },
    { question: '보증기간은 얼마나 되나요?', answer: '제품 구매일로부터 1년간 무상 A/S가 제공됩니다.', category: 'A/S' },
    { question: '대량구매 할인이 가능한가요?', answer: '10개 이상 구매시 별도 문의 부탁드립니다.', category: '구매문의' },
    { question: '결제수단은 무엇이 있나요?', answer: '신용카드, 무통장입금, 간편결제(카카오페이, 네이버페이)를 지원합니다.', category: '결제' },
    { question: '해외배송이 가능한가요?', answer: '현재 국내배송만 가능합니다.', category: '배송' },
    { question: '제품 사용설명서는 어디서 받나요?', answer: '홈페이지 다운로드 센터에서 PDF로 받으실 수 있습니다.', category: '제품문의' },
  ];

  const faqs = await Promise.all(
    faqData.map((f, index) =>
      prisma.fAQ.create({
        data: {
          ...f,
          orderIndex: index + 1,
          isActive: true,
          viewCount: Math.floor(Math.random() * 500),
        },
      })
    )
  );
  console.log(`  ✓ ${faqs.length}개의 FAQ 생성 완료`);

  // 14. 리뷰 생성
  console.log('⭐ 리뷰 생성 중...');
  const reviewContents = [
    { rating: 5, content: '정말 좋아요! 공기가 깨끗해진 것 같습니다.', sentiment: 'POSITIVE' },
    { rating: 5, content: '디자인도 예쁘고 성능도 좋습니다. 강추!', sentiment: 'POSITIVE' },
    { rating: 4, content: '전반적으로 만족합니다. 소음이 조금 있네요.', sentiment: 'POSITIVE' },
    { rating: 4, content: '가격 대비 성능 좋습니다.', sentiment: 'POSITIVE' },
    { rating: 3, content: '보통이에요. 기대했던 것보다는...', sentiment: 'NEUTRAL' },
    { rating: 3, content: '그냥저냥 사용할만 합니다.', sentiment: 'NEUTRAL' },
    { rating: 2, content: '배송이 너무 늦었어요.', sentiment: 'NEGATIVE' },
    { rating: 4, content: '아이 방에 놓으니 좋네요.', sentiment: 'POSITIVE' },
  ];

  const reviews = [];
  for (let i = 0; i < 40; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const reviewData = reviewContents[Math.floor(Math.random() * reviewContents.length)];
    
    const review = await prisma.review.create({
      data: {
        productId: product.id,
        productName: product.name,
        ...reviewData,
        authorName: ['구매자', '행복한고객', '만족이', '리뷰어123', '쇼핑왕'][Math.floor(Math.random() * 5)],
        source: ['NAVER', 'COUPANG', 'INTERNAL'][Math.floor(Math.random() * 3)],
      },
    });
    reviews.push(review);
  }
  console.log(`  ✓ ${reviews.length}개의 리뷰 생성 완료`);

  // 15. 고객 노트 생성
  console.log('📝 고객 노트 생성 중...');
  const notes = [];
  for (const customer of customers) {
    const noteCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < noteCount; i++) {
      const note = await prisma.customerNote.create({
        data: {
          customerId: customer.id,
          content: ['VIP 고객 - 특별 관리 필요', '재구매 가능성 높음', '불만 고객 - 주의 필요', '대량 구매 문의 이력 있음'][Math.floor(Math.random() * 4)],
          authorName: users[Math.floor(Math.random() * users.length)].name,
          noteType: ['GENERAL', 'FOLLOW_UP', 'COMPLAINT', 'FEEDBACK'][Math.floor(Math.random() * 4)],
        },
      });
      notes.push(note);
    }
  }
  console.log(`  ✓ ${notes.length}개의 고객 노트 생성 완료`);

  // 16. 선물 생성
  console.log('🎁 선물 생성 중...');
  const giftNames = ['감사 쿠폰', '무료 필터', '할인 바우처', '사은품 세트'];
  
  const gifts = [];
  for (let i = 0; i < 10; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = ['PENDING', 'SENT', 'DELIVERED'][Math.floor(Math.random() * 3)];
    
    const gift = await prisma.gift.create({
      data: {
        customerId: customer.id,
        name: giftNames[Math.floor(Math.random() * giftNames.length)],
        description: 'VIP 고객 감사 선물',
        value: [10000, 20000, 30000, 50000][Math.floor(Math.random() * 4)],
        status,
        sentAt: status !== 'PENDING' ? new Date() : null,
        deliveredAt: status === 'DELIVERED' ? new Date() : null,
      },
    });
    gifts.push(gift);
  }
  console.log(`  ✓ ${gifts.length}개의 선물 생성 완료`);

  // 17. MallUser 생성
  console.log('🛍️ 쇼핑몰 사용자 생성 중...');
  const mallUserData = [
    { email: 'mall_user1@example.com', name: '쇼핑몰고객1', phone: '010-1111-1111' },
    { email: 'mall_user2@example.com', name: '쇼핑몰고객2', phone: '010-2222-2222' },
    { email: 'mall_user3@example.com', name: '쇼핑몰고객3', phone: '010-3333-3333' },
    { email: 'mall_user4@example.com', name: '쇼핑몰고객4', phone: '010-4444-4444' },
    { email: 'mall_user5@example.com', name: '쇼핑몰고객5', phone: '010-5555-5555' },
  ];

  const mallUsers = await Promise.all(
    mallUserData.map(u =>
      prisma.mallUser.upsert({
        where: { email: u.email },
        update: {},
        create: {
          ...u,
          password: hashedPassword,
          address: `서울시 강남구 테헤란로 ${Math.floor(Math.random() * 500)}`,
        },
      })
    )
  );
  console.log(`  ✓ ${mallUsers.length}명의 쇼핑몰 사용자 생성 완료`);

  // 18. MallOrder 생성
  console.log('🛒 쇼핑몰 주문 생성 중...');
  const mallOrderStatuses = ['PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  
  const mallOrders = [];
  for (let i = 0; i < 30; i++) {
    const mallUser = mallUsers[Math.floor(Math.random() * mallUsers.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const status = mallOrderStatuses[Math.floor(Math.random() * mallOrderStatuses.length)];
    const orderDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
    
    const mallOrder = await prisma.mallOrder.create({
      data: {
        orderNumber: `MALL-${Date.now()}-${i.toString().padStart(4, '0')}`,
        userId: mallUser.id,
        totalAmount: Number(product.price) * quantity,
        status,
        shippingName: mallUser.name,
        shippingPhone: mallUser.phone,
        shippingAddress: `서울시 강남구 테헤란로 ${Math.floor(Math.random() * 500)}번지`,
        shippingMemo: ['부재시 경비실에 맡겨주세요', '문 앞에 놓아주세요', null][Math.floor(Math.random() * 3)],
        trackingNumber: ['SHIPPED', 'DELIVERED'].includes(status) ? `${Math.floor(Math.random() * 9000000000) + 1000000000}` : null,
        trackingCompany: ['SHIPPED', 'DELIVERED'].includes(status) ? ['CJ대한통운', '한진택배', '롯데택배'][Math.floor(Math.random() * 3)] : null,
        items: JSON.stringify([{
          productId: product.id,
          productName: product.name,
          quantity,
          price: Number(product.price),
        }]),
        paidAt: status !== 'PENDING' ? orderDate : null,
        shippedAt: ['SHIPPED', 'DELIVERED'].includes(status) ? new Date(orderDate.getTime() + 24 * 60 * 60 * 1000) : null,
        deliveredAt: status === 'DELIVERED' ? new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000) : null,
        createdAt: orderDate,
      },
    });
    mallOrders.push(mallOrder);
  }
  console.log(`  ✓ ${mallOrders.length}개의 쇼핑몰 주문 생성 완료`);

  console.log('\n✅ 모든 시드 데이터 생성 완료!\n');
  
  // 통계 출력
  console.log('📊 데이터 통계:');
  console.log(`   - 사용자: ${users.length}명`);
  console.log(`   - 고객: ${customers.length}명`);
  console.log(`   - 상품: ${products.length}개`);
  console.log(`   - 주문: ${orders.length}건`);
  console.log(`   - 티켓: ${tickets.length}건`);
  console.log(`   - A/S: ${afterServices.length}건`);
  console.log(`   - 리드: ${leads.length}건`);
  console.log(`   - 채팅세션: ${chatSessions.length}개`);
  console.log(`   - 캠페인: ${campaigns.length}개`);
  console.log(`   - 파트너: ${partners.length}개`);
  console.log(`   - 부품: ${parts.length}개`);
  console.log(`   - 지식베이스: ${articles.length}개`);
  console.log(`   - FAQ: ${faqs.length}개`);
  console.log(`   - 리뷰: ${reviews.length}개`);
  console.log(`   - 고객노트: ${notes.length}개`);
  console.log(`   - 선물: ${gifts.length}개`);
  console.log(`   - 쇼핑몰 사용자: ${mallUsers.length}명`);
  console.log(`   - 쇼핑몰 주문: ${mallOrders.length}건`);

  console.log('\n🔑 로그인 정보:');
  console.log('   이메일: admin@company.co.kr');
  console.log('   비밀번호: admin1234');
}

main()
  .catch((e) => {
    console.error('❌ 시드 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
