// ============================================================================
// AI 챗봇 설정 타입 정의
// ============================================================================

/**
 * 챗봇 설정 타입
 */
export interface ChatbotConfigData {
  id?: string;
  
  // 기본 설정
  name: string;
  isActive: boolean;
  welcomeMessage: string;
  
  // 시스템 프롬프트 설정
  systemPrompt: string;
  brandVoice: string;
  responseStyle: "CONCISE" | "BALANCED" | "DETAILED";
  
  // 응답 제한 설정
  maxTokens: number;
  temperature: number;
  
  // 대화 흐름 설정
  requirePhoneAuth: boolean;
  autoGreeting: boolean;
  showSuggestions: boolean;
  maxConversationLength: number;
  
  // 상담원 에스컬레이션 설정
  enableEscalation: boolean;
  escalationKeywords: string[];
  autoEscalateOnFail: boolean;
  maxFailBeforeEscalate: number;
  
  // 업무시간 설정
  businessHoursOnly: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  businessDays: number[];
  outOfHoursMessage: string;
  
  // 언어 및 지역 설정
  defaultLanguage: string;
  supportedLanguages: string[];
  timezone: string;
  
  // 외관 설정
  themeColor: string;
  chatPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  avatarUrl: string;
  
  // 개인정보 및 보안
  dataRetentionDays: number;
  anonymizeAfterDays: number;
  enableEncryption: boolean;
  gdprCompliant: boolean;
  
  // 통합 설정
  webhookUrl: string;
  slackChannel: string;
  emailNotifications: boolean;
  notificationEmail: string;
  
  // 고급 기능
  enableSentimentAnalysis: boolean;
  enableIntentRecognition: boolean;
  enableContextMemory: boolean;
  contextMemoryLength: number;
  
  // 금지어 및 필터링
  blockedKeywords: string[];
  sensitiveDataFilter: boolean;
  
  // A/B 테스트 설정
  enableABTesting: boolean;
  abTestVariant: string;
  
  // API 및 연동
  apiRateLimit: number;
  enableApiAccess: boolean;
  
  // 분석 및 리포팅
  enableAnalytics: boolean;
  trackUserBehavior: boolean;
  
  // FAQ 자동 학습
  enableAutoLearning: boolean;
  learningThreshold: number;
  
  // 버전 정보
  version: number;
  publishedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 기본 챗봇 설정값
 */
export const DEFAULT_CHATBOT_CONFIG: Omit<ChatbotConfigData, 'id' | 'createdAt' | 'updatedAt'> = {
  name: "미니쉴드 AI 고객상담",
  isActive: true,
  welcomeMessage: `안녕하세요! 미니쉴드 고객 서비스입니다. 🤖

📱 주문 시 사용하신 전화번호를 입력해주세요.
(예: 010-1234-5678)

전화번호 인증 후 주문 조회, 배송 확인 등을 이용하실 수 있습니다.`,
  
  systemPrompt: `당신은 미니쉴드 공기청정기 전문 고객 상담 AI입니다.

핵심 역할:
- 고객의 주문/배송 문의에 친절하게 응대
- 제품 관련 질문에 정확한 정보 제공
- AS 접수 및 문의 안내
- 필요시 상담원 연결 안내

응대 원칙:
1. 항상 존댓말을 사용하고 친근하게 응대
2. 고객의 감정에 공감하며 응대
3. 정확한 정보만 제공, 모르는 것은 확인 후 안내
4. 복잡한 문의는 상담원 연결 권유

제품 정보:
- 브랜드: 20vs80
- 제품명: 미니쉴드 공기청정기
- 특징: 4단계 필터, 내장 배터리, 휴대용
- 용도: 차량, 유모차, 사무실, 캠핑`,
  
  brandVoice: "친근함",
  responseStyle: "BALANCED",
  
  maxTokens: 1000,
  temperature: 0.7,
  
  requirePhoneAuth: true,
  autoGreeting: true,
  showSuggestions: true,
  maxConversationLength: 50,
  
  enableEscalation: true,
  escalationKeywords: ["상담원", "사람", "담당자", "연결", "전화", "직접"],
  autoEscalateOnFail: true,
  maxFailBeforeEscalate: 3,
  
  businessHoursOnly: false,
  businessHoursStart: "09:00",
  businessHoursEnd: "18:00",
  businessDays: [1, 2, 3, 4, 5],
  outOfHoursMessage: "현재 업무시간 외입니다. 업무시간(평일 09:00~18:00)에 다시 문의해 주세요. 긴급한 문의는 고객센터(1588-0000)로 연락해 주세요.",
  
  defaultLanguage: "ko",
  supportedLanguages: ["ko"],
  timezone: "Asia/Seoul",
  
  themeColor: "#3B82F6",
  chatPosition: "bottom-right",
  avatarUrl: "",
  
  dataRetentionDays: 90,
  anonymizeAfterDays: 30,
  enableEncryption: true,
  gdprCompliant: true,
  
  webhookUrl: "",
  slackChannel: "",
  emailNotifications: false,
  notificationEmail: "",
  
  enableSentimentAnalysis: true,
  enableIntentRecognition: true,
  enableContextMemory: true,
  contextMemoryLength: 10,
  
  blockedKeywords: [],
  sensitiveDataFilter: true,
  
  enableABTesting: false,
  abTestVariant: "A",
  
  apiRateLimit: 100,
  enableApiAccess: false,
  
  enableAnalytics: true,
  trackUserBehavior: true,
  
  enableAutoLearning: false,
  learningThreshold: 0.8,
  
  version: 1,
  publishedAt: null,
};
