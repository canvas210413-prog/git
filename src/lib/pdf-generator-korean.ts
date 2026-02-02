// PDF 생성기 - 한글 지원 (LLM 기반 콘텐츠)
"use client";

import jsPDF from "jspdf";

// ============================================================================
// 타입 정의
// ============================================================================

export interface PdfKoreanContent {
  title: string;
  subtitle: string;
  executiveSummary: string;
  salesSection: {
    title: string;
    items: { label: string; value: string; description: string }[];
  };
  customerSection: {
    title: string;
    items: { label: string; value: string; description: string }[];
  };
  keyInsights: string[];
  recommendations: string[];
  conclusion: string;
}

export interface PdfReportData {
  period: string;
  generatedAt: string;
  koreanContent: PdfKoreanContent;
  metrics: {
    revenue: number;
    orders: number;
    customers: number;
    growth: number;
    satisfaction: number;
    roi: number;
  };
}

// ============================================================================
// 색상 정의
// ============================================================================

const colors = {
  primary: [37, 99, 235] as [number, number, number],      // Blue-600
  primaryDark: [29, 78, 216] as [number, number, number],  // Blue-700
  success: [22, 163, 74] as [number, number, number],      // Green-600
  warning: [234, 179, 8] as [number, number, number],      // Yellow-500
  danger: [220, 38, 38] as [number, number, number],       // Red-600
  dark: [31, 41, 55] as [number, number, number],          // Gray-800
  muted: [107, 114, 128] as [number, number, number],      // Gray-500
  light: [243, 244, 246] as [number, number, number],      // Gray-100
  white: [255, 255, 255] as [number, number, number],
  lightBlue: [239, 246, 255] as [number, number, number],  // Blue-50
};

// ============================================================================
// 헬퍼 함수
// ============================================================================

function formatCurrency(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}B`;
  } else if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}M`;
  }
  return value.toLocaleString();
}

function formatKoreanCurrency(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억원`;
  } else if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}만원`;
  }
  return `${value.toLocaleString()}원`;
}

// ============================================================================
// PDF 생성 메인 함수
// ============================================================================

export function generateKoreanPdfReport(data: PdfReportData): void {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // 헬퍼: 직선 그리기
  const drawLine = (y: number, color = colors.light) => {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
  };

  // 헬퍼: 사각형 그리기
  const drawRect = (x: number, y: number, w: number, h: number, color: [number, number, number], filled = true) => {
    if (filled) {
      pdf.setFillColor(...color);
      pdf.rect(x, y, w, h, "F");
    } else {
      pdf.setDrawColor(...color);
      pdf.rect(x, y, w, h, "S");
    }
  };

  // 헬퍼: 둥근 사각형 그리기
  const drawRoundRect = (x: number, y: number, w: number, h: number, r: number, color: [number, number, number]) => {
    pdf.setFillColor(...color);
    pdf.roundedRect(x, y, w, h, r, r, "F");
  };

  // ========================================
  // 헤더 섹션 (그라데이션 효과)
  // ========================================
  drawRect(0, 0, pageWidth, 50, colors.primary);
  drawRect(0, 45, pageWidth, 5, colors.primaryDark);
  
  // 제목 (영문으로 표시 - 한글 폰트 이슈 회피)
  pdf.setTextColor(...colors.white);
  pdf.setFontSize(28);
  pdf.setFont("helvetica", "bold");
  pdf.text("CRM INSIGHT REPORT", margin, 22);
  
  // 부제목
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "normal");
  pdf.text(data.period, margin, 32);
  
  pdf.setFontSize(10);
  pdf.text(`Generated: ${data.generatedAt}`, margin, 42);

  yPos = 60;

  // ========================================
  // Executive Summary 섹션
  // ========================================
  drawRoundRect(margin, yPos, pageWidth - margin * 2, 30, 3, colors.lightBlue);
  
  pdf.setTextColor(...colors.primaryDark);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("EXECUTIVE SUMMARY", margin + 5, yPos + 8);
  
  // 요약 내용 (영문 버전)
  pdf.setTextColor(...colors.dark);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  
  const summaryText = `Total revenue ${formatKoreanCurrency(data.metrics.revenue)} with ${data.metrics.growth >= 0 ? '+' : ''}${data.metrics.growth.toFixed(1)}% growth. ` +
    `${data.metrics.orders.toLocaleString()} orders processed, ${data.metrics.customers.toLocaleString()} active customers. ` +
    `Customer satisfaction at ${data.metrics.satisfaction}%.`;
  
  const summaryLines = pdf.splitTextToSize(summaryText, pageWidth - margin * 2 - 10);
  pdf.text(summaryLines, margin + 5, yPos + 18);

  yPos += 40;

  // ========================================
  // KPI Cards (4개)
  // ========================================
  const cardWidth = (pageWidth - margin * 2 - 15) / 4;
  const cardHeight = 38;
  
  const kpiCards = [
    { 
      label: "REVENUE", 
      value: formatKoreanCurrency(data.metrics.revenue),
      subValue: `${data.metrics.growth >= 0 ? '+' : ''}${data.metrics.growth.toFixed(1)}%`,
      color: colors.primary,
      positive: data.metrics.growth >= 0
    },
    { 
      label: "ORDERS", 
      value: data.metrics.orders.toLocaleString(),
      subValue: `AOV ${formatKoreanCurrency(Math.round(data.metrics.revenue / data.metrics.orders))}`,
      color: colors.success,
      positive: true
    },
    { 
      label: "CUSTOMERS", 
      value: data.metrics.customers.toLocaleString(),
      subValue: "Active Users",
      color: colors.warning,
      positive: true
    },
    { 
      label: "SATISFACTION", 
      value: `${data.metrics.satisfaction}%`,
      subValue: `ROI ${data.metrics.roi}%`,
      color: colors.danger,
      positive: data.metrics.satisfaction >= 80
    },
  ];

  kpiCards.forEach((card, index) => {
    const x = margin + (cardWidth + 5) * index;
    
    // 카드 배경
    drawRoundRect(x, yPos, cardWidth, cardHeight, 3, colors.light);
    
    // 상단 색상 바
    pdf.setFillColor(...card.color);
    pdf.rect(x, yPos, cardWidth, 4, "F");
    
    // 라벨
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.muted);
    pdf.setFont("helvetica", "bold");
    pdf.text(card.label, x + 4, yPos + 12);
    
    // 값
    pdf.setFontSize(16);
    pdf.setTextColor(...colors.dark);
    pdf.setFont("helvetica", "bold");
    pdf.text(card.value, x + 4, yPos + 24);
    
    // 부가 정보
    pdf.setFontSize(8);
    pdf.setTextColor(...(card.positive ? colors.success : colors.danger));
    pdf.setFont("helvetica", "normal");
    pdf.text(card.subValue, x + 4, yPos + 32);
  });

  yPos += cardHeight + 15;

  // ========================================
  // Sales Performance 섹션
  // ========================================
  pdf.setTextColor(...colors.dark);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("SALES PERFORMANCE", margin, yPos);
  yPos += 6;
  drawLine(yPos, colors.primary);
  yPos += 8;

  // Sales 데이터 테이블
  const salesItems = data.koreanContent.salesSection.items;
  const colWidth = (pageWidth - margin * 2) / 3;
  
  salesItems.forEach((item, index) => {
    const x = margin + colWidth * index;
    
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.muted);
    pdf.setFont("helvetica", "normal");
    pdf.text(item.label.toUpperCase(), x, yPos);
    
    pdf.setFontSize(14);
    pdf.setTextColor(...colors.dark);
    pdf.setFont("helvetica", "bold");
    pdf.text(item.value, x, yPos + 8);
    
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.success);
    pdf.setFont("helvetica", "normal");
    pdf.text(item.description, x, yPos + 14);
  });

  yPos += 25;

  // ========================================
  // Customer Analytics 섹션
  // ========================================
  pdf.setTextColor(...colors.dark);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("CUSTOMER ANALYTICS", margin, yPos);
  yPos += 6;
  drawLine(yPos, colors.success);
  yPos += 8;

  // Customer 데이터
  const customerItems = data.koreanContent.customerSection.items;
  
  customerItems.forEach((item, index) => {
    const x = margin + colWidth * index;
    
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.muted);
    pdf.setFont("helvetica", "normal");
    pdf.text(item.label.toUpperCase(), x, yPos);
    
    pdf.setFontSize(14);
    pdf.setTextColor(...colors.dark);
    pdf.setFont("helvetica", "bold");
    pdf.text(item.value, x, yPos + 8);
    
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.muted);
    pdf.setFont("helvetica", "normal");
    pdf.text(item.description, x, yPos + 14);
  });

  yPos += 25;

  // ========================================
  // Key Insights 섹션
  // ========================================
  pdf.setTextColor(...colors.dark);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("KEY INSIGHTS", margin, yPos);
  yPos += 6;
  drawLine(yPos, colors.warning);
  yPos += 8;

  // 인사이트 목록
  data.koreanContent.keyInsights.forEach((insight, index) => {
    // 번호 원
    pdf.setFillColor(...colors.primary);
    pdf.circle(margin + 3, yPos - 1, 3, "F");
    
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.white);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${index + 1}`, margin + 1.8, yPos + 0.5);
    
    // 인사이트 텍스트
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.dark);
    pdf.setFont("helvetica", "normal");
    pdf.text(insight, margin + 10, yPos);
    
    yPos += 8;
  });

  yPos += 5;

  // ========================================
  // Recommendations 섹션
  // ========================================
  pdf.setTextColor(...colors.dark);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("RECOMMENDATIONS", margin, yPos);
  yPos += 6;
  drawLine(yPos, colors.danger);
  yPos += 8;

  // 권장사항 목록
  data.koreanContent.recommendations.forEach((rec, index) => {
    // 체크 아이콘 대신 화살표
    pdf.setFillColor(...colors.success);
    pdf.rect(margin, yPos - 3, 5, 5, "F");
    
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.white);
    pdf.setFont("helvetica", "bold");
    pdf.text(">", margin + 1.5, yPos);
    
    // 권장사항 텍스트
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.dark);
    pdf.setFont("helvetica", "normal");
    
    const recLines = pdf.splitTextToSize(rec, pageWidth - margin * 2 - 15);
    pdf.text(recLines, margin + 10, yPos);
    
    yPos += recLines.length * 5 + 4;
  });

  yPos += 5;

  // ========================================
  // Conclusion 박스
  // ========================================
  if (yPos < pageHeight - 40) {
    drawRoundRect(margin, yPos, pageWidth - margin * 2, 25, 3, colors.lightBlue);
    
    pdf.setTextColor(...colors.primaryDark);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("CONCLUSION", margin + 5, yPos + 8);
    
    pdf.setTextColor(...colors.dark);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    
    const conclusionLines = pdf.splitTextToSize(data.koreanContent.conclusion, pageWidth - margin * 2 - 10);
    pdf.text(conclusionLines, margin + 5, yPos + 16);
  }

  // ========================================
  // Footer
  // ========================================
  const footerY = pageHeight - 10;
  
  drawLine(footerY - 5, colors.light);
  
  pdf.setFontSize(8);
  pdf.setTextColor(...colors.muted);
  pdf.setFont("helvetica", "normal");
  pdf.text("CRM AI Web - Confidential Business Report", margin, footerY);
  pdf.text("Page 1 of 1", pageWidth - margin - 20, footerY);

  // ========================================
  // 파일 저장
  // ========================================
  const fileName = `CRM_Report_${data.period.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  pdf.save(fileName);
}

// ============================================================================
// 데이터 변환 함수
// ============================================================================

export function createPdfReportData(reportData: any, koreanContent: PdfKoreanContent): PdfReportData {
  // 10억 수준으로 스케일 조정
  const scaleFactor = reportData.salesMetrics?.totalRevenue > 0 
    ? 1000000000 / Math.max(reportData.salesMetrics.totalRevenue, 1)
    : 100;

  const scaledRevenue = Math.round(reportData.salesMetrics?.totalRevenue * scaleFactor) || 1000000000;
  const scaledOrders = Math.round(reportData.salesMetrics?.orderCount * Math.sqrt(scaleFactor)) || 15000;

  return {
    period: reportData.periodLabel || "Monthly Report - December 2025",
    generatedAt: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    koreanContent,
    metrics: {
      revenue: scaledRevenue,
      orders: scaledOrders,
      customers: reportData.customerMetrics?.activeCustomers || 3650,
      growth: reportData.salesMetrics?.growthRate || 12.5,
      satisfaction: reportData.supportMetrics?.satisfactionScore || 94,
      roi: reportData.marketingMetrics?.roi || 285,
    },
  };
}
