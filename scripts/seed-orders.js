const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 한국 이름 샘플
const firstNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'];
const lastNames = ['민수', '서연', '지훈', '수진', '준호', '은지', '동현', '혜진', '성민', '유진', '태양', '미나', '승우', '소희', '재원'];

// 미니쉴드 상품 샘플
const shieldProducts = [
  { name: '쉴드 신생아 항알러지 초미세먼지꽃가루 비염 폐렴 방역용 무필터 공기청정기 아이방', price: 244400, shortName: '쉴드 공기청정기 (아이방)' },
  { name: '쉴드 신생아 항알러지 초미세먼지꽃가루 비염 폐렴 방역용 무필터 공기청정기 (화이트)', price: 198000, shortName: '쉴드 공기청정기 (화이트)' },
  { name: '케이프로젝트 쉴드 공기살균기 거치대', price: 9960, shortName: '쉴드 거치대' },
  { name: '쉴드 항알러지 꽃가루 비염 폐렴 방역용 무필터 공기살균기 아이방', price: 179000, shortName: '쉴드 공기살균기' },
  { name: '쉴드미니 신생아 항알러지 양극이온 무필터 공기청정기 비염 아이방 공기살균기', price: 99000, shortName: '쉴드미니 공기청정기' },
  { name: '쉴드미니 신생아 비염 폐렴 독감 항알러지 공기청정기 방역용 바이러스 무필터', price: 99000, shortName: '쉴드미니 방역용' },
];
const orderSources = ['자사몰', '스마트스토어', '그로트', '스몰닷', '해피포즈'];
const couriers = ['CJ대한통운', '한진택배', '롯데택배', '우체국택배', '로젠택배'];

// 서울 지역 샘플
const districts = ['강남구', '서초구', '송파구', '강동구', '마포구', '용산구', '성동구', '광진구', '동대문구', '중랑구'];
const dongs = ['역삼동', '삼성동', '개포동', '대치동', '논현동', '신사동', '청담동', '압구정동', '잠실동', '방배동'];

// 배송 메시지 샘플
const deliveryMessages = [
  '문 앞에 놓아주세요',
  '경비실에 맡겨주세요',
  '부재시 전화주세요',
  '택배함에 넣어주세요',
  '직접 받겠습니다',
  '배송 전 연락주세요',
  '조심히 다뤄주세요',
  '벨 누르지 말아주세요'
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomName() {
  return getRandomElement(firstNames) + getRandomElement(lastNames);
}

function getRandomPhone() {
  return `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function getRandomZipCode() {
  return `${Math.floor(10000 + Math.random() * 90000)}`;
}

function getRandomAddress() {
  const district = getRandomElement(districts);
  const dong = getRandomElement(dongs);
  const building = Math.floor(1 + Math.random() * 999);
  return `서울시 ${district} ${dong} ${building}번지`;
}

function getRandomDate() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 90); // 지난 90일 이내
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date;
}

function getRandomStatus() {
  const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const weights = [0.15, 0.25, 0.3, 0.25, 0.05]; // 가중치
  const random = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (random < sum) return statuses[i];
  }
  return 'PENDING';
}

async function main() {
  console.log('🌱 주문 더미 데이터 생성 시작...');

  // 고객 목록 가져오기
  const customers = await prisma.customer.findMany();
  
  if (customers.length === 0) {
    console.log('❌ 고객 데이터가 없습니다. 먼저 고객 데이터를 생성해주세요.');
    return;
  }

  console.log(`📦 ${customers.length}명의 고객 데이터 발견`);

  // 기존 주문 삭제
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  console.log('🗑️  기존 주문 데이터 삭제 완료');

  // 100개 주문 생성
  const orders = [];
  for (let i = 0; i < 100; i++) {
    const customer = getRandomElement(customers);
    const product = getRandomElement(shieldProducts);
    const quantity = Math.floor(1 + Math.random() * 3); // 1-3개
    const unitPrice = product.price;
    const orderAmount = unitPrice * quantity;
    const shippingFee = orderAmount >= 50000 ? 0 : 3000; // 5만원 이상 무료배송
    const totalAmount = orderAmount + shippingFee;
    const orderDate = getRandomDate();
    const status = getRandomStatus();
    
    // 배송 관련 정보 (배송중/배송완료인 경우만)
    const hasTracking = ['SHIPPED', 'DELIVERED'].includes(status);
    const courier = hasTracking ? getRandomElement(couriers) : null;
    const trackingNumber = hasTracking ? `${Math.floor(100000000000 + Math.random() * 900000000000)}` : null;

    const order = {
      customerId: customer.id,
      orderDate,
      orderAmount,
      totalAmount,
      shippingFee,
      status,
      
      ordererName: customer.name,
      contactPhone: customer.phone || getRandomPhone(),
      recipientName: Math.random() > 0.3 ? customer.name : getRandomName(), // 70%는 본인, 30%는 다른 사람
      recipientPhone: getRandomPhone(),
      recipientZipCode: getRandomZipCode(),
      recipientAddr: getRandomAddress(),
      
      orderNumber: `ORD-2024${String(10001 + i).padStart(5, '0')}`,
      productInfo: `${product.shortName} / ${quantity}개`,
      deliveryMsg: Math.random() > 0.5 ? getRandomElement(deliveryMessages) : null,
      orderSource: getRandomElement(orderSources),
      
      courier,
      trackingNumber,
    };

    orders.push(order);
  }

  // 일괄 생성
  await prisma.order.createMany({
    data: orders,
  });

  console.log(`✅ 주문 ${orders.length}개 생성 완료!`);

  // 통계 출력
  const stats = await prisma.order.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('\n📊 주문 상태별 통계:');
  stats.forEach(stat => {
    const labels = {
      PENDING: '대기',
      PROCESSING: '처리중',
      SHIPPED: '배송중',
      DELIVERED: '배송완료',
      CANCELLED: '취소'
    };
    console.log(`   ${labels[stat.status]}: ${stat._count}건`);
  });

  console.log('\n🎉 시드 데이터 생성 완료!');
}

main()
  .catch((e) => {
    console.error('❌ 에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
