import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 기본 협력사별 공급가 단가
const DEFAULT_SUPPLY_PRICE_BY_PARTNER: Record<string, number> = {
  "본사": 45000,
  "로켓그로스": 99000,
  "그로트": 99000,
  "스몰닷": 99000,
  "해피포즈": 99000,
};

// 기본 원가 (개당)
const DEFAULT_COST_PER_UNIT = 42000;
// 기본 부가세율
const DEFAULT_VAT_RATE = 0.1;
// 기본 수수료
const DEFAULT_COMMISSION_RATE = 0;

// 협력사 목록 (고정)
const PARTNERS = ["본사", "로켓그로스", "그로트", "스몰닷", "해피포즈"];

export async function GET(request: Request) {
  try {
    // URL 파라미터에서 날짜 범위 가져오기
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const kpiSettingsParam = searchParams.get('kpiSettings');

    // KPI 설정 파싱
    let supplyPriceByPartner: Record<string, number> = { ...DEFAULT_SUPPLY_PRICE_BY_PARTNER };
    let costPriceByPartner: Record<string, number> = {};
    let vatRate = DEFAULT_VAT_RATE;
    let commissionRate = DEFAULT_COMMISSION_RATE;
    let defaultShippingFee = 3000;

    // 협력사별 원가 기본값 설정
    PARTNERS.forEach(p => {
      costPriceByPartner[p] = DEFAULT_COST_PER_UNIT;
    });

    if (kpiSettingsParam) {
      try {
        const kpiSettings = JSON.parse(kpiSettingsParam);
        
        // 협력사별 공급가 및 원가 설정 적용
        if (kpiSettings.partners) {
          Object.entries(kpiSettings.partners).forEach(([partner, config]: [string, any]) => {
            if (config.enabled) {
              supplyPriceByPartner[partner] = config.supplyPrice;
              costPriceByPartner[partner] = config.costPrice;
            }
          });
        }

        // 세율 및 수수료율 설정 적용
        if (kpiSettings.vatRate !== undefined) {
          vatRate = kpiSettings.vatRate;
        }
        if (kpiSettings.commissionRate !== undefined) {
          commissionRate = kpiSettings.commissionRate;
        }
        if (kpiSettings.defaultShippingFee !== undefined) {
          defaultShippingFee = kpiSettings.defaultShippingFee;
        }
      } catch (e) {
        console.error('Failed to parse KPI settings:', e);
      }
    }

    // 날짜 범위 설정 (파라미터가 없으면 오늘 기준)
    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // 기본값: 오늘
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    // 검색 종료일 기준으로 월 계산
    const searchEndMonth = endDate.getMonth();
    const searchEndYear = endDate.getFullYear();
    
    // 검색 종료일이 속한 달의 1일
    const monthStart = new Date(searchEndYear, searchEndMonth, 1);
    
    // 지난 달 1일 ~ 말일 (검색 종료일 기준)
    const lastMonthStart = new Date(searchEndYear, searchEndMonth - 1, 1);
    const lastMonthEnd = new Date(searchEndYear, searchEndMonth, 0, 23, 59, 59, 999);
    
    // 검색 종료일이 속한 연도의 1월 1일
    const yearStart = new Date(searchEndYear, 0, 1);
    
    // =====================================================
    // 1. 선택된 날짜 범위 통계 (협력사별)
    // =====================================================
    const selectedOrders = await prisma.order.findMany({
      where: {
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        orderSource: true,
        quantity: true,
        basePrice: true,
        shippingFee: true,
        productInfo: true,
      },
    });

    // 선택 기간 협력사별 집계
    const selectedStats: Record<string, { count: number; quantity: number; basePrice: number; shippingFee: number }> = {};
    PARTNERS.forEach(p => {
      selectedStats[p] = { count: 0, quantity: 0, basePrice: 0, shippingFee: 0 };
    });

    selectedOrders.forEach(order => {
      const source = PARTNERS.includes(order.orderSource || "") ? order.orderSource! : "본사";
      selectedStats[source].count += 1;
      selectedStats[source].quantity += order.quantity || 1;
      selectedStats[source].basePrice += Number(order.basePrice) || 0;
      selectedStats[source].shippingFee += Number(order.shippingFee) || 0;
    });

    // =====================================================
    // 2. 1일~선택 종료일(이번 달 누계) 통계
    // =====================================================
    const monthOrders = await prisma.order.findMany({
      where: {
        orderDate: {
          gte: monthStart,
          lte: endDate,
        },
      },
      select: {
        orderSource: true,
        quantity: true,
        basePrice: true,
        shippingFee: true,
        productInfo: true,
      },
    });

    const monthStats: Record<string, { count: number; quantity: number; basePrice: number; shippingFee: number }> = {};
    PARTNERS.forEach(p => {
      monthStats[p] = { count: 0, quantity: 0, basePrice: 0, shippingFee: 0 };
    });

    monthOrders.forEach(order => {
      const source = PARTNERS.includes(order.orderSource || "") ? order.orderSource! : "본사";
      monthStats[source].count += 1;
      monthStats[source].quantity += order.quantity || 1;
      monthStats[source].basePrice += Number(order.basePrice) || 0;
      monthStats[source].shippingFee += Number(order.shippingFee) || 0;
    });

    // =====================================================
    // 3. 전월 통계
    // =====================================================
    const lastMonthOrders = await prisma.order.findMany({
      where: {
        orderDate: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      select: {
        orderSource: true,
        quantity: true,
        basePrice: true,
        shippingFee: true,
        productInfo: true,
      },
    });

    const lastMonthStats: Record<string, { count: number; quantity: number; basePrice: number; shippingFee: number }> = {};
    PARTNERS.forEach(p => {
      lastMonthStats[p] = { count: 0, quantity: 0, basePrice: 0, shippingFee: 0 };
    });

    lastMonthOrders.forEach(order => {
      const source = PARTNERS.includes(order.orderSource || "") ? order.orderSource! : "본사";
      lastMonthStats[source].count += 1;
      lastMonthStats[source].quantity += order.quantity || 1;
      lastMonthStats[source].basePrice += Number(order.basePrice) || 0;
      lastMonthStats[source].shippingFee += Number(order.shippingFee) || 0;
    });

    // =====================================================
    // 4. 연간 누적 통계
    // =====================================================
    const yearOrders = await prisma.order.findMany({
      where: {
        orderDate: {
          gte: yearStart,
        },
      },
      select: {
        orderSource: true,
        quantity: true,
        basePrice: true,
        shippingFee: true,
        productInfo: true,
      },
    });

    const yearStats: Record<string, { count: number; quantity: number; basePrice: number; shippingFee: number }> = {};
    PARTNERS.forEach(p => {
      yearStats[p] = { count: 0, quantity: 0, basePrice: 0, shippingFee: 0 };
    });

    // 상품별 판매수량 집계 (연간 누적)
    const productSales: Record<string, number> = {
      "쉴드4": 0,
      "쉴드유선전용": 0,
      "쉴드미니": 0,
      "스탠드": 0,
      "기타": 0,
    };

    yearOrders.forEach(order => {
      const source = PARTNERS.includes(order.orderSource || "") ? order.orderSource! : "본사";
      yearStats[source].count += 1;
      yearStats[source].quantity += order.quantity || 1;
      yearStats[source].basePrice += Number(order.basePrice) || 0;
      yearStats[source].shippingFee += Number(order.shippingFee) || 0;

      // 상품명에서 상품 종류 추출
      const productInfo = order.productInfo?.toLowerCase() || "";
      const qty = order.quantity || 1;
      
      if (productInfo.includes("쉴드4") || productInfo.includes("shield4")) {
        productSales["쉴드4"] += qty;
      } else if (productInfo.includes("유선") || productInfo.includes("wired")) {
        productSales["쉴드유선전용"] += qty;
      } else if (productInfo.includes("미니") || productInfo.includes("mini")) {
        productSales["쉴드미니"] += qty;
      } else if (productInfo.includes("스탠드") || productInfo.includes("stand")) {
        productSales["스탠드"] += qty;
      } else {
        productSales["기타"] += qty;
      }
    });

    // =====================================================
    // 금액 계산 함수
    // =====================================================
    const calculateFinancials = (
      quantity: number, 
      partner: string = "본사",
      actualShippingFee: number = 0
    ) => {
      const pricePerUnit = supplyPriceByPartner[partner] || supplyPriceByPartner["본사"] || 45000;
      const costPerUnit = costPriceByPartner[partner] || DEFAULT_COST_PER_UNIT;
      
      const supplyPrice = quantity * pricePerUnit; // 공급가
      const vat = supplyPrice * vatRate; // 부가세
      const totalWithVat = supplyPrice + vat; // 합계 (부가세 포함)
      const cost = quantity * costPerUnit; // 원가
      const commission = supplyPrice * commissionRate; // 수수료
      const margin = supplyPrice - cost - commission - actualShippingFee; // 마진 (배송비 차감)

      return {
        supplyPrice: Math.round(supplyPrice),
        vat: Math.round(vat),
        totalWithVat: Math.round(totalWithVat),
        cost: Math.round(cost),
        commission: Math.round(commission),
        margin: Math.round(margin),
      };
    };

    // =====================================================
    // 통계 데이터 빌드 함수
    // =====================================================
    const buildPartnerData = (stats: Record<string, { count: number; quantity: number; basePrice: number; shippingFee: number }>) => {
      return PARTNERS.map(partner => {
        const s = stats[partner];
        const financials = calculateFinancials(s.quantity, partner, s.shippingFee);
        return {
          partner,
          count: s.count,
          quantity: s.quantity,
          basePrice: s.basePrice,      // 실제 단가 합계 (DB)
          shippingFee: s.shippingFee,  // 실제 배송비 합계 (DB)
          ...financials,
        };
      });
    };

    const buildTotals = (partnerData: ReturnType<typeof buildPartnerData>) => {
      return {
        count: partnerData.reduce((sum, d) => sum + d.count, 0),
        quantity: partnerData.reduce((sum, d) => sum + d.quantity, 0),
        basePrice: partnerData.reduce((sum, d) => sum + d.basePrice, 0),
        shippingFee: partnerData.reduce((sum, d) => sum + d.shippingFee, 0),
        supplyPrice: partnerData.reduce((sum, d) => sum + d.supplyPrice, 0),
        vat: partnerData.reduce((sum, d) => sum + d.vat, 0),
        totalWithVat: partnerData.reduce((sum, d) => sum + d.totalWithVat, 0),
        cost: partnerData.reduce((sum, d) => sum + d.cost, 0),
        commission: partnerData.reduce((sum, d) => sum + d.commission, 0),
        margin: partnerData.reduce((sum, d) => sum + d.margin, 0),
      };
    };

    // =====================================================
    // 응답 데이터 구성
    // =====================================================
    
    // 선택 기간 통계
    const selectedData = buildPartnerData(selectedStats);
    const selectedTotals = buildTotals(selectedData);

    // 1일~현재 (이번 달 누계)
    const monthData = buildPartnerData(monthStats);
    const monthTotals = buildTotals(monthData);

    // 전월 통계
    const lastMonthData = buildPartnerData(lastMonthStats);
    const lastMonthTotals = buildTotals(lastMonthData);

    // 연간 누적
    const yearData = buildPartnerData(yearStats);
    const yearTotals = buildTotals(yearData);

    return NextResponse.json({
      success: true,
      data: {
        // 날짜 범위 정보
        dateRange: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          year: searchEndYear,
        },
        // 선택 기간 통계
        selected: {
          byPartner: selectedData,
          totals: selectedTotals,
        },
        // 1일~현재 (이번 달 누계)
        monthToDate: {
          byPartner: monthData,
          totals: monthTotals,
        },
        // 전월 통계
        lastMonth: lastMonthTotals,
        // 연간 누적
        yearToDate: {
          byPartner: yearData,
          totals: yearTotals,
          productSales,
        },
        // 계산 단가 정보
        priceInfo: {
          supplyPriceByPartner,
          costPerUnit: DEFAULT_COST_PER_UNIT,
          vatRate,
          commissionRate,
        },
      },
    });
  } catch (error) {
    console.error("Integrated dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
