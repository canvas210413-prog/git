// ===================================================
// ?몄뀡 諛?沅뚰븳 ?좏떥由ы떚
// ===================================================

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * ?꾩옱 ?ъ슜?먯쓽 ?몄뀡 諛?沅뚰븳 ?뺣낫瑜?媛?몄샃?덈떎
 */
export async function getCurrentUserWithPermissions() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      userRoles: {
        select: {
          role: {
            select: {
              name: true,
              displayName: true,
              rolePermissions: {
                select: {
                  permission: {
                    select: {
                      resource: true,
                      action: true,
                      scope: true,
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

  if (!user) {
    return null;
  }

  // 沅뚰븳 紐⑸줉 異붿텧 (resource, resource:action, resource:action:scope ?뺥깭)
  const permissions: string[] = [];
  
  user.userrole.forEach((ur) => {
    ur.role.rolepermission.forEach((rp) => {
      const perm = rp.permission;
      
      // resource 異붽?
      if (!permissions.includes(perm.resource)) {
        permissions.push(perm.resource);
      }
      
      // resource:action 異붽?
      if (perm.action) {
        const permWithAction = `${perm.resource}:${perm.action}`;
        if (!permissions.includes(permWithAction)) {
          permissions.push(permWithAction);
        }
      }
      
      // resource:action:scope 異붽?
      if (perm.action && perm.scope) {
        const fullPerm = `${perm.resource}:${perm.action}:${perm.scope}`;
        if (!permissions.includes(fullPerm)) {
          permissions.push(fullPerm);
        }
      }
    });
  });

  return {
    ...user,
    permissions,
    roleNames: user.userrole.map((ur) => ur.role.name),
    roleDisplayNames: user.userrole.map((ur) => ur.role.displayName),
  };
}

/**
 * ?ъ슜?먭? ?뱀젙 沅뚰븳??媛吏怨??덈뒗吏 ?뺤씤?⑸땲??
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * ?ъ슜?먭? ?щ윭 沅뚰븳 以??섎굹?쇰룄 媛吏怨??덈뒗吏 ?뺤씤?⑸땲??
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(perm => userPermissions.includes(perm));
}

/**
 * ?ъ슜?먭? 紐⑤뱺 沅뚰븳??媛吏怨??덈뒗吏 ?뺤씤?⑸땲??
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(perm => userPermissions.includes(perm));
}
