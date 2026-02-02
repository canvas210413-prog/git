const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// 파트너사 데이터
const partners = [
  {
    name: "그로트",
    email: "contact@grott.co.kr",
    phone: "02-1234-5678",
    company: "그로트 주식회사",
    status: "ACTIVE",
    type: "DISTRIBUTOR",
  },
  {
    name: "스몰닷",
    email: "info@smalldot.kr",
    phone: "02-2345-6789",
    company: "스몰닷 주식회사",
    status: "ACTIVE",
    type: "RESELLER",
  },
  {
    name: "해피포즈",
    email: "hello@happypose.com",
    phone: "02-3456-7890",
    company: "해피포즈 주식회사",
    status: "ACTIVE",
    type: "RESELLER",
  },
];

// 성과 데이터 생성 함수 (최근 12개월)
function generatePerformances(partnerId, partnerName) {
  const performances = [];
  const now = new Date();
  
  // 기본 매출 범위 (파트너사별 차별화)
  const salesRange = {
    "그로트": { min: 50000000, max: 80000000 }, // 5천만~8천만
    "스몰닷": { min: 30000000, max: 50000000 }, // 3천만~5천만
    "해피포즈": { min: 20000000, max: 40000000 }, // 2천만~4천만
  };
  
  const range = salesRange[partnerName];
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    
    // 매출은 계절성 반영 (여름/겨울 높음)
    const month = date.getMonth() + 1;
    const seasonalFactor = [6, 7, 8, 12, 1, 2].includes(month) ? 1.3 : 1.0;
    
    const salesAmount = Math.floor(
      (range.min + Math.random() * (range.max - range.min)) * seasonalFactor
    );
    
    // 수수료: 매출의 10~15%
    const commissionRate = 0.1 + Math.random() * 0.05;
    const commission = Math.floor(salesAmount * commissionRate);
    
    // 리드 수: 30~80건
    const leadsCount = Math.floor(30 + Math.random() * 50);
    
    // 성사 건수: 리드의 40~60%
    const dealsClosed = Math.floor(leadsCount * (0.4 + Math.random() * 0.2));
    
    performances.push({
      partnerId,
      period,
      salesAmount,
      commission,
      leadsCount,
      dealsClosed,
    });
  }
  
  return performances;
}

// 기존 주문에 랜덤 협력사 할당
async function updateOrdersWithPartners() {
  const partnerNames = ["그로트", "본사", "스몰닷", "해피포즈"];
  
  const orders = await prisma.order.findMany();
  
  console.log(`${orders.length}개 주문에 협력사 할당 중...`);
  
  for (const order of orders) {
    const randomPartner = partnerNames[Math.floor(Math.random() * partnerNames.length)];
    await prisma.order.update({
      where: { id: order.id },
      data: { partner: randomPartner },
    });
  }
  
  console.log("✅ 주문 협력사 할당 완료");
}

async function main() {
  console.log("파트너 데이터 시딩 시작...");

  // 1. 기존 파트너 및 성과 데이터 삭제
  console.log("기존 파트너 데이터 삭제 중...");
  await prisma.partnerPerformance.deleteMany({});
  await prisma.partner.deleteMany({});

  // 2. 새 파트너 생성 및 성과 데이터 추가
  for (const partnerData of partners) {
    console.log(`${partnerData.name} 생성 중...`);
    
    const partner = await prisma.partner.create({
      data: partnerData,
    });

    // 성과 데이터 생성
    const performances = generatePerformances(partner.id, partnerData.name);
    
    for (const perf of performances) {
      await prisma.partnerPerformance.create({
        data: perf,
      });
    }
    
    console.log(`  ✅ ${partnerData.name}: ${performances.length}개월 성과 데이터 생성`);
  }

  // 3. 기존 주문에 협력사 할당
  await updateOrdersWithPartners();

  console.log("\n🎉 파트너 시딩 완료!");
  console.log("- 파트너: 그로트, 스몰닷, 해피포즈");
  console.log("- 성과 데이터: 최근 12개월");
  console.log("- 주문 협력사 할당 완료");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
