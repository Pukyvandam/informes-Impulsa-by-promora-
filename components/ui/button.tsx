import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "text-white shadow-sm active:scale-95",
        outline:
          "border bg-transparent text-[#e8ecf5] hover:bg-white/5 active:scale-95",
        ghost:
          "bg-transparent text-[#e8ecf5] hover:bg-white/5 active:scale-95",
        destructive:
          "text-white active:scale-95",
      },
      size: {
        sm:      "px-3 py-1.5 text-xs h-8",
        default: "px-4 py-2 text-sm h-9",
        lg:      "px-6 py-2.5 text-base h-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const variantStyles: React.CSSProperties =
      variant === "default"
        ? { background: "linear-gradient(135deg, #1A3C96 0%, #0B58A8 100%)", border: "1px solid rgba(11,88,168,0.5)", ...style }
        : variant === "outline"
        ? { borderColor: "rgba(59,81,157,0.5)", ...style }
        : variant === "destructive"
        ? { background: "linear-gradient(135deg, #b94b4b 0%, #d67575 100%)", border: "1px solid rgba(214,117,117,0.5)", ...style }
        : style ?? {};

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={variantStyles}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
