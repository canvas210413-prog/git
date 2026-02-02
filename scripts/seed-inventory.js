const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedInventoryParts() {
  console.log('🌱 미니 공기청정기 부품 데이터 생성 중...');

  const parts = [
    // 필터 관련
    {
      name: 'HEPA 필터 H13 등급',
      sku: 'FLT-HEPA-H13-001',
      description: '99.97% 미세먼지 제거, H13 등급 HEPA 필터',
      stock: 45,
      minStock: 20,
      price: 15000,
      location: 'A동-1층-선반1',
    },
    {
      name: '프리필터 (세척형)',
      sku: 'FLT-PRE-WASH-001',
      description: '큰 먼지 입자 제거용 세척 가능 프리필터',
      stock: 80,
      minStock: 30,
      price: 3000,
      location: 'A동-1층-선반1',
    },
    {
      name: '활성탄 탈취 필터',
      sku: 'FLT-CARBON-001',
      description: '냄새 제거용 활성탄 필터',
      stock: 12,
      minStock: 15,
      price: 8000,
      location: 'A동-1층-선반2',
    },

    // 팬/모터 관련
    {
      name: 'DC 브러시리스 모터 12V',
      sku: 'MTR-BLDC-12V-001',
      description: '저소음 DC 브러시리스 팬 모터, 12V 2A',
      stock: 25,
      minStock: 10,
      price: 45000,
      location: 'B동-2층-서랍A',
    },
    {
      name: '원심형 팬 블레이드',
      sku: 'FAN-BLADE-CF-001',
      description: '공기 순환용 원심형 팬 블레이드 (ABS)',
      stock: 30,
      minStock: 15,
      price: 12000,
      location: 'B동-2층-서랍B',
    },

    // 센서 관련
    {
      name: 'PM2.5 미세먼지 센서',
      sku: 'SNS-PM25-001',
      description: '레이저 방식 PM2.5 농도 측정 센서',
      stock: 8,
      minStock: 10,
      price: 25000,
      location: 'C동-3층-정밀부품함',
    },
    {
      name: '온습도 센서 (DHT22)',
      sku: 'SNS-TEMP-HUM-001',
      description: '디지털 온습도 센서 DHT22',
      stock: 50,
      minStock: 20,
      price: 5000,
      location: 'C동-3층-정밀부품함',
    },
    {
      name: '공기질 센서 (VOC)',
      sku: 'SNS-VOC-001',
      description: 'VOC (휘발성 유기화합물) 감지 센서',
      stock: 15,
      minStock: 10,
      price: 18000,
      location: 'C동-3층-정밀부품함',
    },

    // 전자부품
    {
      name: 'MCU 제어 보드 (STM32)',
      sku: 'PCB-MCU-STM32-001',
      description: 'STM32 기반 메인 제어 보드',
      stock: 20,
      minStock: 8,
      price: 35000,
      location: 'C동-3층-PCB보관함',
    },
    {
      name: '전원 어댑터 12V 3A',
      sku: 'PWR-ADAPTER-12V3A',
      description: 'AC 100-240V to DC 12V 3A 어댑터',
      stock: 60,
      minStock: 25,
      price: 8000,
      location: 'D동-1층-전원부품',
    },
    {
      name: 'LED 인디케이터 모듈',
      sku: 'LED-IND-RGB-001',
      description: 'RGB LED 공기질 상태 표시 모듈',
      stock: 40,
      minStock: 20,
      price: 6000,
      location: 'C동-3층-LED함',
    },

    // 케이스/하우징
    {
      name: '전면 케이스 (ABS 화이트)',
      sku: 'CASE-FRONT-WHT-001',
      description: 'ABS 재질 전면 케이스, 화이트',
      stock: 35,
      minStock: 15,
      price: 22000,
      location: 'E동-1층-대형부품',
    },
    {
      name: '후면 케이스 (ABS 화이트)',
      sku: 'CASE-BACK-WHT-001',
      description: 'ABS 재질 후면 케이스, 화이트',
      stock: 35,
      minStock: 15,
      price: 18000,
      location: 'E동-1층-대형부품',
    },
    {
      name: '필터 커버 (투명 PC)',
      sku: 'COVER-FILTER-CLR-001',
      description: '투명 PC 재질 필터 교체용 커버',
      stock: 50,
      minStock: 20,
      price: 5000,
      location: 'E동-1층-소형부품',
    },

    // 조립 부품
    {
      name: '고무 패드 (미끄럼 방지)',
      sku: 'PAD-RUBBER-001',
      description: '바닥 미끄럼 방지 고무 패드 (4개입)',
      stock: 200,
      minStock: 50,
      price: 1000,
      location: 'F동-부속품',
    },
    {
      name: '나사 세트 (M3x8mm)',
      sku: 'SCR-M3X8-SET',
      description: 'M3x8mm 십자 나사 100개입',
      stock: 500,
      minStock: 200,
      price: 5000,
      location: 'F동-나사류',
    },
    {
      name: '케이블 타이 (150mm)',
      sku: 'CBL-TIE-150MM',
      description: '배선 정리용 케이블 타이 100개입',
      stock: 300,
      minStock: 100,
      price: 3000,
      location: 'F동-부속품',
    },

    // 소모품
    {
      name: '사용 설명서 (한국어)',
      sku: 'DOC-MANUAL-KR',
      description: '제품 사용 설명서, 한국어판',
      stock: 150,
      minStock: 50,
      price: 500,
      location: 'G동-포장재',
    },
    {
      name: '제품 박스 (소형)',
      sku: 'BOX-PRODUCT-SM',
      description: '미니 공기청정기용 제품 박스',
      stock: 100,
      minStock: 30,
      price: 2000,
      location: 'G동-포장재',
    },
    {
      name: '완충재 (에어캡)',
      sku: 'PKG-BUBBLE-WRAP',
      description: '제품 보호용 에어캡 완충재',
      stock: 80,
      minStock: 30,
      price: 1500,
      location: 'G동-포장재',
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const part of parts) {
    try {
      // SKU 중복 체크
      const existing = await prisma.part.findUnique({
        where: { sku: part.sku },
      });

      if (existing) {
        console.log(`⏭️  이미 존재: ${part.name} (${part.sku})`);
        skippedCount++;
        continue;
      }

      await prisma.part.create({
        data: part,
      });

      console.log(`✅ 생성됨: ${part.name} (재고: ${part.stock})`);
      createdCount++;
    } catch (error) {
      console.error(`❌ 생성 실패: ${part.name}`, error);
    }
  }

  console.log(`\n📦 부품 데이터 생성 완료!`);
  console.log(`   - 새로 생성: ${createdCount}개`);
  console.log(`   - 이미 존재: ${skippedCount}개`);
  console.log(`   - 전체: ${parts.length}개`);
}

async function main() {
  try {
    await seedInventoryParts();
  } catch (error) {
    console.error('❌ 시드 데이터 생성 중 오류:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
