import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { PAGE_PERMISSION_MAP, hasAnyPermissionByResource, extractCategoriesFromPermissions } from "@/lib/auth/permissions";

// 인증 없이 접근 가능한 경로
const publicPaths = [
  "/dashboard/reports/insight", // PDF 테스트용
  "/dashboard/unauthorized", // 권한 없음 페이지
];

// 권한 체크 필요 없는 경로 (인증만 필요)
const authOnlyPaths = [
  "/dashboard", // 대시보드 홈 (정확히 일치해야 함)
  "/dashboard/messages", // 메시지함 - 모든 사용자 접근 가능
  "/dashboard/settings/change-password", // 비밀번호 변경 - 모든 사용자 접근 가능
];

// API 경로는 인증만 체크하고 권한 체크는 API 내부에서 처리
const apiPaths = [
  "/api/",
];

// 경로에 해당하는 권한 찾기
function findRequiredPermissions(pathname: string): string[] | null {
  // 정확히 일치하는 경로 먼저 찾기
  if (PAGE_PERMISSION_MAP[pathname]) {
    return PAGE_PERMISSION_MAP[pathname];
  }
  
  // 접두사로 일치하는 경로 찾기 (긴 경로부터 매칭)
  const sortedPaths = Object.keys(PAGE_PERMISSION_MAP)
    .filter(path => path !== '/dashboard') // 대시보드 홈 제외
    .sort((a, b) => b.length - a.length); // 긴 경로부터
  
  for (const path of sortedPaths) {
    if (pathname.startsWith(path)) {
      return PAGE_PERMISSION_MAP[path];
    }
  }
  
  return null;
}

// 커스텀 인증 미들웨어
export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const token = req.nextauth.token;

    // 공개 경로는 인증 없이 통과
    if (publicPaths.some(path => pathname.startsWith(path))) {
      const response = NextResponse.next();
      response.headers.set('x-pathname', pathname);
      return response;
    }

    // API 경로는 인증만 체크 (권한은 API 내부에서 처리)
    if (apiPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // 정확히 /dashboard 경로만 인증만 필요
    if (authOnlyPaths.includes(pathname)) {
      const response = NextResponse.next();
      response.headers.set('x-pathname', pathname);
      return response;
    }

    // 권한 체크
    const userPermissions = (token?.permissions as Array<{resource: string}>) || [];
    
    // 페이지 경로에 대한 필요 권한 찾기
    const requiredPermissions = findRequiredPermissions(pathname);
    
    if (requiredPermissions) {
      // 필요한 권한 중 하나라도 있으면 통과
      if (!hasAnyPermissionByResource(userPermissions, requiredPermissions)) {
        // 권한 거부 시 디버깅 로그
        const userCategories = Array.from(extractCategoriesFromPermissions(userPermissions));
        console.log(`[권한 거부] ${pathname}`);
        console.log('  필요 권한:', requiredPermissions);
        console.log('  사용자 권한 (원본):', userPermissions.map(p => p.resource));
        console.log('  사용자 권한 (카테고리):', userCategories);
        return NextResponse.redirect(new URL('/dashboard/unauthorized', req.url));
      }
    } else {
      // 매핑되지 않은 페이지 경로는 기본적으로 거부 (보안 강화)
      console.log(`[매핑 없음 - 거부] ${pathname}`);
      return NextResponse.redirect(new URL('/dashboard/unauthorized', req.url));
    }

    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // 공개 경로는 토큰 없어도 통과
        if (publicPaths.some(path => pathname.startsWith(path))) {
          return true;
        }
        // 그 외는 토큰 필요
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/customers/:path*",
    "/api/orders/:path*",
  ],
};
