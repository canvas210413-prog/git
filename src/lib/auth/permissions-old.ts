// 권한 정의 및 관리

export const RESOURCES = {
  DASHBOARD: 'dashboard',
  ORDERS: 'orders',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  AFTER_SERVICE: 'after_service',
  USERS: 'users',
  ROLES: 'roles',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  AUDIT_LOGS: 'audit_logs',
  MASTER_DATA: 'master_data',
} as const;

export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  MANAGE: 'manage', // 전체 관리 권한
  APPROVE: 'approve',
} as const;

export const SCOPES = {
  OWN: 'own',     // 자기 자신만
  TEAM: 'team',   // 자기 팀
  ALL: 'all',     // 전체
} as const;

// 권한 키 생성
export function makePermissionKey(
  resource: string,
  action: string,
  scope?: string
): string {
  return scope ? `${resource}:${action}:${scope}` : `${resource}:${action}`;
}

// 시스템 기본 역할 정의
export const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    displayName: '슈퍼 관리자',
    description: '시스템의 모든 권한을 가진 최고 관리자',
  },
  ADMIN: {
    name: 'ADMIN',
    displayName: '관리자',
    description: '대부분의 관리 기능을 사용할 수 있는 관리자',
  },
  MANAGER: {
    name: 'MANAGER',
    displayName: '매니저',
    description: '주문, 고객, AS 관리 권한을 가진 매니저',
  },
  CS_AGENT: {
    name: 'CS_AGENT',
    displayName: 'CS 담당자',
    description: '고객 지원 및 AS 처리 담당자',
  },
  SALES: {
    name: 'SALES',
    displayName: '영업 담당자',
    description: '주문 및 고객 관리 권한',
  },
  VIEWER: {
    name: 'VIEWER',
    displayName: '열람자',
    description: '조회 권한만 가진 사용자',
  },
} as const;

// 기본 권한 세트 정의
export const DEFAULT_PERMISSIONS = {
  SUPER_ADMIN: [
    // 모든 리소스에 대한 전체 권한
    { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.ORDERS, action: ACTIONS.MANAGE, scope: SCOPES.ALL },
    { resource: RESOURCES.CUSTOMERS, action: ACTIONS.MANAGE, scope: SCOPES.ALL },
    { resource: RESOURCES.PRODUCTS, action: ACTIONS.MANAGE, scope: SCOPES.ALL },
    { resource: RESOURCES.AFTER_SERVICE, action: ACTIONS.MANAGE, scope: SCOPES.ALL },
    { resource: RESOURCES.USERS, action: ACTIONS.MANAGE, scope: SCOPES.ALL },
    { resource: RESOURCES.ROLES, action: ACTIONS.MANAGE, scope: SCOPES.ALL },
    { resource: RESOURCES.REPORTS, action: ACTIONS.MANAGE, scope: SCOPES.ALL },
    { resource: RESOURCES.SETTINGS, action: ACTIONS.MANAGE, scope: SCOPES.ALL },
    { resource: RESOURCES.AUDIT_LOGS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.MASTER_DATA, action: ACTIONS.MANAGE, scope: SCOPES.ALL },
  ],
  ADMIN: [
    { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.ORDERS, action: ACTIONS.MANAGE, scope: SCOPES.ALL },
    { resource: RESOURCES.CUSTOMERS, action: ACTIONS.MANAGE, scope: SCOPES.ALL },
    { resource: RESOURCES.PRODUCTS, action: ACTIONS.MANAGE, scope: SCOPES.ALL },
    { resource: RESOURCES.AFTER_SERVICE, action: ACTIONS.MANAGE, scope: SCOPES.ALL },
    { resource: RESOURCES.USERS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.USERS, action: ACTIONS.UPDATE, scope: SCOPES.ALL },
    { resource: RESOURCES.REPORTS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.REPORTS, action: ACTIONS.EXPORT, scope: SCOPES.ALL },
    { resource: RESOURCES.MASTER_DATA, action: ACTIONS.MANAGE, scope: SCOPES.ALL },
  ],
  MANAGER: [
    { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.ORDERS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.ORDERS, action: ACTIONS.UPDATE, scope: SCOPES.ALL },
    { resource: RESOURCES.ORDERS, action: ACTIONS.EXPORT, scope: SCOPES.ALL },
    { resource: RESOURCES.CUSTOMERS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.CUSTOMERS, action: ACTIONS.UPDATE, scope: SCOPES.ALL },
    { resource: RESOURCES.AFTER_SERVICE, action: ACTIONS.MANAGE, scope: SCOPES.ALL },
    { resource: RESOURCES.PRODUCTS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.REPORTS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.MASTER_DATA, action: ACTIONS.VIEW, scope: SCOPES.ALL },
  ],
  CS_AGENT: [
    { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW, scope: SCOPES.OWN },
    { resource: RESOURCES.ORDERS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.ORDERS, action: ACTIONS.UPDATE, scope: SCOPES.OWN },
    { resource: RESOURCES.CUSTOMERS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.CUSTOMERS, action: ACTIONS.UPDATE, scope: SCOPES.OWN },
    { resource: RESOURCES.AFTER_SERVICE, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.AFTER_SERVICE, action: ACTIONS.CREATE, scope: SCOPES.ALL },
    { resource: RESOURCES.AFTER_SERVICE, action: ACTIONS.UPDATE, scope: SCOPES.OWN },
    { resource: RESOURCES.PRODUCTS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
  ],
  SALES: [
    { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW, scope: SCOPES.OWN },
    { resource: RESOURCES.ORDERS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.ORDERS, action: ACTIONS.CREATE, scope: SCOPES.ALL },
    { resource: RESOURCES.ORDERS, action: ACTIONS.UPDATE, scope: SCOPES.OWN },
    { resource: RESOURCES.CUSTOMERS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.CUSTOMERS, action: ACTIONS.CREATE, scope: SCOPES.ALL },
    { resource: RESOURCES.CUSTOMERS, action: ACTIONS.UPDATE, scope: SCOPES.OWN },
    { resource: RESOURCES.PRODUCTS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
  ],
  VIEWER: [
    { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.ORDERS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.CUSTOMERS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.PRODUCTS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.AFTER_SERVICE, action: ACTIONS.VIEW, scope: SCOPES.ALL },
    { resource: RESOURCES.REPORTS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
  ],
};

// 권한 체크 헬퍼
export function hasPermission(
  userPermissions: string[],
  resource: string,
  action: string,
  scope?: string
): boolean {
  const permissionKey = makePermissionKey(resource, action, scope);
  const manageKey = makePermissionKey(resource, ACTIONS.MANAGE, scope);
  const manageAllKey = makePermissionKey(resource, ACTIONS.MANAGE, SCOPES.ALL);
  
  // MANAGE 권한이 있으면 모든 액션 허용
  if (userPermissions.includes(manageKey) || userPermissions.includes(manageAllKey)) {
    return true;
  }
  
  // 특정 권한 체크
  if (userPermissions.includes(permissionKey)) {
    return true;
  }
  
  // ALL 스코프가 있으면 하위 스코프도 허용
  if (scope && scope !== SCOPES.ALL) {
    const allScopeKey = makePermissionKey(resource, action, SCOPES.ALL);
    if (userPermissions.includes(allScopeKey)) {
      return true;
    }
  }
  
  return false;
}

// 페이지별 필요 권한 매핑
export const PAGE_PERMISSIONS: Record<string, { resource: string; action: string; scope?: string }> = {
  '/dashboard': { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW },
  '/dashboard/orders': { resource: RESOURCES.ORDERS, action: ACTIONS.VIEW },
  '/dashboard/orders/status': { resource: RESOURCES.ORDERS, action: ACTIONS.VIEW },
  '/dashboard/customers': { resource: RESOURCES.CUSTOMERS, action: ACTIONS.VIEW },
  '/dashboard/after-service': { resource: RESOURCES.AFTER_SERVICE, action: ACTIONS.VIEW },
  '/dashboard/after-service/kpi': { resource: RESOURCES.AFTER_SERVICE, action: ACTIONS.VIEW },
  '/dashboard/products': { resource: RESOURCES.PRODUCTS, action: ACTIONS.VIEW },
  '/dashboard/reports': { resource: RESOURCES.REPORTS, action: ACTIONS.VIEW },
  '/dashboard/settings': { resource: RESOURCES.SETTINGS, action: ACTIONS.VIEW },
  '/dashboard/users': { resource: RESOURCES.USERS, action: ACTIONS.VIEW, scope: SCOPES.ALL },
  '/dashboard/roles': { resource: RESOURCES.ROLES, action: ACTIONS.VIEW, scope: SCOPES.ALL },
  '/dashboard/master-data': { resource: RESOURCES.MASTER_DATA, action: ACTIONS.VIEW },
};
