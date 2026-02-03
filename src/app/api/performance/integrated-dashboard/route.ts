import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 기본 부가세율
const DEFAULT_VAT_RATE = 0.1;
// 기본 수수료
const DEFAULT_COMMISSION_RATE = 0;

// 협력사 목록 (고정)
const PARTNERS = ["본사", "로켓그로스", "그로트", "스몰닷", "해피포즈"];

// 상품 KPI 설정 타입
interface ProductKPISetting {
  id: number;
  name: string;
  partnerCode: string;
  unitPrice: number;
  kpiSupplyPrice: number | null;
  kpiCostPrice: number | null;
  kpiCommissionRate: number | null;  // 수수료율 (기본 0.02585 = 2.585%)
  kpiUnitCount: number;               // 기본단가당 건수
  kpiCountEnabled: boolean;
  kpiSalesEnabled: boolean;
}

export async function GET(request: Request) {
  try {
    // URL 파라미터에서 날짜 범위 가져오기
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

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
    // 상품 KPI 설정 조회
    // =====================================================
    const baseProducts = await prisma.baseproduct.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        partnerCode: true,
        unitPrice: true,
        kpiSupplyPrice: true,
        kpiCostPrice: true,
        kpiCommissionRate: true,
        kpiUnitCount: true,
        kpiCountEnabled: true,
        kpiSalesEnabled: true,
      },
    });

    // 상품명 -> KPI 설정 매핑 생성
    const productKPIMap = new Map<string, ProductKPISetting>();
    baseProducts.forEach(product => {
      productKPIMap.set(product.name, {
        id: product.id,
        name: product.name,
        partnerCode: product.partnerCode || "본사",
        unitPrice: Number(product.unitPrice),
        kpiSupplyPrice: product.kpiSupplyPrice ? Number(product.kpiSupplyPrice) : null,
        kpiCostPrice: product.kpiCostPrice ? Number(product.kpiCostPrice) : null,
        kpiCommissionRate: product.kpiCommissionRate ? Number(product.kpiCommissionRate) : null,
        kpiUnitCount: product.kpiUnitCount ?? 1,
        kpiCountEnabled: product.kpiCountEnabled,
        kpiSalesEnabled: product.kpiSalesEnabled,
      });
    });
    
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

    // 선택 기간 협력사별 집계 (KPI 설정 반영)
    interface PartnerStats {
      count: number;
      countForKPI: number;
      quantity: number;
      basePrice: number;
      basePriceForKPI: number;
      shippingFee: number;
      supplyPriceTotal: number;
      costTotal: number;
      commissionTotal: number;  // 수수료 합계
    }
    
    const selectedStats: Record<string, PartnerStats> = {};
    PARTNERS.forEach(p => {
      selectedStats[p] = { 
        count: 0, 
        countForKPI: 0,
        quantity: 0, 
        basePrice: 0, 
        basePriceForKPI: 0,
        shippingFee: 0,
        supplyPriceTotal: 0,
        costTotal: 0,
        commissionTotal: 0,
      };
    });

    // 주문 상품정보에서 KPI 설정된 상품 매칭 함수 (협력사 고려)
    const matchProductKPI = (productInfo: string, partnerCode: string): ProductKPISetting | null => {
      // 1단계: 협력사 + 상품명 정확히 매칭
      for (const [productName, kpi] of productKPIMap.entries()) {
        if (productInfo.includes(productName) && kpi.partnerCode === partnerCode) {
          return kpi;
        }
      }
      // 2단계: 상품명만 매칭 (협력사 불일치 시)
      for (const [productName, kpi] of productKPIMap.entries()) {
        if (productInfo.includes(productName)) {
          return kpi;
        }
      }
      return null;
    };

    selectedOrders.forEach(order => {
      const source = PARTNERS.includes(order.orderSource || "") ? order.orderSource! : "본사";
      const productInfo = order.productInfo || "";
      const qty = order.quantity || 1;
      const matchedKPI = matchProductKPI(productInfo, source);
      
      // 기본 통계
      selectedStats[source].count += 1;
      selectedStats[source].quantity += qty;
      selectedStats[source].basePrice += Number(order.basePrice) || 0;
      selectedStats[source].shippingFee += Number(order.shippingFee) || 0;
      
      // KPI 설정에 따른 통계
      if (matchedKPI) {
        // 건수 카운트 (kpiUnitCount × 주문수량 적용)
        if (matchedKPI.kpiCountEnabled) {
          selectedStats[source].countForKPI += matchedKPI.kpiUnitCount * qty;
        }
        // 매출 집계 여부
        if (matchedKPI.kpiSalesEnabled) {
          selectedStats[source].basePriceForKPI += Number(order.basePrice) || 0;
        }
        // 공급가 (설정값 또는 기본 단가)
        const supplyPrice = matchedKPI.kpiSupplyPrice ?? matchedKPI.unitPrice;
        const totalSupplyPrice = supplyPrice * qty;
        selectedStats[source].supplyPriceTotal += totalSupplyPrice;
        // 원가 (설정값 또는 0)
        const costPrice = matchedKPI.kpiCostPrice ?? 0;
        selectedStats[source].costTotal += costPrice * qty;
        // 수수료 = 공급가 × 수수료율 (기본 0.02585)
        const commissionRate = matchedKPI.kpiCommissionRate ?? 0.02585;
        selectedStats[source].commissionTotal += totalSupplyPrice * commissionRate;
      } else {
        // 매칭 안된 상품은 기본적으로 포함
        selectedStats[source].countForKPI += 1;
        selectedStats[source].basePriceForKPI += Number(order.basePrice) || 0;
        const basePrice = Number(order.basePrice) || 0;
        selectedStats[source].supplyPriceTotal += basePrice;
        // 기본 수수료율 적용
        selectedStats[source].commissionTotal += basePrice * 0.02585;
      }
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

    const monthStats: Record<string, PartnerStats> = {};
    PARTNERS.forEach(p => {
      monthStats[p] = { 
        count: 0, 
        countForKPI: 0,
        quantity: 0, 
        basePrice: 0, 
        basePriceForKPI: 0,
        shippingFee: 0,
        supplyPriceTotal: 0,
        costTotal: 0,
        commissionTotal: 0,
      };
    });

    monthOrders.forEach(order => {
      const source = PARTNERS.includes(order.orderSource || "") ? order.orderSource! : "본사";
      const productInfo = order.productInfo || "";
      const qty = order.quantity || 1;
      const matchedKPI = matchProductKPI(productInfo, source);
      
      monthStats[source].count += 1;
      monthStats[source].quantity += qty;
      monthStats[source].basePrice += Number(order.basePrice) || 0;
      monthStats[source].shippingFee += Number(order.shippingFee) || 0;
      
      if (matchedKPI) {
        if (matchedKPI.kpiCountEnabled) {
          monthStats[source].countForKPI += matchedKPI.kpiUnitCount * qty;
        }
        if (matchedKPI.kpiSalesEnabled) {
          monthStats[source].basePriceForKPI += Number(order.basePrice) || 0;
        }
        const supplyPrice = matchedKPI.kpiSupplyPrice ?? matchedKPI.unitPrice;
        const totalSupplyPrice = supplyPrice * qty;
        monthStats[source].supplyPriceTotal += totalSupplyPrice;
        const costPrice = matchedKPI.kpiCostPrice ?? 0;
        monthStats[source].costTotal += costPrice * qty;
        const commissionRate = matchedKPI.kpiCommissionRate ?? 0.02585;
        monthStats[source].commissionTotal += totalSupplyPrice * commissionRate;
      } else {
        monthStats[source].countForKPI += 1;
        monthStats[source].basePriceForKPI += Number(order.basePrice) || 0;
        const basePrice = Number(order.basePrice) || 0;
        monthStats[source].supplyPriceTotal += basePrice;
        monthStats[source].commissionTotal += basePrice * 0.02585;
      }
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

    const lastMonthStats: Record<string, PartnerStats> = {};
    PARTNERS.forEach(p => {
      lastMonthStats[p] = { 
        count: 0, 
        countForKPI: 0,
        quantity: 0, 
        basePrice: 0, 
        basePriceForKPI: 0,
        shippingFee: 0,
        supplyPriceTotal: 0,
        costTotal: 0,
        commissionTotal: 0,
      };
    });

    lastMonthOrders.forEach(order => {
      const source = PARTNERS.includes(order.orderSource || "") ? order.orderSource! : "본사";
      const productInfo = order.productInfo || "";
      const qty = order.quantity || 1;
      const matchedKPI = matchProductKPI(productInfo, source);
      
      lastMonthStats[source].count += 1;
      lastMonthStats[source].quantity += qty;
      lastMonthStats[source].basePrice += Number(order.basePrice) || 0;
      lastMonthStats[source].shippingFee += Number(order.shippingFee) || 0;
      
      if (matchedKPI) {
        if (matchedKPI.kpiCountEnabled) {
          lastMonthStats[source].countForKPI += matchedKPI.kpiUnitCount * qty;
        }
        if (matchedKPI.kpiSalesEnabled) {
          lastMonthStats[source].basePriceForKPI += Number(order.basePrice) || 0;
        }
        const supplyPrice = matchedKPI.kpiSupplyPrice ?? matchedKPI.unitPrice;
        const totalSupplyPrice = supplyPrice * qty;
        lastMonthStats[source].supplyPriceTotal += totalSupplyPrice;
        const costPrice = matchedKPI.kpiCostPrice ?? 0;
        lastMonthStats[source].costTotal += costPrice * qty;
        const commissionRate = matchedKPI.kpiCommissionRate ?? 0.02585;
        lastMonthStats[source].commissionTotal += totalSupplyPrice * commissionRate;
      } else {
        lastMonthStats[source].countForKPI += 1;
        lastMonthStats[source].basePriceForKPI += Number(order.basePrice) || 0;
        const basePrice = Number(order.basePrice) || 0;
        lastMonthStats[source].supplyPriceTotal += basePrice;
        lastMonthStats[source].commissionTotal += basePrice * 0.02585;
      }
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

    const yearStats: Record<string, PartnerStats> = {};
    PARTNERS.forEach(p => {
      yearStats[p] = { 
        count: 0, 
        countForKPI: 0,
        quantity: 0, 
        basePrice: 0, 
        basePriceForKPI: 0,
        shippingFee: 0,
        supplyPriceTotal: 0,
        costTotal: 0,
        commissionTotal: 0,
      };
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
      const productInfo = order.productInfo || "";
      const qty = order.quantity || 1;
      const matchedKPI = matchProductKPI(productInfo, source);
      
      yearStats[source].count += 1;
      yearStats[source].quantity += qty;
      yearStats[source].basePrice += Number(order.basePrice) || 0;
      yearStats[source].shippingFee += Number(order.shippingFee) || 0;
      
      if (matchedKPI) {
        if (matchedKPI.kpiCountEnabled) {
          yearStats[source].countForKPI += matchedKPI.kpiUnitCount * qty;
        }
        if (matchedKPI.kpiSalesEnabled) {
          yearStats[source].basePriceForKPI += Number(order.basePrice) || 0;
        }
        const supplyPrice = matchedKPI.kpiSupplyPrice ?? matchedKPI.unitPrice;
        const totalSupplyPrice = supplyPrice * qty;
        yearStats[source].supplyPriceTotal += totalSupplyPrice;
        const costPrice = matchedKPI.kpiCostPrice ?? 0;
        yearStats[source].costTotal += costPrice * qty;
        const commissionRate = matchedKPI.kpiCommissionRate ?? 0.02585;
        yearStats[source].commissionTotal += totalSupplyPrice * commissionRate;
      } else {
        yearStats[source].countForKPI += 1;
        yearStats[source].basePriceForKPI += Number(order.basePrice) || 0;
        const basePrice = Number(order.basePrice) || 0;
        yearStats[source].supplyPriceTotal += basePrice;
        yearStats[source].commissionTotal += basePrice * 0.02585;
      }

      // 상품명에서 상품 종류 추출
      const productInfoLower = productInfo.toLowerCase();
      if (productInfoLower.includes("쉴드4") || productInfoLower.includes("shield4")) {
        productSales["쉴드4"] += qty;
      } else if (productInfoLower.includes("유선") || productInfoLower.includes("wired")) {
        productSales["쉴드유선전용"] += qty;
      } else if (productInfoLower.includes("미니") || productInfoLower.includes("mini")) {
        productSales["쉴드미니"] += qty;
      } else if (productInfoLower.includes("스탠드") || productInfoLower.includes("stand")) {
        productSales["스탠드"] += qty;
      } else {
        productSales["기타"] += qty;
      }
    });

    // =====================================================
    // 통계 데이터 빌드 함수 (KPI 설정 반영)
    // =====================================================
    const buildPartnerData = (stats: Record<string, PartnerStats>) => {
      return PARTNERS.map(partner => {
        const s = stats[partner];
        const vat = Math.round(s.supplyPriceTotal * DEFAULT_VAT_RATE);
        // 수수료는 상품별로 이미 계산되어 commissionTotal에 누적됨
        const commission = Math.round(s.commissionTotal);
        // 부가세 제외 공급가액 = 공급가 / 1.1
        const supplyPriceExcludingVAT = s.supplyPriceTotal / 1.1;
        // 마진 = 공급가(부가세 제외) - 원가 - 배송비 - 수수료
        const margin = supplyPriceExcludingVAT - s.costTotal - s.shippingFee - s.commissionTotal;
        
        return {
          partner,
          count: s.count,
          countForKPI: s.countForKPI,
          quantity: s.quantity,
          basePrice: s.basePrice,
          basePriceForKPI: s.basePriceForKPI,
          shippingFee: s.shippingFee,
          supplyPrice: Math.round(s.supplyPriceTotal),
          cost: Math.round(s.costTotal),
          vat,
          totalWithVat: Math.round(s.supplyPriceTotal + vat),
          commission,
          margin: Math.round(margin),
        };
      });
    };

    const buildTotals = (partnerData: ReturnType<typeof buildPartnerData>) => {
      return {
        count: partnerData.reduce((sum, d) => sum + d.count, 0),
        countForKPI: partnerData.reduce((sum, d) => sum + d.countForKPI, 0),
        quantity: partnerData.reduce((sum, d) => sum + d.quantity, 0),
        basePrice: partnerData.reduce((sum, d) => sum + d.basePrice, 0),
        basePriceForKPI: partnerData.reduce((sum, d) => sum + d.basePriceForKPI, 0),
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
        // 상품별 KPI 설정 정보 (프론트엔드 표시용)
        productKPISettings: baseProducts.map(p => ({
          id: p.id,
          name: p.name,
          partnerCode: p.partnerCode || "본사",
          unitPrice: Number(p.unitPrice),
          kpiSupplyPrice: p.kpiSupplyPrice ? Number(p.kpiSupplyPrice) : null,
          kpiCostPrice: p.kpiCostPrice ? Number(p.kpiCostPrice) : null,
          kpiCommissionRate: p.kpiCommissionRate ? Number(p.kpiCommissionRate) : null,
          kpiUnitCount: p.kpiUnitCount ?? 1,
          kpiCountEnabled: p.kpiCountEnabled,
          kpiSalesEnabled: p.kpiSalesEnabled,
        })),
        // 계산 단가 정보
        priceInfo: {
          vatRate: DEFAULT_VAT_RATE,
          commissionRate: DEFAULT_COMMISSION_RATE,
          defaultCommissionRate: 0.02585,  // 기본 수수료율 2.585%
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
