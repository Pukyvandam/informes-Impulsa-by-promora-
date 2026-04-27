import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, style, children, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-xl flex flex-col", className)}
      style={{
        background: "#111736",
        border: "1px solid rgba(59,81,157,0.35)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-5 pb-0", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold leading-tight", className)}
      style={{ color: "#e8ecf5" }}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 flex-1", className)} {...props} />
  );
}

export function CardFooter({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 py-4 flex items-center gap-3", className)}
      style={{ borderTop: "1px solid rgba(59,81,157,0.25)", ...style }}
      {...props}
    />
  );
}
