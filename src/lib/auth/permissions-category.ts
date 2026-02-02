// ===================================================
// 카테고리 기반 페이지 접근 권한 시스템
// ===================================================

// 메뉴 카테고리 정의 (사이드바 메뉴 구조 기반)
export const PAGE_CATEGORIES = {
  DASHBOARD: 'dashboard',
  CUSTOMER_SERVICE: 'customer_service',
  ORDER_MANAGEMENT: 'order_management',
  REVIEW_MANAGEMENT: 'review_management',
  AS_MANAGEMENT: 'as_management',
  INVENTORY_MANAGEMENT: 'inventory_management',
  PARTNER_MANAGEMENT: 'partner_management',
  PERFORMANCE_ANALYTICS: 'performance_analytics',
  SHOPPING_MALL: 'shopping_mall',
  SYSTEM_MANAGEMENT: 'system_management'
} as const;

// 카테고리 표시 정보
export const CATEGORY_INFO: Record<string, {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  subPages?: string[];
}> = {
  [PAGE_CATEGORIES.DASHBOARD]: {
    name: 'dashboard',
    displayName: '대시보드',
    description: '전체 현황 및 주요 지표 조회',
    icon: 'LayoutDashboard'
  },
  [PAGE_CATEGORIES.CUSTOMER_SERVICE]: {
    name: 'customer_service',
    displayName: '고객 상담',
    description: 'AI 챗봇, 문의/상담 관리, VOC 분석',
    icon: 'MessageSquare',
    subPages: [
      'AI 챗봇 자동응답',
      '문의/상담 관리',
      'FAQ 관리',
      'VOC 분석',
      '문의 우선순위 분류'
    ]
  },
  [PAGE_CATEGORIES.ORDER_MANAGEMENT]: {
    name: 'order_management',
    displayName: '주문 관리',
    description: '주문 조회, 수정, 상태 관리',
    icon: 'ShoppingCart',
    subPages: ['주문 목록', '주문 상세', '주문 통계']
  },
  [PAGE_CATEGORIES.REVIEW_MANAGEMENT]: {
    name: 'review_management',
    displayName: '고객 리뷰 관리',
    description: '리뷰 조회, 답변, 분석',
    icon: 'Star',
    subPages: ['리뷰 목록', '리뷰 분석', '평점 통계']
  },
  [PAGE_CATEGORIES.AS_MANAGEMENT]: {
    name: 'as_management',
    displayName: 'AS 접수 및 관리',
    description: 'AS 요청 접수 및 처리',
    icon: 'Wrench',
    subPages: ['AS 접수', 'AS 처리 현황', 'AS 통계']
  },
  [PAGE_CATEGORIES.INVENTORY_MANAGEMENT]: {
    name: 'inventory_management',
    displayName: '재고 관리',
    description: '재고 현황 및 입출고 관리',
    icon: 'Package',
    subPages: ['재고 현황', '입출고 내역', '재고 알림']
  },
  [PAGE_CATEGORIES.PARTNER_MANAGEMENT]: {
    name: 'partner_management',
    displayName: '파트너 관리',
    description: '파트너사 정보 및 거래 관리',
    icon: 'Building',
    subPages: ['파트너 목록', '거래 내역', '정산 관리']
  },
  [PAGE_CATEGORIES.PERFORMANCE_ANALYTICS]: {
    name: 'performance_analytics',
    displayName: '성과 분석',
    description: '매출, KPI, 트렌드 분석',
    icon: 'TrendingUp',
    subPages: ['매출 분석', 'KPI 대시보드', '트렌드 분석']
  },
  [PAGE_CATEGORIES.SHOPPING_MALL]: {
    name: 'shopping_mall',
    displayName: '쇼핑몰 관리',
    description: '상품, 카테고리, 프로모션 관리',
    icon: 'Store',
    subPages: ['상품 관리', '카테고리 관리', '프로모션 관리']
  },
  [PAGE_CATEGORIES.SYSTEM_MANAGEMENT]: {
    name: 'system_management',
    displayName: '시스템 관리',
    description: '사용자, 역할, 권한 관리',
    icon: 'Settings',
    subPages: ['사용자 관리', '역할 및 권한 관리', '시스템 설정']
  }
};

// 시스템 기본 역할 정의
export const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    displayName: '슈퍼 관리자',
    description: '시스템의 모든 권한을 가진 최고 관리자',
    permissions: Object.keys(CATEGORY_INFO) // 모든 카테고리 접근
  },
  ADMIN: {
    name: 'ADMIN',
    displayName: '관리자',
    description: '시스템 관리를 제외한 대부분의 권한',
    permissions: [
      PAGE_CATEGORIES.DASHBOARD,
      PAGE_CATEGORIES.CUSTOMER_SERVICE,
      PAGE_CATEGORIES.ORDER_MANAGEMENT,
      PAGE_CATEGORIES.REVIEW_MANAGEMENT,
      PAGE_CATEGORIES.AS_MANAGEMENT,
      PAGE_CATEGORIES.INVENTORY_MANAGEMENT,
      PAGE_CATEGORIES.PARTNER_MANAGEMENT,
      PAGE_CATEGORIES.PERFORMANCE_ANALYTICS,
      PAGE_CATEGORIES.SHOPPING_MALL
    ]
  },
  MANAGER: {
    name: 'MANAGER',
    displayName: '매니저',
    description: '운영 관리 권한',
    permissions: [
      PAGE_CATEGORIES.DASHBOARD,
      PAGE_CATEGORIES.CUSTOMER_SERVICE,
      PAGE_CATEGORIES.ORDER_MANAGEMENT,
      PAGE_CATEGORIES.REVIEW_MANAGEMENT,
      PAGE_CATEGORIES.AS_MANAGEMENT,
      PAGE_CATEGORIES.INVENTORY_MANAGEMENT,
      PAGE_CATEGORIES.PERFORMANCE_ANALYTICS
    ]
  },
  CS_AGENT: {
    name: 'CS_AGENT',
    displayName: 'CS 상담원',
    description: '고객 상담 및 AS 처리 권한',
    permissions: [
      PAGE_CATEGORIES.DASHBOARD,
      PAGE_CATEGORIES.CUSTOMER_SERVICE,
      PAGE_CATEGORIES.ORDER_MANAGEMENT,
      PAGE_CATEGORIES.REVIEW_MANAGEMENT,
      PAGE_CATEGORIES.AS_MANAGEMENT
    ]
  },
  SALES: {
    name: 'SALES',
    displayName: '영업담당',
    description: '주문 및 파트너 관리 권한',
    permissions: [
      PAGE_CATEGORIES.DASHBOARD,
      PAGE_CATEGORIES.ORDER_MANAGEMENT,
      PAGE_CATEGORIES.PARTNER_MANAGEMENT,
      PAGE_CATEGORIES.PERFORMANCE_ANALYTICS
    ]
  },
  VIEWER: {
    name: 'VIEWER',
    displayName: '조회자',
    description: '대시보드 및 기본 조회 권한',
    permissions: [
      PAGE_CATEGORIES.DASHBOARD
    ]
  }
} as const;

// 역할별 기본 권한 매핑
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: SYSTEM_ROLES.SUPER_ADMIN.permissions,
  ADMIN: SYSTEM_ROLES.ADMIN.permissions,
  MANAGER: SYSTEM_ROLES.MANAGER.permissions,
  CS_AGENT: SYSTEM_ROLES.CS_AGENT.permissions,
  SALES: SYSTEM_ROLES.SALES.permissions,
  VIEWER: SYSTEM_ROLES.VIEWER.permissions
};

// 권한 체크 함수
export function hasPageAccess(
  userPermissions: string[],
  requiredCategory: string
): boolean {
  return userPermissions.includes(requiredCategory);
}

// 여러 권한 중 하나라도 있는지 체크
export function hasAnyPageAccess(
  userPermissions: string[],
  requiredCategories: string[]
): boolean {
  return requiredCategories.some(category => userPermissions.includes(category));
}

// 모든 권한이 있는지 체크
export function hasAllPageAccess(
  userPermissions: string[],
  requiredCategories: string[]
): boolean {
  return requiredCategories.every(category => userPermissions.includes(category));
}

// 페이지 경로와 카테고리 매핑
export const PAGE_CATEGORY_MAP: Record<string, string> = {
  '/dashboard': PAGE_CATEGORIES.DASHBOARD,
  
  // 고객 상담
  '/dashboard/chatbot': PAGE_CATEGORIES.CUSTOMER_SERVICE,
  '/dashboard/consultations': PAGE_CATEGORIES.CUSTOMER_SERVICE,
  '/dashboard/faq': PAGE_CATEGORIES.CUSTOMER_SERVICE,
  '/dashboard/voc': PAGE_CATEGORIES.CUSTOMER_SERVICE,
  
  // 주문 관리
  '/dashboard/orders': PAGE_CATEGORIES.ORDER_MANAGEMENT,
  
  // 리뷰 관리
  '/dashboard/reviews': PAGE_CATEGORIES.REVIEW_MANAGEMENT,
  
  // AS 관리
  '/dashboard/as': PAGE_CATEGORIES.AS_MANAGEMENT,
  
  // 재고 관리
  '/dashboard/inventory': PAGE_CATEGORIES.INVENTORY_MANAGEMENT,
  
  // 파트너 관리
  '/dashboard/partners': PAGE_CATEGORIES.PARTNER_MANAGEMENT,
  
  // 성과 분석
  '/dashboard/performance': PAGE_CATEGORIES.PERFORMANCE_ANALYTICS,
  '/dashboard/performance/sales': PAGE_CATEGORIES.PERFORMANCE_ANALYTICS,
  '/dashboard/performance/kpi': PAGE_CATEGORIES.PERFORMANCE_ANALYTICS,
  
  // 쇼핑몰 관리
  '/dashboard/shopping-mall': PAGE_CATEGORIES.SHOPPING_MALL,
  
  // 시스템 관리
  '/dashboard/users': PAGE_CATEGORIES.SYSTEM_MANAGEMENT,
  '/dashboard/roles': PAGE_CATEGORIES.SYSTEM_MANAGEMENT
};

// 경로로 필요한 카테고리 가져오기
export function getRequiredCategory(path: string): string | null {
  return PAGE_CATEGORY_MAP[path] || null;
}

// 사용자가 페이지에 접근할 수 있는지 체크
export function canAccessPage(
  userPermissions: string[],
  path: string
): boolean {
  const requiredCategory = getRequiredCategory(path);
  if (!requiredCategory) return true; // 매핑되지 않은 페이지는 허용
  return hasPageAccess(userPermissions, requiredCategory);
}
