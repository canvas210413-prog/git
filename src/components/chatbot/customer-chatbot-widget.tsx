"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Send,
  Loader2,
  X,
  Bot,
  User,
  Sparkles,
  ChevronDown,
  HelpCircle,
  Phone,
  ShoppingBag,
  Ticket,
  Gift,
  CheckCircle,
  RefreshCw,
  Headphones,
  Store,
  Truck,
  Shield,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { 
  sendChatMessage, 
  getSampleQuestions,
  verifyCustomerPhone,
  endChatWithSummary,
  startChatSessionAction,
  requestAgentConnection,
} from "@/app/actions/chatbot";
import type { CustomerInfo } from "@/lib/customer-text2db";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  queryType?: string;
  resultCount?: number;
  requiresPhone?: boolean;
}

// 퀵 메뉴 버튼들
const QUICK_MENUS = [
  { icon: Truck, label: "배송조회", query: "내 배송 현황 알려줘", locked: true },
  { icon: RefreshCw, label: "교환/반품", query: "교환 반품 방법 알려줘", locked: false },
  { icon: Gift, label: "쿠폰", query: "사용 가능한 쿠폰 알려줘", locked: false },
  { icon: Headphones, label: "상담원", query: "상담원 연결해줘", locked: true },
];

export function CustomerChatbotWidget() {
  // 챗봇 위젯 숨김
  return null;
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 전화번호 인증 상태
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [showPhoneInput, setShowPhoneInput] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  
  // 상담 세션 ID
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // 상담원 연결 상태
  const [isEscalating, setIsEscalating] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "안녕하세요! 미니쉴드 AI 고객상담입니다. 🤖✨\n\n무엇이든 물어보세요! 주문 조회, 배송 확인 등 개인정보가 필요한 서비스는 전화번호 인증 후 이용 가능합니다.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sampleQuestions, setSampleQuestions] = useState<string[]>([]);
  const [showSamples, setShowSamples] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSampleQuestions().then(setSampleQuestions);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && !showPhoneInput) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized, showPhoneInput]);

  // 전화번호 인증 처리
  const handlePhoneVerify = async () => {
    if (!phoneNumber.trim()) return;
    
    setPhoneLoading(true);
    try {
      const result = await verifyCustomerPhone(phoneNumber.trim());
      
      if (result.success && result.customerInfo) {
        setCustomerInfo(result.customerInfo);
        setShowPhoneInput(false);
        setPhoneNumber("");
        
        const sessionResult = await startChatSessionAction(phoneNumber.trim());
        if (sessionResult.success && sessionResult.sessionId) {
          setSessionId(sessionResult.sessionId);
        }
        
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          role: "assistant",
          content: result.message,
          timestamp: new Date().toISOString(),
        }]);
      } else {
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          role: "assistant",
          content: result.message,
          timestamp: new Date().toISOString(),
        }]);
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  // 인증 초기화
  const handleReset = async () => {
    if (sessionId && messages.length > 1) {
      const userMessages = messages.filter(m => m.role === "user").map(m => m.content);
      const summary = userMessages.length > 0 
        ? `사용자 문의: ${userMessages.slice(0, 3).join(", ").slice(0, 100)}...`
        : "사용자가 대화를 초기화함";
      await endChatWithSummary(sessionId, summary);
      setSessionId(null);
    }
    
    setCustomerInfo(null);
    setShowPhoneInput(true);
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      role: "assistant",
      content: "인증이 초기화되었습니다. 새로운 전화번호를 입력해주세요.",
      timestamp: new Date().toISOString(),
    }]);
  };

  // 메시지 전송
  const handleSend = async (customMessage?: string) => {
    const messageToSend = customMessage || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowSamples(false);

    try {
      const response = await sendChatMessage(userMessage.content, customerInfo, sessionId);

      if (response.sessionId && !sessionId) {
        setSessionId(response.sessionId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        timestamp: response.timestamp,
        requiresPhone: response.requiresPhone,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.requiresPhone && !customerInfo) {
        setTimeout(() => setShowPhoneInput(true), 500);
      }
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요. 🙏",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 챗봇 닫기
  const handleClose = async () => {
    if (sessionId && messages.length > 1) {
      const userMessages = messages.filter(m => m.role === "user").map(m => m.content);
      const lastAssistantMsg = messages.filter(m => m.role === "assistant").slice(-1)[0];
      
      let summary = "";
      if (userMessages.length > 0) {
        summary = `고객 문의: ${userMessages.slice(0, 3).join(", ").slice(0, 100)}`;
        if (lastAssistantMsg) {
          summary += ` | 응답: ${lastAssistantMsg.content.slice(0, 50)}...`;
        }
      } else {
        summary = "대화 종료";
      }
      
      await endChatWithSummary(sessionId, summary);
      setSessionId(null);
    }
    
    setIsOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showPhoneInput && !customerInfo) {
        handlePhoneVerify();
      } else {
        handleSend();
      }
    }
  };

  // 퀵 메뉴 클릭
  const handleQuickMenu = (menu: typeof QUICK_MENUS[0]) => {
    if (menu.locked && !customerInfo) {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: `🔒 ${menu.label} 서비스는 본인 인증이 필요합니다.\n\n전화번호를 입력하여 인증을 완료해주세요.`,
        timestamp: new Date().toISOString(),
      }]);
      setShowPhoneInput(true);
      return;
    }
    
    if (menu.label === "상담원") {
      handleAgentConnect();
    } else {
      handleSend(menu.query);
    }
  };

  // 상담사 연결 요청
  const handleAgentConnect = async () => {
    if (isEscalating || isEscalated) return;
    
    if (!customerInfo) {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "📱 상담원 연결을 위해 먼저 전화번호 인증을 해주세요.\n\n전화번호 인증 후 상담원 연결이 가능합니다.",
        timestamp: new Date().toISOString(),
      }]);
      setShowPhoneInput(true);
      return;
    }
    
    setIsEscalating(true);
    
    try {
      const result = await requestAgentConnection(sessionId, customerInfo);
      
      if (result.sessionId && !sessionId) {
        setSessionId(result.sessionId);
      }
      
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: result.message,
        timestamp: new Date().toISOString(),
      }]);
      
      if (result.escalated) {
        setIsEscalated(true);
      }
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "죄송합니다. 상담원 연결 중 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsEscalating(false);
    }
  };

  const maskName = (name: string) => {
    if (!name || name.length < 2) return name || "";
    if (name.length === 2) return name[0] + "*";
    return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
  };

  // 전화번호 포맷팅
  const formatPhoneInput = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const clearChat = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: customerInfo 
        ? `${maskName(customerInfo.customerName)}님, 무엇을 도와드릴까요? 😊` 
        : "안녕하세요! 무엇을 도와드릴까요?",
      timestamp: new Date().toISOString(),
    }]);
    setIsEscalated(false);
  };

  // 플로팅 버튼 (닫혀있을 때)
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 transition-all duration-300 hover:scale-110"
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      </div>
    );
  }

  // 최소화 상태
  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white px-5 py-3.5 rounded-full shadow-2xl cursor-pointer z-50 flex items-center gap-3 hover:shadow-pink-500/30 hover:scale-105 transition-all duration-300"
      >
        <div className="relative">
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </div>
        <span className="font-semibold">미니쉴드 AI 고객상담</span>
        {customerInfo && (
          <Badge className="bg-white/20 text-white border-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            인증됨
          </Badge>
        )}
      </div>
    );
  }

  // 메인 챗봇 UI
  const chatWidth = isExpanded ? "w-[500px]" : "w-[420px]";
  const chatHeight = isExpanded ? "h-[700px]" : "h-[640px]";

  return (
    <div className={`fixed bottom-6 right-6 ${chatWidth} ${chatHeight} shadow-2xl z-50 flex flex-col overflow-hidden rounded-3xl bg-white border border-slate-200 transition-all duration-300`}>
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-4 flex-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-white/20 backdrop-blur p-2 rounded-xl">
                <Store className="h-6 w-6" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight">미니쉴드 AI 고객상담</h3>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  온라인
                </span>
                {customerInfo && (
                  <>
                    <span className="text-white/50">•</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {maskName(customerInfo.customerName)}님
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/20 rounded-xl"
              onClick={() => setShowPhoneInput(!showPhoneInput)}
              title="전화번호 인증"
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/20 rounded-xl"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "축소" : "확대"}
            >
              {isExpanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/20 rounded-xl"
              onClick={() => setIsMinimized(true)}
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/20 rounded-xl"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 전화번호 인증 섹션 */}
      {showPhoneInput && !customerInfo && (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-5 flex-none border-b">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Phone className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">전화번호 인증</h4>
              <p className="text-xs text-slate-500">회원가입 시 등록한 전화번호로 인증해주세요</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type="tel"
                placeholder="010-1234-5678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value))}
                onKeyPress={handleKeyPress}
                disabled={phoneLoading}
                className="h-12 text-lg font-medium bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4"
                maxLength={13}
                autoFocus
              />
            </div>
            <Button
              onClick={handlePhoneVerify}
              disabled={phoneNumber.replace(/-/g, "").length < 10 || phoneLoading}
              className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold"
            >
              {phoneLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "인증"}
            </Button>
          </div>
        </div>
      )}

      {/* 인증 완료 배너 */}
      {customerInfo && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 px-4 py-3 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <Shield className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-800">
                {maskName(customerInfo.customerName)}님으로 인증됨
              </p>
              <p className="text-xs text-emerald-600">모든 서비스 이용 가능</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg h-8"
            onClick={handleReset}
          >
            변경
          </Button>
        </div>
      )}

      {/* 퀵 메뉴 */}
      <div className="flex gap-2 p-3 bg-slate-50 border-b overflow-x-auto flex-none">
        {QUICK_MENUS.map((menu, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickMenu(menu)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              menu.locked && !customerInfo
                ? "bg-white border border-slate-200 text-slate-400"
                : "bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            }`}
          >
            <menu.icon className="h-4 w-4" />
            {menu.label}
            {menu.locked && !customerInfo && (
              <span className="text-amber-500">🔒</span>
            )}
          </button>
        ))}
      </div>

      {/* 메시지 영역 */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mr-2 flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                
                {msg.requiresPhone && !customerInfo && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 bg-white/90 hover:bg-white text-indigo-600 border-indigo-200"
                    onClick={() => setShowPhoneInput(true)}
                  >
                    <Phone className="h-3.5 w-3.5 mr-1.5" />
                    전화번호 입력하기
                  </Button>
                )}
                
                <p className={`text-[11px] mt-2 ${msg.role === "user" ? "text-white/60" : "text-slate-400"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {msg.role === "user" && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center ml-2 flex-shrink-0">
                  <User className="h-5 w-5 text-slate-600" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mr-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="bg-slate-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-sm text-slate-500 ml-1">답변 생성 중...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* 예시 질문 */}
      {showSamples && (
        <div className="border-t bg-slate-50 p-3 flex-none">
          <p className="text-xs text-slate-500 mb-2 font-medium">💡 이런 질문을 해보세요</p>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.slice(0, 4).map((q, idx) => (
              <button
                key={idx}
                className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                onClick={() => {
                  handleSend(q);
                  setShowSamples(false);
                }}
              >
                {q.length > 20 ? q.slice(0, 20) + "..." : q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="border-t p-4 flex-none bg-white">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl flex-none text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
            onClick={() => setShowSamples(!showSamples)}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="궁금한 점을 물어보세요..."
              disabled={isLoading}
              className="h-12 pr-4 border-2 border-slate-200 focus:border-indigo-500 rounded-xl text-base"
            />
          </div>
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-12 w-12 rounded-xl flex-none bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        {/* 하단 메뉴 */}
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
          <button
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
            onClick={clearChat}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            대화 초기화
          </button>
          <button
            className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              isEscalated 
                ? "bg-emerald-100 text-emerald-700" 
                : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            }`}
            onClick={handleAgentConnect}
            disabled={isEscalating || isEscalated}
          >
            {isEscalating ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 예약 중...</>
            ) : isEscalated ? (
              <><CheckCircle className="h-3.5 w-3.5" /> 상담 예약됨</>
            ) : (
              <><Headphones className="h-3.5 w-3.5" /> 상담사 예약하기</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
