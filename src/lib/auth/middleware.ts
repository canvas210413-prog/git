import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateSession, createAuditLog } from './auth';
import { hasPermission } from './permissions';
import type { AuthUser } from './auth';

// 서버 컴포넌트용 인증 체크
export async function requireAuth(): Promise<AuthUser> {
  const headersList = headers();
  const token = headersList.get('authorization')?.replace('Bearer ', '') || 
                getCookieValue(headersList.get('cookie') || '', 'auth_token');

  if (!token) {
    redirect('/login');
  }

  const user = await validateSession(token);

  if (!user) {
    redirect('/login');
  }

  return user;
}

// 권한이 필요한 작업 수행
export async function requirePermission(
  resource: string,
  action: string,
  scope?: string
): Promise<AuthUser> {
  const user = await requireAuth();

  const allowed = hasPermission(user.permissions, resource, action, scope);

  if (!allowed) {
    // 감사 로그 기록
    const headersList = headers();
    await createAuditLog({
      userId: user.id,
      action: 'ACCESS_DENIED',
      resource,
      resourceId: `${resource}:${action}${scope ? ':' + scope : ''}`,
      status: 'DENIED',
      ipAddress: headersList.get('x-forwarded-for') || undefined,
      errorMessage: `권한 없음: ${resource}:${action}`,
    });

    throw new Error('이 작업을 수행할 권한이 없습니다.');
  }

  return user;
}

// API 라우트용 권한 체크
export async function checkApiPermission(
  request: Request,
  resource: string,
  action: string,
  scope?: string
): Promise<AuthUser> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                getCookieValue(request.headers.get('cookie') || '', 'auth_token');

  if (!token) {
    throw new Error('인증이 필요합니다.');
  }

  const user = await validateSession(token);

  if (!user) {
    throw new Error('유효하지 않은 세션입니다.');
  }

  const allowed = hasPermission(user.permissions, resource, action, scope);

  if (!allowed) {
    // 감사 로그 기록
    await createAuditLog({
      userId: user.id,
      action: 'ACCESS_DENIED',
      resource,
      resourceId: `${resource}:${action}${scope ? ':' + scope : ''}`,
      status: 'DENIED',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      errorMessage: `권한 없음: ${resource}:${action}`,
    });

    throw new Error('이 작업을 수행할 권한이 없습니다.');
  }

  return user;
}

// 여러 권한 중 하나라도 있으면 허용
export async function requireAnyPermission(
  permissions: Array<{ resource: string; action: string; scope?: string }>
): Promise<AuthUser> {
  const user = await requireAuth();

  const hasAnyPermission = permissions.some((perm) =>
    hasPermission(user.permissions, perm.resource, perm.action, perm.scope)
  );

  if (!hasAnyPermission) {
    const headersList = headers();
    await createAuditLog({
      userId: user.id,
      action: 'ACCESS_DENIED',
      resource: 'multiple',
      status: 'DENIED',
      ipAddress: headersList.get('x-forwarded-for') || undefined,
      errorMessage: '필요한 권한이 없습니다.',
    });

    throw new Error('이 작업을 수행할 권한이 없습니다.');
  }

  return user;
}

// 역할 체크
export async function requireRole(allowedRoles: string[]): Promise<AuthUser> {
  const user = await requireAuth();

  const hasRole = user.roles.some((role) => allowedRoles.includes(role));

  if (!hasRole) {
    const headersList = headers();
    await createAuditLog({
      userId: user.id,
      action: 'ACCESS_DENIED',
      resource: 'roles',
      status: 'DENIED',
      ipAddress: headersList.get('x-forwarded-for') || undefined,
      errorMessage: `필요한 역할: ${allowedRoles.join(', ')}`,
    });

    throw new Error('이 페이지에 접근할 권한이 없습니다.');
  }

  return user;
}

// 쿠키에서 값 추출
function getCookieValue(cookieString: string, name: string): string | undefined {
  const cookies = cookieString.split(';').map((c) => c.trim());
  const cookie = cookies.find((c) => c.startsWith(`${name}=`));
  return cookie?.substring(name.length + 1);
}

// 클라이언트 컴포넌트용 권한 체크 훅 (사용 예시)
export function createPermissionChecker(userPermissions: string[]) {
  return {
    can: (resource: string, action: string, scope?: string) => {
      return hasPermission(userPermissions, resource, action, scope);
    },
    cannot: (resource: string, action: string, scope?: string) => {
      return !hasPermission(userPermissions, resource, action, scope);
    },
    hasRole: (roles: string[], userRoles: string[]) => {
      return userRoles.some((role) => roles.includes(role));
    },
  };
}
