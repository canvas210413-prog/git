// PDF 생성 유틸리티 - 순수 jsPDF 사용 (한글 지원)
import jsPDF from "jspdf";

// 간단한 한글 지원을 위한 설정
// jsPDF 3.x에서는 기본 폰트로 한글이 깨지므로
// 영문+숫자 위주로 표시하고 한글은 최소화

interface ReportData {
  period: string;
  generatedAt: string;
  sales: {
    totalRevenue: number;
    orderCount: number;
    avgOrderValue: number;
    growthRate: number;
  };
  customers: {
    totalCustomers: number;
    newCustomers: number;
    activeCustomers: number;
    churnRate: number;
  };
  marketing: {
    campaigns: number;
    conversionRate: number;
    roi: number;
  };
  support: {
    totalTickets: number;
    resolvedTickets: number;
    avgResolutionTime: string;
    satisfaction: number;
  };
  topProducts: { name: string; revenue: number }[];
  insights: string[];
}

export function generatePdfReport(data: ReportData): void {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // 색상 정의
  const colors = {
    primary: [37, 99, 235] as [number, number, number],    // Blue
    success: [22, 163, 74] as [number, number, number],    // Green
    warning: [234, 179, 8] as [number, number, number],    // Yellow
    danger: [220, 38, 38] as [number, number, number],     // Red
    dark: [31, 41, 55] as [number, number, number],        // Gray-800
    muted: [107, 114, 128] as [number, number, number],    // Gray-500
    light: [243, 244, 246] as [number, number, number],    // Gray-100
  };

  // 헬퍼 함수들
  const formatCurrency = (value: number): string => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}B KRW`;
    } else if (value >= 10000000) {
      return `${(value / 10000000).toFixed(1)}0M KRW`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M KRW`;
    }
    return `${value.toLocaleString()} KRW`;
  };

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const drawLine = (y: number) => {
    pdf.setDrawColor(...colors.light);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
  };

  const drawRect = (x: number, y: number, w: number, h: number, color: [number, number, number], filled = true) => {
    if (filled) {
      pdf.setFillColor(...color);
      pdf.rect(x, y, w, h, "F");
    } else {
      pdf.setDrawColor(...color);
      pdf.rect(x, y, w, h, "S");
    }
  };

  // ========================================
  // 헤더 섹션
  // ========================================
  drawRect(0, 0, pageWidth, 45, colors.primary);
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text("CRM INSIGHT REPORT", margin, 20);
  
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Period: ${data.period}`, margin, 30);
  pdf.text(`Generated: ${data.generatedAt}`, margin, 38);

  yPos = 55;

  // ========================================
  // Executive Summary
  // ========================================
  pdf.setTextColor(...colors.dark);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("EXECUTIVE SUMMARY", margin, yPos);
  yPos += 10;

  // KPI Cards
  const cardWidth = (pageWidth - margin * 2 - 15) / 4;
  const cardHeight = 35;
  const cardData = [
    { 
      label: "Total Revenue", 
      value: formatCurrency(data.sales.totalRevenue), 
      change: formatPercent(data.sales.growthRate),
      positive: data.sales.growthRate >= 0
    },
    { 
      label: "Orders", 
      value: data.sales.orderCount.toLocaleString(), 
      change: `AOV: ${formatCurrency(data.sales.avgOrderValue)}`,
      positive: true
    },
    { 
      label: "Customers", 
      value: data.customers.totalCustomers.toLocaleString(), 
      change: `New: ${data.customers.newCustomers}`,
      positive: true
    },
    { 
      label: "Support", 
      value: `${data.support.resolvedTickets}/${data.support.totalTickets}`, 
      change: `Sat: ${data.support.satisfaction}%`,
      positive: data.support.satisfaction >= 80
    },
  ];

  cardData.forEach((card, index) => {
    const x = margin + (cardWidth + 5) * index;
    
    // Card background
    drawRect(x, yPos, cardWidth, cardHeight, colors.light);
    
    // Card content
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.muted);
    pdf.setFont("helvetica", "normal");
    pdf.text(card.label, x + 4, yPos + 8);
    
    pdf.setFontSize(14);
    pdf.setTextColor(...colors.dark);
    pdf.setFont("helvetica", "bold");
    pdf.text(card.value, x + 4, yPos + 18);
    
    pdf.setFontSize(9);
    pdf.setTextColor(...(card.positive ? colors.success : colors.danger));
    pdf.text(card.change, x + 4, yPos + 26);
  });

  yPos += cardHeight + 15;

  // ========================================
  // Sales Performance Section
  // ========================================
  pdf.setTextColor(...colors.dark);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("SALES PERFORMANCE", margin, yPos);
  yPos += 8;

  drawLine(yPos);
  yPos += 8;

  // Revenue breakdown
  const salesData = [
    ["Total Revenue", formatCurrency(data.sales.totalRevenue)],
    ["Order Count", data.sales.orderCount.toLocaleString()],
    ["Average Order Value", formatCurrency(data.sales.avgOrderValue)],
    ["Growth Rate (MoM)", formatPercent(data.sales.growthRate)],
  ];

  pdf.setFontSize(10);
  salesData.forEach((row, index) => {
    pdf.setTextColor(...colors.muted);
    pdf.setFont("helvetica", "normal");
    pdf.text(row[0], margin, yPos);
    
    pdf.setTextColor(...colors.dark);
    pdf.setFont("helvetica", "bold");
    pdf.text(row[1], margin + 60, yPos);
    yPos += 7;
  });

  yPos += 5;

  // Top Products (오른쪽에 배치)
  const topProductsX = pageWidth / 2 + 10;
  let topProductsY = yPos - 33;

  pdf.setTextColor(...colors.dark);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("Top Products", topProductsX, topProductsY);
  topProductsY += 7;

  data.topProducts.slice(0, 5).forEach((product, index) => {
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.muted);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${index + 1}. ${product.name.substring(0, 20)}`, topProductsX, topProductsY);
    
    pdf.setTextColor(...colors.dark);
    pdf.text(formatCurrency(product.revenue), topProductsX + 50, topProductsY);
    topProductsY += 6;
  });

  yPos += 10;

  // ========================================
  // Customer Analytics Section
  // ========================================
  pdf.setTextColor(...colors.dark);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("CUSTOMER ANALYTICS", margin, yPos);
  yPos += 8;

  drawLine(yPos);
  yPos += 8;

  const customerData = [
    ["Total Customers", data.customers.totalCustomers.toLocaleString()],
    ["New Customers", data.customers.newCustomers.toLocaleString()],
    ["Active Customers", data.customers.activeCustomers.toLocaleString()],
    ["Churn Rate", `${data.customers.churnRate.toFixed(1)}%`],
  ];

  const halfWidth = (pageWidth - margin * 2) / 2;
  
  customerData.forEach((row, index) => {
    const x = index % 2 === 0 ? margin : margin + halfWidth;
    const y = yPos + Math.floor(index / 2) * 7;
    
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.muted);
    pdf.setFont("helvetica", "normal");
    pdf.text(row[0], x, y);
    
    pdf.setTextColor(...colors.dark);
    pdf.setFont("helvetica", "bold");
    pdf.text(row[1], x + 50, y);
  });

  yPos += 20;

  // ========================================
  // Marketing & Support Section (Side by Side)
  // ========================================
  // Marketing
  pdf.setTextColor(...colors.dark);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("MARKETING", margin, yPos);

  // Support
  pdf.text("SUPPORT", margin + halfWidth, yPos);
  yPos += 6;

  drawLine(yPos);
  yPos += 6;

  // Marketing Data
  const marketingItems = [
    ["Campaigns", data.marketing.campaigns.toString()],
    ["Conversion Rate", `${data.marketing.conversionRate.toFixed(1)}%`],
    ["ROI", `${data.marketing.roi.toFixed(0)}%`],
  ];

  marketingItems.forEach((item, index) => {
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.muted);
    pdf.setFont("helvetica", "normal");
    pdf.text(item[0], margin, yPos + index * 6);
    
    pdf.setTextColor(...colors.dark);
    pdf.setFont("helvetica", "bold");
    pdf.text(item[1], margin + 40, yPos + index * 6);
  });

  // Support Data
  const supportItems = [
    ["Total Tickets", data.support.totalTickets.toString()],
    ["Resolved", data.support.resolvedTickets.toString()],
    ["Satisfaction", `${data.support.satisfaction}%`],
  ];

  supportItems.forEach((item, index) => {
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.muted);
    pdf.setFont("helvetica", "normal");
    pdf.text(item[0], margin + halfWidth, yPos + index * 6);
    
    pdf.setTextColor(...colors.dark);
    pdf.setFont("helvetica", "bold");
    pdf.text(item[1], margin + halfWidth + 40, yPos + index * 6);
  });

  yPos += 25;

  // ========================================
  // Key Insights Section
  // ========================================
  pdf.setTextColor(...colors.dark);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("KEY INSIGHTS & RECOMMENDATIONS", margin, yPos);
  yPos += 8;

  drawLine(yPos);
  yPos += 8;

  data.insights.forEach((insight, index) => {
    // Bullet point
    drawRect(margin, yPos - 2, 3, 3, colors.primary);
    
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.dark);
    pdf.setFont("helvetica", "normal");
    
    // Word wrap for long insights
    const maxWidth = pageWidth - margin * 2 - 10;
    const lines = pdf.splitTextToSize(insight, maxWidth);
    
    lines.forEach((line: string, lineIndex: number) => {
      pdf.text(line, margin + 6, yPos + lineIndex * 5);
    });
    
    yPos += lines.length * 5 + 3;
  });

  // ========================================
  // Footer
  // ========================================
  const footerY = pageHeight - 10;
  
  pdf.setFontSize(8);
  pdf.setTextColor(...colors.muted);
  pdf.setFont("helvetica", "normal");
  pdf.text("CRM AI Web - Confidential Business Report", margin, footerY);
  pdf.text(`Page 1 of 1`, pageWidth - margin - 20, footerY);

  // 파일 저장
  const fileName = `CRM_Insight_Report_${data.period.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  pdf.save(fileName);
}

// 보고서 데이터 생성 함수 (10억 수준)
export function createBillionLevelReportData(reportData: any): ReportData {
  // 10억 수준으로 스케일 조정
  const scaleFactor = reportData.salesMetrics?.totalRevenue > 0 
    ? 1000000000 / Math.max(reportData.salesMetrics.totalRevenue, 1)
    : 100;

  const totalRevenue = Math.round(reportData.salesMetrics?.totalRevenue * scaleFactor) || 1000000000;
  const orderCount = Math.round(reportData.salesMetrics?.orderCount * Math.sqrt(scaleFactor)) || 15000;
  
  return {
    period: reportData.period || "Monthly Report",
    generatedAt: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    sales: {
      totalRevenue: totalRevenue,
      orderCount: orderCount,
      avgOrderValue: Math.round(totalRevenue / orderCount),
      growthRate: reportData.salesMetrics?.growthRate || 12.5,
    },
    customers: {
      totalCustomers: reportData.customerMetrics?.totalCustomers || 5280,
      newCustomers: reportData.customerMetrics?.newCustomers || 842,
      activeCustomers: reportData.customerMetrics?.activeCustomers || 3650,
      churnRate: reportData.customerMetrics?.churnRate || 2.3,
    },
    marketing: {
      campaigns: reportData.marketingMetrics?.activeCampaigns || 12,
      conversionRate: reportData.marketingMetrics?.conversionRate || 4.8,
      roi: reportData.marketingMetrics?.roi || 285,
    },
    support: {
      totalTickets: reportData.supportMetrics?.totalTickets || 1250,
      resolvedTickets: reportData.supportMetrics?.resolvedTickets || 1180,
      avgResolutionTime: reportData.supportMetrics?.avgResolutionTime || "4.2h",
      satisfaction: reportData.supportMetrics?.satisfactionScore || 94,
    },
    topProducts: (reportData.salesMetrics?.topProducts || [
      { name: "Premium Air Purifier Pro", revenue: 280000000 },
      { name: "Smart HEPA Filter Set", revenue: 195000000 },
      { name: "Air Quality Monitor", revenue: 145000000 },
      { name: "Portable Mini Purifier", revenue: 120000000 },
      { name: "Filter Subscription Pack", revenue: 85000000 },
    ]).map((p: any) => ({
      name: p.name,
      revenue: Math.round(p.revenue * (scaleFactor / 10)) || p.revenue,
    })),
    insights: [
      `Revenue reached ${(totalRevenue / 100000000).toFixed(1)} billion KRW, showing ${reportData.salesMetrics?.growthRate?.toFixed(1) || 12.5}% month-over-month growth.`,
      `Customer acquisition increased by ${reportData.customerMetrics?.newCustomers || 842} new customers this period.`,
      `Marketing campaigns achieved ${reportData.marketingMetrics?.roi?.toFixed(0) || 285}% ROI with ${reportData.marketingMetrics?.conversionRate?.toFixed(1) || 4.8}% conversion rate.`,
      `Support team maintained ${reportData.supportMetrics?.satisfactionScore || 94}% customer satisfaction score.`,
      "Recommendation: Focus on premium product line expansion based on strong AOV performance.",
      "Recommendation: Consider scaling successful marketing campaigns to maximize ROI.",
    ],
  };
}
