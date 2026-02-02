"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, ShoppingCart, BarChart3, Settings, Package,
  Megaphone, TrendingUp, ClipboardList, BookOpen, Award, Shield,
  MessageSquare, Bot, UserCheck, AlertTriangle, RefreshCcw, Truck,
  AlertCircle, Star, FileBarChart, Bell, Gift, Mail, UserMinus,
  Target, PieChart, HelpCircle, BarChart2, Activity, Database,
  CheckCircle, HardDrive, FileText, ChevronDown, ChevronRight,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// Types
// ============================================================================

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface NavSubSection {
  id: string;
  label: string;
  items: NavItem[];
}

interface NavSection {
  id: string;
  title: string;
  isMain?: boolean;
  isCollapsible?: boolean;
  requiresAdmin?: boolean;
  items?: NavItem[];
  subSections?: NavSubSection[];
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  userRole?: string;
  isCollapsed?: boolean;
}

// ============================================================================
// Navigation Configuration
// ============================================================================

const NAV_SECTIONS: NavSection[] = [
  {
    id: "main",
    title: "AI CRM",
    isMain: true,
    items: [
      { id: "dashboard", label: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    id: "chat",
    title: "고객 상담",
    items: [
      { id: "ai-bot", label: "AI 챗봇 자동응답", href: "/dashboard/chat/ai-bot", icon: Bot },
      { id: "history", label: "상담 내역 저장", href: "/dashboard/chat/history", icon: MessageSquare },
      { id: "assign", label: "담당자 연결", href: "/dashboard/chat/assign", icon: UserCheck },
      { id: "priority", label: "문의 우선순위 분류", href: "/dashboard/chat/priority", icon: AlertTriangle },
    ],
  },
  {
    id: "orders",
    title: "주문 관리",
    items: [
      { id: "orders-main", label: "주문 데이터 통합", href: "/dashboard/orders", icon: ShoppingCart },
      { id: "orders-status", label: "주문 상태 확인", href: "/dashboard/orders/status", icon: RefreshCcw },
      { id: "orders-delivery", label: "배송 정보 연동", href: "/dashboard/orders/delivery", icon: Truck },
      { id: "orders-validation", label: "주문 오류 검증", href: "/dashboard/orders/validation", icon: AlertCircle },
    ],
  },
  {
    id: "reviews",
    title: "고객 리뷰 관리",
    items: [
      { id: "reviews-collect", label: "리뷰 자동 수집", href: "/dashboard/support", icon: Star },
      { id: "reviews-analysis", label: "LLM 리뷰 분류", href: "/dashboard/reviews/analysis", icon: FileBarChart },
      { id: "reviews-alerts", label: "불만 알림", href: "/dashboard/reviews/alerts", icon: Bell },
      { id: "reviews-report", label: "리뷰 요약 리포트", href: "/dashboard/reviews/report", icon: ClipboardList },
    ],
  },
  {
    id: "marketing",
    title: "마케팅 자동화",
    items: [
      { id: "marketing-coupon", label: "맞춤 쿠폰 발송", href: "/dashboard/marketing/coupon", icon: Gift },
      { id: "marketing-repurchase", label: "재구매 알림", href: "/dashboard/marketing/repurchase", icon: RefreshCcw },
      { id: "marketing-event", label: "이벤트 안내", href: "/dashboard/marketing/event", icon: Mail },
      { id: "marketing-winback", label: "이탈고객 재유입", href: "/dashboard/marketing/winback", icon: UserMinus },
      { id: "marketing-analytics", label: "캠페인 효과 분석", href: "/dashboard/marketing/analytics", icon: Target },
    ],
  },
  {
    id: "performance",
    title: "성과 관리",
    items: [
      { id: "perf-kpi", label: "실시간 KPI 대시보드", href: "/dashboard/performance/kpi", icon: PieChart },
      { id: "perf-customers", label: "고객 현황 분석", href: "/dashboard/customers", icon: Users },
      { id: "perf-inquiry", label: "문의 현황 분석", href: "/dashboard/performance/inquiry", icon: HelpCircle },
      { id: "perf-channel", label: "채널별 성과 비교", href: "/dashboard/performance/channel", icon: BarChart2 },
    ],
  },
  {
    id: "alerts",
    title: "알림 및 모니터링",
    items: [
      { id: "alerts-orders", label: "주문 급증 알림", href: "/dashboard/alerts/orders", icon: TrendingUp },
      { id: "alerts-inventory", label: "재고 부족 알림", href: "/dashboard/inventory", icon: Package },
      { id: "alerts-system", label: "시스템 오류 알림", href: "/dashboard/alerts/system", icon: AlertCircle },
      { id: "alerts-reviews", label: "악성 리뷰 감지", href: "/dashboard/alerts/reviews", icon: AlertTriangle },
      { id: "alerts-churn", label: "고객 이탈 위험 알림", href: "/dashboard/alerts/churn", icon: Activity },
    ],
  },
  {
    id: "data",
    title: "데이터 관리",
    items: [
      { id: "data-integration", label: "고객 정보 통합", href: "/dashboard/data/integration", icon: Database },
      { id: "data-quality", label: "데이터 품질 관리", href: "/dashboard/data/quality", icon: CheckCircle },
      { id: "data-backup", label: "백업 및 복구", href: "/dashboard/data/backup", icon: HardDrive },
    ],
  },
  {
    id: "reports",
    title: "보고서 생성",
    items: [
      { id: "reports-main", label: "LLM 기반 인사이트 리포트", href: "/dashboard/reports", icon: FileText },
    ],
  },
  {
    id: "custom",
    title: "사용자 정의",
    isCollapsible: true,
    subSections: [
      {
        id: "custom-analysis",
        label: "고객 분석",
        items: [
          { id: "segmentation", label: "고객 세분화", href: "/dashboard/customers/segmentation", icon: Users },
          { id: "behavior", label: "고객 행동 분석", href: "/dashboard/customers/behavior", icon: BarChart3 },
        ],
      },
      {
        id: "custom-sales",
        label: "영업 관리",
        items: [
          { id: "leads", label: "리드 및 기회 관리", href: "/dashboard/leads", icon: ShoppingCart },
          { id: "campaigns", label: "마케팅 캠페인", href: "/dashboard/marketing", icon: Megaphone },
          { id: "forecast", label: "매출 예측", href: "/dashboard/sales/forecast", icon: TrendingUp },
        ],
      },
      {
        id: "custom-orders",
        label: "판매 관리",
        items: [
          { id: "sales", label: "판매 현황", href: "/dashboard/sales", icon: ClipboardList },
          { id: "categories", label: "카테고리 메뉴", href: "/dashboard/sales/categories", icon: Package },
        ],
      },
      {
        id: "custom-support",
        label: "지원",
        items: [
          { id: "knowledge", label: "지식 기반", href: "/dashboard/knowledge", icon: BookOpen },
        ],
      },
      {
        id: "custom-partners",
        label: "파트너",
        items: [
          { id: "partners-portal", label: "파트너 포털", href: "/dashboard/partners", icon: Users },
          { id: "partners-edu", label: "교육 및 자료", href: "/dashboard/partners/education", icon: BookOpen },
          { id: "partners-perf", label: "성과 및 보상", href: "/dashboard/partners/performance", icon: Award },
        ],
      },
    ],
  },
  {
    id: "admin",
    title: "시스템 관리",
    requiresAdmin: true,
    items: [
      { id: "admin-users", label: "사용자 및 권한", href: "/dashboard/settings/users", icon: Shield },
      { id: "admin-settings", label: "시스템 설정", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

// ============================================================================
// Sub-components
// ============================================================================

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed?: boolean;
  variant?: "default" | "small";
}

function NavItemComponent({ item, isActive, isCollapsed, variant = "default" }: NavItemComponentProps) {
  const Icon = item.icon;
  const isSmall = variant === "small";
  
  const buttonContent = (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start",
        isSmall && "text-sm h-8",
        isCollapsed && "justify-center px-2"
      )}
      asChild
    >
      <Link href={item.href}>
        <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2", isSmall && "h-3 w-3")} />
        {!isCollapsed && item.label}
        {item.badge && !isCollapsed && (
          <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    </Button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return buttonContent;
}

interface NavSectionComponentProps {
  section: NavSection;
  pathname: string;
  isCollapsed?: boolean;
  expandedSections: Set<string>;
  onToggleSection: (sectionId: string) => void;
}

function NavSectionComponent({
  section,
  pathname,
  isCollapsed,
  expandedSections,
  onToggleSection,
}: NavSectionComponentProps) {
  const isExpanded = expandedSections.has(section.id);

  // Render collapsible section
  if (section.isCollapsible && section.subSections) {
    return (
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          className="w-full justify-between px-4 text-sm font-semibold text-muted-foreground"
          onClick={() => onToggleSection(section.id)}
        >
          {!isCollapsed && <span>{section.title}</span>}
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {isExpanded && !isCollapsed && (
          <div className="ml-2 mt-2 space-y-3 border-l-2 border-muted pl-2">
            {section.subSections.map((subSection) => (
              <div key={subSection.id} className="space-y-1">
                <p className="px-2 text-xs font-medium text-muted-foreground">
                  {subSection.label}
                </p>
                {subSection.items.map((item) => (
                  <NavItemComponent
                    key={item.id}
                    item={item}
                    isActive={pathname === item.href}
                    isCollapsed={isCollapsed}
                    variant="small"
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render regular section
  return (
    <div className="px-3 py-2">
      {!isCollapsed && (
        <h2
          className={cn(
            "mb-2 px-4 tracking-tight",
            section.isMain
              ? "text-lg font-semibold"
              : "text-sm font-semibold text-muted-foreground"
          )}
        >
          {section.title}
        </h2>
      )}
      <div className="space-y-1">
        {section.items?.map((item) => (
          <NavItemComponent
            key={item.id}
            item={item}
            isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Sidebar Component
// ============================================================================

export function Sidebar({ className, userRole = "USER", isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Filter sections based on user role
  const filteredSections = useMemo(() => {
    return NAV_SECTIONS.filter((section) => {
      if (section.requiresAdmin && userRole !== "ADMIN") {
        return false;
      }
      return true;
    });
  }, [userRole]);

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn("pb-12 overflow-y-auto", className)}>
        <div className="space-y-4 py-4">
          {filteredSections.map((section) => (
            <NavSectionComponent
              key={section.id}
              section={section}
              pathname={pathname}
              isCollapsed={isCollapsed}
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
