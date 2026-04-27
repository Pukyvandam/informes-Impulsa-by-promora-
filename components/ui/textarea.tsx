import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex w-full rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8993b8] outline-none transition-all resize-y",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        style={{
          background: "#171e42",
          border: "1px solid rgba(59,81,157,0.4)",
          minHeight: "80px",
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = "1px solid rgba(11,88,168,0.8)";
          e.currentTarget.style.boxShadow = "0 0 0 2px rgba(11,88,168,0.15)";
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = "1px solid rgba(59,81,157,0.4)";
          e.currentTarget.style.boxShadow = "none";
          props.onBlur?.(e);
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
