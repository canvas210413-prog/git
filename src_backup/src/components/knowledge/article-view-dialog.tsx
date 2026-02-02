"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface ArticleViewDialogProps {
  article: {
    id: string;
    title: string;
    content: string;
    category: string;
    tags?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function ArticleViewDialog({ article }: ArticleViewDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="mr-2 h-4 w-4" /> 보기
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge>{article.category}</Badge>
            {article.tags?.split(",").map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {tag.trim()}
              </Badge>
            ))}
          </div>
          <DialogTitle className="text-2xl">{article.title}</DialogTitle>
          <DialogDescription>
            작성: {new Date(article.createdAt).toLocaleDateString("ko-KR")} | 
            수정: {new Date(article.updatedAt).toLocaleDateString("ko-KR")}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {article.content}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
