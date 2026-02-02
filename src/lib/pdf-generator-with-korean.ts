// PDF 생성기 - 한글 폰트 지원 (jsPDF + NanumGothic)
"use client";

import jsPDF from "jspdf";

// ============================================================================
// 타입 정의
// ============================================================================

export interface InsightReportData {
  period: string;
  generatedAt: string;
  executiveSummary: string;
  metrics: {
    revenue: number;
    orders: number;
    customers: number;
    growth: number;
    satisfaction: number;
    roi: number;
  };
  salesAnalysis: string;
  customerAnalysis: string;
  keyInsights: string[];
  recommendations: string[];
  conclusion: string;
}

// ============================================================================
// 색상 정의
// ============================================================================

const colors = {
  primary: [37, 99, 235] as [number, number, number],
  primaryDark: [29, 78, 216] as [number, number, number],
  success: [22, 163, 74] as [number, number, number],
  warning: [202, 138, 4] as [number, number, number],
  danger: [220, 38, 38] as [number, number, number],
  dark: [31, 41, 55] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  light: [243, 244, 246] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightBlue: [239, 246, 255] as [number, number, number],
};

// ============================================================================
// 폰트 로드 함수
// ============================================================================

let fontLoaded = false;

async function loadKoreanFont(pdf: jsPDF): Promise<boolean> {
  if (fontLoaded) return true;
  
  try {
    // Google Fonts에서 NanumGothic TTF 로드
    const fontUrl = 'https://fonts.gstatic.com/ea/nanumgothic/v5/NanumGothic-Regular.ttf';
    const response = await fetch(fontUrl);
    
    if (!response.ok) {
      console.error('폰트 로드 실패:', response.status);
      return false;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    
    // jsPDF에 폰트 등록
    pdf.addFileToVFS('NanumGothic-Regular.ttf', base64);
    pdf.addFont('NanumGothic-Regular.ttf', 'NanumGothic', 'normal');
    
    fontLoaded = true;
    return true;
  } catch (error) {
    console.error('한글 폰트 로드 실패:', error);
    return false;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

function formatKoreanCurrency(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억원`;
  } else if (value >= 10000000) {
    return `${(value / 10000000).toFixed(1)}천만원`;
  } else if (value >= 10000) {
    return `${Math.round(value / 10000)}만원`;
  }
  return `${value.toLocaleString()}원`;
}

// ============================================================================
// PDF 생성 메인 함수 (한글 지원)
// ============================================================================

export async function generateInsightReportPdf(data: InsightReportData): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // 한글 폰트 로드
  const koreanFontLoaded = await loadKoreanFont(pdf);
  const fontFamily = koreanFontLoaded ? 'NanumGothic' : 'helvetica';

  // 페이지 추가 체크 함수
  const checkPageBreak = (neededHeight: number) => {
    if (yPos + neededHeight > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // 텍스트 줄바꿈 처리 함수
  const addWrappedText = (text: string, x: number, maxWidth: number, fontSize: number = 10) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      checkPageBreak(6);
      pdf.text(line, x, yPos);
      yPos += 5;
    });
  };

  // ========================================
  // 헤더 섹션
  // ========================================
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, pageWidth, 45, "F");
  pdf.setFillColor(...colors.primaryDark);
  pdf.rect(0, 40, pageWidth, 5, "F");

  // 제목
  pdf.setTextColor(...colors.white);
  pdf.setFontSize(24);
  pdf.setFont(fontFamily, 'normal');
  pdf.text(koreanFontLoaded ? "CRM 인사이트 리포트" : "CRM Insight Report", margin, 20);

  // 부제목
  pdf.setFontSize(12);
  pdf.text(data.period, margin, 30);
  
  pdf.setFontSize(9);
  pdf.text(koreanFontLoaded ? `생성일: ${data.generatedAt}` : `Generated: ${data.generatedAt}`, margin, 38);

  yPos = 55;

  // ========================================
  // Executive Summary
  // ========================================
  pdf.setFillColor(...colors.lightBlue);
  pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 3, 3, "F");

  pdf.setTextColor(...colors.primaryDark);
  pdf.setFontSize(14);
  pdf.setFont(fontFamily, 'normal');
  pdf.text(koreanFontLoaded ? "📋 Executive Summary" : "Executive Summary", margin + 5, yPos + 8);

  pdf.setTextColor(...colors.dark);
  pdf.setFontSize(9);
  
  const summaryLines = pdf.splitTextToSize(data.executiveSummary, pageWidth - margin * 2 - 10);
  let summaryY = yPos + 15;
  summaryLines.slice(0, 4).forEach((line: string) => {
    pdf.text(line, margin + 5, summaryY);
    summaryY += 5;
  });

  yPos += 45;

  // ========================================
  // KPI Cards (4개)
  // ========================================
  const cardWidth = (pageWidth - margin * 2 - 15) / 4;
  const cardHeight = 32;

  const kpiData = [
    { 
      label: koreanFontLoaded ? "총 매출" : "Revenue", 
      value: formatKoreanCurrency(data.metrics.revenue),
      subValue: `${data.metrics.growth >= 0 ? '+' : ''}${data.metrics.growth.toFixed(1)}%`,
      color: colors.primary 
    },
    { 
      label: koreanFontLoaded ? "주문 수" : "Orders", 
      value: data.metrics.orders.toLocaleString(),
      subValue: `AOV ${formatKoreanCurrency(Math.round(data.metrics.revenue / data.metrics.orders))}`,
      color: colors.success 
    },
    { 
      label: koreanFontLoaded ? "고객 수" : "Customers", 
      value: data.metrics.customers.toLocaleString(),
      subValue: koreanFontLoaded ? "활성 고객" : "Active",
      color: colors.warning 
    },
    { 
      label: koreanFontLoaded ? "만족도" : "Satisfaction", 
      value: `${data.metrics.satisfaction}%`,
      subValue: `ROI ${data.metrics.roi}%`,
      color: colors.danger 
    },
  ];

  kpiData.forEach((kpi, i) => {
    const x = margin + i * (cardWidth + 5);
    
    // 카드 배경
    pdf.setFillColor(...colors.light);
    pdf.roundedRect(x, yPos, cardWidth, cardHeight, 2, 2, "F");
    
    // 상단 컬러 바
    pdf.setFillColor(...kpi.color);
    pdf.rect(x, yPos, cardWidth, 3, "F");
    
    // 라벨
    pdf.setTextColor(...colors.muted);
    pdf.setFontSize(7);
    pdf.text(kpi.label, x + 3, yPos + 10);
    
    // 값
    pdf.setTextColor(...colors.dark);
    pdf.setFontSize(12);
    pdf.text(kpi.value, x + 3, yPos + 18);
    
    // 서브값
    pdf.setTextColor(...colors.muted);
    pdf.setFontSize(7);
    pdf.text(kpi.subValue, x + 3, yPos + 25);
  });

  yPos += cardHeight + 10;

  // ========================================
  // 매출 분석 섹션
  // ========================================
  checkPageBreak(40);
  
  pdf.setTextColor(...colors.primaryDark);
  pdf.setFontSize(13);
  pdf.text(koreanFontLoaded ? "📈 매출 분석" : "Sales Analysis", margin, yPos);
  yPos += 7;

  pdf.setTextColor(...colors.dark);
  pdf.setFontSize(9);
  addWrappedText(data.salesAnalysis, margin, pageWidth - margin * 2);
  yPos += 5;

  // ========================================
  // 고객 분석 섹션
  // ========================================
  checkPageBreak(40);
  
  pdf.setTextColor(...colors.primaryDark);
  pdf.setFontSize(13);
  pdf.text(koreanFontLoaded ? "👥 고객 분석" : "Customer Analysis", margin, yPos);
  yPos += 7;

  pdf.setTextColor(...colors.dark);
  pdf.setFontSize(9);
  addWrappedText(data.customerAnalysis, margin, pageWidth - margin * 2);
  yPos += 5;

  // ========================================
  // 핵심 인사이트 섹션
  // ========================================
  checkPageBreak(50);

  pdf.setTextColor(...colors.primaryDark);
  pdf.setFontSize(13);
  pdf.text(koreanFontLoaded ? "💡 핵심 인사이트" : "Key Insights", margin, yPos);
  yPos += 8;

  data.keyInsights.forEach((insight, i) => {
    checkPageBreak(10);
    
    // 번호 원형 배경
    pdf.setFillColor(...colors.primary);
    pdf.circle(margin + 3, yPos - 1.5, 3, "F");
    
    pdf.setTextColor(...colors.white);
    pdf.setFontSize(8);
    pdf.text(`${i + 1}`, margin + 2, yPos);
    
    pdf.setTextColor(...colors.dark);
    pdf.setFontSize(9);
    const insightLines = pdf.splitTextToSize(insight, pageWidth - margin * 2 - 12);
    insightLines.forEach((line: string) => {
      pdf.text(line, margin + 10, yPos);
      yPos += 5;
    });
    yPos += 3;
  });

  // ========================================
  // 추천 사항 섹션
  // ========================================
  checkPageBreak(50);
  
  pdf.setTextColor(...colors.primaryDark);
  pdf.setFontSize(13);
  pdf.text(koreanFontLoaded ? "✅ 추천 사항" : "Recommendations", margin, yPos);
  yPos += 8;

  data.recommendations.forEach((rec, i) => {
    checkPageBreak(10);
    
    // 체크 아이콘 배경
    pdf.setFillColor(...colors.success);
    pdf.circle(margin + 3, yPos - 1.5, 3, "F");
    
    pdf.setTextColor(...colors.white);
    pdf.setFontSize(8);
    pdf.text("✓", margin + 1.5, yPos);
    
    pdf.setTextColor(...colors.dark);
    pdf.setFontSize(9);
    const recLines = pdf.splitTextToSize(rec, pageWidth - margin * 2 - 12);
    recLines.forEach((line: string) => {
      pdf.text(line, margin + 10, yPos);
      yPos += 5;
    });
    yPos += 3;
  });

  // ========================================
  // 결론 섹션
  // ========================================
  checkPageBreak(40);
  
  pdf.setFillColor(...colors.light);
  pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 30, 3, 3, "F");
  
  pdf.setTextColor(...colors.primaryDark);
  pdf.setFontSize(12);
  pdf.text(koreanFontLoaded ? "📝 결론" : "Conclusion", margin + 5, yPos + 8);
  
  pdf.setTextColor(...colors.dark);
  pdf.setFontSize(9);
  const conclusionLines = pdf.splitTextToSize(data.conclusion, pageWidth - margin * 2 - 10);
  let conclusionY = yPos + 15;
  conclusionLines.slice(0, 3).forEach((line: string) => {
    pdf.text(line, margin + 5, conclusionY);
    conclusionY += 5;
  });

  // ========================================
  // 푸터
  // ========================================
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFillColor(...colors.dark);
    pdf.rect(0, pageHeight - 12, pageWidth, 12, "F");
    
    pdf.setTextColor(...colors.white);
    pdf.setFontSize(8);
    pdf.text("CRM AI System | Confidential Report", margin, pageHeight - 5);
    pdf.text(`Page ${i} / ${totalPages}`, pageWidth - margin - 15, pageHeight - 5);
  }

  return pdf.output('blob');
}

// ============================================================================
// 다운로드 헬퍼 함수
// ============================================================================

export async function downloadInsightReportPdf(data: InsightReportData, filename?: string): Promise<void> {
  const blob = await generateInsightReportPdf(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `CRM_Report_${data.period.replace(/\s/g, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
