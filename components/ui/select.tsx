import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, style, children, placeholder, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            "flex w-full appearance-none rounded-lg px-3 py-2 pr-9 text-sm text-white outline-none transition-all cursor-pointer",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          style={{
            background: "#171e42",
            border: "1px solid rgba(59,81,157,0.4)",
            color: "#e8ecf5",
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
        >
          {placeholder && (
            <option value="" style={{ background: "#171e42", color: "#8993b8" }}>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: "#8993b8" }}
        />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
