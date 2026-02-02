"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const mergedRef = ref || inputRef;

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    }, [onCheckedChange]);

    const handleClick = React.useCallback(() => {
      if (inputRef.current) {
        inputRef.current.click();
      }
    }, []);

    return (
      <div className="relative flex items-center">
        <input
          type="checkbox"
          ref={(node) => {
            inputRef.current = node;
            if (typeof mergedRef === 'function') {
              mergedRef(node);
            } else if (mergedRef) {
              (mergedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }
          }}
          checked={checked}
          onChange={handleChange}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "peer-checked:bg-primary peer-checked:text-primary-foreground",
            "flex items-center justify-center cursor-pointer",
            className
          )}
          onClick={handleClick}
        >
          {checked && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
