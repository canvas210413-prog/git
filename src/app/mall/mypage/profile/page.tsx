"use client";

import { useEffect, useState } from "react";
import { useMallAuth } from "@/components/mall/auth/MallAuthProvider";
import { useRouter } from "next/navigation";
import { 
  User, 
  Loader2, 
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  Phone
} from "lucide-react";

export default function ProfilePage() {
  const { user, loading, refresh } = useMallAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/mall/login?redirect=/mall/mypage/profile");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name,
        phone: user.phone || "",
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // 유효성 검사
    if (formData.newPassword && formData.newPassword.length < 6) {
      setErrors({ newPassword: "비밀번호는 6자 이상이어야 합니다" });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: "비밀번호가 일치하지 않습니다" });
      return;
    }

    if (formData.newPassword && !formData.currentPassword) {
      setErrors({ currentPassword: "현재 비밀번호를 입력해주세요" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/mall/mypage/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || undefined,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
        }),
      });

      if (res.ok) {
        setIsSaved(true);
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        refresh();
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        const data = await res.json();
        setErrors({ general: data.message || "저장에 실패했습니다" });
      }
    } catch (error) {
      setErrors({ general: "서버 오류가 발생했습니다" });
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
      <h1 className="text-2xl font-bold text-slate-900 mb-8">회원정보 수정</h1>

      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이메일 (변경 불가) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
              />
              <p className="text-xs text-slate-400 mt-1">이메일은 변경할 수 없습니다</p>
            </div>

            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                이름
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                전화번호
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">상담 시 본인 인증에 사용됩니다</p>
            </div>

            {/* 비밀번호 변경 섹션 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4">비밀번호 변경</h3>
              <p className="text-sm text-slate-500 mb-4">
                비밀번호를 변경하려면 현재 비밀번호와 새 비밀번호를 입력해주세요
              </p>

              {/* 현재 비밀번호 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  현재 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-red-500 mt-1">{errors.currentPassword}</p>
                )}
              </div>

              {/* 새 비밀번호 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  새 비밀번호
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="6자 이상"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {errors.newPassword && (
                  <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>
                )}
              </div>

              {/* 새 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  새 비밀번호 확인
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* 에러 메시지 */}
            {errors.general && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            {/* 성공 메시지 */}
            {isSaved && (
              <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                저장되었습니다
              </div>
            )}

            {/* 저장 버튼 */}
            <button
              type="submit"
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
          </form>
        </div>
      </div>
    </div>
  );
}
