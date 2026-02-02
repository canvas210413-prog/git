import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  roles: string[];
  permissions: string[];
}

// 鍮꾨?踰덊샇 ?댁떛
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// 鍮꾨?踰덊샇 寃利?
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ?ъ슜???몄쬆 (?대찓??+ 鍮꾨?踰덊샇)
export async function authenticateUser(
  email: string,
  password: string,
  ipAddress?: string
): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  // 怨꾩젙 ?좉? ?뺤씤
  if (user.isLocked) {
    throw new Error('怨꾩젙???좉꺼?덉뒿?덈떎. 愿由ъ옄?먭쾶 臾몄쓽?섏꽭??');
  }

  // 怨꾩젙 鍮꾪솢?깊솕 ?뺤씤
  if (!user.isActive) {
    throw new Error('鍮꾪솢?깊솕??怨꾩젙?낅땲??');
  }

  // 鍮꾨?踰덊샇媛 ?녿뒗 寃쎌슦 (?뚯뀥 濡쒓렇???꾩슜)
  if (!user.password) {
    throw new Error('鍮꾨?踰덊샇 濡쒓렇?몄쓣 ?ъ슜?????녿뒗 怨꾩젙?낅땲??');
  }

  // 鍮꾨?踰덊샇 寃利?
  const isValidPassword = await verifyPassword(password, user.password);

  if (!isValidPassword) {
    // ?ㅽ뙣 ?잛닔 利앷?
    const newFailedAttempts = user.failedLoginAttempts + 1;
    const shouldLock = newFailedAttempts >= 5;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newFailedAttempts,
        isLocked: shouldLock,
      },
    });

    // 媛먯궗 濡쒓렇 湲곕줉
    await createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      resource: 'users',
      resourceId: user.id,
      status: 'FAILED',
      ipAddress,
      errorMessage: '?섎せ??鍮꾨?踰덊샇',
    });

    if (shouldLock) {
      throw new Error('濡쒓렇???ㅽ뙣 ?잛닔 珥덇낵濡?怨꾩젙???좉꼈?듬땲??');
    }

    return null;
  }

  // 濡쒓렇???깃났 - ?ㅽ뙣 ?잛닔 珥덇린??
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    },
  });

  // 媛먯궗 濡쒓렇 湲곕줉
  await createAuditLog({
    userId: user.id,
    action: 'LOGIN',
    resource: 'users',
    resourceId: user.id,
    status: 'SUCCESS',
    ipAddress,
  });

  // ??븷怨?沅뚰븳 異붿텧
  const roles = user.userrole.map((ur) => ur.role.name);
  const permissions = new Set<string>();

  user.userrole.forEach((ur) => {
    ur.role.rolepermission.forEach((rp) => {
      const { resource, action, scope } = rp.permission;
      const permKey = scope ? `${resource}:${action}:${scope}` : `${resource}:${action}`;
      permissions.add(permKey);
    });
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isActive: user.isActive,
    roles,
    permissions: Array.from(permissions),
  };
}

// ?ъ슜??沅뚰븳 媛?몄삤湲?
export async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoles = await prisma.userrole.findMany({
    where: { userId },
    include: {
      role: {
        where: { isActive: true },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();

  userRoles.forEach((ur) => {
    ur.role.rolepermission.forEach((rp) => {
      const { resource, action, scope } = rp.permission;
      const permKey = scope ? `${resource}:${action}:${scope}` : `${resource}:${action}`;
      permissions.add(permKey);
    });
  });

  return Array.from(permissions);
}

// ?ъ슜?먭? ?뱀젙 沅뚰븳??媛吏怨??덈뒗吏 ?뺤씤
export async function checkUserPermission(
  userId: string,
  resource: string,
  action: string,
  scope?: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  
  const permissionKey = scope ? `${resource}:${action}:${scope}` : `${resource}:${action}`;
  const manageKey = scope ? `${resource}:manage:${scope}` : `${resource}:manage`;
  const manageAllKey = `${resource}:manage:all`;

  return (
    permissions.includes(permissionKey) ||
    permissions.includes(manageKey) ||
    permissions.includes(manageAllKey)
  );
}

// 媛먯궗 濡쒓렇 ?앹꽦
interface CreateAuditLogParams {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED' | 'DENIED';
  errorMessage?: string;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        status: params.status,
        errorMessage: params.errorMessage,
      },
    });
  } catch (error) {
    console.error('媛먯궗 濡쒓렇 ?앹꽦 ?ㅽ뙣:', error);
  }
}

// ?몄뀡 ?앹꽦
export async function createUserSession(
  userId: string,
  token: string,
  expiresAt: Date,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await prisma.userSession.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });
}

// ?몄뀡 寃利?
export async function validateSession(token: string): Promise<AuthUser | null> {
  const session = await prisma.userSession.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session || !session.isActive || session.expiresAt < new Date()) {
    return null;
  }

  const user = session.user;

  if (!user.isActive || user.isLocked) {
    return null;
  }

  const roles = user.userrole.map((ur) => ur.role.name);
  const permissions = new Set<string>();

  user.userrole.forEach((ur) => {
    ur.role.rolepermission.forEach((rp) => {
      const { resource, action, scope } = rp.permission;
      const permKey = scope ? `${resource}:${action}:${scope}` : `${resource}:${action}`;
      permissions.add(permKey);
    });
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isActive: user.isActive,
    roles,
    permissions: Array.from(permissions),
  };
}

// ?몄뀡 臾댄슚??
export async function invalidateSession(token: string): Promise<void> {
  await prisma.userSession.update({
    where: { token },
    data: { isActive: false },
  });
}

// ?ъ슜?먯쓽 紐⑤뱺 ?몄뀡 臾댄슚??
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { userId },
    data: { isActive: false },
  });
}
