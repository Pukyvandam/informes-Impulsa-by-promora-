import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "active" | "pending" | "blocked" | "done";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default:  { background: "rgba(137,147,184,0.15)", color: "#8993b8", border: "1px solid rgba(137,147,184,0.3)" },
  active:   { background: "rgba(108,182,122,0.15)", color: "#6cb67a", border: "1px solid rgba(108,182,122,0.3)" },
  pending:  { background: "rgba(224,169,84,0.15)",  color: "#e0a954", border: "1px solid rgba(224,169,84,0.3)"  },
  blocked:  { background: "rgba(214,117,117,0.15)", color: "#d67575", border: "1px solid rgba(214,117,117,0.3)" },
  done:     { background: "rgba(115,172,202,0.15)", color: "#73ACCA", border: "1px solid rgba(115,172,202,0.3)" },
};

export function Badge({ variant = "default", className, style, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </span>
  );
}

/** Map a raw estado_programa string to a Badge variant */
export function estadoToBadgeVariant(estado: string | null | undefined): BadgeVariant {
  if (!estado) return "default";
  const s = estado.toLowerCase();
  if (s.includes("activ") || s.includes("en program")) return "active";
  if (s.includes("pend") || s.includes("espera"))        return "pending";
  if (s.includes("bloqu") || s.includes("baja"))         return "blocked";
  if (s.includes("complet") || s.includes("finaliz"))    return "done";
  return "default";
}
