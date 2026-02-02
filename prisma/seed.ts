import { PrismaClient, Product } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// 한국식 더미 데이터 생성기
// ============================================================================

// 한국 성씨
const koreanLastNames = [
  "김", "이", "박", "최", "정", "강", "조", "윤", "장", "임",
  "한", "오", "서", "신", "권", "황", "안", "송", "전", "홍",
  "유", "고", "문", "양", "손", "배", "백", "허", "노", "심"
];

// 한국 이름
const koreanFirstNames = [
  "민준", "서준", "예준", "도윤", "시우", "주원", "하준", "지호", "지후", "준서",
  "서연", "서윤", "지우", "서현", "민서", "하은", "하윤", "윤서", "지민", "채원",
  "수빈", "지현", "영호", "성민", "현우", "재현", "승현", "준혁", "민재", "현정",
  "미영", "은정", "수진", "혜진", "지영", "민정", "소영", "유진", "지연", "수연"
];

// 한국 회사명
const koreanCompanies = [
  "삼성전자", "LG전자", "현대자동차", "SK하이닉스", "네이버",
  "카카오", "쿠팡", "배달의민족", "토스", "당근마켓",
  "(주)행복상사", "(주)미래테크", "(주)한국물산", "(주)서울식품", "(주)부산무역",
  "대한상사", "동양건설", "서진테크", "한빛솔루션", "명품식품",
  "글로벌유통", "스마트커머스", "이커머스솔루션", "테크스타트업", "패션브랜드코리아"
];

// 한국 지역
const koreanRegions = [
  { city: "서울", districts: ["강남구", "서초구", "송파구", "강동구", "마포구", "용산구", "종로구", "중구", "영등포구", "강서구"] },
  { city: "경기", districts: ["성남시", "수원시", "용인시", "고양시", "화성시", "안양시", "부천시", "평택시", "안산시", "남양주시"] },
  { city: "인천", districts: ["남동구", "부평구", "계양구", "연수구", "중구", "동구", "서구", "미추홀구"] },
  { city: "부산", districts: ["해운대구", "수영구", "남구", "동래구", "부산진구", "사상구", "북구", "사하구"] },
  { city: "대구", districts: ["수성구", "달서구", "북구", "동구", "중구", "남구", "서구"] },
  { city: "대전", districts: ["유성구", "서구", "동구", "중구", "대덕구"] },
  { city: "광주", districts: ["북구", "광산구", "서구", "남구", "동구"] }
];

const koreanStreets = [
  "테헤란로", "강남대로", "올림픽대로", "양재대로", "도산대로",
  "삼성로", "봉은사로", "역삼로", "선릉로", "논현로",
  "중앙로", "해운대로", "광복로", "부산대로", "수원로"
];

// 상품 카테고리
const productCategories = [
  { name: "생활용품", products: ["주방세제 3개입", "섬유유연제 대용량", "화장지 30롤", "물티슈 10팩", "샴푸 세트"] },
  { name: "식품", products: ["유기농 현미 5kg", "순수 올리브유 1L", "프리미엄 견과류 세트", "국산 사과 5kg", "제주 감귤 10kg"] },
  { name: "뷰티", products: ["스킨케어 3종 세트", "선크림 SPF50+", "마스크팩 30매", "립스틱 세트", "클렌징폼"] },
  { name: "패션", products: ["캐시미어 니트", "겨울 패딩 점퍼", "정장 셔츠", "청바지 슬림핏", "스니커즈 운동화"] },
  { name: "전자기기", products: ["블루투스 이어폰", "무선 충전기", "보조배터리 20000mAh", "USB-C 케이블 3팩", "스마트워치 밴드"] },
  { name: "홈인테리어", products: ["LED 무드등", "메모리폼 베개", "극세사 이불", "수건 세트", "방향제"] },
  { name: "건강식품", products: ["멀티비타민 60정", "오메가3 90캡슐", "콜라겐 파우더", "프로바이오틱스", "홍삼 스틱 30포"] },
  { name: "유아용품", products: ["아기 물티슈", "기저귀 대용량", "분유 800g", "아기 로션", "이유식 세트"] }
];

const orderSources = ["스마트스토어", "쿠팡", "11번가", "G마켓", "위메프", "티몬", "자사몰", "카카오커머스"];
const couriers = ["CJ대한통운", "한진택배", "롯데택배", "우체국택배", "로젠택배"];
const deliveryMessages = ["부재시 문앞에 놓아주세요", "경비실에 맡겨주세요", "벨 누르지 말고 노크해주세요", "배송 전 연락 부탁드립니다", "직접 받겠습니다", "택배함에 넣어주세요", ""];
const ticketCategories = ["배송문의", "교환/반품", "결제문제", "상품문의", "회원정보", "기타"];
const ticketSubjects = ["배송이 언제 되나요?", "주문 취소하고 싶어요", "교환 신청합니다", "환불 처리 문의드립니다", "상품이 파손되어 왔어요", "색상이 다른 상품이 왔습니다", "수량이 부족해요", "주문번호 조회가 안됩니다", "결제가 두 번 됐어요", "영수증 발급 부탁드립니다"];

// 유틸리티 함수
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startDays: number, endDays: number): Date {
  const now = new Date();
  const start = new Date(now.getTime() - startDays * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() - endDays * 24 * 60 * 60 * 1000);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateKoreanName(): string {
  return randomElement(koreanLastNames) + randomElement(koreanFirstNames);
}

function generatePhoneNumber(): string {
  return `010-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`;
}

function generateEmail(idx: number): string {
  const domains = ["naver.com", "gmail.com", "kakao.com", "daum.net", "hanmail.net"];
  return `user${idx}@${randomElement(domains)}`;
}

function generateAddress(): { zipCode: string; addr: string } {
  const region = randomElement(koreanRegions);
  const street = randomElement(koreanStreets);
  const zipCode = String(randomInt(10000, 99999));
  const addr = `${region.city} ${randomElement(region.districts)} ${street} ${randomInt(1, 500)} ${randomInt(1, 30)}층 ${randomInt(101, 2500)}호`;
  return { zipCode, addr };
}

function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}-${String(randomInt(1, 999999)).padStart(6, "0")}`;
}

function generateTrackingNumber(): string {
  return String(randomInt(100000000000, 999999999999));
}

// ============================================================================
// 메인 시드 함수
// ============================================================================

async function main() {
  console.log("🗑️  기존 데이터 삭제 중...");
  
  await prisma.couponUsage.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.gift.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.partnerPerformance.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.review.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.part.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log("🌱 한국식 더미 데이터 생성 시작...\n");

  // 1. 사용자 생성 - 10명
  console.log("👤 사용자 생성 중...");
  const users = [];
  const userRoles = ["ADMIN", "MANAGER", "USER", "USER", "USER", "USER", "USER", "USER", "USER", "USER"];
  
  for (let i = 0; i < 10; i++) {
    users.push(await prisma.user.create({
      data: {
        email: `staff${i + 1}@company.co.kr`,
        name: generateKoreanName(),
        password: "hashed_password_123",
        role: userRoles[i],
      },
    }));
  }
  console.log(`   ✓ ${users.length}명 생성 완료`);

  // 2. 고객 생성 - 100명
  console.log("👥 고객 생성 중...");
  const customers = [];
  const segments = ["VIP", "VIP", "일반", "일반", "일반", "일반", "일반", "일반", "신규", "휴면"];
  
  for (let i = 0; i < 100; i++) {
    const name = generateKoreanName();
    customers.push(await prisma.customer.create({
      data: {
        name,
        email: generateEmail(i + 1),
        phone: generatePhoneNumber(),
        company: Math.random() > 0.7 ? randomElement(koreanCompanies) : null,
        status: Math.random() > 0.1 ? "ACTIVE" : "INACTIVE",
        segment: randomElement(segments),
      },
    }));
  }
  console.log(`   ✓ ${customers.length}명 생성 완료`);

  // 3. 상품 생성 - 100개
  console.log("📦 상품 생성 중...");
  const products = [];
  
  for (let i = 0; i < 100; i++) {
    const category = randomElement(productCategories);
    const productName = randomElement(category.products);
    products.push(await prisma.product.create({
      data: {
        name: `${productName}`,
        description: `${category.name} 카테고리의 인기 상품입니다.`,
        price: randomInt(5000, 200000),
        sku: `SKU${String(i + 1).padStart(6, "0")}`,
        stock: randomInt(0, 500),
        category: category.name,
      },
    }));
  }
  console.log(`   ✓ ${products.length}개 생성 완료`);

  // 4. 주문 생성 - 100건 (핵심!)
  console.log("🛒 주문 생성 중...");
  const orders = [];
  const orderStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED"];
  const statusWeights = [10, 15, 20, 30, 20, 5];
  
  function weightedStatus(): string {
    const total = statusWeights.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    for (let i = 0; i < orderStatuses.length; i++) {
      random -= statusWeights[i];
      if (random <= 0) return orderStatuses[i];
    }
    return "PENDING";
  }
  
  for (let i = 0; i < 100; i++) {
    const customer = randomElement(customers);
    const address = generateAddress();
    const orderDate = randomDate(90, 0);
    const status = weightedStatus();
    
    const selectedProducts: Product[] = [];
    const productCount = randomInt(1, 5);
    const usedIds = new Set();
    
    for (let j = 0; j < productCount; j++) {
      let product;
      do { product = randomElement(products); } while (usedIds.has(product.id));
      usedIds.add(product.id);
      selectedProducts.push(product);
    }
    
    let orderAmount = 0;
    const orderItems: { productId: string; quantity: number; price: number }[] = [];
    
    for (const product of selectedProducts) {
      const quantity = randomInt(1, 3);
      const price = Number(product.price);
      orderAmount += price * quantity;
      orderItems.push({ productId: product.id, quantity, price });
    }
    
    const shippingFee = orderAmount >= 50000 ? 0 : 3000;
    const totalAmount = orderAmount + shippingFee;
    const hasTracking = ["SHIPPED", "DELIVERED", "COMPLETED"].includes(status);
    
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        orderDate,
        orderAmount,
        totalAmount,
        shippingFee,
        status,
        ordererName: customer.name,
        contactPhone: customer.phone || generatePhoneNumber(),
        recipientZipCode: address.zipCode,
        recipientAddr: address.addr,
        orderNumber: generateOrderNumber(),
        productInfo: selectedProducts.map(p => p.name).join(", "),
        deliveryMsg: randomElement(deliveryMessages) || null,
        orderSource: randomElement(orderSources),
        courier: hasTracking ? randomElement(couriers) : null,
        trackingNumber: hasTracking ? generateTrackingNumber() : null,
        items: { create: orderItems },
      },
    });
    orders.push(order);
  }
  console.log(`   ✓ ${orders.length}건 생성 완료`);

  // 5. 리드 생성 - 100건
  console.log("💼 영업 리드 생성 중...");
  const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
  
  for (let i = 0; i < 100; i++) {
    const customer = randomElement(customers);
    await prisma.lead.create({
      data: {
        customerId: customer.id,
        title: `${customer.company || customer.name} - ${randomElement(productCategories).name} 거래 건`,
        description: `${customer.name} 고객님의 대량 구매 상담 건입니다.`,
        value: randomInt(100000, 10000000),
        status: randomElement(leadStatuses),
        assignedToId: randomElement(users).id,
        createdAt: randomDate(60, 0),
      },
    });
  }
  console.log(`   ✓ 100건 생성 완료`);

  // 6. 문의 티켓 생성 - 100건 (주문 연계)
  console.log("📩 고객 문의 생성 중...");
  const ticketStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  
  for (let i = 0; i < 100; i++) {
    const order = randomElement(orders);
    const customer = customers.find(c => c.id === order.customerId)!;
    const status = randomElement(ticketStatuses);
    
    const ticket = await prisma.ticket.create({
      data: {
        subject: randomElement(ticketSubjects),
        description: `주문번호: ${order.orderNumber}\n상품: ${order.productInfo}\n\n문의 내용입니다.`,
        status,
        priority: randomElement(priorities),
        category: randomElement(ticketCategories),
        customerId: customer.id,
        assignedToId: randomElement(users).id,
        createdAt: new Date(order.orderDate.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000),
        closedAt: status === "CLOSED" ? new Date() : null,
      },
    });

    if (Math.random() > 0.5) {
      await prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          content: "안녕하세요, 문의 주셔서 감사합니다. 확인 후 답변 드리겠습니다.",
          isInternal: false,
        },
      });
    }
  }
  console.log(`   ✓ 100건 생성 완료`);

  // 7. 파트너 생성 - 50명
  console.log("🤝 파트너 생성 중...");
  const partners = [];
  const partnerTypes = ["RESELLER", "DISTRIBUTOR", "REFERRAL"];
  
  for (let i = 0; i < 50; i++) {
    const partner = await prisma.partner.create({
      data: {
        name: generateKoreanName(),
        email: `partner${i + 1}@partner.co.kr`,
        phone: generatePhoneNumber(),
        company: randomElement(koreanCompanies),
        status: Math.random() > 0.2 ? "ACTIVE" : "INACTIVE",
        type: randomElement(partnerTypes),
      },
    });
    partners.push(partner);
    
    for (let m = 0; m < 6; m++) {
      const date = new Date();
      date.setMonth(date.getMonth() - m);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      await prisma.partnerPerformance.create({
        data: {
          partnerId: partner.id,
          period,
          salesAmount: randomInt(1000000, 50000000),
          commission: randomInt(100000, 5000000),
          leadsCount: randomInt(5, 50),
          dealsClosed: randomInt(1, 20),
        },
      });
    }
  }
  console.log(`   ✓ ${partners.length}명 생성 완료`);

  // 8. 재고 품목 생성 - 24개 (공기청정기 부품 및 포장재)
  console.log("📋 재고 품목 생성 중...");
  
  // 공기청정기 부품 및 포장재 목록
  const inventoryItems = [
    { name: "완제품 재고", category: "완제품", supplier: "자체생산", unitPrice: 150000, minStock: 10, location: "완제품창고-A-1-1" },
    { name: "이너", category: "내부부품", supplier: "(주)플라스틱산업", unitPrice: 5000, minStock: 50, location: "부품창고-B-2-1" },
    { name: "BOTTOM", category: "프레임", supplier: "(주)금속가공", unitPrice: 8000, minStock: 50, location: "부품창고-B-2-2" },
    { name: "타공판", category: "프레임", supplier: "(주)금속가공", unitPrice: 3000, minStock: 50, location: "부품창고-B-2-3" },
    { name: "UPER", category: "프레임", supplier: "(주)금속가공", unitPrice: 7000, minStock: 50, location: "부품창고-B-2-4" },
    { name: "TOP", category: "프레임", supplier: "(주)금속가공", unitPrice: 6000, minStock: 50, location: "부품창고-B-2-5" },
    { name: "프라즈마", category: "전자부품", supplier: "전자부품상사", unitPrice: 15000, minStock: 30, location: "부품창고-C-1-1" },
    { name: "배터리", category: "전자부품", supplier: "배터리코리아", unitPrice: 12000, minStock: 30, location: "부품창고-C-1-2" },
    { name: "팬", category: "전자부품", supplier: "모터산업", unitPrice: 20000, minStock: 30, location: "부품창고-C-1-3" },
    { name: "PCB", category: "전자부품", supplier: "PCB제작소", unitPrice: 25000, minStock: 30, location: "부품창고-C-1-4" },
    { name: "서브PCB", category: "전자부품", supplier: "PCB제작소", unitPrice: 8000, minStock: 50, location: "부품창고-C-1-5" },
    { name: "하네스", category: "전선부품", supplier: "전선공업", unitPrice: 3000, minStock: 100, location: "부품창고-C-2-1" },
    { name: "케이블(W)", category: "전선부품", supplier: "전선공업", unitPrice: 2000, minStock: 100, location: "부품창고-C-2-2" },
    { name: "고무링", category: "소모품", supplier: "고무산업", unitPrice: 500, minStock: 200, location: "부품창고-D-1-1" },
    { name: "사용설명서", category: "인쇄물", supplier: "인쇄사", unitPrice: 1000, minStock: 100, location: "포장창고-E-1-1" },
    { name: "주의사항 스티커", category: "라벨", supplier: "라벨인쇄", unitPrice: 300, minStock: 200, location: "포장창고-E-1-2" },
    { name: "바닥 스티커", category: "라벨", supplier: "라벨인쇄", unitPrice: 500, minStock: 200, location: "포장창고-E-1-3" },
    { name: "실링투명 스티커", category: "라벨", supplier: "라벨인쇄", unitPrice: 400, minStock: 200, location: "포장창고-E-1-4" },
    { name: "청소솔", category: "악세서리", supplier: "악세서리제조", unitPrice: 2000, minStock: 100, location: "포장창고-E-2-1" },
    { name: "완제품 박스", category: "포장재", supplier: "박스제조", unitPrice: 3000, minStock: 100, location: "포장창고-F-1-1" },
    { name: "스펀지", category: "완충재", supplier: "완충재업체", unitPrice: 1500, minStock: 100, location: "포장창고-F-1-2" },
    { name: "볼트(소)", category: "체결부품", supplier: "나사못공업", unitPrice: 50, minStock: 500, location: "부품창고-D-2-1" },
    { name: "볼트(대)", category: "체결부품", supplier: "나사못공업", unitPrice: 100, minStock: 500, location: "부품창고-D-2-2" },
    { name: "쿠팡 대박스", category: "포장재", supplier: "박스제조", unitPrice: 5000, minStock: 50, location: "포장창고-F-2-1" },
  ];
  
  for (let i = 0; i < inventoryItems.length; i++) {
    const item = inventoryItems[i];
    await prisma.part.create({
      data: {
        partNumber: `PT-${String(i + 1).padStart(5, "0")}`,
        name: item.name,
        description: `${item.name} - ${item.category}`,
        quantity: randomInt(item.minStock, item.minStock * 3),
        minStock: item.minStock,
        location: item.location,
        supplier: item.supplier,
        unitPrice: item.unitPrice,
        category: item.category,
      },
    });
  }
  console.log(`   ✓ ${inventoryItems.length}개 생성 완료`);

  // 9. 쿠폰 생성 - 20개
  console.log("🎫 쿠폰 생성 중...");
  const coupons = [];
  const couponNames = ["신규회원 할인", "VIP 감사 쿠폰", "첫 구매 할인", "재구매 감사", "생일 축하 쿠폰", "명절 특별 할인", "시즌 오프", "긴급 할인", "리뷰 작성 감사", "친구 추천 보상"];
  
  for (let i = 0; i < 20; i++) {
    const discountType = Math.random() > 0.5 ? "PERCENT" : "FIXED";
    const coupon = await prisma.coupon.create({
      data: {
        code: `COUPON${String(i + 1).padStart(3, "0")}`,
        name: couponNames[i % couponNames.length],
        description: `${couponNames[i % couponNames.length]} 쿠폰입니다.`,
        discountType,
        discountValue: discountType === "PERCENT" ? randomInt(5, 30) : randomInt(1000, 10000),
        minOrderAmount: randomInt(10000, 50000),
        maxDiscountAmount: discountType === "PERCENT" ? randomInt(5000, 20000) : null,
        validFrom: randomDate(30, 0),
        validUntil: new Date(Date.now() + randomInt(30, 90) * 24 * 60 * 60 * 1000),
        usageLimit: randomInt(100, 1000),
        usagePerCustomer: randomInt(1, 3),
        targetSegment: randomElement(["VIP", "일반", "신규", null]),
        isActive: Math.random() > 0.2,
      },
    });
    coupons.push(coupon);
  }
  console.log(`   ✓ ${coupons.length}개 생성 완료`);

  // 10. 캠페인 생성 - 20개
  console.log("📢 캠페인 생성 중...");
  const campaignNames = ["신규고객 웰컴 캠페인", "VIP 감사 캠페인", "휴면고객 재활성화", "시즌 프로모션", "명절 마케팅", "리뷰 이벤트", "생일 축하 캠페인", "대량구매 할인전", "여름 특별 세일", "겨울 감사 이벤트"];
  
  for (let i = 0; i < 20; i++) {
    await prisma.campaign.create({
      data: {
        name: campaignNames[i % campaignNames.length],
        description: `${campaignNames[i % campaignNames.length]} - 마케팅 캠페인입니다.`,
        type: randomElement(["COUPON", "EMAIL", "SMS", "PUSH"]),
        status: randomElement(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"]),
        targetSegment: randomElement(["VIP", "일반", "신규", "휴면"]),
        couponId: Math.random() > 0.5 ? randomElement(coupons).id : null,
        budget: randomInt(100000, 5000000),
        spent: randomInt(0, 1000000),
        startDate: randomDate(60, 0),
        endDate: new Date(Date.now() + randomInt(30, 90) * 24 * 60 * 60 * 1000),
        sentCount: randomInt(100, 10000),
        openCount: randomInt(50, 5000),
        convertCount: randomInt(10, 500),
      },
    });
  }
  console.log(`   ✓ 20개 생성 완료`);

  // 11. 리뷰 생성 - 100개
  console.log("⭐ 리뷰 생성 중...");
  const reviewContents = ["배송이 빨라서 좋아요!", "품질이 기대 이상입니다.", "가격 대비 만족스러워요.", "포장이 꼼꼼하게 왔어요.", "재구매 의사 있습니다.", "색상이 사진과 같아요.", "사이즈가 딱 맞네요.", "선물용으로 구매했는데 반응이 좋아요.", "배송은 빠른데 포장이 아쉬워요.", "괜찮은 편이에요.", "생각보다 작아요.", "조금 비싼 것 같아요."];
  
  for (let i = 0; i < 100; i++) {
    const rating = randomInt(1, 5);
    await prisma.review.create({
      data: {
        source: randomElement(orderSources),
        author: generateKoreanName(),
        content: randomElement(reviewContents),
        rating,
        date: randomDate(90, 0),
        sentiment: rating >= 4 ? "Positive" : rating === 3 ? "Neutral" : "Negative",
        topics: randomElement(["배송", "품질", "가격", "포장", "디자인"]),
      },
    });
  }
  console.log(`   ✓ 100개 생성 완료`);

  // 12. 지식베이스 생성 - 50개
  console.log("📚 지식베이스 문서 생성 중...");
  const articleCategories = ["배송안내", "교환/반품", "결제", "회원정보", "상품정보"];
  const articleTitles = ["배송 조회는 어떻게 하나요?", "교환/반품 절차 안내", "결제 수단 변경 방법", "회원 탈퇴 절차", "포인트 적립 안내", "VIP 등급 혜택", "선물 포장 서비스", "해외 배송 안내", "대량 구매 문의", "영수증 재발급"];
  
  for (let i = 0; i < 50; i++) {
    await prisma.knowledgeArticle.create({
      data: {
        title: articleTitles[i % articleTitles.length],
        content: `이 문서는 ${articleTitles[i % articleTitles.length]}에 대한 상세 안내입니다.\n\n자세한 내용은 고객센터로 문의해주세요.`,
        category: randomElement(articleCategories),
        tags: randomElement(["FAQ", "자주묻는질문", "안내", "정책"]),
        views: randomInt(0, 1000),
        isPublished: Math.random() > 0.1,
      },
    });
  }
  console.log(`   ✓ 50개 생성 완료`);

  // 13. 고객 메모 생성
  console.log("📝 고객 메모 생성 중...");
  const notes = ["VIP 고객 - 특별 관리 필요", "대량 구매 가능성 있음", "클레임 이력 있음 - 주의", "정기 구매 고객", "추천인 많은 우수 고객", "법인 구매 담당자"];
  for (let i = 0; i < 50; i++) {
    await prisma.customerNote.create({
      data: { customerId: randomElement(customers).id, content: randomElement(notes) },
    });
  }
  console.log(`   ✓ 50개 생성 완료`);

  // 14. 선물 이력 생성
  console.log("🎁 선물 이력 생성 중...");
  for (let i = 0; i < 30; i++) {
    await prisma.gift.create({
      data: {
        customerId: randomElement(customers).id,
        giftType: randomElement(["생일선물", "VIP감사", "명절선물", "이벤트당첨"]),
        giftDate: randomDate(180, 0),
        notes: randomElement(["택배발송", "매장수령", "이메일쿠폰"]),
      },
    });
  }
  console.log(`   ✓ 30건 생성 완료`);

  // 15. 자동화 규칙 생성
  console.log("⚙️ 자동화 규칙 생성 중...");
  const rules = [
    { name: "신규가입 환영 쿠폰", trigger: "SIGNUP", action: "SEND_COUPON" },
    { name: "첫 구매 감사 메시지", trigger: "FIRST_ORDER", action: "SEND_EMAIL" },
    { name: "휴면고객 재활성화", trigger: "NO_ORDER_DAYS", action: "SEND_COUPON" },
    { name: "생일 축하 쿠폰", trigger: "BIRTHDAY", action: "SEND_COUPON" },
    { name: "장바구니 이탈 알림", trigger: "CART_ABANDON", action: "SEND_EMAIL" },
  ];
  for (const rule of rules) {
    await prisma.automationRule.create({
      data: { name: rule.name, description: `${rule.name} 자동화 규칙`, triggerType: rule.trigger, actionType: rule.action, isActive: true, executedCount: randomInt(0, 500) },
    });
  }
  console.log(`   ✓ ${rules.length}개 생성 완료`);

  console.log("\n✅ 시드 데이터 생성 완료!");
  console.log("=".repeat(50));
  console.log("📊 생성된 데이터 요약:");
  console.log("   - 사용자: 10명");
  console.log("   - 고객: 100명");
  console.log("   - 상품: 100개");
  console.log("   - 주문: 100건 (핵심 기준 데이터)");
  console.log("   - 리드: 100건");
  console.log("   - 문의 티켓: 100건");
  console.log("   - 파트너: 50명");
  console.log("   - 재고 품목: 24개 (공기청정기 부품)");
  console.log("   - 쿠폰: 20개");
  console.log("   - 캠페인: 20개");
  console.log("   - 리뷰: 100개");
  console.log("   - 지식베이스: 50개");
  console.log("=".repeat(50));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
