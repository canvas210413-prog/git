"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchCommand } from "./search-command";
import { ClientOnly } from "@/components/client-only";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Shield, ChevronDown } from "lucide-react";

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 사용자 정보
  const user = session?.user as { id: string; name?: string; email?: string; role?: string } | undefined;
  const userName = user?.name || "사용자";
  const userEmail = user?.email || "";
  const userRole = user?.role || "USER";

  // 읽지 않은 메시지 수 가져오기
  useEffect(() => {
    if (!session) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/messages?type=inbox');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // 30초마다 자동 갱신
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [session]);

  // 이름에서 이니셜 추출 (한글/영어 모두 지원)
  const getInitials = (name: string) => {
    if (!name) return "U";
    
    // 한글인 경우 첫 글자만
    if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(name)) {
      return name.charAt(0);
    }
    
    // 영어인 경우 각 단어의 첫 글자
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // 역할 표시명
  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'ADMIN': '관리자',
      'SUPER_ADMIN': '최고 관리자',
      'MANAGER': '매니저',
      'PARTNER': '협력사',
      'USER': '사용자',
      'VIEWER': '조회자'
    };
    return roleMap[role] || role;
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // 로그인 페이지로 리다이렉트
        router.push('/login');
        router.refresh();
      } else {
        console.error('로그아웃 실패');
        alert('로그아웃에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="mr-4 hidden md:flex">
          <ClientOnly fallback={<div className="h-10 w-60" />}>
            <SearchCommand />
          </ClientOnly>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {/* 읽지 않은 메시지 알림 */}
          {session && (
            <Button 
              variant="ghost" 
              size="sm"
              className="relative"
              onClick={() => router.push('/dashboard/messages')}
            >
              <Mail className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
              <span className="sr-only">메시지함 ({unreadCount}개 읽지 않음)</span>
            </Button>
          )}

          <ClientOnly fallback={<div className="h-10 w-32 rounded-lg bg-muted" />}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 gap-2 px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`/avatars/${userName.charAt(0).toLowerCase()}.png`} alt={userName} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">{userName}</span>
                    <span className="text-xs text-muted-foreground">{getRoleDisplay(userRole)}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium leading-none">{userName}</p>
                    </div>
                    {userEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {userEmail}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs leading-none text-muted-foreground">
                        {getRoleDisplay(userRole)}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/messages')}>
                    <Mail className="mr-2 h-4 w-4" />
                    <span>메시지함</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings/users')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>내 프로필</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  disabled={isLoggingOut}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ClientOnly>
        </div>
      </div>
    </header>
  );
}
