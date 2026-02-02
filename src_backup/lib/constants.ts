// ============================================
// CRM AI Platform - Constants & Configuration
// ============================================

// App Configuration
export const APP_CONFIG = {
  name: 'AI CRM',
  version: '1.0.0',
  defaultPageSize: 10,
  maxPageSize: 100,
} as const;

// Status Labels (Korean)
export const STATUS_LABELS = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  PENDING: '대기',
} as const;

export const ORDER_STATUS_LABELS = {
  PENDING: '대기',
  CONFIRMED: '확인',
  PROCESSING: '처리중',
  SHIPPED: '배송중',
  DELIVERED: '배송완료',
  CANCELLED: '취소',
  REFUNDED: '환불',
} as const;

export const TICKET_STATUS_LABELS = {
  OPEN: '미해결',
  IN_PROGRESS: '처리중',
  RESOLVED: '해결',
  CLOSED: '종료',
} as const;

export const LEAD_STATUS_LABELS = {
  NEW: '신규',
  CONTACTED: '접촉',
  QUALIFIED: '검증',
  PROPOSAL: '제안',
  NEGOTIATION: '협상',
  WON: '성공',
  LOST: '실패',
} as const;

export const PRIORITY_LABELS = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급',
} as const;

export const SENTIMENT_LABELS = {
  POSITIVE: '긍정',
  NEUTRAL: '중립',
  NEGATIVE: '부정',
} as const;

export const SEGMENT_LABELS = {
  VIP: 'VIP',
  REGULAR: '일반',
  NEW: '신규',
  DORMANT: '휴면',
  AT_RISK: '이탈위험',
} as const;

// Status Colors (for badges, charts)
export const STATUS_COLORS = {
  // General
  ACTIVE: 'bg-green-500',
  INACTIVE: 'bg-gray-500',
  PENDING: 'bg-yellow-500',
  
  // Order
  CONFIRMED: 'bg-blue-500',
  PROCESSING: 'bg-indigo-500',
  SHIPPED: 'bg-purple-500',
  DELIVERED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
  REFUNDED: 'bg-orange-500',
  
  // Ticket
  OPEN: 'bg-red-500',
  IN_PROGRESS: 'bg-yellow-500',
  RESOLVED: 'bg-green-500',
  CLOSED: 'bg-gray-500',
  
  // Lead
  NEW: 'bg-blue-500',
  CONTACTED: 'bg-cyan-500',
  QUALIFIED: 'bg-indigo-500',
  PROPOSAL: 'bg-purple-500',
  NEGOTIATION: 'bg-amber-500',
  WON: 'bg-green-500',
  LOST: 'bg-red-500',
  
  // Priority
  LOW: 'bg-gray-400',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-600',
  
  // Sentiment
  POSITIVE: 'bg-green-500',
  NEUTRAL: 'bg-gray-500',
  NEGATIVE: 'bg-red-500',
  
  // Segment
  VIP: 'bg-amber-500',
  REGULAR: 'bg-blue-500',
  DORMANT: 'bg-gray-500',
  AT_RISK: 'bg-red-500',
} as const;

// Chart Colors
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#6366f1',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  muted: '#6b7280',
  palette: [
    '#3b82f6', // blue
    '#22c55e', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#f97316', // orange
  ],
} as const;

// Date Format
export const DATE_FORMATS = {
  display: 'yyyy-MM-dd',
  displayWithTime: 'yyyy-MM-dd HH:mm',
  displayKorean: 'yyyy년 MM월 dd일',
  api: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  customers: '/api/customers',
  orders: '/api/orders',
  products: '/api/products',
  tickets: '/api/tickets',
  leads: '/api/leads',
  reviews: '/api/reviews',
  campaigns: '/api/campaigns',
  reports: '/api/reports',
  auth: '/api/auth',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  VALIDATION: '입력값을 확인해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
} as const;

// Validation Rules
export const VALIDATION = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '올바른 이메일 형식을 입력해주세요.',
  },
  phone: {
    pattern: /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
    message: '올바른 전화번호 형식을 입력해주세요.',
  },
  required: {
    message: '필수 입력 항목입니다.',
  },
} as const;

// Feature Flags (for gradual rollout)
export const FEATURE_FLAGS = {
  AI_CHATBOT: true,
  ADVANCED_ANALYTICS: true,
  MARKETING_AUTOMATION: true,
  MULTI_CHANNEL: true,
  REAL_TIME_ALERTS: true,
} as const;
