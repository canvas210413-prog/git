// 2026년 2월 3일 본사 주문의 KPI 매핑 상태 확인
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. 모든 KPI 설정 조회 (API와 동일한 방식)
  const allKpiSettings = await prisma.baseproduct.findMany({
    where: { isActive: true },
    select: {
      name: true,
      partnerCode: true,
      kpiUnitCount: true,
      kpiCountEnabled: true,
    }
  });
  
  // partnerCode가 null 또는 "본사"인 것만 필터
  const kpiSettings = allKpiSettings.filter(k => !k.partnerCode || k.partnerCode === "본사");
  
  console.log('\n=== 본사 KPI 설정 ===');
  kpiSettings.forEach(kpi => {
    console.log(`- ${kpi.name} | partnerCode: ${kpi.partnerCode} | kpiUnitCount: ${kpi.kpiUnitCount} | kpiCountEnabled: ${kpi.kpiCountEnabled}`);
  });

  // 2. 2026년 2월 3일 본사 주문 조회
  const startDate = new Date('2026-02-03T00:00:00');
  const endDate = new Date('2026-02-03T23:59:59');
  
  const orders = await prisma.order.findMany({
    where: {
      orderDate: {
        gte: startDate,
        lte: endDate
      },
      OR: [
        { orderSource: "본사" },
        { orderSource: null },
        { orderSource: "" }
      ]
    },
    select: {
      id: true,
      productInfo: true,
      orderSource: true,
      quantity: true,
    }
  });

  console.log(`\n=== 2026년 2월 3일 본사 주문 (${orders.length}건) ===`);
  
  // KPI 설정을 상품명 길이가 긴 순서대로 정렬 (더 구체적인 상품명 우선 매칭)
  const sortedKpiSettings = [...kpiSettings].sort((a, b) => b.name.length - a.name.length);
  
  let totalCountForKPI = 0;
  
  orders.forEach((order, idx) => {
    const productInfo = order.productInfo || '';
    const qty = order.quantity || 1;
    
    // 매칭되는 KPI 찾기 (길이순 정렬된 리스트에서 먼저 매칭)
    let matchedKPI = null;
    for (const kpi of sortedKpiSettings) {
      if (productInfo.includes(kpi.name)) {
        matchedKPI = kpi;
        break;
      }
    }
    
    let countContribution = 0;
    if (matchedKPI) {
      if (matchedKPI.kpiCountEnabled) {
        countContribution = matchedKPI.kpiUnitCount * qty;
      } else {
        countContribution = 1; // kpiCountEnabled가 false여도 1건
      }
    } else {
      countContribution = 1; // 매칭 안 되면 기본 1건
    }
    
    totalCountForKPI += countContribution;
    
    console.log(`${idx + 1}. productInfo: "${productInfo.substring(0, 50)}..." | orderSource: ${order.orderSource || 'null'} | qty: ${qty}`);
    console.log(`   -> 매칭된 KPI: ${matchedKPI ? matchedKPI.name : '없음'} | countContribution: ${countContribution}`);
  });
  
  console.log(`\n=== 결과 ===`);
  console.log(`총 주문 건수: ${orders.length}`);
  console.log(`계산된 countForKPI: ${totalCountForKPI}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
