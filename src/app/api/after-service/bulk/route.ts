import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";

/**
 * AS 일괄 등록
 * POST /api/after-service/bulk
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "등록할 데이터가 없습니다" },
        { status: 400 }
      );
    }

    let successCount = 0;
    const errors: string[] = [];

    // AS 번호 생성을 위한 오늘 날짜 prefix와 시작 카운트 조회
    const now = new Date();
    const kstOffset = 9 * 60;
    const localTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
    const kstTime = new Date(localTime + (kstOffset * 60 * 1000));
    
    const year = kstTime.getFullYear();
    const month = String(kstTime.getMonth() + 1).padStart(2, "0");
    const day = String(kstTime.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;
    
    const todayPrefix = `AS-${dateStr}-`;
    let currentCount = await prisma.afterservice.count({
      where: {
        asNumber: {
          startsWith: todayPrefix,
        },
      },
    });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowNum = i + 2; // 엑셀 행 번호 (헤더 제외)
      
      try {
        const {
          companyName,
          customerName,
          customerPhone,
          customerAddress,
          pickupRequestDate,
          processDate,
          shipDate,
          pickupCompleteDate,
          purchaseDate,
          productName,
          description,
          repairContent,
          trackingNumber,
          status,
          receivedAt,
        } = item;

        // 고객명은 필수
        if (!customerName) {
          errors.push(`[행 ${rowNum}] 고객명 누락 - 데이터: ${JSON.stringify(item).slice(0, 100)}`);
          continue;
        }

        // 전화번호로 기존 고객 찾기 또는 생성
        const phoneToUse = customerPhone || "미등록";
        let customer = await prisma.customer.findFirst({
          where: { phone: phoneToUse },
        });

        if (!customer) {
          // 신규 고객 생성
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          customer = await prisma.customer.create({
            data: {
              name: customerName,
              phone: phoneToUse,
              email: `${randomSuffix}@temp.com`,
              address: customerAddress || "",
              status: "ACTIVE",
            },
          });
        }

        // AS 번호 생성 (중복 체크하며 생성)
        let asNumber = "";
        let isUnique = false;
        let attemptCount = 0;
        
        while (!isUnique && attemptCount < 100) {
          currentCount++;
          asNumber = `AS-${dateStr}-${String(currentCount).padStart(3, "0")}`;
          
          // 해당 번호가 이미 존재하는지 확인
          const existing = await prisma.afterservice.findUnique({
            where: { asNumber },
          });
          
          if (!existing) {
            isUnique = true;
          }
          attemptCount++;
        }
        
        if (!isUnique) {
          // 100번 시도했는데도 고유 번호를 못 찾았으면 타임스탬프 추가
          asNumber = `AS-${dateStr}-${Date.now().toString().slice(-6)}`;
        }

        // 날짜 파싱 헬퍼 함수 (Invalid Date 방지)
        const parseValidDate = (dateValue: any): Date | null => {
          if (!dateValue) return null;
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? null : date;
        };

        // AS 생성
        await prisma.afterservice.create({
          data: {
            id: createId(),
            asNumber,
            ticketNumber: asNumber,
            customerId: customer.id,
            customerName,
            customerPhone: phoneToUse,
            customerAddress: customerAddress || "",
            companyName: companyName || "",
            type: "REPAIR",
            issueType: "OTHER",
            status: status || "RECEIVED",
            priority: "NORMAL",
            productName: productName || "",
            description: description || "",
            repairContent: repairContent || "",
            trackingNumber: trackingNumber || "",
            pickupRequestDate: parseValidDate(pickupRequestDate),
            processDate: parseValidDate(processDate),
            shipDate: parseValidDate(shipDate),
            pickupCompleteDate: parseValidDate(pickupCompleteDate),
            purchaseDate: parseValidDate(purchaseDate),
            receivedAt: parseValidDate(receivedAt) || new Date(),
            updatedAt: new Date(),
          },
        });

        successCount++;
      } catch (itemError) {
        const errorMsg = itemError instanceof Error ? itemError.message : String(itemError);
        console.error(`[행 ${rowNum}] AS 등록 오류:`, itemError);
        errors.push(
          `[행 ${rowNum}] 등록 실패\n` +
          `- 고객명: ${item.customerName || "정보없음"}\n` +
          `- 제품: ${item.productName || "정보없음"}\n` +
          `- 오류: ${errorMsg}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      count: successCount,
      successCount: successCount,
      total: items.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("AS 일괄 등록 오류:", error);
    return NextResponse.json(
      { error: "AS 일괄 등록 실패", details: String(error) },
      { status: 500 }
    );
  }
}
