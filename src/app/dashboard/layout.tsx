import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CustomerChatbotWidget } from "@/components/chatbot/customer-chatbot-widget";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canAccessPage } from "@/lib/auth/permissions";

// 사용자의 최신 권한을 DB에서 조회
async function getUserPermissionsFromDB(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userrole: {
          include: {
            role: {
              include: {
                rolepermission: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) return [];

    // 모든 역할의 권한을 합침
    const permissions = user.userrole.flatMap((ur) =>
      ur.role.rolepermission.map((rp) => ({
        resource: rp.permission.resource,
        action: rp.permission.action,
        scope: rp.permission.scope,
      }))
    );

    return permissions;
  } catch (error) {
    console.error('권한 조회 오류:', error);
    return [];
  }
}

// 권한 체크가 필요 없는 경로 (대시보드 홈, 권한없음 페이지 등)
const noPermissionCheckPaths = [
  '/dashboard',
  '/dashboard/unauthorized',
  '/dashboard/messages', // 메시지함 - 모든 사용자 접근 가능
  '/dashboard/settings/change-password', // 비밀번호 변경 - 모든 사용자 접근 가능
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || "USER";
  const userId = (session?.user as any)?.id;
  const isPartner = (session?.user as any)?.isPartner || false;
  
  // DB에서 최신 권한 조회 (세션 권한 대신 실시간 조회)
  const userPermissions = userId 
    ? await getUserPermissionsFromDB(userId)
    : (session?.user as any)?.permissions || [];
  
  // 디버그: 사용자 권한 확인
  if (userId) {
    console.log('[Dashboard Layout] User Info:', {
      userId,
      userRole,
      isPartner,
      permissionsCount: userPermissions.length,
      permissions: userPermissions.map(p => p.resource).slice(0, 10), // 처음 10개만
    });
  }

  // 현재 경로 가져오기
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';
  
  // 권한 체크가 필요한 페이지인지 확인
  if (pathname && !noPermissionCheckPaths.includes(pathname)) {
    // 페이지 접근 권한 체크 (DB 기반 실시간)
    const hasAccess = canAccessPage(userPermissions, pathname);
    
    if (!hasAccess && pathname !== '/dashboard/unauthorized') {
      // 권한 없음 페이지로 리다이렉트
      redirect('/dashboard/unauthorized');
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r bg-background hidden md:block overflow-y-auto">
          <Sidebar userRole={userRole} userPermissions={userPermissions} isPartner={isPartner} />
        </aside>
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
      {/* 고객용 보안 AI 챗봇 위젯 */}
      <CustomerChatbotWidget />
      {/* 실시간 알림 센터 */}
      <NotificationCenter />
    </div>
  );
}
