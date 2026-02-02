import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * AS ?��?/CSV ?�로??API
 * POST /api/after-service/upload
 * 
 * 컬럼 매핑:
 * ?�짜, ?�체�? 고객�? ?�거?�청, 처리, 발송, ?�거?�료, 구매?�자, ?�품, ?�용, ?�리?�역, ?�송?�번?? ?�락�? 주소지
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    console.log("===== AS ?�로???�작 =====");
    console.log("받�? ?�이??개수:", data?.length);
    console.log("�?번째 ?�이??", JSON.stringify(data?.[0], null, 2));

    if (!Array.isArray(data) || data.length === 0) {
      console.log("?�로???�패: ?�이?��? ?�음");
      return NextResponse.json(
        { error: "?�로?�할 ?�이?��? ?�습?�다." },
        { status: 400 }
      );
    }

    const results = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // ?�켓 번호 ?�성 ?�수
    const generateTicketNumber = async () => {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      // ?�늘 ?�짜??마�?�??�켓 번호 조회
      const lastTicket = await prisma.afterservice.findFirst({
        where: {
          ticketNumber: {
            startsWith: `AS-${dateStr}`,
          },
        },
        orderBy: {
          ticketNumber: 'desc',
        },
      });

      let seq = 1;
      if (lastTicket) {
        const lastSeq = parseInt(lastTicket.ticketNumber.split('-')[2]);
        seq = lastSeq + 1;
      }

      return `AS-${dateStr}-${seq.toString().padStart(3, '0')}`;
    };

    // ?�양???�짜 ?�식 ?�싱 ?�수
    const parseDate = (dateStr: string | null | undefined): Date | null => {
      if (!dateStr || dateStr === '-' || dateStr === '' || dateStr.trim() === '') return null;
      
      const str = dateStr.trim();
      
      // "Invalid Date" 문자???�체가 ?�어??경우
      if (str === 'Invalid Date') return null;
      
      const currentYear = 2026; // ?�재 ?�도�?변�?
      
      // 1. "12??26??, "1??5?? ?�식
      const koreanMonthDayMatch = str.match(/(\d{1,2})??s*(\d{1,2})??);
      if (koreanMonthDayMatch) {
        const month = parseInt(koreanMonthDayMatch[1]) - 1;
        const day = parseInt(koreanMonthDayMatch[2]);
        const date = new Date(currentYear, month, day);
        return isNaN(date.getTime()) ? null : date;
      }
      
      // 2. "26??????, "25??2??6?? ?�식
      const koreanFullMatch = str.match(/(\d{2,4})??s*(\d{1,2})??s*(\d{1,2})??);
      if (koreanFullMatch) {
        let year = parseInt(koreanFullMatch[1]);
        if (year < 100) year = year + 2000;
        const month = parseInt(koreanFullMatch[2]) - 1;
        const day = parseInt(koreanFullMatch[3]);
        const date = new Date(year, month, day);
        return isNaN(date.getTime()) ? null : date;
      }
      
      // 3. "12-26", "1-5" (???�만 ?�는 경우) -> ?�재 ?�도�??�정
      const shortMatch = str.match(/^(\d{1,2})[\-\/\.](\d{1,2})$/);
      if (shortMatch) {
        const month = parseInt(shortMatch[1]) - 1;
        const day = parseInt(shortMatch[2]);
        const date = new Date(currentYear, month, day);
        return isNaN(date.getTime()) ? null : date;
      }
      
      // 4. ?�반 ?�짜 ?�식: YYYY.MM.DD, YYYY-MM-DD, YYYY/MM/DD, YY.MM.DD, YY-MM-DD
      const cleaned = str.replace(/[\/\-\.\s]/g, '-');
      const parts = cleaned.split('-').filter(p => p.length > 0);
      
      if (parts.length >= 3) {
        let year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        
        // 2?�리 ?�도 처리
        if (year < 100) {
          year = year + 2000;
        }
        
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // 5. ?�자�??�는 경우 (ex: "1226" -> 12??26??
      if (/^\d{3,4}$/.test(str)) {
        const num = str.padStart(4, '0');
        const month = parseInt(num.slice(0, 2)) - 1;
        const day = parseInt(num.slice(2, 4));
        if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
          const date = new Date(currentYear, month, day);
          return isNaN(date.getTime()) ? null : date;
        }
      }
      
      // 6. 기�? ?��? ?�짜 ?�식 ?�도
      try {
        const date = new Date(str);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (e) {
        // ?�싱 ?�패??무시
      }
      
      // 모든 ?�싱 ?�패 ??null 반환
      console.log(`?�짜 ?�싱 ?�패: "${str}"`);
      return null;
    };

    // ?�이??처리
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // ?�수 ?�드 검�?- ?�더 ???�규??(공백, BOM ?�거)
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
          const normalizedKey = key.replace(/^\uFEFF/, '').trim();
          normalizedRow[normalizedKey] = row[key];
        });
        
        console.log(`??${i + 1} ?�규?�된 ??`, Object.keys(normalizedRow));
        
        const customerName = normalizedRow['고객�?] || normalizedRow['customerName'] || '';
        const customerPhone = normalizedRow['?�락�?] || normalizedRow['customerPhone'] || normalizedRow['phone'] || '';
        
        console.log(`??${i + 1}: 고객�?"${customerName}", ?�락�?"${customerPhone}"`);
        
        if (!customerName && !customerPhone) {
          results.errors.push(`??${i + 1}: 고객�??�는 ?�락처�? ?�요?�니??`);
          results.failed++;
          continue;
        }

        // ?�켓 번호 ?�성
        const ticketNumber = await generateTicketNumber();
        console.log(`??${i + 1}: ?�성???�켓번호 = ${ticketNumber}`);

        // AS ?�이???�성
        await prisma.afterservice.create({
          data: {
            ticketNumber,
            // 기본 ?�보
            serviceDate: parseDate(normalizedRow['?�짜'] || normalizedRow['date']) || new Date(),
            companyName: normalizedRow['?�체�?] || normalizedRow['company'] || null,
            
            // 고객 ?�보
            customerName: customerName || '-',
            customerPhone: customerPhone || '-',
            customerAddress: normalizedRow['주소지'] || normalizedRow['address'] || null,
            
            // ?�거/배송 ?�정
            pickupRequestDate: parseDate(normalizedRow['?�거?�청'] || normalizedRow['pickupRequest']),
            processDate: parseDate(normalizedRow['처리'] || normalizedRow['process']),
            shipDate: parseDate(normalizedRow['발송'] || normalizedRow['ship']),
            pickupCompleteDate: parseDate(normalizedRow['?�거?�료'] || normalizedRow['pickupComplete']),
            
            // ?�품 ?�보
            productName: normalizedRow['?�품'] || normalizedRow['product'] || '?�품',
            purchaseDate: parseDate(normalizedRow['구매?�자'] || normalizedRow['purchaseDate']),
            
            // 증상/문제
            issueTitle: normalizedRow['?�용'] || normalizedRow['content'] || normalizedRow['issue'] || '',
            issueDescription: normalizedRow['?�용'] || normalizedRow['content'] || normalizedRow['issue'] || '',
            repairContent: normalizedRow['?�리 ?�역'] || normalizedRow['?�리?�역'] || normalizedRow['repair'] || null,
            
            // 배송 ?�보
            trackingNumber: normalizedRow['?�송?�번??] || normalizedRow['trackingNumber'] || null,
            
            // 기본�?
            status: 'RECEIVED',
            priority: 'NORMAL',
            issueType: 'OTHER',
          },
        });

        console.log(`??${i + 1}: ?�???�공`);
        results.success++;
      } catch (error) {
        console.error(`??${i + 1} 처리 ?�류:`, error);
        results.errors.push(`??${i + 1}: ?�이???�???�패 - ${error instanceof Error ? error.message : '?????�는 ?�류'}`);
        results.failed++;
      }
    }

    return NextResponse.json({
      message: `${results.success}�??�로???�료, ${results.failed}�??�패`,
      ...results,
    });
  } catch (error) {
    console.error("AS ?�로???�류:", error);
    return NextResponse.json(
      { error: "AS ?�이???�로???�패" },
      { status: 500 }
    );
  }
}
