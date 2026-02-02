"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

// TODO: 권한 시스템 완성 후 주석 해제
// import { requirePermission } from "@/lib/auth/middleware";
// import { createAuditLog } from "@/lib/auth/auth";
// import { RESOURCES, ACTIONS, SCOPES } from "@/lib/auth/permissions";

const prisma = new PrismaClient();

// 역할 목록 조회
export async function getRoles() {
  // await requirePermission(RESOURCES.ROLES, ACTIONS.VIEW, SCOPES.ALL);

  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
      userRoles: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          userRoles: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return roles.map((role) => ({
    ...role,
    userCount: role._count.userRoles,
    permissions: role.rolePermissions.map((rp) => rp.permission),
    users: role.userRoles.map((ur) => ur.user),
  }));
}

// 권한 목록 조회
export async function getPermissions() {
  // await requirePermission(RESOURCES.ROLES, ACTIONS.VIEW, SCOPES.ALL);

  const permissions = await prisma.permission.findMany({
    orderBy: [{ category: "asc" }, { resource: "asc" }, { action: "asc" }],
  });

  return permissions;
}

// 역할 생성
export async function createRole(data: {
  name: string;
  displayName: string;
  description?: string;
  permissionIds: string[];
}) {
  // const currentUser = await requirePermission(RESOURCES.ROLES, ACTIONS.CREATE, SCOPES.ALL);

  // 역할명 중복 확인
  const existing = await prisma.role.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    throw new Error("이미 존재하는 역할명입니다.");
  }

  // 역할 생성
  const role = await prisma.role.create({
    data: {
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      isSystem: false,
      isActive: true,
    },
  });

  // 권한 할당
  if (data.permissionIds.length > 0) {
    await prisma.rolePermission.createMany({
      data: data.permissionIds.map((permissionId) => ({
        roleId: role.id,
        permissionId,
      })),
    });
  }

  // 감사 로그
  // await createAuditLog({
  //   userId: currentUser.id,
  //   action: "CREATE",
  //   resource: "roles",
  //   resourceId: role.id,
  //   status: "SUCCESS",
  //   details: data,
  // });

  revalidatePath("/dashboard/roles");

  return { success: true, roleId: role.id };
}

// 역할 수정
export async function updateRole(
  roleId: string,
  data: {
    displayName?: string;
    description?: string;
    isActive?: boolean;
    permissionIds?: string[];
  }
) {
  // const currentUser = await requirePermission(RESOURCES.ROLES, ACTIONS.UPDATE, SCOPES.ALL);

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw new Error("역할을 찾을 수 없습니다.");
  }

  // 시스템 역할은 일부 정보만 수정 가능
  if (role.isSystem && data.permissionIds) {
    throw new Error("시스템 역할의 권한은 수정할 수 없습니다.");
  }

  // 역할 정보 업데이트
  await prisma.role.update({
    where: { id: roleId },
    data: {
      displayName: data.displayName,
      description: data.description,
      isActive: data.isActive,
    },
  });

  // 권한 업데이트
  if (data.permissionIds && !role.isSystem) {
    // 기존 권한 삭제
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // 새 권한 할당
    if (data.permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: data.permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    }
  }

  // 감사 로그
  // await createAuditLog({
  //   userId: currentUser.id,
  //   action: "UPDATE",
  //   resource: "roles",
  //   resourceId: roleId,
  //   status: "SUCCESS",
  //   details: data,
  // });

  revalidatePath("/dashboard/roles");

  return { success: true };
}

// 역할 삭제
export async function deleteRole(roleId: string) {
  // const currentUser = await requirePermission(RESOURCES.ROLES, ACTIONS.DELETE, SCOPES.ALL);

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      _count: {
        select: { userRoles: true },
      },
    },
  });

  if (!role) {
    throw new Error("역할을 찾을 수 없습니다.");
  }

  // 시스템 역할은 삭제 불가
  if (role.isSystem) {
    throw new Error("시스템 역할은 삭제할 수 없습니다.");
  }

  // 할당된 사용자가 있으면 삭제 불가
  if (role._count.userRoles > 0) {
    throw new Error("사용자에게 할당된 역할은 삭제할 수 없습니다.");
  }

  await prisma.role.delete({
    where: { id: roleId },
  });

  // 감사 로그
  // await createAuditLog({
  //   userId: currentUser.id,
  //   action: "DELETE",
  //   resource: "roles",
  //   resourceId: roleId,
  //   status: "SUCCESS",
  // });

  revalidatePath("/dashboard/roles");

  return { success: true };
}

// 권한 카테고리별 그룹화
export async function getPermissionsByCategory() {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ category: "asc" }, { resource: "asc" }, { action: "asc" }],
  });

  const grouped = permissions.reduce(
    (acc, perm) => {
      const category = perm.category || "기타";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(perm);
      return acc;
    },
    {} as Record<string, typeof permissions>
  );

  return grouped;
}
