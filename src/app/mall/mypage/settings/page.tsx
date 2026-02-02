"use client";

import { useEffect, useState } from "react";
import { useMallAuth } from "@/components/mall/auth/MallAuthProvider";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  Loader2, 
  Save,
  Bell,
  Mail,
  MessageSquare,
  CheckCircle
} from "lucide-react";

export default function SettingsPage() {
  const { user, loading, refresh } = useMallAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [settings, setSettings] = useState({
    emailNotification: true,
    smsNotification: true,
    marketingEmail: false,
    marketingSms: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/mall/login?redirect=/mall/mypage/settings");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setSettings({
        emailNotification: user.emailNotification ?? true,
        smsNotification: user.smsNotification ?? true,
        marketingEmail: user.marketingEmail ?? false,
        marketingSms: user.marketingSms ?? false,
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mall/mypage/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setIsSaved(true);
        refresh();
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">알림 설정</h1>

      <div className="max-w-xl mx-auto space-y-6">
        {/* 주문/배송 알림 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">주문/배송 알림</h2>
              <p className="text-sm text-slate-500">주문 상태 변경 시 알림을 받습니다</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700">이메일 알림</span>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.emailNotification}
                  onChange={(e) => setSettings({ ...settings, emailNotification: e.target.checked })}
                  className="sr-only"
                />
                <div
                  onClick={() => setSettings({ ...settings, emailNotification: !settings.emailNotification })}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.emailNotification ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-1 ${
                      settings.emailNotification ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700">SMS 알림</span>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.smsNotification}
                  onChange={(e) => setSettings({ ...settings, smsNotification: e.target.checked })}
                  className="sr-only"
                />
                <div
                  onClick={() => setSettings({ ...settings, smsNotification: !settings.smsNotification })}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.smsNotification ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-1 ${
                      settings.smsNotification ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* 마케팅 알림 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">마케팅 알림</h2>
              <p className="text-sm text-slate-500">혜택 및 이벤트 소식을 받습니다</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700">이메일 수신</span>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.marketingEmail}
                  onChange={(e) => setSettings({ ...settings, marketingEmail: e.target.checked })}
                  className="sr-only"
                />
                <div
                  onClick={() => setSettings({ ...settings, marketingEmail: !settings.marketingEmail })}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.marketingEmail ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-1 ${
                      settings.marketingEmail ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700">SMS 수신</span>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.marketingSms}
                  onChange={(e) => setSettings({ ...settings, marketingSms: e.target.checked })}
                  className="sr-only"
                />
                <div
                  onClick={() => setSettings({ ...settings, marketingSms: !settings.marketingSms })}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.marketingSms ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-1 ${
                      settings.marketingSms ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* 성공 메시지 */}
        {isSaved && (
          <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            저장되었습니다
          </div>
        )}

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save className="h-5 w-5" />
              저장하기
            </>
          )}
        </button>
      </div>
    </div>
  );
}
