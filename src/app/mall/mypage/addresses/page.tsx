"use client";

import { useEffect, useState } from "react";
import { useMallAuth } from "@/components/mall/auth/MallAuthProvider";
import { useRouter } from "next/navigation";
import { 
  MapPin, 
  Plus, 
  Loader2, 
  Trash2, 
  Edit, 
  CheckCircle,
  Home,
  Building
} from "lucide-react";

interface Address {
  id: string;
  name: string;
  recipient: string;
  phone: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { user, loading } = useMallAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    recipient: "",
    phone: "",
    zipCode: "",
    address: "",
    addressDetail: "",
    isDefault: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/mall/login?redirect=/mall/mypage/addresses");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/mall/mypage/addresses");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAddresses(data);
      } else if (data.addresses) {
        setAddresses(data.addresses);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingId 
        ? `/api/mall/mypage/addresses/${editingId}` 
        : "/api/mall/mypage/addresses";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchAddresses();
        resetForm();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 배송지를 삭제하시겠습니까?")) return;
    
    try {
      const res = await fetch(`/api/mall/mypage/addresses/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/mall/mypage/addresses/${id}/default`, {
        method: "PUT",
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      name: address.name || "",
      recipient: address.recipient || address.name || "",
      phone: address.phone || "",
      zipCode: address.zipCode || "",
      address: address.address || "",
      addressDetail: address.addressDetail || "",
      isDefault: address.isDefault || false,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      recipient: "",
      phone: "",
      zipCode: "",
      address: "",
      addressDetail: "",
      isDefault: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">배송지 관리</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          새 배송지
        </button>
      </div>

      {/* 배송지 등록/수정 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            {editingId ? "배송지 수정" : "새 배송지 등록"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                배송지명
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 집, 회사"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  받는 분
                </label>
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  placeholder="이름"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  연락처
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                우편번호
              </label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                placeholder="우편번호"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                주소
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="기본 주소"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                상세주소
              </label>
              <input
                type="text"
                value={formData.addressDetail}
                onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
                placeholder="상세 주소"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-slate-600">기본 배송지로 설정</span>
            </label>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : editingId ? "수정" : "등록"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 배송지 목록 */}
      {addresses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <MapPin className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">등록된 배송지가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div key={address.id} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${address.isDefault ? "bg-blue-100" : "bg-slate-100"}`}>
                    {address.isDefault ? (
                      <Home className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Building className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">{address.name}</span>
                      {address.isDefault && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          기본 배송지
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600">{address.recipient || address.name} · {address.phone}</p>
                    <p className="text-slate-500 text-sm mt-1">
                      [{address.zipCode}] {address.address} {address.addressDetail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      title="기본 배송지로 설정"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(address)}
                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    title="수정"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
