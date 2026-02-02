"use client";

import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  ShoppingCart,
  Users,
  AlertCircle,
  Package,
  Target,
  Clock,
  Truck,
  CheckCircle,
  Star,
  BarChart,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatNumber, formatPercent } from "@/lib/utils";

// Icon map for string-based icon prop
const ICON_MAP: Record<string, LucideIcon> = {
  "dollar-sign": DollarSign,
  "shopping-cart": ShoppingCart,
  users: Users,
  "alert-circle": AlertCircle,
  package: Package,
  target: Target,
  clock: Clock,
  truck: Truck,
  "check-circle": CheckCircle,
  "trending-up": TrendingUp,
  star: Star,
  "bar-chart": BarChart,
  activity: Activity,
};

type IconName = keyof typeof ICON_MAP;

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: IconName | LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
  valueClassName?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  valueClassName,
  variant = "default",
}: StatCardProps) {
  // Resolve icon from string or use directly if it's a component
  const Icon = typeof icon === "string" ? ICON_MAP[icon] : icon;
  
  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
      ? TrendingDown
      : Minus
    : null;

  const trendColor = trend
    ? trend.value > 0
      ? "text-green-600"
      : trend.value < 0
      ? "text-red-600"
      : "text-gray-500"
    : "";

  const variantValueColors = {
    default: "",
    success: "text-green-600",
    warning: "text-orange-600",
    danger: "text-red-600",
    info: "text-blue-600",
  };

  const variantIconColors = {
    default: "text-muted-foreground",
    success: "text-green-500",
    warning: "text-orange-500",
    danger: "text-red-500",
    info: "text-blue-500",
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className={cn("h-4 w-4", variantIconColors[variant])} />}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", variantValueColors[variant], valueClassName)}>
          {typeof value === "number" ? formatNumber(value) : value}
        </div>
        {(description || trend) && (
          <div className="flex items-center gap-1 mt-1">
            {trend && TrendIcon && (
              <>
                <TrendIcon className={cn("h-4 w-4", trendColor)} />
                <span className={cn("text-xs font-medium", trendColor)}>
                  {trend.value > 0 ? "+" : ""}
                  {formatPercent(trend.value)}
                  {trend.label && ` ${trend.label}`}
                </span>
              </>
            )}
            {description && !trend && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
}

export function StatGrid({ children, columns = 4 }: StatGridProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns])}>
      {children}
    </div>
  );
}

interface MiniStatProps {
  label: string;
  value: string | number;
  icon?: IconName | LucideIcon;
  color?: "default" | "success" | "warning" | "danger";
}

export function MiniStat({ label, value, icon, color = "default" }: MiniStatProps) {
  const Icon = typeof icon === "string" ? ICON_MAP[icon] : icon;
  
  const colorClasses = {
    default: "text-foreground",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600",
  };

  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className={cn("h-4 w-4", colorClasses[color])} />}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-medium", colorClasses[color])}>
          {typeof value === "number" ? formatNumber(value) : value}
        </p>
      </div>
    </div>
  );
}
