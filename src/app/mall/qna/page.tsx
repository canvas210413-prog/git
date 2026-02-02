"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMallAuth } from "@/components/mall/auth/MallAuthProvider";
import { 
  Loader2,
  MessageCircle,
  Plus,
  ChevronRight,
  Clock
} from "lucide-react";

type QnA = {
  id: string;
  title: string;
  content: string;
  answer: string | null;
  status: string;
  category: string;
  createdAt: string;
  answeredAt: string | null;
};

export default function QnAPage() {
  const { user, loading } = useMallAuth();
  const [questions, setQuestions] = useState<QnA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: "", content: "", category: "general" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/mall/qna")
      .then(res => res.json())
      .then(data => {
        if (data.questions) setQuestions(data.questions);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mall/qna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion),
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions([data.question, ...questions]);
        setNewQuestion({ title: "", content: "", category: "general" });
        setShowForm(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: Record<string, string> = {
    general: "일반문의",
    product: "상품문의",
    delivery: "배송문의",
    return: "교환/반품",
    etc: "기타",
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Q&A</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          질문하기
        </button>
      </div>

      {/* 질문 작성 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">새 질문 작성</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                카테고리
              </label>
              <select
                value={newQuestion.category}
                onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Object.entries(categories).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                제목
              </label>
              <input
                type="text"
                value={newQuestion.title}
                onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                placeholder="질문 제목을 입력하세요"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                내용
              </label>
              <textarea
                value={newQuestion.content}
                onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                placeholder="질문 내용을 입력하세요"
                required
                rows={5}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !user}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "등록"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 질문 목록 */}
      {questions.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">등록된 질문이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((qna) => (
            <div key={qna.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                    {categories[qna.category] || "일반문의"}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    qna.status === "answered" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {qna.status === "answered" ? "답변완료" : "대기중"}
                  </span>
                </div>
                <h3 className="font-medium text-slate-900 mb-2">{qna.title}</h3>
                <p className="text-slate-600 text-sm line-clamp-2 mb-3">{qna.content}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(qna.createdAt).toLocaleDateString("ko-KR")}
                </p>
              </div>
              
              {qna.answer && (
                <div className="bg-blue-50 p-6 border-t border-blue-100">
                  <p className="text-sm font-medium text-blue-700 mb-2">답변</p>
                  <p className="text-slate-700 text-sm whitespace-pre-wrap">{qna.answer}</p>
                  {qna.answeredAt && (
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(qna.answeredAt).toLocaleDateString("ko-KR")} 답변
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
