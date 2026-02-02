"use client";

import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  ORDER_STATUS_LABELS,
  TICKET_STATUS_LABELS,
  LEAD_STATUS_LABELS,
  PRIORITY_LABELS,
  SENTIMENT_LABELS,
  SEGMENT_LABELS,
} from "@/lib/constants";

type StatusType = keyof typeof STATUS_COLORS;

interface StatusBadgeProps {
  status: string;
  type?: "status" | "order" | "ticket" | "lead" | "priority" | "sentiment" | "segment";
  className?: string;
}

export function StatusBadge({ status, type = "status", className }: StatusBadgeProps) {
  const labels: Record<string, Record<string, string>> = {
    status: STATUS_LABELS,
    order: ORDER_STATUS_LABELS,
    ticket: TICKET_STATUS_LABELS,
    lead: LEAD_STATUS_LABELS,
    priority: PRIORITY_LABELS,
    sentiment: SENTIMENT_LABELS,
    segment: SEGMENT_LABELS,
  };

  const label = labels[type]?.[status] || status;
  const colorClass = STATUS_COLORS[status as StatusType] || "bg-gray-500";

  return (
    <Badge className={cn(colorClass, "text-white", className)}>
      {label}
    </Badge>
  );
}

interface DotStatusProps {
  status: "success" | "warning" | "error" | "info" | "default";
  label?: string;
}

export function DotStatus({ status, label }: DotStatusProps) {
  const dotColors = {
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    default: "bg-gray-400",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2 w-2 rounded-full", dotColors[status])} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

interface ProgressIndicatorProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  color?: "default" | "success" | "warning" | "danger";
}

export function ProgressIndicator({
  value,
  max = 100,
  size = "md",
  showLabel = false,
  color = "default",
}: ProgressIndicatorProps) {
  const percent = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const colorClasses = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span>{value}</span>
          <span className="text-muted-foreground">{max}</span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-secondary", sizeClasses[size])}>
        <div
          className={cn(
            "rounded-full transition-all duration-300",
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
}

export function RatingStars({ rating, max = 5, size = "md" }: RatingStarsProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          className={cn(
            sizeClasses[size],
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
