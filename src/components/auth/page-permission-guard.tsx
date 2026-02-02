"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { canAccessPage } from "@/lib/auth/permissions";

interface PagePermissionGuardProps {
  children: React.ReactNode;
  userPermissions: Array<{ resource: string }>;
}

// 권한 체크가 필요 없는 경로
const noPermissionCheckPaths = [
  '/dashboard',
  '/dashboard/unauthorized',
  '/dashboard/messages', // 메시지함 - 모든 사용자 접근 가능
];

export function PagePermissionGuard({ children, userPermissions }: PagePermissionGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    // 권한 체크가 필요 없는 경로
    if (noPermissionCheckPaths.includes(pathname)) {
      setIsChecking(false);
      setHasAccess(true);
      return;
    }

    // 권한 체크
    const access = canAccessPage(userPermissions, pathname);
    setHasAccess(access);
    setIsChecking(false);

    // 권한 없으면 리다이렉트
    if (!access) {
      router.replace('/dashboard/unauthorized');
    }
  }, [pathname, userPermissions, router]);

  // 체크 중이면 로딩 표시 (선택 사항)
  if (isChecking) {
    return null; // 또는 로딩 스피너
  }

  // 권한 없으면 렌더링하지 않음 (리다이렉트 중)
  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
