"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { 
  type ChatbotConfigData, 
  DEFAULT_CHATBOT_CONFIG 
} from "@/types/chatbot-config";

// Re-export type for convenience (types are allowed in "use server" files)
export type { ChatbotConfigData } from "@/types/chatbot-config";

/**
 * 챗봇 설정 조회 (없으면 기본값 생성)
 */
export async function getChatbotConfig(): Promise<ChatbotConfigData> {
  try {
    // 기존 설정 조회
    let config = await prisma.chatbotConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    // 설정이 없으면 기본값으로 생성
    if (!config) {
      config = await prisma.chatbotConfig.create({
        data: {
          name: DEFAULT_CHATBOT_CONFIG.name,
          isActive: DEFAULT_CHATBOT_CONFIG.isActive,
          welcomeMessage: DEFAULT_CHATBOT_CONFIG.welcomeMessage,
          systemPrompt: DEFAULT_CHATBOT_CONFIG.systemPrompt,
          brandVoice: DEFAULT_CHATBOT_CONFIG.brandVoice,
          responseStyle: DEFAULT_CHATBOT_CONFIG.responseStyle,
          maxTokens: DEFAULT_CHATBOT_CONFIG.maxTokens,
          temperature: DEFAULT_CHATBOT_CONFIG.temperature,
          requirePhoneAuth: DEFAULT_CHATBOT_CONFIG.requirePhoneAuth,
          autoGreeting: DEFAULT_CHATBOT_CONFIG.autoGreeting,
          showSuggestions: DEFAULT_CHATBOT_CONFIG.showSuggestions,
          maxConversationLength: DEFAULT_CHATBOT_CONFIG.maxConversationLength,
          enableEscalation: DEFAULT_CHATBOT_CONFIG.enableEscalation,
          escalationKeywords: JSON.stringify(DEFAULT_CHATBOT_CONFIG.escalationKeywords),
          autoEscalateOnFail: DEFAULT_CHATBOT_CONFIG.autoEscalateOnFail,
          maxFailBeforeEscalate: DEFAULT_CHATBOT_CONFIG.maxFailBeforeEscalate,
          businessHoursOnly: DEFAULT_CHATBOT_CONFIG.businessHoursOnly,
          businessHoursStart: DEFAULT_CHATBOT_CONFIG.businessHoursStart,
          businessHoursEnd: DEFAULT_CHATBOT_CONFIG.businessHoursEnd,
          businessDays: DEFAULT_CHATBOT_CONFIG.businessDays.join(','),
          outOfHoursMessage: DEFAULT_CHATBOT_CONFIG.outOfHoursMessage,
          defaultLanguage: DEFAULT_CHATBOT_CONFIG.defaultLanguage,
          supportedLanguages: DEFAULT_CHATBOT_CONFIG.supportedLanguages.join(','),
          timezone: DEFAULT_CHATBOT_CONFIG.timezone,
          themeColor: DEFAULT_CHATBOT_CONFIG.themeColor,
          chatPosition: DEFAULT_CHATBOT_CONFIG.chatPosition,
          avatarUrl: DEFAULT_CHATBOT_CONFIG.avatarUrl,
          dataRetentionDays: DEFAULT_CHATBOT_CONFIG.dataRetentionDays,
          anonymizeAfterDays: DEFAULT_CHATBOT_CONFIG.anonymizeAfterDays,
          enableEncryption: DEFAULT_CHATBOT_CONFIG.enableEncryption,
          gdprCompliant: DEFAULT_CHATBOT_CONFIG.gdprCompliant,
          webhookUrl: DEFAULT_CHATBOT_CONFIG.webhookUrl,
          slackChannel: DEFAULT_CHATBOT_CONFIG.slackChannel,
          emailNotifications: DEFAULT_CHATBOT_CONFIG.emailNotifications,
          notificationEmail: DEFAULT_CHATBOT_CONFIG.notificationEmail,
          enableSentimentAnalysis: DEFAULT_CHATBOT_CONFIG.enableSentimentAnalysis,
          enableIntentRecognition: DEFAULT_CHATBOT_CONFIG.enableIntentRecognition,
          enableContextMemory: DEFAULT_CHATBOT_CONFIG.enableContextMemory,
          contextMemoryLength: DEFAULT_CHATBOT_CONFIG.contextMemoryLength,
          blockedKeywords: JSON.stringify(DEFAULT_CHATBOT_CONFIG.blockedKeywords),
          sensitiveDataFilter: DEFAULT_CHATBOT_CONFIG.sensitiveDataFilter,
          enableABTesting: DEFAULT_CHATBOT_CONFIG.enableABTesting,
          abTestVariant: DEFAULT_CHATBOT_CONFIG.abTestVariant,
          apiRateLimit: DEFAULT_CHATBOT_CONFIG.apiRateLimit,
          enableApiAccess: DEFAULT_CHATBOT_CONFIG.enableApiAccess,
          enableAnalytics: DEFAULT_CHATBOT_CONFIG.enableAnalytics,
          trackUserBehavior: DEFAULT_CHATBOT_CONFIG.trackUserBehavior,
          enableAutoLearning: DEFAULT_CHATBOT_CONFIG.enableAutoLearning,
          learningThreshold: DEFAULT_CHATBOT_CONFIG.learningThreshold,
          version: DEFAULT_CHATBOT_CONFIG.version,
        },
      });
    }

    // DB 형식을 클라이언트 형식으로 변환
    return {
      id: config.id,
      name: config.name,
      isActive: config.isActive,
      welcomeMessage: config.welcomeMessage || "",
      systemPrompt: config.systemPrompt || "",
      brandVoice: config.brandVoice || "",
      responseStyle: config.responseStyle as "CONCISE" | "BALANCED" | "DETAILED",
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      requirePhoneAuth: config.requirePhoneAuth,
      autoGreeting: config.autoGreeting,
      showSuggestions: config.showSuggestions,
      maxConversationLength: config.maxConversationLength,
      enableEscalation: config.enableEscalation,
      escalationKeywords: config.escalationKeywords ? JSON.parse(config.escalationKeywords) : [],
      autoEscalateOnFail: config.autoEscalateOnFail,
      maxFailBeforeEscalate: config.maxFailBeforeEscalate,
      businessHoursOnly: config.businessHoursOnly,
      businessHoursStart: config.businessHoursStart,
      businessHoursEnd: config.businessHoursEnd,
      businessDays: config.businessDays.split(',').map(Number),
      outOfHoursMessage: config.outOfHoursMessage || "",
      defaultLanguage: config.defaultLanguage,
      supportedLanguages: config.supportedLanguages.split(','),
      timezone: config.timezone,
      themeColor: config.themeColor,
      chatPosition: config.chatPosition as "bottom-right" | "bottom-left" | "top-right" | "top-left",
      avatarUrl: config.avatarUrl || "",
      dataRetentionDays: config.dataRetentionDays,
      anonymizeAfterDays: config.anonymizeAfterDays,
      enableEncryption: config.enableEncryption,
      gdprCompliant: config.gdprCompliant,
      webhookUrl: config.webhookUrl || "",
      slackChannel: config.slackChannel || "",
      emailNotifications: config.emailNotifications,
      notificationEmail: config.notificationEmail || "",
      enableSentimentAnalysis: config.enableSentimentAnalysis,
      enableIntentRecognition: config.enableIntentRecognition,
      enableContextMemory: config.enableContextMemory,
      contextMemoryLength: config.contextMemoryLength,
      blockedKeywords: config.blockedKeywords ? JSON.parse(config.blockedKeywords) : [],
      sensitiveDataFilter: config.sensitiveDataFilter,
      enableABTesting: config.enableABTesting,
      abTestVariant: config.abTestVariant,
      apiRateLimit: config.apiRateLimit,
      enableApiAccess: config.enableApiAccess,
      enableAnalytics: config.enableAnalytics,
      trackUserBehavior: config.trackUserBehavior,
      enableAutoLearning: config.enableAutoLearning,
      learningThreshold: config.learningThreshold,
      version: config.version,
      publishedAt: config.publishedAt,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  } catch (error) {
    console.error("Failed to get chatbot config:", error);
    return DEFAULT_CHATBOT_CONFIG as ChatbotConfigData;
  }
}

/**
 * 챗봇 설정 업데이트
 */
export async function updateChatbotConfig(
  data: Partial<ChatbotConfigData>
): Promise<{ success: boolean; message: string; config?: ChatbotConfigData }> {
  try {
    // 기존 설정 조회
    let existingConfig = await prisma.chatbotConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    // 설정이 없으면 먼저 생성
    if (!existingConfig) {
      await getChatbotConfig(); // 기본값으로 생성
      existingConfig = await prisma.chatbotConfig.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      
      if (!existingConfig) {
        return { success: false, message: "설정 생성에 실패했습니다." };
      }
    }

    // DB 형식으로 변환
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.welcomeMessage !== undefined) updateData.welcomeMessage = data.welcomeMessage;
    if (data.systemPrompt !== undefined) updateData.systemPrompt = data.systemPrompt;
    if (data.brandVoice !== undefined) updateData.brandVoice = data.brandVoice;
    if (data.responseStyle !== undefined) updateData.responseStyle = data.responseStyle;
    if (data.maxTokens !== undefined) updateData.maxTokens = data.maxTokens;
    if (data.temperature !== undefined) updateData.temperature = data.temperature;
    if (data.requirePhoneAuth !== undefined) updateData.requirePhoneAuth = data.requirePhoneAuth;
    if (data.autoGreeting !== undefined) updateData.autoGreeting = data.autoGreeting;
    if (data.showSuggestions !== undefined) updateData.showSuggestions = data.showSuggestions;
    if (data.maxConversationLength !== undefined) updateData.maxConversationLength = data.maxConversationLength;
    if (data.enableEscalation !== undefined) updateData.enableEscalation = data.enableEscalation;
    if (data.escalationKeywords !== undefined) updateData.escalationKeywords = JSON.stringify(data.escalationKeywords);
    if (data.autoEscalateOnFail !== undefined) updateData.autoEscalateOnFail = data.autoEscalateOnFail;
    if (data.maxFailBeforeEscalate !== undefined) updateData.maxFailBeforeEscalate = data.maxFailBeforeEscalate;
    if (data.businessHoursOnly !== undefined) updateData.businessHoursOnly = data.businessHoursOnly;
    if (data.businessHoursStart !== undefined) updateData.businessHoursStart = data.businessHoursStart;
    if (data.businessHoursEnd !== undefined) updateData.businessHoursEnd = data.businessHoursEnd;
    if (data.businessDays !== undefined) updateData.businessDays = data.businessDays.join(',');
    if (data.outOfHoursMessage !== undefined) updateData.outOfHoursMessage = data.outOfHoursMessage;
    if (data.defaultLanguage !== undefined) updateData.defaultLanguage = data.defaultLanguage;
    if (data.supportedLanguages !== undefined) updateData.supportedLanguages = data.supportedLanguages.join(',');
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.themeColor !== undefined) updateData.themeColor = data.themeColor;
    if (data.chatPosition !== undefined) updateData.chatPosition = data.chatPosition;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.dataRetentionDays !== undefined) updateData.dataRetentionDays = data.dataRetentionDays;
    if (data.anonymizeAfterDays !== undefined) updateData.anonymizeAfterDays = data.anonymizeAfterDays;
    if (data.enableEncryption !== undefined) updateData.enableEncryption = data.enableEncryption;
    if (data.gdprCompliant !== undefined) updateData.gdprCompliant = data.gdprCompliant;
    if (data.webhookUrl !== undefined) updateData.webhookUrl = data.webhookUrl;
    if (data.slackChannel !== undefined) updateData.slackChannel = data.slackChannel;
    if (data.emailNotifications !== undefined) updateData.emailNotifications = data.emailNotifications;
    if (data.notificationEmail !== undefined) updateData.notificationEmail = data.notificationEmail;
    if (data.enableSentimentAnalysis !== undefined) updateData.enableSentimentAnalysis = data.enableSentimentAnalysis;
    if (data.enableIntentRecognition !== undefined) updateData.enableIntentRecognition = data.enableIntentRecognition;
    if (data.enableContextMemory !== undefined) updateData.enableContextMemory = data.enableContextMemory;
    if (data.contextMemoryLength !== undefined) updateData.contextMemoryLength = data.contextMemoryLength;
    if (data.blockedKeywords !== undefined) updateData.blockedKeywords = JSON.stringify(data.blockedKeywords);
    if (data.sensitiveDataFilter !== undefined) updateData.sensitiveDataFilter = data.sensitiveDataFilter;
    if (data.enableABTesting !== undefined) updateData.enableABTesting = data.enableABTesting;
    if (data.abTestVariant !== undefined) updateData.abTestVariant = data.abTestVariant;
    if (data.apiRateLimit !== undefined) updateData.apiRateLimit = data.apiRateLimit;
    if (data.enableApiAccess !== undefined) updateData.enableApiAccess = data.enableApiAccess;
    if (data.enableAnalytics !== undefined) updateData.enableAnalytics = data.enableAnalytics;
    if (data.trackUserBehavior !== undefined) updateData.trackUserBehavior = data.trackUserBehavior;
    if (data.enableAutoLearning !== undefined) updateData.enableAutoLearning = data.enableAutoLearning;
    if (data.learningThreshold !== undefined) updateData.learningThreshold = data.learningThreshold;

    // 버전 증가
    updateData.version = existingConfig.version + 1;

    // 업데이트 실행
    await prisma.chatbotConfig.update({
      where: { id: existingConfig.id },
      data: updateData,
    });

    revalidatePath("/dashboard/chat/ai-bot");

    const updatedConfig = await getChatbotConfig();
    return { 
      success: true, 
      message: "설정이 저장되었습니다.",
      config: updatedConfig,
    };
  } catch (error) {
    console.error("Failed to update chatbot config:", error);
    return { success: false, message: "설정 저장에 실패했습니다." };
  }
}

/**
 * 챗봇 설정 배포 (버전 스냅샷)
 */
export async function publishChatbotConfig(): Promise<{ success: boolean; message: string }> {
  try {
    let config = await prisma.chatbotConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    // 설정이 없으면 먼저 생성
    if (!config) {
      await getChatbotConfig();
      config = await prisma.chatbotConfig.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      
      if (!config) {
        return { success: false, message: "설정 생성에 실패했습니다." };
      }
    }

    await prisma.chatbotConfig.update({
      where: { id: config.id },
      data: { publishedAt: new Date() },
    });

    revalidatePath("/dashboard/chat/ai-bot");
    return { success: true, message: "챗봇 설정이 배포되었습니다." };
  } catch (error) {
    console.error("Failed to publish chatbot config:", error);
    return { success: false, message: "배포에 실패했습니다." };
  }
}

/**
 * 챗봇 활성화/비활성화 토글
 */
export async function toggleChatbotActive(): Promise<{ success: boolean; isActive: boolean; message: string }> {
  try {
    let config = await prisma.chatbotConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    // 설정이 없으면 먼저 생성
    if (!config) {
      await getChatbotConfig();
      config = await prisma.chatbotConfig.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      
      if (!config) {
        return { success: false, isActive: false, message: "설정 생성에 실패했습니다." };
      }
    }

    const newIsActive = !config.isActive;

    await prisma.chatbotConfig.update({
      where: { id: config.id },
      data: { isActive: newIsActive },
    });

    revalidatePath("/dashboard/chat/ai-bot");
    return { 
      success: true, 
      isActive: newIsActive,
      message: newIsActive ? "챗봇이 활성화되었습니다." : "챗봇이 비활성화되었습니다.",
    };
  } catch (error) {
    console.error("Failed to toggle chatbot:", error);
    return { success: false, isActive: false, message: "상태 변경에 실패했습니다." };
  }
}

/**
 * 프롬프트 템플릿 목록 조회
 */
export async function getPromptTemplates() {
  try {
    const templates = await prisma.chatbotPromptTemplate.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' },
    });
    return templates;
  } catch (error) {
    console.error("Failed to get prompt templates:", error);
    return [];
  }
}

/**
 * 프롬프트 템플릿 생성
 */
export async function createPromptTemplate(data: {
  name: string;
  category: string;
  content: string;
  variables?: string[];
}): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.chatbotPromptTemplate.create({
      data: {
        name: data.name,
        category: data.category,
        content: data.content,
        variables: data.variables ? JSON.stringify(data.variables) : null,
      },
    });

    revalidatePath("/dashboard/chat/ai-bot");
    return { success: true, message: "템플릿이 생성되었습니다." };
  } catch (error) {
    console.error("Failed to create prompt template:", error);
    return { success: false, message: "템플릿 생성에 실패했습니다." };
  }
}

/**
 * 챗봇 통계 조회
 */
export async function getChatbotStats() {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 오늘 세션 수
    const todaySessions = await prisma.chatSession.count({
      where: { createdAt: { gte: startOfDay } },
    });

    // 이번 주 세션 수
    const weekSessions = await prisma.chatSession.count({
      where: { createdAt: { gte: startOfWeek } },
    });

    // 이번 달 세션 수
    const monthSessions = await prisma.chatSession.count({
      where: { createdAt: { gte: startOfMonth } },
    });

    // 에스컬레이션 비율
    const escalatedSessions = await prisma.chatSession.count({
      where: { 
        createdAt: { gte: startOfMonth },
        isEscalated: true,
      },
    });

    // 평균 세션 길이 (메시지 수)
    const sessionsWithMessages = await prisma.chatSession.findMany({
      where: { createdAt: { gte: startOfMonth } },
      include: { _count: { select: { messages: true } } },
    });
    
    const avgMessages = sessionsWithMessages.length > 0
      ? sessionsWithMessages.reduce((acc, s) => acc + s._count.messages, 0) / sessionsWithMessages.length
      : 0;

    return {
      todaySessions,
      weekSessions,
      monthSessions,
      escalationRate: monthSessions > 0 ? (escalatedSessions / monthSessions * 100).toFixed(1) : 0,
      avgMessagesPerSession: avgMessages.toFixed(1),
    };
  } catch (error) {
    console.error("Failed to get chatbot stats:", error);
    return {
      todaySessions: 0,
      weekSessions: 0,
      monthSessions: 0,
      escalationRate: 0,
      avgMessagesPerSession: 0,
    };
  }
}

/**
 * 설정 초기화 (기본값으로 복원)
 */
export async function resetChatbotConfig(): Promise<{ success: boolean; message: string }> {
  try {
    let config = await prisma.chatbotConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    // 설정이 없으면 먼저 생성
    if (!config) {
      await getChatbotConfig();
      config = await prisma.chatbotConfig.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      
      if (!config) {
        return { success: false, message: "설정 생성에 실패했습니다." };
      }
    }

    await prisma.chatbotConfig.update({
      where: { id: config.id },
      data: {
        name: DEFAULT_CHATBOT_CONFIG.name,
        welcomeMessage: DEFAULT_CHATBOT_CONFIG.welcomeMessage,
        systemPrompt: DEFAULT_CHATBOT_CONFIG.systemPrompt,
        brandVoice: DEFAULT_CHATBOT_CONFIG.brandVoice,
        responseStyle: DEFAULT_CHATBOT_CONFIG.responseStyle,
        maxTokens: DEFAULT_CHATBOT_CONFIG.maxTokens,
        temperature: DEFAULT_CHATBOT_CONFIG.temperature,
        requirePhoneAuth: DEFAULT_CHATBOT_CONFIG.requirePhoneAuth,
        autoGreeting: DEFAULT_CHATBOT_CONFIG.autoGreeting,
        showSuggestions: DEFAULT_CHATBOT_CONFIG.showSuggestions,
        maxConversationLength: DEFAULT_CHATBOT_CONFIG.maxConversationLength,
        enableEscalation: DEFAULT_CHATBOT_CONFIG.enableEscalation,
        escalationKeywords: JSON.stringify(DEFAULT_CHATBOT_CONFIG.escalationKeywords),
        autoEscalateOnFail: DEFAULT_CHATBOT_CONFIG.autoEscalateOnFail,
        maxFailBeforeEscalate: DEFAULT_CHATBOT_CONFIG.maxFailBeforeEscalate,
        version: config.version + 1,
      },
    });

    revalidatePath("/dashboard/chat/ai-bot");
    return { success: true, message: "설정이 기본값으로 초기화되었습니다." };
  } catch (error) {
    console.error("Failed to reset chatbot config:", error);
    return { success: false, message: "초기화에 실패했습니다." };
  }
}
