import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding partners...');

  const partners = [
    {
      name: 'Tech Solutions Inc.',
      email: 'contact@techsolutions.com',
      phone: '02-1234-5678',
      company: 'Tech Solutions',
      status: 'ACTIVE',
      type: 'RESELLER',
    },
    {
      name: 'Global Systems Ltd.',
      email: 'info@globalsystems.com',
      phone: '02-9876-5432',
      company: 'Global Systems',
      status: 'ACTIVE',
      type: 'DISTRIBUTOR',
    },
    {
      name: 'Smart Innovations',
      email: 'sales@smartinnovations.kr',
      phone: '010-1111-2222',
      company: 'Smart Innovations',
      status: 'PENDING',
      type: 'REFERRAL',
    },
    {
      name: 'Future Networks',
      email: 'support@futurenet.com',
      phone: '031-555-7777',
      company: 'Future Networks',
      status: 'ACTIVE',
      type: 'RESELLER',
    },
    {
      name: 'Cloud Nine Corp',
      email: 'biz@cloudnine.com',
      phone: '02-333-4444',
      company: 'Cloud Nine',
      status: 'INACTIVE',
      type: 'RESELLER',
    },
  ];

  for (const p of partners) {
    const partner = await prisma.partner.upsert({
      where: { email: p.email },
      update: {},
      create: p,
    });

    console.log(`Created partner: ${partner.name}`);

    // Create performance data for the last 6 months
    const months = ['2023-05', '2023-06', '2023-07', '2023-08', '2023-09', '2023-10'];
    
    for (const period of months) {
      const salesAmount = Math.floor(Math.random() * 10000000) + 1000000;
      const commission = Math.floor(salesAmount * 0.1);
      const leadsCount = Math.floor(Math.random() * 20) + 1;
      const dealsClosed = Math.floor(Math.random() * 10) + 1;

      await prisma.partnerPerformance.upsert({
        where: {
          partnerId_period: {
            partnerId: partner.id,
            period: period,
          }
        },
        update: {},
        create: {
          partnerId: partner.id,
          period: period,
          salesAmount,
          commission,
          leadsCount,
          dealsClosed,
        },
      });
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
