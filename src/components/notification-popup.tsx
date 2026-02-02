"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  subject: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  createdAt: string; // sentAt 대신 createdAt 사용
  senderName: string;
}

export function NotificationPopup() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // 초기값을 1분 전으로 설정하여 최근 메시지 감지
  const [lastChecked, setLastChecked] = useState<Date>(() => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - 1);
    return date;
  });
  const [isVisible, setIsVisible] = useState(false);

  // 관리자, 협력사, 또는 assignedPartner가 있는 사용자에게 알림 표시
  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  const assignedPartner = (session?.user as any)?.assignedPartner;
  const canShowNotifications = 
    userRole === "ADMIN" || 
    userRole === "SUPER_ADMIN" || 
    userRole === "PARTNER" ||
    (assignedPartner && assignedPartner.length > 0); // assignedPartner가 있으면 알림 허용

  useEffect(() => {
    if (!session) {
      console.log("[NotificationPopup] 세션 로딩 중...");
      return;
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔔 [NotificationPopup] 폴링 체크`);
    console.log(`  - canShowNotifications: ${canShowNotifications}`);
    console.log(`  - userRole: ${userRole || "없음"}`);
    console.log(`  - userId: ${userId || "없음"}`);
    console.log(`  - assignedPartner: ${assignedPartner || "없음"}`);
    console.log(`  - session.user:`, session?.user);
    console.log(`${'='.repeat(80)}`);
    
    if (!canShowNotifications) {
      console.log(`❌ [NotificationPopup] 알림 권한 없음 - 폴링 중지`);
      console.log(`  역할: ${userRole || "없음"}`);
      console.log(`  assignedPartner: ${assignedPartner || "없음"}`);
      console.log(`  허용 조건: ADMIN, SUPER_ADMIN, PARTNER 또는 assignedPartner 있음`);
      return;
    }

    console.log(`✅ [NotificationPopup] 알림 권한 확인됨 - 메시지 폴링 시작 (3초마다)`);

    // 새 메시지 확인
    const checkNewMessages = async () => {
      try {
        console.log(`\n🔄 [NotificationPopup] 메시지 조회 시작... (${new Date().toLocaleTimeString()})`);
        console.log(`  API 호출: GET /api/messages?type=inbox`);
        console.log(`  API 호출: GET /api/messages?type=inbox`);
        const response = await fetch("/api/messages?type=inbox");
        console.log(`  응답 상태: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`  전체 메시지: ${data.messages?.length || 0}건`);
          console.log(`  읽지 않은 메시지 수: ${data.unreadCount || 0}건`);
          
          // 읽지 않은 메시지만 필터링
          const unreadMessages = data.messages?.filter((msg: any) => !msg.isRead) || [];
          console.log(`\n📬 [NotificationPopup] 메시지 필터링 결과:`);
          console.log(`  읽지 않은 메시지: ${unreadMessages.length}건`);
          if (unreadMessages.length > 0) {
            unreadMessages.forEach((msg: any, idx: number) => {
              console.log(`  ${idx + 1}. ${msg.subject} (발신: ${msg.senderName})`);
            });
          }
          
          // lastChecked 이후 받은 메시지 필터링
          const newMessages = unreadMessages.filter((msg: any) => {
            const createdAt = new Date(msg.createdAt);
            return createdAt > lastChecked;
          });

          console.log(`\n🔍 [NotificationPopup] 새 메시지 체크:`);
          console.log(`  읽지 않은 메시지: ${unreadMessages.length}건`);
          console.log(`  마지막 확인 시간: ${lastChecked.toISOString()}`);
          console.log(`  새 메시지: ${newMessages.length}건`);

          if (newMessages.length > 0) {
            console.log(`\n🎉🎉🎉 [NotificationPopup] 새 메시지 발견! 알림 표시`);
            console.log(`  알림 수: ${newMessages.length}건`);
            newMessages.forEach((msg: any, idx: number) => {
              console.log(`    ${idx + 1}. ${msg.subject}`);
            });
            
            // 새 메시지를 알림 목록에 추가
            setNotifications(prev => {
              // 중복 제거
              const existingIds = new Set(prev.map(n => n.id));
              const uniqueNew = newMessages.filter((msg: any) => !existingIds.has(msg.id));
              return [...uniqueNew.slice(0, 5), ...prev].slice(0, 10); // 최대 10개
            });
            setIsVisible(true);
            
            // lastChecked 업데이트
            const now = new Date();
            setLastChecked(now);
            console.log(`  마지막 확인 시간 업데이트: ${now.toISOString()}`);

            // 알림 사운드 재생 (선택적)
            playNotificationSound();
          } else {
            console.log(`[NotificationPopup] 새 메시지 없음 - 알림 표시하지 않음`);
          }
        } else {
          console.error(`❌ [NotificationPopup] API 응답 실패: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error(`\n❌❌❌ [NotificationPopup] 메시지 조회 중 오류:`, error);
        console.error(`스택 트레이스:`, error instanceof Error ? error.stack : error);
      }
    };

    // 초기 로드
    checkNewMessages();

    // 3초마다 체크
    const interval = setInterval(checkNewMessages, 3000);

    return () => clearInterval(interval);
  }, [canShowNotifications, lastChecked, userRole]);

  const playNotificationSound = () => {
    try {
      // 브라우저 내장 알림 소리 (선택적)
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIGWi77eefTRAMUKfj8LZjHAY4ktfyz3ksBSR3yPDdkEAKFF607OunVRQKRp/g8r5sIQUrgs/z2ok3CBlouO3nn00QDFC");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {
      // 소리 재생 실패해도 무시
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    // 메시지함으로 이동
    router.push("/dashboard/messages");
    // 알림 제거
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (notifications.length <= 1) {
      setIsVisible(false);
    }
  };

  const handleDismiss = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (notifications.length <= 1) {
      setIsVisible(false);
    }
  };

  const handleDismissAll = () => {
    setNotifications([]);
    setIsVisible(false);
    setLastChecked(new Date());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500";
      case "HIGH":
        return "bg-orange-500";
      case "NORMAL":
        return "bg-blue-500";
      case "LOW":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "긴급";
      case "HIGH":
        return "높음";
      case "NORMAL":
        return "보통";
      case "LOW":
        return "낮음";
      default:
        return "보통";
    }
  };

  if (!canShowNotifications || !isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] overflow-y-auto space-y-2">
      <div className="flex items-center justify-between mb-2 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600 animate-bounce" />
          <span className="font-semibold">새 알림 {notifications.length}개</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismissAll}
          className="h-8"
        >
          모두 닫기
        </Button>
      </div>

      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-l-4"
          style={{
            borderLeftColor: getPriorityColor(notification.priority).replace("bg-", "#"),
          }}
          onClick={() => handleNotificationClick(notification.id)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={getPriorityColor(notification.priority)}>
                  {getPriorityLabel(notification.priority)}
                </Badge>
                <span className="text-xs text-gray-500">
                  {notification.senderName}
                </span>
              </div>
              <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                {notification.subject}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {notification.content}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(notification.createdAt).toLocaleString("ko-KR")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleDismiss(notification.id, e)}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
