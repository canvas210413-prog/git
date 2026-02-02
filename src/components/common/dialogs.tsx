"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  onConfirm,
  onCancel,
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === "destructive" && (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "처리 중..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  type?: "info" | "success" | "warning" | "error";
  confirmLabel?: string;
  onConfirm?: () => void;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  type = "info",
  confirmLabel = "확인",
  onConfirm,
}: AlertDialogProps) {
  const icons = {
    info: <Info className="h-6 w-6 text-blue-500" />,
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
    warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
    error: <XCircle className="h-6 w-6 text-red-500" />,
  };

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <div className="flex flex-col items-center text-center pt-4">
          {icons[type]}
          <DialogHeader className="mt-4">
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription className="mt-2">{description}</DialogDescription>
            )}
          </DialogHeader>
        </div>
        <DialogFooter className="mt-4">
          <Button className="w-full" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = "저장",
  cancelLabel = "취소",
  onSubmit,
  onCancel,
  isSubmitting = false,
  size = "md",
}: FormDialogProps) {
  const sizeClasses = {
    sm: "sm:max-w-[400px]",
    md: "sm:max-w-[500px]",
    lg: "sm:max-w-[700px]",
    xl: "sm:max-w-[900px]",
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(sizeClasses[size])}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-4">{children}</div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
