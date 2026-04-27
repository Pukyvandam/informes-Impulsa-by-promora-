"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { truncate } from "@/lib/utils";
import type { CategoriaInsight, Insight } from "@/lib/supabase/types";

const CATEGORY_LABELS: Record<CategoriaInsight, string> = {
  miedo_explicito:   "Miedo explícito",
  miedo_implicito:   "Miedo implícito",
  reto:              "Reto",
  resolucion:        "Resolución",
  compromiso:        "Compromiso",
  logro:             "Logro",
  bloqueo:           "Bloqueo",
  objetivo_emergente:"Objetivo emergente",
  estado_emocional:  "Estado emocional",
  feedback_mentor:   "Feedback mentor",
  objetivo_cumplido: "Objetivo cumplido",
  alerta:            "Alerta",
};

function getCategoryChipClass(cat: CategoriaInsight): string {
  if (cat.startsWith("miedo")) return "chip-miedo";
  if (cat === "reto")          return "chip-reto";
  if (cat === "logro" || cat === "objetivo_cumplido" || cat === "resolucion") return "chip-logro";
  if (cat === "bloqueo")       return "chip-bloqueo";
  if (cat === "compromiso" || cat === "objetivo_emergente" || cat === "estado_emocional" || cat === "feedback_mentor") return "chip-compromiso";
  if (cat === "alerta")        return "chip-alerta";
  return "chip-default";
}

interface InsightCardProps {
  insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const chipClass = getCategoryChipClass(insight.categoria);
  const label     = CATEGORY_LABELS[insight.categoria] ?? insight.categoria;

  return (
    <Card className="flex flex-col gap-0">
      <CardContent className="p-4 space-y-3">
        {/* Category chip */}
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${chipClass}`}
        >
          {label}
        </span>

        {/* Title */}
        <h4
          className="font-semibold text-sm leading-snug"
          style={{ color: "#e8ecf5" }}
        >
          {insight.titulo}
        </h4>

        {/* Description */}
        <p className="text-sm leading-relaxed" style={{ color: "#8993b8" }}>
          {insight.descripcion}
        </p>

        {/* Evidencia */}
        {insight.evidencia && (
          <div>
            <button
              onClick={() => setEvidenceOpen((v) => !v)}
              className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
              style={{ color: "#73ACCA" }}
            >
              <Quote size={11} />
              {evidenceOpen ? "Ocultar evidencia" : "Ver evidencia"}
              {evidenceOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {evidenceOpen && (
              <blockquote
                className="mt-2 pl-3 text-sm italic leading-relaxed"
                style={{
                  color: "#8993b8",
                  borderLeft: "2px solid rgba(115,172,202,0.4)",
                  fontFamily: "Fraunces, serif",
                }}
              >
                {insight.evidencia}
              </blockquote>
            )}
          </div>
        )}

        {/* Confidence */}
        {insight.confianza !== null && (
          <div className="flex items-center gap-2">
            <div
              className="flex-1 h-1 rounded-full overflow-hidden"
              style={{ background: "rgba(59,81,157,0.3)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(insight.confianza * 100)}%`,
                  background: "linear-gradient(90deg, #1A3C96, #73ACCA)",
                }}
              />
            </div>
            <span className="text-xs shrink-0" style={{ color: "#8993b8" }}>
              {Math.round(insight.confianza * 100)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
