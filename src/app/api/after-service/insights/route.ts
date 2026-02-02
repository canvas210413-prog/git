import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chatCompletion } from "@/lib/ai";

// ============================================================================
// Types
// ============================================================================

interface InsightRequestBody {
  startDate?: string;
  endDate?: string;
}

interface ASStats {
  총AS건수: number;
  ?�료건수: number;
  진행중건?? number;
  ?�수?��? number;
  증상별분?? Record<string, number>;
  ?�선?�위분포: Record<string, number>;
  ?�터교체건수: number;
  ?�균비용: number;
  고객만족?? string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getDateRange(startDate?: string, endDate?: string) {
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate
    ? new Date(startDate)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
}

function calculateStats(asData: any[]): ASStats {
  const totalCount = asData.length;
  const completedCount = asData.filter((as) => as.status === "COMPLETED").length;
  const inProgressCount = asData.filter((as) => as.status === "IN_PROGRESS").length;
  const receivedCount = asData.filter((as) => as.status === "RECEIVED").length;

  const issueTypeDistribution = asData.reduce((acc, as) => {
    acc[as.issueType] = (acc[as.issueType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityDistribution = asData.reduce((acc, as) => {
    acc[as.priority] = (acc[as.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filterReplacementCount = asData.filter((as) => as.filterReplaced).length;

  const avgCost = totalCount > 0
    ? Math.round(asData.reduce((sum, as) => sum + as.totalCost, 0) / totalCount)
    : 0;

  const ratedAS = asData.filter((as) => as.customerRating !== null);
  const avgRating = ratedAS.length > 0
    ? (ratedAS.reduce((sum, as) => sum + (as.customerRating || 0), 0) / ratedAS.length).toFixed(1)
    : "?��??�음";

  return {
    총AS건수: totalCount,
    ?�료건수: completedCount,
    진행중건?? inProgressCount,
    ?�수?��? receivedCount,
    증상별분?? issueTypeDistribution,
    ?�선?�위분포: priorityDistribution,
    ?�터교체건수: filterReplacementCount,
    ?�균비용: avgCost,
    고객만족?? avgRating,
  };
}

function buildPrompt(stats: ASStats, recentIssues: any[], start: Date, end: Date, additionalData: any): string {
  return `?�신?� 가?�제??AS 관�??�문가?�니?? ?�음 AS ?�이?��? 분석?�고 경영진을 ?�한 ?�사?�트�??�공?�세??

## AS ?�계 (${start.toISOString().split("T")[0]} ~ ${end.toISOString().split("T")[0]})

### 기본 ?�황
- �?AS 건수: ${stats.총AS건수}�?
- ?�료: ${stats.?�료건수}�? 진행�? ${stats.진행중건??�? ?�수?��? ${stats.?�수?��?�?
- ?�결�? ${stats.총AS건수 > 0 ? ((stats.?�료건수 / stats.총AS건수) * 100).toFixed(1) : 0}%
- ?�균 비용: ${stats.?�균비용.toLocaleString()}??
- 고객 만족?? ${stats.고객만족??
- ?�터 교체 건수: ${stats.?�터교체건수}�?

### 증상�?분포
${Object.entries(stats.증상별분??
  .map(([type, count]) => `- ${type}: ${count}�?(${((count as number / stats.총AS건수) * 100).toFixed(1)}%)`)
  .join("\n")}

### ?�선?�위�?분포
${Object.entries(stats.?�선?�위분포)
  .map(([priority, count]) => `- ${priority}: ${count}�?)
  .join("\n")}

### 처리 ?�간 분석
- ?�균 처리 ?�간: ${additionalData.avgProcessingTime}?�간
- 최장 처리 �? ${additionalData.maxProcessingDays}??
- 긴급 �?�?미완�? ${additionalData.urgentPending}�?

### 최근 주요 ?�슈
${recentIssues.map((issue, i) => `${i + 1}. [${issue.?�켓번호}] ${issue.?�목} (${issue.증상}, ${issue.?�선?�위}, ${issue.?�태})`).join("\n")}

### ?�당???�황
${additionalData.assigneeStats.map((a: any) => `- ${a.name}: ${a.count}�?(?�료??${a.completionRate}%)`).join("\n")}

?�음 ?�식?�로 ?�국?�로 ?�사?�트�??�성?�세??

# AS 관�??�사?�트 리포??

## ?�� ?�심 발견?�항
(3-4개의 주요 발견?�항??bullet point�?

## ?�� ?�세 분석

### 1. 증상 ?�턴 분석
(가??빈번??증상�?�??�인, ?�렌??분석)

### 2. ?�영 ?�율??
(처리 ?�황, ?�선?�위 관�? 개선 ?�요 ?�항)

### 3. 고객 만족??분석
(만족???�황�?개선 방향)

### 4. 비용 분석
(비용 ?�황�?최적??방안)

## ?�� 개선 ?�안

### 즉시 조치 ?�항
(1-2개의 긴급 개선 ?�항)

### 중장�?개선 방안
(2-3개의 ?�략??개선 방안)

## ?�� ?�측 �??�비책
(?�후 ?�상?�는 ?�슈?� ?�??방안)

?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━
리포?�는 간결?�고 ?�행 가?�한 ?�용?�로 ?�성?�세?? ?�는 ?�용?��? 마세??`;
}

// ?�장???�롬?�트 구성 (?�품, ?�리?�역, ?�체�?분석 ?�함)
function buildEnhancedPrompt(
  stats: ASStats, 
  recentIssues: any[], 
  start: Date, 
  end: Date, 
  additionalData: any,
  productAnalysis: any[],
  topRepairs: string[],
  companyAnalysis: string[]
): string {
  return `?�신?� 가?�제??AS 관�??�문가?�니?? ?�음 AS ?�이?��? 분석?�고 경영진을 ?�한 ?�사?�트�??�공?�세??

## AS ?�계 (${start.toISOString().split("T")[0]} ~ ${end.toISOString().split("T")[0]})

### 기본 ?�황
- �?AS 건수: ${stats.총AS건수}�?
- ?�료: ${stats.?�료건수}�? 진행�? ${stats.진행중건??�? ?�수?��? ${stats.?�수?��?�?
- ?�결�? ${stats.총AS건수 > 0 ? ((stats.?�료건수 / stats.총AS건수) * 100).toFixed(1) : 0}%
- ?�균 비용: ${stats.?�균비용.toLocaleString()}??
- 고객 만족?? ${stats.고객만족??
- ?�터 교체 건수: ${stats.?�터교체건수}�?

### ?�� ?�품�?AS 분석 (?�심!)
${productAnalysis.map((p, i) => `${i + 1}. **${p.?�품�?** - ${p.AS건수}�?
   - 주요 증상: ${p.주요증상}
   - ?�리 ?�역: ${p.주요?�리?�역}`).join("\n")}

### ?�� ?�주 발생?�는 ?�리 ?�역
${topRepairs.length > 0 ? topRepairs.map((r, i) => `${i + 1}. ${r}`).join("\n") : "- ?�리 ?�역 ?�이???�음"}

### ?�� ?�체�?AS ?�황
${companyAnalysis.length > 0 ? companyAnalysis.join("\n") : "- ?�체�??�이???�음"}

### 증상�?분포
${Object.entries(stats.증상별분??
  .map(([type, count]) => `- ${type}: ${count}�?(${((count as number / stats.총AS건수) * 100).toFixed(1)}%)`)
  .join("\n") || "- 증상 ?�이???�음"}

### 처리 ?�간 분석
- ?�균 처리 ?�간: ${additionalData.avgProcessingTime}?�간
- 최장 처리 �? ${additionalData.maxProcessingDays}??
- 긴급 �?�?미완�? ${additionalData.urgentPending}�?

### 최근 AS ?�세 ?�역 (10�?
${recentIssues.map((issue, i) => `${i + 1}. [${issue.?�켓번호}] ${issue.?�품} - ${issue.?�용}
   - ?�리: ${issue.?�리?�역} | ?�체: ${issue.?�체} | ?�태: ${issue.?�태}`).join("\n")}

### ?�당???�황
${additionalData.assigneeStats.map((a: any) => `- ${a.name}: ${a.count}�?(?�료??${a.completionRate}%)`).join("\n")}

?�음 ?�식?�로 ?�국?�로 ?�사?�트�??�성?�세??

# AS 관�??�사?�트 리포??

## ?�� ?�심 발견?�항
(3-4개의 주요 발견?�항??bullet point�?- ?�히 ?�품�? ?�리?�역 ?�턴??주목)

## ?�� ?�세 분석

### 1. ?�품�?AS ?�턴 분석
(가??문제가 많�? ?�품�?주요 증상, 반복?�는 ?�리 ?�턴 분석)

### 2. ?�리 ?�역 ?�렌??
(?�주 발생?�는 ?�리 ?�형, ?�방 가?�한 문제 ?�별)

### 3. ?�체�??�성
(?�체�?AS ?�청 ?�턴, ?�정 ?�체 집중 지???�요 ?��?)

### 4. ?�영 ?�율??
(처리 ?�황, ?�선?�위 관�? 병목 구간 분석)

## ?�� 개선 ?�안

### 즉시 조치 ?�항
(?�품 ?�질 개선, ?�주 발생?�는 문제???�???�방�?

### 중장�?개선 방안
(?�품 개선 ?�안, 고객 교육, ?�로?�스 최적??

## ?�� ?�품�??�질 개선 ?�안
(분석 결과�?바탕?�로 �??�품???�??구체?�인 ?�질 개선 방안)

?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━
리포?�는 ?�제 ?�이?��? 기반?�로 구체?�이�??�행 가?�한 ?�용?�로 ?�성?�세?? ?�는 ?�용?��? 마세??`;
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  console.log("[AS Insights API] ?�청 ?�작");
  
  try {
    const body: InsightRequestBody = await request.json();
    console.log("[AS Insights API] ?�청 body:", JSON.stringify(body));
    const { startDate, endDate } = body;

    // ?�짜 범위 ?�정
    const { start, end } = getDateRange(startDate, endDate);
    console.log("[AS Insights API] ?�짜 범위:", { start, end });
    
    // 종료?�을 ?�루 ?�으�??�정
    end.setHours(23, 59, 59, 999);

    console.log("[AS Insights API] Prisma 쿼리 ?�작");
    // AS ?�이??조회 - createdAt 기�??�로 ?�순??
    const allAS = await prisma.afterservice.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    console.log("[AS Insights API] Prisma 쿼리 ?�료. ?�이????", allAS.length);

    // ?�이???�음 처리
    if (allAS.length === 0) {
      return NextResponse.json({
        insight: "# AS 관�??�사?�트 리포??n\n분석??AS ?�이?��? ?�습?�다. ?�짜 범위�?조정?�주?�요.",
        stats: {
          총AS건수: 0,
          ?�료건수: 0,
          진행중건?? 0,
          ?�수?��? 0,
          증상별분?? {},
          ?�선?�위분포: {},
          ?�터교체건수: 0,
          ?�균비용: 0,
          고객만족?? "?��??�음",
        },
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        analyzedCount: 0,
      });
    }

    // ?�계 계산
    const stats = calculateStats(allAS);

    // 추�? 분석 ?�이??
    // ?�균 처리 ?�간 계산
    const completedAS = allAS.filter((as) => as.status === "COMPLETED" && as.completedDate);
    let avgProcessingTime = 0;
    let maxProcessingDays = 0;
    if (completedAS.length > 0) {
      const times = completedAS.map((as) => {
        const created = new Date(as.createdAt).getTime();
        const completed = as.completedDate ? new Date(as.completedDate).getTime() : created;
        return (completed - created) / (1000 * 60 * 60); // ?�간 ?�위
      });
      avgProcessingTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      maxProcessingDays = Math.round(Math.max(...times) / 24);
    }

    // 긴급 �?�?미완�?
    const urgentPending = allAS.filter(
      (as) => as.priority === "HIGH" && as.status !== "COMPLETED"
    ).length;

    // ?�당?�별 ?�계
    const assigneeMap = new Map<string, { count: number; completed: number }>();
    allAS.forEach((as) => {
      const name = as\.user?.name || "미배??;
      if (!assigneeMap.has(name)) {
        assigneeMap.set(name, { count: 0, completed: 0 });
      }
      const stat = assigneeMap.get(name)!;
      stat.count++;
      if (as.status === "COMPLETED") stat.completed++;
    });

    const assigneeStats = Array.from(assigneeMap.entries())
      .map(([name, stat]) => ({
        name,
        count: stat.count,
        completionRate: stat.count > 0 ? Math.round((stat.completed / stat.count) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const additionalData = {
      avgProcessingTime,
      maxProcessingDays,
      urgentPending,
      assigneeStats,
    };

    // ?�품�?AS 분석
    const productStats = new Map<string, { count: number; issues: string[]; repairs: string[] }>();
    allAS.forEach((as) => {
      const product = as.productName || "미분�?;
      if (!productStats.has(product)) {
        productStats.set(product, { count: 0, issues: [], repairs: [] });
      }
      const stat = productStats.get(product)!;
      stat.count++;
      if (as.issueTitle) stat.issues.push(as.issueTitle);
      if (as.repairContent) stat.repairs.push(as.repairContent);
      if (as.repairDetails) stat.repairs.push(as.repairDetails);
    });

    const productAnalysis = Array.from(productStats.entries())
      .map(([product, stat]) => ({
        ?�품�? product,
        AS건수: stat.count,
        주요증상: [...new Set(stat.issues)].slice(0, 3).join(", ") || "?�보 ?�음",
        주요?�리?�역: [...new Set(stat.repairs)].slice(0, 3).join(", ") || "?�보 ?�음",
      }))
      .sort((a, b) => b.AS건수 - a.AS건수)
      .slice(0, 10);

    // ?�리 ?�역 ?�턴 분석
    const repairPatterns = new Map<string, number>();
    allAS.forEach((as) => {
      const repair = as.repairContent || as.repairDetails;
      if (repair) {
        repairPatterns.set(repair, (repairPatterns.get(repair) || 0) + 1);
      }
    });

    const topRepairs = Array.from(repairPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([repair, count]) => `${repair}: ${count}�?);

    // ?�체�?AS ?�황
    const companyStats = new Map<string, number>();
    allAS.forEach((as) => {
      const company = as.companyName || "개인";
      companyStats.set(company, (companyStats.get(company) || 0) + 1);
    });

    const companyAnalysis = Array.from(companyStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([company, count]) => `${company}: ${count}�?);

    // 주요 ?�슈 ?�플 (?�세 ?�보 ?�함)
    const recentIssues = allAS.slice(0, 10).map((as) => ({
      ?�켓번호: as.ticketNumber,
      ?�품: as.productName || "미분�?,
      ?�용: as.issueTitle || "?�보 ?�음",
      ?�리?�역: as.repairContent || as.repairDetails || "미처�?,
      ?�태: as.status,
      ?�체: as.companyName || "개인",
    }));

    // ?�장???�롬?�트 구성
    const prompt = buildEnhancedPrompt(stats, recentIssues, start, end, additionalData, productAnalysis, topRepairs, companyAnalysis);

    console.log("[AS Insights API] LLM ?�출 ?�작");
    // LLM ?�출
    let llmResponse;
    try {
      llmResponse = await chatCompletion(
        [
          {
            role: "system",
            content:
              "?�신?� 20??경력??AS 관�??�문가?�자 ?�이??분석가?�니?? ?�이?��? 기반?�로 ?�질?�이�??�행 가?�한 ?�사?�트�??�공?�니?? ?�국?�로�??�성?�며, ?�어 ?�어??최소?�합?�다.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        {
          maxTokens: 4096,
          temperature: 0.7,
        }
      );
    } catch (llmError) {
      console.error("[AS Insights API] LLM ?�출 ?�류:", llmError);
      // LLM ?�결 ?�패?�에???�계 ?�이?�는 반환
      return NextResponse.json({
        insight: `# AS 관�??�사?�트 리포??

?�️ **AI 분석 ?�비?�에 ?�결?????�습?�다.**

?�재 LLM ?�버???�결?????�어 AI 분석??불�??�합?�다.
?�래 ?�계 ?�이?��? 참고?�주?�요.

## ?�� 기본 ?�계 ?�약

- **�?AS 건수**: ${stats.총AS건수}�?
- **?�료**: ${stats.?�료건수}�?(${stats.총AS건수 > 0 ? ((stats.?�료건수 / stats.총AS건수) * 100).toFixed(1) : 0}%)
- **진행�?*: ${stats.진행중건??�?
- **?�수?��?*: ${stats.?�수?��?�?
- **?�균 비용**: ${stats.?�균비용.toLocaleString()}??
- **고객 만족??*: ${stats.고객만족??

### 증상�?분포
${Object.entries(stats.증상별분??.map(([type, count]) => `- ${type}: ${count}�?).join('\n') || '- ?�이???�음'}

### ?�선?�위�?분포
${Object.entries(stats.?�선?�위분포).map(([priority, count]) => `- ${priority}: ${count}�?).join('\n') || '- ?�이???�음'}

---
*LLM ?�버 ?�결 ???�세 분석??받으?????�습?�다.*`,
        stats,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        analyzedCount: allAS.length,
        llmError: true,
      });
    }

    console.log("[AS Insights API] LLM ?�답 ?�공, 리턴");
    return NextResponse.json({
      insight: llmResponse.content,
      stats,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      analyzedCount: allAS.length,
    });
  } catch (error) {
    console.error("[AS Insights API] ?�사?�트 ?�성 ?�류:", error);
    
    // ?�세???�러 ?�보 반환
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      {
        error: "?�사?�트 ?�성 ?�패",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
