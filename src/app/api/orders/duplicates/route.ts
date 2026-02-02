import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 중복된 전화번호를 가진 주문들을 찾기 (전화번호 형식만)
    const duplicates = await prisma.$queryRaw<Array<{
      recipientPhone: string;
      count: bigint;
    }>>`
      SELECT recipientPhone, COUNT(*) as count
      FROM \`Order\`
      WHERE recipientPhone IS NOT NULL 
        AND recipientPhone != ''
        AND (recipientPhone LIKE '010-%' 
             OR recipientPhone LIKE '011-%'
             OR recipientPhone LIKE '016-%'
             OR recipientPhone LIKE '017-%'
             OR recipientPhone LIKE '018-%'
             OR recipientPhone LIKE '019-%'
             OR recipientPhone LIKE '02-%'
             OR recipientPhone LIKE '031-%'
             OR recipientPhone LIKE '032-%'
             OR recipientPhone LIKE '033-%'
             OR recipientPhone LIKE '041-%'
             OR recipientPhone LIKE '042-%'
             OR recipientPhone LIKE '043-%'
             OR recipientPhone LIKE '044-%'
             OR recipientPhone LIKE '051-%'
             OR recipientPhone LIKE '052-%'
             OR recipientPhone LIKE '053-%'
             OR recipientPhone LIKE '054-%'
             OR recipientPhone LIKE '055-%'
             OR recipientPhone LIKE '061-%'
             OR recipientPhone LIKE '062-%'
             OR recipientPhone LIKE '063-%'
             OR recipientPhone LIKE '064-%'
             OR recipientPhone LIKE '0502-%'
             OR recipientPhone LIKE '0503-%'
             OR recipientPhone LIKE '0504-%'
             OR recipientPhone LIKE '0505-%'
             OR recipientPhone LIKE '0506-%'
             OR recipientPhone LIKE '0507-%'
             OR recipientPhone LIKE '070-%')
      GROUP BY recipientPhone
      HAVING COUNT(*) > 1
      ORDER BY count DESC, recipientPhone ASC
    `;

    // 각 중복 그룹에 대한 주문 상세 정보 가져오기
    const duplicateGroups = await Promise.all(
      duplicates.map(async (dup) => {
        const orders = await prisma.order.findMany({
          where: { recipientPhone: dup.recipientPhone },
          orderBy: { orderDate: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            recipientName: true,
            recipientPhone: true,
            orderDate: true,
            productName: true,
            status: true,
            totalAmount: true,
            orderSource: true,
            trackingNumber: true,
            createdAt: true,
          }
        });

        return {
          recipientPhone: dup.recipientPhone,
          count: Number(dup.count),
          orders,
        };
      })
    );

    return NextResponse.json({
      success: true,
      duplicates: duplicateGroups,
      totalDuplicateGroups: duplicateGroups.length,
      totalDuplicateOrders: duplicateGroups.reduce((sum, g) => sum + g.count, 0),
    });
  } catch (error: any) {
    console.error('중복 주문 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { orderIds } = await request.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '삭제할 주문 ID가 없습니다.' },
        { status: 400 }
      );
    }

    // 주문 삭제
    const result = await prisma.order.deleteMany({
      where: {
        id: { in: orderIds }
      }
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error: any) {
    console.error('주문 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
