const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDates() {
  console.log('기존 AS 데이터 날짜 수정 시작...');
  
  // 모든 AS 데이터 조회
  const allAS = await prisma.afterService.findMany();
  console.log('총 AS 데이터:', allAS.length);
  
  let updated = 0;
  
  for (const as of allAS) {
    const updates = {};
    
    // serviceDate 체크 및 수정
    if (as.serviceDate) {
      const d = new Date(as.serviceDate);
      if (d.getFullYear() !== 2025) {
        d.setFullYear(2025);
        updates.serviceDate = d;
      }
    }
    
    // pickupRequestDate 체크 및 수정
    if (as.pickupRequestDate) {
      const d = new Date(as.pickupRequestDate);
      if (d.getFullYear() !== 2025) {
        d.setFullYear(2025);
        updates.pickupRequestDate = d;
      }
    }
    
    // processDate 체크 및 수정
    if (as.processDate) {
      const d = new Date(as.processDate);
      if (d.getFullYear() !== 2025) {
        d.setFullYear(2025);
        updates.processDate = d;
      }
    }
    
    // shipDate 체크 및 수정
    if (as.shipDate) {
      const d = new Date(as.shipDate);
      if (d.getFullYear() !== 2025) {
        d.setFullYear(2025);
        updates.shipDate = d;
      }
    }
    
    // pickupCompleteDate 체크 및 수정
    if (as.pickupCompleteDate) {
      const d = new Date(as.pickupCompleteDate);
      if (d.getFullYear() !== 2025) {
        d.setFullYear(2025);
        updates.pickupCompleteDate = d;
      }
    }
    
    // purchaseDate 체크 및 수정
    if (as.purchaseDate) {
      const d = new Date(as.purchaseDate);
      if (d.getFullYear() !== 2025) {
        d.setFullYear(2025);
        updates.purchaseDate = d;
      }
    }
    
    // 업데이트가 있으면 실행
    if (Object.keys(updates).length > 0) {
      await prisma.afterService.update({
        where: { id: as.id },
        data: updates
      });
      updated++;
    }
  }
  
  console.log('업데이트 완료:', updated, '건');
  await prisma.$disconnect();
}

fixDates().catch(console.error);
