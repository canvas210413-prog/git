"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bot,
  Save,
  RefreshCw,
  Play,
  Pause,
  Settings,
  MessageSquare,
  Clock,
  Shield,
  Zap,
  Globe,
  Palette,
  Bell,
  Brain,
  Lock,
  TestTube,
  BarChart3,
  Rocket,
  RotateCcw,
  HelpCircle,
  Code,
  Webhook,
  Mail,
  Loader2,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Plus,
  X,
  Copy,
  Sparkles,
} from "lucide-react";
import {
  getChatbotConfig,
  updateChatbotConfig,
  publishChatbotConfig,
  toggleChatbotActive,
  resetChatbotConfig,
  getChatbotStats,
  type ChatbotConfigData,
} from "@/app/actions/chatbot-config";

// ============================================================================
// Types
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

// ============================================================================
// Components
// ============================================================================

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KeywordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemove = (keyword: string) => {
    onChange(value.filter((k) => k !== keyword));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="icon" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((keyword) => (
            <Badge key={keyword} variant="secondary" className="gap-1">
              {keyword}
              <button
                type="button"
                onClick={() => handleRemove(keyword)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AIBotSettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<ChatbotConfigData | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const [configData, statsData] = await Promise.all([
          getChatbotConfig(),
          getChatbotStats(),
        ]);
        setConfig(configData);
        setStats(statsData);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 설정 업데이트 핸들러
  const updateConfig = useCallback((updates: Partial<ChatbotConfigData>) => {
    setConfig((prev) => (prev ? { ...prev, ...updates } : null));
    setHasChanges(true);
  }, []);

  // 저장 핸들러
  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const result = await updateChatbotConfig(config);
      if (result.success) {
        setHasChanges(false);
        alert("설정이 저장되었습니다.");
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 배포 핸들러
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      if (hasChanges) {
        await handleSave();
      }
      const result = await publishChatbotConfig();
      if (result.success) {
        alert("챗봇 설정이 배포되었습니다.");
        const updatedConfig = await getChatbotConfig();
        setConfig(updatedConfig);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("배포에 실패했습니다.");
    } finally {
      setIsPublishing(false);
    }
  };

  // 활성화 토글 핸들러
  const handleToggleActive = async () => {
    try {
      const result = await toggleChatbotActive();
      if (result.success) {
        setConfig((prev) => (prev ? { ...prev, isActive: result.isActive } : null));
      }
    } catch (error) {
      alert("상태 변경에 실패했습니다.");
    }
  };

  // 초기화 핸들러
  const handleReset = async () => {
    try {
      const result = await resetChatbotConfig();
      if (result.success) {
        const updatedConfig = await getChatbotConfig();
        setConfig(updatedConfig);
        setHasChanges(false);
      }
    } catch (error) {
      alert("초기화에 실패했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">설정을 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">AI 챗봇 설정</h1>
              <Badge
                variant={config.isActive ? "default" : "secondary"}
                className="gap-1"
              >
                {config.isActive ? (
                  <>
                    <Check className="h-3 w-3" /> 활성화됨
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3" /> 비활성화됨
                  </>
                )}
              </Badge>
              {hasChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  저장되지 않은 변경사항
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              쇼핑몰 AI 챗봇의 동작 방식과 응답 스타일을 설정합니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleToggleActive}
              className={config.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
            >
              {config.isActive ? (
                <>
                  <Pause className="h-4 w-4 mr-2" /> 비활성화
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" /> 활성화
                </>
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" /> 초기화
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>설정을 초기화하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    모든 설정이 기본값으로 복원됩니다. 이 작업은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>초기화</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" onClick={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              저장
            </Button>
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4 mr-2" />
              )}
              배포
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatCard
              title="오늘 상담"
              value={stats.todaySessions}
              icon={<MessageSquare className="h-6 w-6 text-primary" />}
            />
            <StatCard
              title="이번 주 상담"
              value={stats.weekSessions}
              icon={<BarChart3 className="h-6 w-6 text-primary" />}
            />
            <StatCard
              title="이번 달 상담"
              value={stats.monthSessions}
              icon={<Bot className="h-6 w-6 text-primary" />}
            />
            <StatCard
              title="에스컬레이션 비율"
              value={`${stats.escalationRate}%`}
              icon={<AlertTriangle className="h-6 w-6 text-yellow-500" />}
            />
            <StatCard
              title="평균 대화 수"
              value={stats.avgMessagesPerSession}
              description="세션당"
              icon={<Sparkles className="h-6 w-6 text-purple-500" />}
            />
          </div>
        )}

        {/* 설정 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-8 w-full">
            <TabsTrigger value="general" className="gap-1">
              <Settings className="h-4 w-4" /> 기본
            </TabsTrigger>
            <TabsTrigger value="prompts" className="gap-1">
              <Brain className="h-4 w-4" /> 프롬프트
            </TabsTrigger>
            <TabsTrigger value="conversation" className="gap-1">
              <MessageSquare className="h-4 w-4" /> 대화
            </TabsTrigger>
            <TabsTrigger value="escalation" className="gap-1">
              <Zap className="h-4 w-4" /> 에스컬레이션
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1">
              <Clock className="h-4 w-4" /> 업무시간
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1">
              <Palette className="h-4 w-4" /> 외관
            </TabsTrigger>
            <TabsTrigger value="integration" className="gap-1">
              <Webhook className="h-4 w-4" /> 통합
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-1">
              <Shield className="h-4 w-4" /> 고급
            </TabsTrigger>
          </TabsList>

          {/* 기본 설정 탭 */}
          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" /> 챗봇 기본 정보
                  </CardTitle>
                  <CardDescription>
                    챗봇의 이름과 기본 동작을 설정합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">챗봇 이름</Label>
                    <Input
                      id="name"
                      value={config.name}
                      onChange={(e) => updateConfig({ name: e.target.value })}
                      placeholder="예: 미니쉴드 AI 상담원"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage">환영 메시지</Label>
                    <Textarea
                      id="welcomeMessage"
                      value={config.welcomeMessage}
                      onChange={(e) => updateConfig({ welcomeMessage: e.target.value })}
                      placeholder="고객에게 보여줄 첫 인사말을 입력하세요"
                      rows={5}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" /> 언어 및 지역
                  </CardTitle>
                  <CardDescription>
                    챗봇이 사용할 언어와 시간대를 설정합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultLanguage">기본 언어</Label>
                    <Select
                      value={config.defaultLanguage}
                      onValueChange={(value) => updateConfig({ defaultLanguage: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="언어 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ko">한국어</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">시간대</Label>
                    <Select
                      value={config.timezone}
                      onValueChange={(value) => updateConfig({ timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="시간대 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Seoul">Asia/Seoul (KST)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>버전 정보</Label>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>버전: v{config.version}</span>
                      {config.publishedAt && (
                        <span>
                          배포일: {new Date(config.publishedAt).toLocaleString("ko-KR")}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 프롬프트 설정 탭 */}
          <TabsContent value="prompts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" /> AI 시스템 프롬프트
                </CardTitle>
                <CardDescription>
                  AI의 역할과 응답 방식을 정의하는 핵심 프롬프트입니다. 챗봇의 성격과 행동을 결정합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">시스템 프롬프트</Label>
                  <Textarea
                    id="systemPrompt"
                    value={config.systemPrompt}
                    onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
                    placeholder="AI 챗봇의 역할과 동작 방식을 정의하세요..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    팁: 역할, 응대 원칙, 제품 정보, 금지 사항 등을 명확히 정의하세요.
                  </p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandVoice">브랜드 음성/톤</Label>
                    <Select
                      value={config.brandVoice}
                      onValueChange={(value) => updateConfig({ brandVoice: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="브랜드 톤 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="친근함">친근함 (Friendly)</SelectItem>
                        <SelectItem value="전문적">전문적 (Professional)</SelectItem>
                        <SelectItem value="캐주얼">캐주얼 (Casual)</SelectItem>
                        <SelectItem value="정중함">정중함 (Formal)</SelectItem>
                        <SelectItem value="유머러스">유머러스 (Humorous)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responseStyle">응답 스타일</Label>
                    <Select
                      value={config.responseStyle}
                      onValueChange={(value) => updateConfig({ responseStyle: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="응답 스타일 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONCISE">간결함 (Concise)</SelectItem>
                        <SelectItem value="BALANCED">균형 (Balanced)</SelectItem>
                        <SelectItem value="DETAILED">상세함 (Detailed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="temperature">창의성 (Temperature)</Label>
                      <span className="text-sm text-muted-foreground">{config.temperature}</span>
                    </div>
                    <Input
                      id="temperature"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.temperature}
                      onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      낮을수록 일관된 응답, 높을수록 창의적인 응답
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">최대 토큰 수</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      min="100"
                      max="4000"
                      value={config.maxTokens}
                      onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      응답의 최대 길이를 제한합니다 (100-4000)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 대화 설정 탭 */}
          <TabsContent value="conversation" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>대화 흐름 설정</CardTitle>
                  <CardDescription>
                    챗봇의 대화 흐름과 동작을 설정합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>전화번호 인증 필수</Label>
                      <p className="text-sm text-muted-foreground">
                        주문 조회 시 전화번호 인증을 요구합니다
                      </p>
                    </div>
                    <Switch
                      checked={config.requirePhoneAuth}
                      onCheckedChange={(checked) => updateConfig({ requirePhoneAuth: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>자동 인사말</Label>
                      <p className="text-sm text-muted-foreground">
                        채팅 시작 시 자동으로 환영 메시지를 표시합니다
                      </p>
                    </div>
                    <Switch
                      checked={config.autoGreeting}
                      onCheckedChange={(checked) => updateConfig({ autoGreeting: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>추천 질문 표시</Label>
                      <p className="text-sm text-muted-foreground">
                        사용자에게 관련 질문을 추천합니다
                      </p>
                    </div>
                    <Switch
                      checked={config.showSuggestions}
                      onCheckedChange={(checked) => updateConfig({ showSuggestions: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="maxConversationLength">최대 대화 길이</Label>
                    <Input
                      id="maxConversationLength"
                      type="number"
                      min="10"
                      max="200"
                      value={config.maxConversationLength}
                      onChange={(e) => updateConfig({ maxConversationLength: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      세션당 최대 메시지 수 (10-200)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>컨텍스트 메모리</CardTitle>
                  <CardDescription>
                    AI가 이전 대화 내용을 기억하는 방식을 설정합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>컨텍스트 메모리 활성화</Label>
                      <p className="text-sm text-muted-foreground">
                        이전 대화 내용을 기억하여 자연스러운 대화를 유지합니다
                      </p>
                    </div>
                    <Switch
                      checked={config.enableContextMemory}
                      onCheckedChange={(checked) => updateConfig({ enableContextMemory: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="contextMemoryLength">기억할 대화 수</Label>
                    <Input
                      id="contextMemoryLength"
                      type="number"
                      min="1"
                      max="50"
                      value={config.contextMemoryLength}
                      onChange={(e) => updateConfig({ contextMemoryLength: parseInt(e.target.value) })}
                      disabled={!config.enableContextMemory}
                    />
                    <p className="text-xs text-muted-foreground">
                      최근 몇 개의 메시지를 기억할지 설정 (1-50)
                    </p>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>감정 분석 활성화</Label>
                      <p className="text-sm text-muted-foreground">
                        고객의 감정을 분석하여 응답을 조절합니다
                      </p>
                    </div>
                    <Switch
                      checked={config.enableSentimentAnalysis}
                      onCheckedChange={(checked) => updateConfig({ enableSentimentAnalysis: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>의도 인식 활성화</Label>
                      <p className="text-sm text-muted-foreground">
                        고객의 질문 의도를 자동으로 분류합니다
                      </p>
                    </div>
                    <Switch
                      checked={config.enableIntentRecognition}
                      onCheckedChange={(checked) => updateConfig({ enableIntentRecognition: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 에스컬레이션 설정 탭 */}
          <TabsContent value="escalation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" /> 상담원 에스컬레이션
                </CardTitle>
                <CardDescription>
                  AI가 응답하지 못하는 상황에서 상담원에게 연결하는 규칙을 설정합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>상담원 연결 허용</Label>
                    <p className="text-sm text-muted-foreground">
                      고객이 상담원 연결을 요청할 수 있습니다
                    </p>
                  </div>
                  <Switch
                    checked={config.enableEscalation}
                    onCheckedChange={(checked) => updateConfig({ enableEscalation: checked })}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>에스컬레이션 키워드</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    다음 키워드가 감지되면 상담원 연결 옵션을 제공합니다
                  </p>
                  <KeywordInput
                    value={config.escalationKeywords}
                    onChange={(value) => updateConfig({ escalationKeywords: value })}
                    placeholder="키워드 입력 (Enter로 추가)"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>자동 에스컬레이션</Label>
                    <p className="text-sm text-muted-foreground">
                      AI가 답변하지 못할 때 자동으로 상담원 연결을 제안합니다
                    </p>
                  </div>
                  <Switch
                    checked={config.autoEscalateOnFail}
                    onCheckedChange={(checked) => updateConfig({ autoEscalateOnFail: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxFailBeforeEscalate">에스컬레이션 전 실패 횟수</Label>
                  <Input
                    id="maxFailBeforeEscalate"
                    type="number"
                    min="1"
                    max="10"
                    value={config.maxFailBeforeEscalate}
                    onChange={(e) => updateConfig({ maxFailBeforeEscalate: parseInt(e.target.value) })}
                    disabled={!config.autoEscalateOnFail}
                  />
                  <p className="text-xs text-muted-foreground">
                    AI가 몇 번 실패하면 상담원 연결을 제안할지 설정 (1-10)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 업무시간 설정 탭 */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" /> 업무 시간 설정
                </CardTitle>
                <CardDescription>
                  챗봇 운영 시간과 업무시간 외 안내 메시지를 설정합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>업무시간만 운영</Label>
                    <p className="text-sm text-muted-foreground">
                      설정된 업무시간에만 AI 상담을 제공합니다
                    </p>
                  </div>
                  <Switch
                    checked={config.businessHoursOnly}
                    onCheckedChange={(checked) => updateConfig({ businessHoursOnly: checked })}
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessHoursStart">업무 시작 시간</Label>
                    <Input
                      id="businessHoursStart"
                      type="time"
                      value={config.businessHoursStart}
                      onChange={(e) => updateConfig({ businessHoursStart: e.target.value })}
                      disabled={!config.businessHoursOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessHoursEnd">업무 종료 시간</Label>
                    <Input
                      id="businessHoursEnd"
                      type="time"
                      value={config.businessHoursEnd}
                      onChange={(e) => updateConfig({ businessHoursEnd: e.target.value })}
                      disabled={!config.businessHoursOnly}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>운영 요일</Label>
                  <div className="flex gap-2">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
                      <Button
                        key={day}
                        type="button"
                        variant={config.businessDays.includes(index) ? "default" : "outline"}
                        size="sm"
                        disabled={!config.businessHoursOnly}
                        onClick={() => {
                          const newDays = config.businessDays.includes(index)
                            ? config.businessDays.filter((d) => d !== index)
                            : [...config.businessDays, index].sort();
                          updateConfig({ businessDays: newDays });
                        }}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="outOfHoursMessage">업무시간 외 메시지</Label>
                  <Textarea
                    id="outOfHoursMessage"
                    value={config.outOfHoursMessage}
                    onChange={(e) => updateConfig({ outOfHoursMessage: e.target.value })}
                    placeholder="업무시간 외에 표시할 메시지를 입력하세요"
                    rows={3}
                    disabled={!config.businessHoursOnly}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 외관 설정 탭 */}
          <TabsContent value="appearance" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" /> 테마 설정
                  </CardTitle>
                  <CardDescription>
                    챗봇 위젯의 색상과 위치를 설정합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="themeColor">테마 색상</Label>
                    <div className="flex gap-2">
                      <Input
                        id="themeColor"
                        type="color"
                        value={config.themeColor}
                        onChange={(e) => updateConfig({ themeColor: e.target.value })}
                        className="w-20 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={config.themeColor}
                        onChange={(e) => updateConfig({ themeColor: e.target.value })}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chatPosition">위젯 위치</Label>
                    <Select
                      value={config.chatPosition}
                      onValueChange={(value) => updateConfig({ chatPosition: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="위치 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">우하단</SelectItem>
                        <SelectItem value="bottom-left">좌하단</SelectItem>
                        <SelectItem value="top-right">우상단</SelectItem>
                        <SelectItem value="top-left">좌상단</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">아바타 이미지 URL</Label>
                    <Input
                      id="avatarUrl"
                      value={config.avatarUrl}
                      onChange={(e) => updateConfig({ avatarUrl: e.target.value })}
                      placeholder="https://example.com/avatar.png"
                    />
                    <p className="text-xs text-muted-foreground">
                      챗봇 아바타로 사용할 이미지 URL (비워두면 기본 아이콘 사용)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>미리보기</CardTitle>
                  <CardDescription>
                    현재 설정이 적용된 챗봇 모습입니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative h-80 bg-muted rounded-lg p-4 overflow-hidden">
                    <div
                      className={`absolute ${
                        config.chatPosition.includes("bottom") ? "bottom-4" : "top-4"
                      } ${
                        config.chatPosition.includes("right") ? "right-4" : "left-4"
                      }`}
                    >
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer"
                        style={{ backgroundColor: config.themeColor }}
                      >
                        <MessageSquare className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <span className="text-sm">챗봇 위젯 미리보기</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 통합 설정 탭 */}
          <TabsContent value="integration" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" /> 웹훅 설정
                  </CardTitle>
                  <CardDescription>
                    외부 시스템과의 연동을 위한 웹훅을 설정합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">웹훅 URL</Label>
                    <Input
                      id="webhookUrl"
                      value={config.webhookUrl}
                      onChange={(e) => updateConfig({ webhookUrl: e.target.value })}
                      placeholder="https://your-webhook-endpoint.com/chatbot"
                    />
                    <p className="text-xs text-muted-foreground">
                      챗봇 이벤트를 수신할 웹훅 URL
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slackChannel">Slack 채널</Label>
                    <Input
                      id="slackChannel"
                      value={config.slackChannel}
                      onChange={(e) => updateConfig({ slackChannel: e.target.value })}
                      placeholder="#customer-support"
                    />
                    <p className="text-xs text-muted-foreground">
                      알림을 받을 Slack 채널 (Slack 앱 설정 필요)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" /> 이메일 알림
                  </CardTitle>
                  <CardDescription>
                    중요 이벤트 발생 시 이메일로 알림을 받습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>이메일 알림 활성화</Label>
                      <p className="text-sm text-muted-foreground">
                        에스컬레이션, 부정적 피드백 등의 알림을 이메일로 받습니다
                      </p>
                    </div>
                    <Switch
                      checked={config.emailNotifications}
                      onCheckedChange={(checked) => updateConfig({ emailNotifications: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notificationEmail">알림 이메일 주소</Label>
                    <Input
                      id="notificationEmail"
                      type="email"
                      value={config.notificationEmail}
                      onChange={(e) => updateConfig({ notificationEmail: e.target.value })}
                      placeholder="support@company.com"
                      disabled={!config.emailNotifications}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" /> API 설정
                </CardTitle>
                <CardDescription>
                  외부 시스템에서 챗봇 API에 접근하기 위한 설정입니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>외부 API 접근 허용</Label>
                    <p className="text-sm text-muted-foreground">
                      외부 시스템에서 챗봇 API를 호출할 수 있도록 합니다
                    </p>
                  </div>
                  <Switch
                    checked={config.enableApiAccess}
                    onCheckedChange={(checked) => updateConfig({ enableApiAccess: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiRateLimit">API 요청 제한 (분당)</Label>
                  <Input
                    id="apiRateLimit"
                    type="number"
                    min="10"
                    max="1000"
                    value={config.apiRateLimit}
                    onChange={(e) => updateConfig({ apiRateLimit: parseInt(e.target.value) })}
                    disabled={!config.enableApiAccess}
                  />
                  <p className="text-xs text-muted-foreground">
                    분당 허용되는 최대 API 요청 수 (10-1000)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 고급 설정 탭 */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" /> 보안 및 개인정보
                  </CardTitle>
                  <CardDescription>
                    데이터 보안과 개인정보 보호 설정입니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>민감정보 필터링</Label>
                      <p className="text-sm text-muted-foreground">
                        신용카드 번호, 주민번호 등 민감정보를 자동으로 마스킹합니다
                      </p>
                    </div>
                    <Switch
                      checked={config.sensitiveDataFilter}
                      onCheckedChange={(checked) => updateConfig({ sensitiveDataFilter: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>암호화 활성화</Label>
                      <p className="text-sm text-muted-foreground">
                        대화 내용을 암호화하여 저장합니다
                      </p>
                    </div>
                    <Switch
                      checked={config.enableEncryption}
                      onCheckedChange={(checked) => updateConfig({ enableEncryption: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>GDPR 준수</Label>
                      <p className="text-sm text-muted-foreground">
                        EU 일반 개인정보 보호법(GDPR) 규정을 준수합니다
                      </p>
                    </div>
                    <Switch
                      checked={config.gdprCompliant}
                      onCheckedChange={(checked) => updateConfig({ gdprCompliant: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataRetentionDays">데이터 보관 기간 (일)</Label>
                      <Input
                        id="dataRetentionDays"
                        type="number"
                        min="7"
                        max="365"
                        value={config.dataRetentionDays}
                        onChange={(e) => updateConfig({ dataRetentionDays: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="anonymizeAfterDays">익명화 기간 (일)</Label>
                      <Input
                        id="anonymizeAfterDays"
                        type="number"
                        min="1"
                        max="90"
                        value={config.anonymizeAfterDays}
                        onChange={(e) => updateConfig({ anonymizeAfterDays: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" /> 콘텐츠 필터링
                  </CardTitle>
                  <CardDescription>
                    부적절한 콘텐츠를 차단하는 설정입니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>금지어 목록</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      응답에서 제외할 단어나 문구를 추가하세요
                    </p>
                    <KeywordInput
                      value={config.blockedKeywords}
                      onChange={(value) => updateConfig({ blockedKeywords: value })}
                      placeholder="금지어 입력 (Enter로 추가)"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" /> A/B 테스트
                  </CardTitle>
                  <CardDescription>
                    챗봇 성능 비교를 위한 A/B 테스트를 설정합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>A/B 테스트 활성화</Label>
                      <p className="text-sm text-muted-foreground">
                        다양한 프롬프트와 설정을 테스트합니다
                      </p>
                    </div>
                    <Switch
                      checked={config.enableABTesting}
                      onCheckedChange={(checked) => updateConfig({ enableABTesting: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="abTestVariant">현재 테스트 변형</Label>
                    <Select
                      value={config.abTestVariant}
                      onValueChange={(value) => updateConfig({ abTestVariant: value })}
                      disabled={!config.enableABTesting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="변형 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">변형 A (기본)</SelectItem>
                        <SelectItem value="B">변형 B</SelectItem>
                        <SelectItem value="C">변형 C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" /> 분석 및 학습
                  </CardTitle>
                  <CardDescription>
                    챗봇 성능 분석과 자동 학습 설정입니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>분석 활성화</Label>
                      <p className="text-sm text-muted-foreground">
                        대화 패턴과 성능 지표를 수집합니다
                      </p>
                    </div>
                    <Switch
                      checked={config.enableAnalytics}
                      onCheckedChange={(checked) => updateConfig({ enableAnalytics: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>사용자 행동 추적</Label>
                      <p className="text-sm text-muted-foreground">
                        사용자 상호작용 패턴을 분석합니다
                      </p>
                    </div>
                    <Switch
                      checked={config.trackUserBehavior}
                      onCheckedChange={(checked) => updateConfig({ trackUserBehavior: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>자동 학습</Label>
                      <p className="text-sm text-muted-foreground">
                        성공적인 대화에서 자동으로 학습합니다
                      </p>
                    </div>
                    <Switch
                      checked={config.enableAutoLearning}
                      onCheckedChange={(checked) => updateConfig({ enableAutoLearning: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="learningThreshold">학습 임계값</Label>
                      <span className="text-sm text-muted-foreground">
                        {config.learningThreshold}
                      </span>
                    </div>
                    <Input
                      id="learningThreshold"
                      type="range"
                      min="0.5"
                      max="1"
                      step="0.05"
                      value={config.learningThreshold}
                      onChange={(e) => updateConfig({ learningThreshold: parseFloat(e.target.value) })}
                      disabled={!config.enableAutoLearning}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      신뢰도가 이 값 이상인 응답만 학습에 사용합니다
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
