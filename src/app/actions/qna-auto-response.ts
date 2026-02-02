"use server";

import { prisma } from "@/lib/prisma";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:27b";

interface LLMResponseResult {
  success: boolean;
  response?: string;
  error?: string;
}

interface AutoResponseResult {
  success: boolean;
  sessionId?: string;
  response?: string;
  priority?: string;
  error?: string;
}

// Q&A 질문에 대한 LLM 자동 응답 생성
export async function generateQnAResponse(
  question: string,
  customerName: string,
  priority: string,
  context?: string
): Promise<LLMResponseResult> {
  try {
    const systemPrompt = `당신은 친절하고 전문적인 고객 서비스 담당자입니다. 
네이버 스마트스토어 상품에 대한 고객 문의에 답변해야 합니다.
다음 지침을 따르세요:

1. 친절하고 공손한 어투를 사용하세요.
2. 질문에 정확하게 답변하세요.
3. 답변은 간결하되 충분한 정보를 제공하세요.
4. 불확실한 내용은 확인 후 답변드리겠다고 안내하세요.
5. 고객의 이름을 불러 개인화된 응대를 하세요.

우선순위 정보:
- CRITICAL: 매우 긴급한 문의입니다. 빠른 해결이 필요합니다.
- HIGH: 중요한 문의입니다. 신속하게 처리해야 합니다.
- MEDIUM: 일반적인 문의입니다.
- LOW: 단순 문의입니다.

현재 문의 우선순위: ${priority}`;

    const userPrompt = `고객명: ${customerName}
질문: ${question}
${context ? `\n추가 컨텍스트: ${context}` : ''}

위 질문에 대해 친절하고 전문적인 답변을 작성해주세요.`;

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: userPrompt,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 500,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      response: data.response,
    };
  } catch (error) {
    console.error("LLM 응답 생성 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "LLM 응답 생성 중 오류가 발생했습니다.",
    };
  }
}

// 세션에 대한 자동 응답 생성 및 저장
export async function generateAndSaveAutoResponse(sessionId: string): Promise<AutoResponseResult> {
  try {
    // 세션 정보 조회
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: "asc" },
          take: 5,
        },
      },
    });

    if (!session) {
      return { success: false, error: "세션을 찾을 수 없습니다." };
    }

    // 첫 번째 고객 메시지 추출 (질문)
    const customerMessage = session.messages.find((m: { role: string; content: string }) => m.role === "user" || m.role === "customer");
    const question = customerMessage?.content || session.subject;

    // 우선순위 레이블 변환
    const priorityLabels: Record<number, string> = {
      0: "LOW",
      1: "MEDIUM", 
      2: "HIGH",
      3: "CRITICAL",
    };
    const priority = priorityLabels[session.priority] || "MEDIUM";

    // LLM 응답 생성
    const llmResult = await generateQnAResponse(
      question,
      session.customer.name,
      priority
    );

    if (!llmResult.success || !llmResult.response) {
      return { 
        success: false, 
        error: llmResult.error || "응답 생성 실패" 
      };
    }

    // 자동 응답 메시지 저장
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        content: llmResult.response,
        senderType: "BOT",
      },
    });

    // 세션 상태 업데이트 (자동 응답 생성됨)
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        metadata: JSON.stringify({
          ...JSON.parse(session.metadata || "{}"),
          autoResponseGenerated: true,
          autoResponseGeneratedAt: new Date().toISOString(),
        }),
      },
    });

    return {
      success: true,
      sessionId,
      response: llmResult.response,
      priority,
    };
  } catch (error) {
    console.error("자동 응답 생성/저장 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "자동 응답 처리 중 오류가 발생했습니다.",
    };
  }
}

// 다중 세션에 대한 일괄 자동 응답 생성
export async function batchGenerateAutoResponses(sessionIds: string[]): Promise<{
  success: boolean;
  results: AutoResponseResult[];
  successCount: number;
  failCount: number;
}> {
  const results: AutoResponseResult[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const sessionId of sessionIds) {
    const result = await generateAndSaveAutoResponse(sessionId);
    results.push(result);
    
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }

    // Rate limiting: 1초 간격
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return {
    success: failCount === 0,
    results,
    successCount,
    failCount,
  };
}

// 미응답 Q&A 세션 조회
export async function getUnansweredQnASessions(): Promise<{
  success: boolean;
  sessions?: any[];
  error?: string;
}> {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: {
        channel: "NAVER",
        status: { in: ["WAITING", "ASSIGNED"] },
        messages: {
          none: {
            role: "assistant",
          },
        },
      },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: "asc" },
          take: 3,
        },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
    });

    return {
      success: true,
      sessions,
    };
  } catch (error) {
    console.error("미응답 세션 조회 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "조회 중 오류가 발생했습니다.",
    };
  }
}

// 자동 응답 승인 (실제 답변으로 처리)
export async function approveAutoResponse(sessionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 자동 생성된 응답 찾기
    const autoMessage = await prisma.chatMessage.findFirst({
      where: {
        sessionId,
        role: "assistant",
        isAutoGenerated: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!autoMessage) {
      return { success: false, error: "자동 생성된 응답이 없습니다." };
    }

    // 메시지 승인 처리 (isAutoGenerated = false로 변경하여 확정)
    await prisma.chatMessage.update({
      where: { id: autoMessage.id },
      data: {
        isAutoGenerated: false,
      },
    });

    // 세션 상태 업데이트
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        metadata: JSON.stringify({
          autoResponseApproved: true,
          autoResponseApprovedAt: new Date().toISOString(),
        }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("자동 응답 승인 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "승인 처리 중 오류가 발생했습니다.",
    };
  }
}

// 자동 응답 수정 후 승인
export async function editAndApproveAutoResponse(
  sessionId: string, 
  editedContent: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 자동 생성된 응답 찾기
    const autoMessage = await prisma.chatMessage.findFirst({
      where: {
        sessionId,
        role: "assistant",
        isAutoGenerated: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!autoMessage) {
      return { success: false, error: "자동 생성된 응답이 없습니다." };
    }

    // 메시지 내용 수정 및 승인
    await prisma.chatMessage.update({
      where: { id: autoMessage.id },
      data: {
        content: editedContent,
        isAutoGenerated: false,
      },
    });

    // 세션 상태 업데이트
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        metadata: JSON.stringify({
          autoResponseEdited: true,
          autoResponseApprovedAt: new Date().toISOString(),
        }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("자동 응답 수정/승인 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "처리 중 오류가 발생했습니다.",
    };
  }
}

// 자동 응답 거부 (삭제)
export async function rejectAutoResponse(sessionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 자동 생성된 응답 삭제
    await prisma.chatMessage.deleteMany({
      where: {
        sessionId,
        role: "assistant",
        isAutoGenerated: true,
      },
    });

    // 세션 메타데이터 업데이트
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (session) {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          metadata: JSON.stringify({
            ...JSON.parse(session.metadata || "{}"),
            autoResponseRejected: true,
            autoResponseRejectedAt: new Date().toISOString(),
          }),
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("자동 응답 거부 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "거부 처리 중 오류가 발생했습니다.",
    };
  }
}
