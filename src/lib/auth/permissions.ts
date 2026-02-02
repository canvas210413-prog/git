// ===================================================
// 하이브리드 권한 시스템: 주요 기능은 세밀하게, 나머지는 카테고리로
// ===================================================

// 권한 타입 정의
export const PERMISSION_TYPES = {
  // 세밀한 권한이 필요한 카테고리
  CUSTOMER_SERVICE: 'customer_service',
  ORDER_MANAGEMENT: 'order_management',
  REVIEW_MANAGEMENT: 'review_management',
  AS_MANAGEMENT: 'as_management',
  
  // 카테고리 단위 접근 (관리자용)
  DASHBOARD: 'dashboard',
  INVENTORY: 'inventory_management',
  PARTNER: 'partner_management',
  ANALYTICS: 'performance_analytics',
  SHOPPING_MALL: 'shopping_mall',
  MASTER_DATA: 'master_data',
  SYSTEM: 'system_management'
} as const;

// 세밀한 권한 정의
export const DETAILED_PERMISSIONS = {
  // 고객 상담
  CUSTOMER_SERVICE: {
    AI_CHATBOT: 'customer_service:ai_chatbot',
    CONSULTATION_HISTORY: 'customer_service:consultation_history',
    AGENT_CONNECTION: 'customer_service:agent_connection',
    PRIORITY_CLASSIFICATION: 'customer_service:priority_classification'
  },
  
  // 주문 관리
  ORDER_MANAGEMENT: {
    DATA_INTEGRATION: 'order_management:data_integration',
    STATUS_CHECK: 'order_management:status_check',
    DELIVERY_INFO: 'order_management:delivery_info',
    ERROR_VALIDATION: 'order_management:error_validation'
  },
  
  // 고객 리뷰 관리
  REVIEW_MANAGEMENT: {
    AUTO_COLLECTION: 'review_management:auto_collection',
    LLM_CLASSIFICATION: 'review_management:llm_classification',
    COMPLAINT_ALERT: 'review_management:complaint_alert',
    SUMMARY_REPORT: 'review_management:summary_report'
  },
  
  // AS 관리
  AS_MANAGEMENT: {
    REQUEST_MANAGEMENT: 'as_management:request_management',
    KPI_DASHBOARD: 'as_management:kpi_dashboard',
    LLM_INSIGHTS: 'as_management:llm_insights'
  },
  
  // 마케팅 자동화
  MARKETING: {
    COUPON: 'marketing:coupon',
    REPURCHASE: 'marketing:repurchase',
    EVENT: 'marketing:event',
    WINBACK: 'marketing:winback',
    ANALYTICS: 'marketing:analytics'
  },
  
  // 성과 관리
  PERFORMANCE: {
    KPI: 'performance:kpi',
    CUSTOMERS: 'performance:customers',
    INQUIRY: 'performance:inquiry',
    CHANNEL: 'performance:channel'
  },
  
  // 알림 및 모니터링
  ALERTS: {
    ORDERS: 'alerts:orders',
    CHURN: 'alerts:churn'
  },
  
  // 보고서 생성
  REPORTS: {
    INSIGHTS: 'reports:insights'
  }
} as const;

// 권한 메타데이터
export const PERMISSION_METADATA = {
  // === 세밀한 권한 카테고리 ===
  
  // 고객 상담
  [DETAILED_PERMISSIONS.CUSTOMER_SERVICE.AI_CHATBOT]: {
    displayName: 'AI 챗봇 자동응답',
    description: 'AI 챗봇 설정 및 자동응답 관리',
    category: '고객 상담',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.CUSTOMER_SERVICE.CONSULTATION_HISTORY]: {
    displayName: '상담 내역 저장',
    description: '고객 상담 이력 조회 및 관리',
    category: '고객 상담',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.CUSTOMER_SERVICE.AGENT_CONNECTION]: {
    displayName: '담당자 연결',
    description: '상담원 배정 및 연결 관리',
    category: '고객 상담',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.CUSTOMER_SERVICE.PRIORITY_CLASSIFICATION]: {
    displayName: '문의 우선순위 분류',
    description: '문의 긴급도 분류 및 우선순위 설정',
    category: '고객 상담',
    isDetailed: true
  },
  
  // 주문 관리
  [DETAILED_PERMISSIONS.ORDER_MANAGEMENT.DATA_INTEGRATION]: {
    displayName: '주문 데이터 통합(고객상세조회)',
    description: '고객 상세 조회 및 주문 통합 관리',
    category: '주문 관리',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.ORDER_MANAGEMENT.STATUS_CHECK]: {
    displayName: '주문 상태 확인',
    description: '주문 처리 상태 조회 및 모니터링',
    category: '주문 관리',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.ORDER_MANAGEMENT.DELIVERY_INFO]: {
    displayName: '배송 정보 연동',
    description: '배송 추적 및 정보 업데이트',
    category: '주문 관리',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.ORDER_MANAGEMENT.ERROR_VALIDATION]: {
    displayName: '주문 오류 검증',
    description: '주문 데이터 검증 및 오류 처리',
    category: '주문 관리',
    isDetailed: true
  },
  
  // 고객 리뷰 관리
  [DETAILED_PERMISSIONS.REVIEW_MANAGEMENT.AUTO_COLLECTION]: {
    displayName: '리뷰 자동 수집',
    description: '쇼핑몰 리뷰 자동 크롤링 및 수집',
    category: '고객 리뷰 관리',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.REVIEW_MANAGEMENT.LLM_CLASSIFICATION]: {
    displayName: 'LLM 리뷰 분류',
    description: 'AI 기반 리뷰 감성 분석 및 분류',
    category: '고객 리뷰 관리',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.REVIEW_MANAGEMENT.COMPLAINT_ALERT]: {
    displayName: '불만 알림',
    description: '부정 리뷰 감지 및 알림',
    category: '고객 리뷰 관리',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.REVIEW_MANAGEMENT.SUMMARY_REPORT]: {
    displayName: '리뷰 요약 리포트',
    description: '리뷰 통계 및 요약 리포트 생성',
    category: '고객 리뷰 관리',
    isDetailed: true
  },
  
  // AS 관리
  [DETAILED_PERMISSIONS.AS_MANAGEMENT.REQUEST_MANAGEMENT]: {
    displayName: 'AS 접수 및 관리',
    description: 'AS 요청 접수, 처리, 현황 관리',
    category: 'AS 관리',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.AS_MANAGEMENT.KPI_DASHBOARD]: {
    displayName: 'AS KPI 대시보드',
    description: 'AS 처리 성과 지표 대시보드',
    category: 'AS 관리',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.AS_MANAGEMENT.LLM_INSIGHTS]: {
    displayName: 'AS 인사이트 (LLM)',
    description: 'AI 기반 AS 분석 및 인사이트',
    category: 'AS 관리',
    isDetailed: true
  },
  
  // 마케팅 자동화
  [DETAILED_PERMISSIONS.MARKETING.COUPON]: {
    displayName: '맞춤 쿠폰 발송',
    description: '고객별 맞춤 쿠폰 자동 생성 및 발송',
    category: '마케팅 자동화',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.MARKETING.REPURCHASE]: {
    displayName: '재구매 알림',
    description: '구매 주기 기반 재구매 알림 발송',
    category: '마케팅 자동화',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.MARKETING.EVENT]: {
    displayName: '이벤트 안내',
    description: '타겟 고객 대상 이벤트 안내 발송',
    category: '마케팅 자동화',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.MARKETING.WINBACK]: {
    displayName: '이탈고객 재유입',
    description: '이탈 고객 재활성화 캠페인',
    category: '마케팅 자동화',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.MARKETING.ANALYTICS]: {
    displayName: '캠페인 효과 분석',
    description: '마케팅 캠페인 성과 분석 및 ROI 측정',
    category: '마케팅 자동화',
    isDetailed: true
  },
  
  // 성과 관리
  [DETAILED_PERMISSIONS.PERFORMANCE.KPI]: {
    displayName: '실시간 KPI 대시보드',
    description: '주요 성과 지표 실시간 모니터링',
    category: '성과 관리',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.PERFORMANCE.CUSTOMERS]: {
    displayName: '고객 현황 분석',
    description: '고객 행동 및 구매 패턴 분석',
    category: '성과 관리',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.PERFORMANCE.INQUIRY]: {
    displayName: '문의 현황 분석',
    description: '고객 문의 트렌드 및 응대 성과 분석',
    category: '성과 관리',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.PERFORMANCE.CHANNEL]: {
    displayName: '채널별 성과 비교',
    description: '판매 채널별 성과 비교 및 분석',
    category: '성과 관리',
    isDetailed: true
  },
  
  // 알림 및 모니터링
  [DETAILED_PERMISSIONS.ALERTS.ORDERS]: {
    displayName: '주문 급증 알림',
    description: '주문 급증 감지 및 알림',
    category: '알림 및 모니터링',
    isDetailed: true
  },
  [DETAILED_PERMISSIONS.ALERTS.CHURN]: {
    displayName: '고객 이탈 위험 알림',
    description: '고객 이탈 위험 감지 및 알림',
    category: '알림 및 모니터링',
    isDetailed: true
  },
  
  // 보고서 생성
  [DETAILED_PERMISSIONS.REPORTS.INSIGHTS]: {
    displayName: 'LLM 기반 인사이트 리포트',
    description: 'AI 기반 비즈니스 인사이트 리포트 자동 생성',
    category: '보고서 생성',
    isDetailed: true
  },
  
  // === 카테고리 단위 권한 (관리자용) ===
  
  [PERMISSION_TYPES.DASHBOARD]: {
    displayName: '대시보드',
    description: '전체 현황 및 주요 지표 조회',
    category: '메인',
    isDetailed: false
  },
  [PERMISSION_TYPES.INVENTORY]: {
    displayName: '재고 관리',
    description: '재고 현황 및 입출고 관리',
    category: '운영 관리',
    isDetailed: false
  },
  [PERMISSION_TYPES.PARTNER]: {
    displayName: '파트너 관리',
    description: '파트너사 정보 및 거래 관리',
    category: '운영 관리',
    isDetailed: false
  },
  [PERMISSION_TYPES.ANALYTICS]: {
    displayName: '성과 분석',
    description: '매출, KPI, 트렌드 분석',
    category: '분석',
    isDetailed: false
  },
  [PERMISSION_TYPES.SHOPPING_MALL]: {
    displayName: '쇼핑몰 관리',
    description: '상품, 카테고리, 프로모션 관리',
    category: '운영 관리',
    isDetailed: false
  },
  [PERMISSION_TYPES.MASTER_DATA]: {
    displayName: '상품 관리',
    description: '상품 기준정보 및 마스터 데이터 관리',
    category: '기준정보',
    isDetailed: false
  },
  [PERMISSION_TYPES.SYSTEM]: {
    displayName: '시스템 관리',
    description: '사용자, 역할, 권한 관리',
    category: '시스템',
    isDetailed: false
  }
} as const;

// 모든 권한 키 추출
export const ALL_PERMISSIONS = [
  ...Object.values(DETAILED_PERMISSIONS.CUSTOMER_SERVICE),
  ...Object.values(DETAILED_PERMISSIONS.ORDER_MANAGEMENT),
  ...Object.values(DETAILED_PERMISSIONS.REVIEW_MANAGEMENT),
  ...Object.values(DETAILED_PERMISSIONS.AS_MANAGEMENT),
  PERMISSION_TYPES.DASHBOARD,
  PERMISSION_TYPES.INVENTORY,
  PERMISSION_TYPES.PARTNER,
  PERMISSION_TYPES.ANALYTICS,
  PERMISSION_TYPES.SHOPPING_MALL,
  PERMISSION_TYPES.MASTER_DATA,
  PERMISSION_TYPES.SYSTEM
];

// 시스템 기본 역할 정의
export const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    displayName: '슈퍼 관리자',
    description: '시스템의 모든 권한을 가진 최고 관리자',
    permissions: ALL_PERMISSIONS
  },
  ADMIN: {
    name: 'ADMIN',
    displayName: '관리자',
    description: '시스템 관리를 제외한 대부분의 권한',
    permissions: ALL_PERMISSIONS.filter(p => p !== PERMISSION_TYPES.SYSTEM)
  },
  MANAGER: {
    name: 'MANAGER',
    displayName: '매니저',
    description: '운영 관리 권한',
    permissions: [
      PERMISSION_TYPES.DASHBOARD,
      ...Object.values(DETAILED_PERMISSIONS.CUSTOMER_SERVICE),
      ...Object.values(DETAILED_PERMISSIONS.ORDER_MANAGEMENT),
      ...Object.values(DETAILED_PERMISSIONS.REVIEW_MANAGEMENT),
      ...Object.values(DETAILED_PERMISSIONS.AS_MANAGEMENT),
      PERMISSION_TYPES.INVENTORY,
      PERMISSION_TYPES.MASTER_DATA,
      PERMISSION_TYPES.ANALYTICS
    ]
  },
  CS_AGENT: {
    name: 'CS_AGENT',
    displayName: 'CS 상담원',
    description: '고객 상담 및 AS 처리 권한',
    permissions: [
      PERMISSION_TYPES.DASHBOARD,
      ...Object.values(DETAILED_PERMISSIONS.CUSTOMER_SERVICE),
      DETAILED_PERMISSIONS.ORDER_MANAGEMENT.STATUS_CHECK,
      ...Object.values(DETAILED_PERMISSIONS.REVIEW_MANAGEMENT),
      DETAILED_PERMISSIONS.AS_MANAGEMENT.REQUEST_MANAGEMENT
    ]
  },
  SALES: {
    name: 'SALES',
    displayName: '영업담당',
    description: '주문 및 파트너 관리 권한',
    permissions: [
      PERMISSION_TYPES.DASHBOARD,
      ...Object.values(DETAILED_PERMISSIONS.ORDER_MANAGEMENT),
      PERMISSION_TYPES.PARTNER,
      PERMISSION_TYPES.ANALYTICS
    ]
  },
  VIEWER: {
    name: 'VIEWER',
    displayName: '조회자',
    description: '대시보드 및 기본 조회 권한',
    permissions: [
      PERMISSION_TYPES.DASHBOARD
    ]
  }
} as const;

// 권한 체크 함수
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission);
}

// 여러 권한 중 하나라도 있는지 체크
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some(perm => userPermissions.includes(perm));
}

// 모든 권한이 있는지 체크
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every(perm => userPermissions.includes(perm));
}

// 카테고리별로 권한 그룹화
export function groupPermissionsByCategory() {
  const grouped: Record<string, Array<{
    key: string;
    displayName: string;
    description: string;
    isDetailed: boolean;
  }>> = {};

  ALL_PERMISSIONS.forEach(permKey => {
    const meta = PERMISSION_METADATA[permKey as keyof typeof PERMISSION_METADATA];
    if (!meta) return;

    const category = meta.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push({
      key: permKey,
      displayName: meta.displayName,
      description: meta.description,
      isDetailed: meta.isDetailed
    });
  });

  return grouped;
}

// 페이지 경로와 권한 매핑 (resource 기반) - 모든 페이지 포함
export const PAGE_PERMISSION_MAP: Record<string, string[]> = {
  // 메인
  '/dashboard': ['dashboard'],
  
  // === 고객 상담 ===
  '/dashboard/chat': ['customer_service'],
  '/dashboard/chatbot': ['customer_service'],
  '/dashboard/consultations': ['customer_service'],
  '/dashboard/voc': ['customer_service'],
  
  // === 주문 관리 ===
  '/dashboard/orders': ['order_management'],
  
  // === 리뷰 관리 ===
  '/dashboard/reviews': ['review_management'],
  '/dashboard/support': ['review_management'], // 리뷰 자동 수집
  
  // === AS 관리 ===
  '/dashboard/after-service': ['as_management'],
  '/dashboard/as': ['as_management'],
  
  // === 재고 관리 ===
  '/dashboard/inventory': ['inventory_management'],
  '/dashboard/alerts/inventory': ['inventory_management'],
  
  // === 파트너 관리 ===
  '/dashboard/partners': ['partner_management'],
  
  // === 성과 분석 ===
  '/dashboard/performance': ['performance_analytics'],
  '/dashboard/customers': ['performance_analytics'],
  '/dashboard/alerts': ['performance_analytics'],
  
  // === 쇼핑몰 관리 ===
  '/dashboard/mall': ['shopping_mall'],
  '/dashboard/shopping-mall': ['shopping_mall'],
  
  // === 시스템 관리 ===
  '/dashboard/users': ['system_management'],
  '/dashboard/roles': ['system_management'],
  '/dashboard/settings': ['system_management'],
  '/dashboard/data': ['system_management'],
  
  // === 마케팅 (성과분석 권한 사용) ===
  '/dashboard/marketing': ['performance_analytics'],
  
  // === 보고서 (성과분석 권한 사용) ===
  '/dashboard/reports': ['performance_analytics'],
  
  // === 기준정보 ===
  '/dashboard/master-data': ['master_data'],
  '/dashboard/master-data/products': ['master_data'],
  
  // === 영업 관리 (주문 권한 사용) ===
  '/dashboard/leads': ['order_management'],
  '/dashboard/sales': ['order_management'],
  
  // === 지식 기반 (고객상담 권한 사용) ===
  '/dashboard/knowledge': ['customer_service'],
};

// 사이드바 메뉴와 권한 매핑
export const MENU_PERMISSION_MAP: Record<string, string> = {
  // 메인
  'dashboard': 'dashboard',
  'messages': '', // 메시지함 - 모든 사용자 접근 가능 (빈 문자열로 권한 체크 무시)
  
  // 고객 상담 (세밀한 권한 매핑)
  'chat': 'customer_service',
  'ai-bot': 'customer_service:ai_chatbot',
  'history': 'customer_service:consultation_history',
  'assign': 'customer_service:agent_connection',
  'priority': 'customer_service:priority_classification',
  
  // 주문 관리 (세밀한 권한 매핑)
  'orders': 'order_management',
  'orders-main': 'order_management:data_integration',
  'orders-status': 'order_management:status_check',
  'orders-delivery': 'order_management:delivery_info',
  'orders-validation': 'order_management:error_validation',
  
  // 리뷰 관리 (세밀한 권한 매핑)
  'reviews': 'review_management',
  'reviews-collect': 'review_management:auto_collection',
  'reviews-analysis': 'review_management:llm_classification',
  'reviews-alerts': 'review_management:complaint_alert',
  'reviews-report': 'review_management:summary_report',
  
  // AS 관리 (세밀한 권한 매핑)
  'after-service': 'as_management',
  'as-main': 'as_management:request_management',
  'as-kpi': 'as_management:kpi_dashboard',
  'as-insights': 'as_management:llm_insights',
  
  // 마케팅
  'marketing': 'marketing',
  'marketing-coupon': 'marketing:coupon',
  'marketing-repurchase': 'marketing:repurchase',
  'marketing-event': 'marketing:event',
  'marketing-winback': 'marketing:winback',
  'marketing-analytics': 'marketing:analytics',
  
  // 성과 관리
  'performance': 'performance',
  'perf-kpi': 'performance:kpi',
  'perf-customers': 'performance:customers',
  'perf-inquiry': 'performance:inquiry',
  'perf-channel': 'performance:channel',
  
  // 알림 및 모니터링
  'alerts': 'alerts',
  'alerts-orders': 'alerts:orders',
  'alerts-inventory': 'inventory_management',
  'alerts-system': 'system_management',
  'alerts-reviews': 'review_management',
  'alerts-churn': 'alerts:churn',
  
  // 데이터 관리
  'data': 'system_management',
  'data-integration': 'system_management',
  'data-quality': 'system_management',
  'data-backup': 'system_management',
  
  // 보고서
  'reports': 'reports',
  'reports-main': 'reports:insights',
  
  // 기준정보
  'master-data': 'master_data',
  'master-products': 'master_data',
  
  // 쇼핑몰
  'mall': 'shopping_mall',
  'mall-home': 'shopping_mall',
  'mall-products': 'shopping_mall',
  'mall-orders': 'shopping_mall',
  'mall-users': 'shopping_mall',
  'mall-qna': 'shopping_mall',
  
  // 사용자 정의 - 고객 분석
  'segmentation': 'performance_analytics',
  'behavior': 'performance_analytics',
  
  // 사용자 정의 - 영업 관리
  'leads': 'order_management',
  'campaigns': 'performance_analytics',
  'forecast': 'performance_analytics',
  
  // 사용자 정의 - 판매 관리
  'sales': 'order_management',
  'categories': 'order_management',
  
  // 사용자 정의 - 지원
  'knowledge': 'customer_service',
  'chat-history': 'customer_service',
  
  // 사용자 정의 - 파트너
  'partners-portal': 'partner_management',
  'partners-edu': 'partner_management',
  'partners-perf': 'partner_management',
  
  // 시스템 관리
  'admin': 'system_management',
  'admin-users': 'system_management',
  'admin-roles': 'system_management',
  'admin-settings': 'system_management',
};

// ===================================================
// 권한 체크 함수 - 세밀한 권한도 카테고리 매칭 지원
// ===================================================

// 세밀한 권한 -> 카테고리 매핑
export const DETAILED_TO_CATEGORY_MAP: Record<string, string> = {
  // 고객 상담
  'customer_service:ai_chatbot': 'customer_service',
  'customer_service:consultation_history': 'customer_service',
  'customer_service:agent_connection': 'customer_service',
  'customer_service:priority_classification': 'customer_service',
  
  // 주문 관리
  'order_management:data_integration': 'order_management',
  'order_management:status_check': 'order_management',
  'order_management:delivery_info': 'order_management',
  'order_management:error_validation': 'order_management',
  
  // 리뷰 관리
  'review_management:auto_collection': 'review_management',
  'review_management:llm_classification': 'review_management',
  'review_management:complaint_alert': 'review_management',
  'review_management:summary_report': 'review_management',
  
  // AS 관리
  'as_management:request_management': 'as_management',
  'as_management:kpi_dashboard': 'as_management',
  'as_management:llm_insights': 'as_management',
  
  // 마케팅 자동화
  'marketing:coupon': 'marketing',
  'marketing:repurchase': 'marketing',
  'marketing:event': 'marketing',
  'marketing:winback': 'marketing',
  'marketing:analytics': 'marketing',
  
  // 성과 관리
  'performance:kpi': 'performance',
  'performance:customers': 'performance',
  'performance:inquiry': 'performance',
  'performance:channel': 'performance',
  
  // 알림 및 모니터링
  'alerts:orders': 'alerts',
  'alerts:churn': 'alerts',
  
  // 보고서 생성
  'reports:insights': 'reports',
};

// 사용자 권한에서 카테고리 목록 추출
export function extractCategoriesFromPermissions(
  userPermissions: Array<{resource: string}> | string[]
): Set<string> {
  const categories = new Set<string>();
  
  userPermissions.forEach(p => {
    const resource = typeof p === 'string' ? p : p.resource;
    
    // 세밀한 권한이면 카테고리로 변환
    if (resource.includes(':')) {
      const category = DETAILED_TO_CATEGORY_MAP[resource];
      if (category) {
        categories.add(category);
      }
    } else {
      // 이미 카테고리 권한
      categories.add(resource);
    }
  });
  
  return categories;
}

// 권한 체크 함수 (resource 기반) - 세밀한 권한도 카테고리 매칭
export function hasPermissionByResource(
  userPermissions: Array<{resource: string}> | string[],
  requiredResource: string
): boolean {
  const categories = extractCategoriesFromPermissions(userPermissions);
  return categories.has(requiredResource);
}

// 여러 권한 중 하나라도 있는지 체크 (resource 기반)
export function hasAnyPermissionByResource(
  userPermissions: Array<{resource: string}> | string[],
  requiredResources: string[]
): boolean {
  const categories = extractCategoriesFromPermissions(userPermissions);
  return requiredResources.some(resource => categories.has(resource));
}

// 메뉴 ID로 권한 체크
export function canAccessMenu(
  userPermissions: Array<{resource: string}> | string[],
  menuId: string
): boolean {
  const requiredResource = MENU_PERMISSION_MAP[menuId];
  if (!requiredResource) return true; // 매핑되지 않은 메뉴는 모든 사용자 접근 가능
  return hasPermissionByResource(userPermissions, requiredResource);
}

// 페이지 경로로 권한 체크
export function canAccessPage(
  userPermissions: Array<{resource: string}> | string[],
  path: string
): boolean {
  // 정확한 경로 매칭
  const requiredResources = PAGE_PERMISSION_MAP[path];
  if (requiredResources) {
    return hasAnyPermissionByResource(userPermissions, requiredResources);
  }
  
  // 긴 경로부터 부분 매칭
  const sortedPaths = Object.keys(PAGE_PERMISSION_MAP).sort((a, b) => b.length - a.length);
  for (const mappedPath of sortedPaths) {
    if (path.startsWith(mappedPath)) {
      return hasAnyPermissionByResource(userPermissions, PAGE_PERMISSION_MAP[mappedPath]);
    }
  }
  
  return false; // 매핑되지 않은 페이지는 기본 거부
}
