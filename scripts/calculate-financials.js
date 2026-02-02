const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log(" 주문 재무 정보 계산 시작...");

  const orders = await prisma.order.findMany({
    where: {
      unitPrice: {
        not: null,
      },
    },
  });

  console.log(` ${orders.length}개 주문 발견`);

  let updated = 0;
  for (const order of orders) {
    const unitPrice = Number(order.unitPrice || 0);
    const supplyPrice = Math.floor(unitPrice / 1.1);
    const vat = unitPrice - supplyPrice;
    const costPrice = Math.floor(unitPrice * 0.6);
    const commission = Math.floor(unitPrice * 0.1);
    const margin = supplyPrice - costPrice - commission;
    const marginRate = supplyPrice > 0 ? (margin / supplyPrice) * 100 : 0;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        supplyPrice,
        vat,
        costPrice,
        commission,
        margin,
        marginRate,
      },
    });

    updated++;
    if (updated % 10 === 0) {
      console.log(`  진행중... ${updated}/${orders.length}`);
    }
  }

  console.log(` ${updated}개 주문 재무 정보 업데이트 완료!`);
}

main()
  .catch((e) => {
    console.error(" 에러:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });