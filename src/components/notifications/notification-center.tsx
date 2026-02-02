"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Bell, X, Package, Truck, Wrench, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  senderType: string;
  senderName: string;
  targetType: string;
  targetPartner: string | null;
  relatedId: string | null;
  relatedType: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  // 현재 사용자 정보
  const userPartner = (session?.user as { assignedPartner?: string | null })?.assignedPartner || null;
  const isHeadquarters = !userPartner;

  // 알림 조회
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        
        console.log(`[NotificationCenter] 알림 조회 완료: ${data.notifications.length}개, 읽지 않음: ${data.unreadCount}개`);
        
        // 새 알림이 있으면 팝업 표시
        setNotifications((prevNotifications) => {
          if (data.notifications.length > 0) {
            const newNotification = data.notifications[0];
            const existingIds = new Set(prevNotifications.map((n) => n.id));
            
            // 새로운 알림이면 팝업 표시 (첫 로드가 아닌 경우에만)
            if (!existingIds.has(newNotification.id) && prevNotifications.length > 0) {
              console.log("[NotificationCenter] 🔔 새 알림 감지! 팝업 표시:", newNotification.title);
              setLatestNotification(newNotification);
              setShowPopup(true);
              // 5초 후 자동으로 팝업 숨기기
              setTimeout(() => setShowPopup(false), 5000);
            }
          }
          
          return data.notifications;
        });
        
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  // 알림 읽음 처리
  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // 알림 삭제
  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  // 주기적으로 알림 조회 (3초마다)
  useEffect(() => {
    if (session) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 3000);
      return () => clearInterval(interval);
    }
  }, [session, fetchNotifications]);

  // 알림 타입별 아이콘
  const getIcon = (type: string) => {
    switch (type) {
      case "ORDER_REGISTERED":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "DELIVERY_COMPLETED":
        return <Truck className="h-4 w-4 text-green-500" />;
      case "AS_REGISTERED":
        return <Wrench className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // 시간 포맷
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  if (!session) return null;

  return (
    <>
      {/* 팝업 알림 (우측 하단) */}
      {showPopup && latestNotification && (
        <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-start gap-3">
              {getIcon(latestNotification.type)}
              <div className="flex-1">
                <p className="font-semibold text-sm">{latestNotification.title}</p>
                <p className="text-sm text-muted-foreground">{latestNotification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTime(latestNotification.createdAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowPopup(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 알림 센터 버튼 */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <h4 className="font-semibold">알림</h4>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-1" />
                모두 읽음
              </Button>
            )}
          </div>
          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                알림이 없습니다
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                      !notification.isRead && "bg-blue-50 dark:bg-blue-950"
                    )}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  );
}
