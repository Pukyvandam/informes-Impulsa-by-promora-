import Link from "next/link";
import { MapPin, User, BookOpen } from "lucide-react";
import { Badge, estadoToBadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { programDay, programMonth, truncate } from "@/lib/utils";
import type { ImpulsadoCache } from "@/lib/supabase/types";

interface ImpulsadoCardProps {
  impulsado: ImpulsadoCache;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function ImpulsadoCard({ impulsado }: ImpulsadoCardProps) {
  const {
    id,
    nombre_completo,
    provincia,
    estado_programa,
    fecha_inicio,
    mentor_principal,
    caso_real_curso,
  } = impulsado;

  const day   = programDay(fecha_inicio);
  const month = programMonth(fecha_inicio);
  const initials = getInitials(nombre_completo);

  return (
    <Link href={`/impulsados/${id}`} className="block group">
      <Card
        className="h-full transition-all duration-200 group-hover:translate-y-[-2px]"
        style={{
          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div className="p-5 flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-base shrink-0"
            style={{ background: "linear-gradient(135deg, #1A3C96 0%, #0B58A8 100%)" }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-[15px] leading-tight truncate"
              style={{ color: "#e8ecf5", fontFamily: "Fraunces, serif" }}
            >
              {nombre_completo}
            </h3>

            {provincia && (
              <p className="flex items-center gap-1 text-xs mt-1" style={{ color: "#8993b8" }}>
                <MapPin size={11} />
                {provincia}
              </p>
            )}
          </div>

          <Badge variant={estadoToBadgeVariant(estado_programa)}>
            {estado_programa ?? "—"}
          </Badge>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(59,81,157,0.2)" }} />

        {/* Body */}
        <div className="p-5 space-y-2.5">
          {day !== null && (
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: "#8993b8" }}>Progreso</span>
              <span style={{ color: "#73ACCA" }}>
                Día {day} · Mes {month ?? 1}
              </span>
            </div>
          )}

          {mentor_principal && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8993b8" }}>
              <User size={11} className="shrink-0" />
              <span className="truncate">{mentor_principal}</span>
            </div>
          )}

          {caso_real_curso && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8993b8" }}>
              <BookOpen size={11} className="shrink-0" />
              <span className="truncate">{truncate(caso_real_curso, 48)}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
