const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// 24개 재고 항목 목록
const inventoryItems = [
  { name: "완제품 재고", partNumber: "FG-001", category: "완제품", minStock: 50, quantity: 100 },
  { name: "이너", partNumber: "PT-001", category: "부품", minStock: 100, quantity: 200 },
  { name: "BOTTOM", partNumber: "PT-002", category: "부품", minStock: 100, quantity: 180 },
  { name: "타공판", partNumber: "PT-003", category: "부품", minStock: 80, quantity: 150 },
  { name: "UPER", partNumber: "PT-004", category: "부품", minStock: 100, quantity: 160 },
  { name: "TOP", partNumber: "PT-005", category: "부품", minStock: 100, quantity: 140 },
  { name: "프라즈마", partNumber: "PT-006", category: "전자부품", minStock: 50, quantity: 80 },
  { name: "배터리", partNumber: "PT-007", category: "전자부품", minStock: 100, quantity: 120 },
  { name: "팬", partNumber: "PT-008", category: "전자부품", minStock: 100, quantity: 180 },
  { name: "PCB", partNumber: "PT-009", category: "전자부품", minStock: 50, quantity: 90 },
  { name: "서브PCB", partNumber: "PT-010", category: "전자부품", minStock: 50, quantity: 85 },
  { name: "하네스", partNumber: "PT-011", category: "전자부품", minStock: 100, quantity: 200 },
  { name: "케이블(W)", partNumber: "PT-012", category: "전자부품", minStock: 100, quantity: 150 },
  { name: "고무링", partNumber: "AC-001", category: "액세서리", minStock: 200, quantity: 500 },
  { name: "사용설명서", partNumber: "AC-002", category: "액세서리", minStock: 100, quantity: 300 },
  { name: "주의사항 스티커", partNumber: "AC-003", category: "스티커", minStock: 200, quantity: 450 },
  { name: "바닥 스티커", partNumber: "AC-004", category: "스티커", minStock: 200, quantity: 400 },
  { name: "실링투명 스티커", partNumber: "AC-005", category: "스티커", minStock: 200, quantity: 350 },
  { name: "청소솔", partNumber: "AC-006", category: "액세서리", minStock: 100, quantity: 250 },
  { name: "완제품 박스", partNumber: "PK-001", category: "포장재", minStock: 100, quantity: 180 },
  { name: "스펀지", partNumber: "PK-002", category: "포장재", minStock: 200, quantity: 400 },
  { name: "볼트(소)", partNumber: "HD-001", category: "하드웨어", minStock: 500, quantity: 1000 },
  { name: "볼트(대)", partNumber: "HD-002", category: "하드웨어", minStock: 500, quantity: 800 },
  { name: "쿠팡 대박스", partNumber: "PK-003", category: "포장재", minStock: 50, quantity: 80 },
];

async function main() {
  console.log("🔄 기존 부품 데이터 삭제...");
  await prisma.part.deleteMany({});

  console.log("📦 24개 재고 항목 시드 시작...");

  for (const item of inventoryItems) {
    await prisma.part.create({
      data: {
        name: item.name,
        partNumber: item.partNumber,
        category: item.category,
        minStock: item.minStock,
        quantity: item.quantity,
        unitPrice: 0,
        location: "창고-A",
      },
    });
    console.log(`  ✅ ${item.name} 생성 완료`);
  }

  console.log("\n🎉 24개 재고 항목 시드 완료!");
}

main()
  .catch((e) => {
    console.error("❌ 시드 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
