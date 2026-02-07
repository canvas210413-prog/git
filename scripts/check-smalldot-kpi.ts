import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSmallDotKPI() {
  try {
    console.log('=== 스몰닷 KPI 설정 확인 ===\n');
    
    // 스몰닷의 모든 KPI 조회
    const smallDotKPIs = await prisma.baseproduct.findMany({
      where: {
        partnerCode: '스몰닷',
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`스몰닷 KPI 총 ${smallDotKPIs.length}개:\n`);
    
    smallDotKPIs.forEach((kpi, index) => {
      console.log(`${index + 1}. 상품명: "${kpi.name}"`);
      console.log(`   - ID: ${kpi.id}`);
      console.log(`   - 공급가: ${kpi.kpiSupplyPrice}원`);
      console.log(`   - 원가: ${kpi.kpiCostPrice}원`);
      console.log(`   - 수량: ${kpi.kpiUnitCount}개`);
      console.log(`   - 건수 포함: ${kpi.kpiCountEnabled ? '예' : '아니오'}`);
      console.log('');
    });
    
    // "쉴드4" 포함된 KPI 검색
    const shield4KPIs = smallDotKPIs.filter(kpi => kpi.name.includes('쉴드4'));
    
    if (shield4KPIs.length > 0) {
      console.log('\n=== "쉴드4" 포함된 KPI ===');
      shield4KPIs.forEach(kpi => {
        console.log(`- "${kpi.name}" (ID: ${kpi.id})`);
      });
    } else {
      console.log('\n스몰닷에 "쉴드4" 관련 KPI가 없습니다.');
    }
    
    // 모든 협력사의 "쉴드4" KPI 확인
    console.log('\n\n=== 전체 협력사 "쉴드4" KPI ===');
    const allShield4KPIs = await prisma.baseproduct.findMany({
      where: {
        name: {
          contains: '쉴드4'
        },
        isActive: true
      },
      orderBy: {
        partnerCode: 'asc'
      }
    });
    
    if (allShield4KPIs.length > 0) {
      allShield4KPIs.forEach(kpi => {
        console.log(`- [${kpi.partnerCode}] "${kpi.name}"`);
      });
    } else {
      console.log('전체 협력사에 "쉴드4" KPI가 없습니다.');
    }
    
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSmallDotKPI();
