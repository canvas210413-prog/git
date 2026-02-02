"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
  ShoppingBag,
  Package,
  CreditCard,
  Truck,
  Gift,
  Headphones,
  Phone,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  queryType?: "order" | "delivery" | "general";
  requiresPhone?: boolean;
  resultCount?: number;
}

interface ChatbotConfig {
  name: string;
  isActive: boolean;
  welcomeMessage: string;
  themeColor: string;
  chatPosition: string;
}

interface CustomerInfo {
  customerId: string;
  customerName: string;
  customerPhone: string;
  recentOrders?: Array<{
    orderId: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  }>;
}

// 쇼핑몰 FAQ 답변
const MALL_FAQ: Record<string, string> = {
  "배송": `📦 **배송 안내**

• 배송비: 50,000원 이상 무료배송, 미만 시 3,000원
• 배송기간: 결제 완료 후 1~3일 (주말/공휴일 제외)
• 도서산간 지역은 2~3일 추가 소요될 수 있습니다.

더 궁금하신 점이 있으시면 말씀해주세요!`,
  
  "교환": `🔄 **교환/반품 안내**

• 단순 변심: 수령 후 7일 이내 (왕복 배송비 고객 부담)
• 제품 불량: 무료 교환/반품 (사진 첨부 필요)
• 반품 불가: 사용 흔적 있는 제품, 포장 훼손 제품

교환/반품 요청은 마이페이지 > 주문내역에서 가능합니다.`,

  "반품": `📦 **반품 안내**

• 반품 신청: 마이페이지 > 주문내역 > 반품 신청
• 반품 기간: 수령 후 7일 이내
• 반품 배송비: 단순변심 시 고객 부담 (약 6,000원)

제품 불량의 경우 무료 반품이 가능합니다.`,

  "쿠폰": `🎟️ **쿠폰 사용 안내**

• 쿠폰 확인: 마이페이지 > 쿠폰함
• 사용 방법: 결제 시 쿠폰 선택
• 쿠폰 중복 사용은 불가합니다.

신규 회원 가입 시 웰컴 쿠폰이 자동 발급됩니다!`,

  "결제": `💳 **결제 수단 안내**

• 신용/체크카드
• 무통장 입금
• 네이버페이
• 카카오페이

무통장 입금의 경우 24시간 내 입금해주세요.`,

  "회원": `👤 **회원 등급 안내**

• BRONZE: 신규 회원
• SILVER: 누적 구매 10만원 이상 (추가 2% 할인)
• GOLD: 누적 구매 30만원 이상 (추가 5% 할인)
• VIP: 누적 구매 50만원 이상 (추가 10% 할인)

등급별 추가 혜택이 제공됩니다!`,

  "필터": `🔧 **필터 교체 안내**

• 교체 주기: 약 6개월 (사용 환경에 따라 다름)
• 교체 알림: 기기에서 빨간 불 깜빡임
• 필터 구매: 쇼핑몰에서 교체 필터 구매 가능

필터 교체 방법은 제품 설명서를 참고해주세요.`,

  "AS": `🛠️ **A/S 안내**

• 무상 A/S: 구매일로부터 1년
• 유상 A/S: 1년 이후 또는 사용자 과실
• A/S 접수: 마이페이지 > Q&A 또는 고객센터

필터는 소모품으로 A/S 대상이 아닙니다.`,
};

// 키워드 매칭으로 FAQ 찾기
function findFAQAnswer(message: string): string | null {
  const msg = message.toLowerCase();
  
  if (/교환/.test(msg)) return MALL_FAQ["교환"];
  if (/반품|환불|취소/.test(msg)) return MALL_FAQ["반품"];
  if (/쿠폰|할인|적립/.test(msg)) return MALL_FAQ["쿠폰"];
  if (/결제|입금|카드|페이/.test(msg)) return MALL_FAQ["결제"];
  if (/회원|등급|혜택/.test(msg)) return MALL_FAQ["회원"];
  if (/필터|교체/.test(msg)) return MALL_FAQ["필터"];
  if (/as|a\/s|수리|고장/.test(msg)) return MALL_FAQ["AS"];
  
  return null;
}

// 전화번호가 필요한 쿼리인지 확인
function requiresPhoneVerification(message: string): boolean {
  const msg = message.toLowerCase();
  // 주문 조회, 배송 조회, 내 주문 등 개인 정보가 필요한 경우
  return /주문.*(조회|확인|내역|상태)|배송.*(조회|확인|상태|어디)|내\s*주문|언제.*(도착|와|오)/.test(msg);
}

// 전화번호 포맷팅
function formatPhoneInput(value: string): string {
  const numbers = value.replace(/[^\d]/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

// 이름 마스킹
function maskName(name: string): string {
  if (!name || name.length < 2) return name;
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

const SAMPLE_QUESTIONS = [
  "배송은 얼마나 걸리나요?",
  "교환/반품 방법이 궁금해요",
  "쿠폰은 어떻게 사용하나요?",
  "회원 등급 혜택이 궁금해요",
];

export function MallChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 전화번호 인증 관련 상태
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  
  // 세션 관리
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // 상담원 연결 상태
  const [isEscalating, setIsEscalating] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);

  // 챗봇 설정 불러오기
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/mall/chatbot/config");
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
          
          // 환영 메시지 설정
          if (data.welcomeMessage) {
            setMessages([{
              id: "welcome",
              role: "assistant",
              content: data.welcomeMessage,
              timestamp: new Date().toISOString(),
            }]);
          }
        }
      } catch (error) {
        console.error("Failed to load chatbot config:", error);
        // 기본 설정 사용
        setConfig({
          name: "K-Project 고객센터",
          isActive: true,
          welcomeMessage: "안녕하세요! K-Project Mall 고객센터입니다. 😊\n무엇을 도와드릴까요?\n\n일반 문의는 바로 질문해주세요.\n주문/배송 조회는 전화번호 인증 후 이용 가능합니다.",
          themeColor: "#3B82F6",
          chatPosition: "bottom-right",
        });
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: "안녕하세요! K-Project Mall 고객센터입니다. 😊\n무엇을 도와드릴까요?\n\n일반 문의는 바로 질문해주세요.\n주문/배송 조회는 전화번호 인증 후 이용 가능합니다.",
          timestamp: new Date().toISOString(),
        }]);
      } finally {
        setIsLoadingConfig(false);
      }
    }
    
    loadConfig();
  }, []);
  
  // 전화번호 인증 처리
  const handlePhoneVerify = async () => {
    const cleanPhone = phoneNumber.replace(/-/g, "");
    if (cleanPhone.length < 10) return;
    
    setPhoneLoading(true);
    try {
      const response = await fetch("/api/mall/chatbot/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomerInfo(data.customer);
        setSessionId(data.sessionId);
        setShowPhoneInput(false);
        
        // 인증 성공 메시지
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "assistant",
          content: `✅ ${maskName(data.customer.customerName)}님 인증이 완료되었습니다!\n\n이제 주문 조회, 배송 상태 확인 등 개인화된 서비스를 이용하실 수 있습니다.`,
          timestamp: new Date().toISOString(),
        }]);
      } else {
        const errorData = await response.json();
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "assistant",
          content: errorData.message || "인증에 실패했습니다. 주문 시 입력한 전화번호를 확인해주세요.",
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "인증 중 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setPhoneLoading(false);
    }
  };
  
  // 인증 초기화
  const handleReset = () => {
    setCustomerInfo(null);
    setSessionId(null);
    setPhoneNumber("");
    setShowPhoneInput(false);
    setIsEscalated(false);
  };
  
  // 상담 종료 시 세션 저장
  const handleClose = async () => {
    if (sessionId && messages.length > 1) {
      try {
        // 대화 요약 생성
        const userMessages = messages.filter(m => m.role === "user").map(m => m.content);
        const summary = userMessages.length > 0 
          ? `쇼핑몰 문의: ${userMessages.slice(0, 3).join(", ")}` 
          : "일반 쇼핑몰 문의";
        
        await fetch("/api/mall/chatbot/end-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            sessionId, 
            summary,
            messages: messages.map(m => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp,
            }))
          }),
        });
      } catch (error) {
        console.error("Failed to save session:", error);
      }
    }
    
    setIsOpen(false);
    // 상태 초기화
    setTimeout(() => {
      handleReset();
      setMessages([]);
    }, 300);
  };
  
  // 상담원 연결 요청
  const handleAgentConnect = async () => {
    if (isEscalating || isEscalated) return;
    
    if (!customerInfo) {
      setShowPhoneInput(true);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "📞 상담원 연결을 위해 전화번호 인증이 필요합니다.\n위의 전화번호 입력란에서 인증해주세요.",
        timestamp: new Date().toISOString(),
        requiresPhone: true,
      }]);
      return;
    }
    
    setIsEscalating(true);
    try {
      const response = await fetch("/api/mall/chatbot/request-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId,
          customerInfo,
        }),
      });
      
      if (response.ok) {
        setIsEscalated(true);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "assistant",
          content: `✅ 상담원 연결이 예약되었습니다!\n\n${maskName(customerInfo.customerName)}님, 곧 담당 상담원이 ${customerInfo.customerPhone}로 연락드리겠습니다.\n\n영업시간: 평일 09:00 - 18:00`,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "상담원 연결 요청 중 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsEscalating(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowSamples(false);

    try {
      // 전화번호가 필요한 질문인지 확인
      if (requiresPhoneVerification(userMessage.content) && !customerInfo) {
        setShowPhoneInput(true);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "📱 주문/배송 조회를 위해 전화번호 인증이 필요합니다.\n\n위의 입력란에 주문 시 사용한 전화번호를 입력해주세요.",
          timestamp: new Date().toISOString(),
          queryType: "order",
          requiresPhone: true,
        }]);
        setIsLoading(false);
        return;
      }
      
      // FAQ에서 답변 찾기 (일반 배송 안내 제외)
      const faqAnswer = findFAQAnswer(userMessage.content);
      
      if (faqAnswer) {
        // FAQ 답변이 있으면 바로 응답
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: faqAnswer,
            timestamp: new Date().toISOString(),
            queryType: "general",
          }]);
          setIsLoading(false);
        }, 500);
      } else {
        // AI 응답 요청 (세션 ID와 고객 정보 전달)
        const response = await fetch("/api/mall/chatbot/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            message: userMessage.content,
            sessionId,
            customerInfo: customerInfo ? {
              customerId: customerInfo.customerId,
              customerName: customerInfo.customerName,
              customerPhone: customerInfo.customerPhone,
            } : null,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.message,
            timestamp: new Date().toISOString(),
            queryType: data.queryType || "general",
            resultCount: data.resultCount,
          }]);
          
          // 세션 ID 업데이트 (새로 생성된 경우)
          if (data.sessionId && !sessionId) {
            setSessionId(data.sessionId);
          }
        } else {
          throw new Error("Chat API error");
        }
        setIsLoading(false);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "죄송합니다. 오류가 발생했습니다.\n\n고객센터 전화: 1588-0000\n(평일 09:00 - 18:00)",
        timestamp: new Date().toISOString(),
      }]);
      setIsLoading(false);
    }
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

  const handleSampleClick = (question: string) => {
    setInput(question);
    setShowSamples(false);
    inputRef.current?.focus();
  };
  
  // 대화 초기화
  const clearChat = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: config?.welcomeMessage || "안녕하세요! K-Project Mall 고객센터입니다. 😊\n무엇을 도와드릴까요?",
      timestamp: new Date().toISOString(),
    }]);
  };

  // 쿼리 타입 뱃지
  const getQueryTypeBadge = (queryType?: string) => {
    if (!queryType) return null;
    const badges: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      order: { label: "주문", variant: "default" },
      delivery: { label: "배송", variant: "secondary" },
      general: { label: "일반", variant: "outline" },
    };
    const badge = badges[queryType];
    if (!badge) return null;
    return <Badge variant={badge.variant} className="text-[10px] ml-1 px-1">{badge.label}</Badge>;
  };

  // 챗봇이 비활성화된 경우 렌더링하지 않음
  if (isLoadingConfig || !config?.isActive) {
    return null;
  }

  const positionClass = config.chatPosition === "bottom-left" 
    ? "left-4" 
    : config.chatPosition === "top-right"
    ? "top-4 right-4 bottom-auto"
    : config.chatPosition === "top-left"
    ? "top-4 left-4 bottom-auto"
    : "right-4"; // default: bottom-right

  return (
    <>
      {/* 채팅 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-4 ${positionClass} z-50 flex items-center gap-2 rounded-full px-4 py-3 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl`}
          style={{ backgroundColor: config.themeColor }}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">상담하기</span>
          <span className="absolute -right-1 -top-1 flex h-4 w-4">
            <span 
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: config.themeColor }}
            />
            <span 
              className="relative inline-flex h-4 w-4 rounded-full"
              style={{ backgroundColor: config.themeColor }}
            />
          </span>
        </button>
      )}

      {/* 채팅 창 */}
      {isOpen && (
        <Card className={`fixed bottom-4 ${positionClass} z-50 w-[380px] shadow-2xl border-0 overflow-hidden transition-all duration-300 flex flex-col ${isMinimized ? "h-14" : "h-[600px]"}`}>
          {/* 헤더 */}
          <CardHeader 
            className="p-3 text-white cursor-pointer flex flex-row items-center justify-between flex-none"
            style={{ backgroundColor: config.themeColor }}
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">{config.name}</CardTitle>
                <p className="text-xs text-white/80">
                  {customerInfo ? `${maskName(customerInfo.customerName)}님` : "온라인"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {customerInfo && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  title="인증 초기화"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              {!customerInfo && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    // 이미 열려있으면 닫기, 닫혀있으면 열기
                    setShowPhoneInput(!showPhoneInput);
                  }}
                  title="전화번호 입력"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isMinimized ? "rotate-180" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              {/* 전화번호 입력 폼 */}
              {showPhoneInput && !customerInfo && (
                <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50 p-4 flex-none">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">전화번호 인증</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    주문 시 입력하신 전화번호로 인증해주세요
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="010-1234-5678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value))}
                      onKeyDown={handleKeyPress}
                      disabled={phoneLoading}
                      className="flex-1 bg-white"
                      maxLength={13}
                      autoFocus
                    />
                    <Button
                      onClick={handlePhoneVerify}
                      disabled={phoneNumber.replace(/-/g, "").length < 10 || phoneLoading}
                      size="sm"
                      style={{ backgroundColor: config.themeColor }}
                    >
                      {phoneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "인증"}
                    </Button>
                  </div>
                </div>
              )}

              {/* 인증 완료 배너 */}
              {customerInfo && (
                <div className="bg-green-50 border-b border-green-100 px-4 py-2 flex items-center justify-between flex-none">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>{maskName(customerInfo.customerName)}님으로 인증됨</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-green-600 h-6 px-2"
                    onClick={handleReset}
                  >
                    변경
                  </Button>
                </div>
              )}

              {/* 메시지 영역 */}
              <ScrollArea className="flex-1 p-4 bg-slate-50">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <div 
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mr-2"
                          style={{ backgroundColor: config.themeColor }}
                        >
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          message.role === "user"
                            ? "text-white rounded-br-md"
                            : "bg-white text-slate-800 shadow-sm rounded-bl-md"
                        }`}
                        style={message.role === "user" ? { backgroundColor: config.themeColor } : undefined}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {message.role === "assistant" ? (
                            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                          ) : (
                            <User className="h-3.5 w-3.5" />
                          )}
                          <span className="text-xs opacity-70">
                            {message.role === "assistant" ? "AI" : "나"}
                          </span>
                          {getQueryTypeBadge(message.queryType)}
                          {message.resultCount !== undefined && message.resultCount > 0 && (
                            <Badge variant="outline" className="text-xs ml-1">
                              {message.resultCount}건
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {/* 전화번호 입력 유도 버튼 */}
                        {message.requiresPhone && !customerInfo && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs"
                            onClick={() => setShowPhoneInput(true)}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            전화번호 입력하기
                          </Button>
                        )}
                        
                        <p className="text-[10px] opacity-50 mt-1 text-right">
                          {new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {message.role === "user" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 ml-2">
                          <User className="h-4 w-4 text-slate-600" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div 
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mr-2"
                        style={{ backgroundColor: config.themeColor }}
                      >
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* 퀵 메뉴 */}
              <div className="px-3 py-2 bg-white border-t border-slate-100 flex-none">
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {[
                    { icon: Truck, label: "배송조회", requiresAuth: true },
                    { icon: Package, label: "교환/반품", requiresAuth: false },
                    { icon: Gift, label: "쿠폰", requiresAuth: false },
                    { icon: Headphones, label: "상담원", requiresAuth: true },
                  ].map(({ icon: Icon, label, requiresAuth }) => (
                    <button
                      key={label}
                      onClick={() => {
                        if (label === "상담원") {
                          handleAgentConnect();
                        } else if (label === "배송조회") {
                          if (!customerInfo) {
                            setShowPhoneInput(true);
                            setMessages(prev => [...prev, {
                              id: Date.now().toString(),
                              role: "assistant",
                              content: "📱 배송 조회를 위해 전화번호 인증이 필요합니다.\n\n위의 입력란에 주문 시 사용한 전화번호를 입력해주세요.",
                              timestamp: new Date().toISOString(),
                              requiresPhone: true,
                            }]);
                          } else {
                            handleSampleClick("내 주문 배송 상태 알려줘");
                          }
                        } else {
                          handleSampleClick(`${label} 안내해주세요`);
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-full transition-colors whitespace-nowrap"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                      {requiresAuth && !customerInfo && (
                        <span className="text-[10px] text-slate-400">🔒</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 샘플 질문 */}
              {showSamples && (
                <div className="absolute bottom-36 left-4 right-4 bg-white rounded-lg shadow-lg border p-2 space-y-1">
                  <div className="flex items-center gap-1 text-xs text-slate-500 px-2 py-1">
                    <HelpCircle className="h-3 w-3" />
                    자주 묻는 질문
                  </div>
                  {SAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSampleClick(q)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-md transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* 입력 영역 */}
              <div className="p-3 bg-white border-t flex-none">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => setShowSamples(!showSamples)}
                  >
                    <Sparkles className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={customerInfo ? "질문을 입력하세요..." : "궁금한 점을 물어보세요..."}
                    className="flex-1 h-10"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="h-10 w-10 shrink-0"
                    style={{ backgroundColor: config.themeColor }}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-400 h-6 px-2"
                    onClick={clearChat}
                  >
                    대화 초기화
                  </Button>
                  <Button
                    variant={isEscalated ? "secondary" : "outline"}
                    size="sm"
                    className={`text-xs h-7 px-3 gap-1 ${
                      isEscalated 
                        ? "bg-green-100 text-green-700 border-green-200" 
                        : "text-purple-600 border-purple-200 hover:bg-purple-50"
                    }`}
                    onClick={handleAgentConnect}
                    disabled={isEscalating || isEscalated}
                  >
                    {isEscalating ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> 예약 중...</>
                    ) : isEscalated ? (
                      <><CheckCircle className="h-3 w-3" /> 예약 완료</>
                    ) : (
                      <><Headphones className="h-3 w-3" /> 상담사 예약하기</>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
}
