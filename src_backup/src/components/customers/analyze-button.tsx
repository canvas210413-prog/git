"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { analyzeCustomer } from "@/app/actions/ai";
import { cn } from "@/lib/utils";

interface AnalyzeButtonProps {
  customerId: string;
  currentSegment?: string | null;
}

export function AnalyzeButton({ customerId, currentSegment }: AnalyzeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      await analyzeCustomer(customerId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {currentSegment && (
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-full border",
          currentSegment === "Enterprise" && "bg-blue-100 text-blue-700 border-blue-200",
          currentSegment === "SMB" && "bg-green-100 text-green-700 border-green-200",
          currentSegment === "At-Risk" && "bg-red-100 text-red-700 border-red-200",
          currentSegment === "VIP" && "bg-purple-100 text-purple-700 border-purple-200",
        )}>
          {currentSegment}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-primary"
        onClick={handleAnalyze}
        disabled={loading}
        title="AI 분석"
      >
        <Sparkles className={cn("h-4 w-4", loading && "animate-spin")} />
        <span className="sr-only">분석</span>
      </Button>
    </div>
  );
}
