"use client";
import { daysSince, truncate } from "@/lib/utils";
import type { ProgramaEtapa } from "@/lib/supabase/types";

interface HitoProgressProps {
  etapas: ProgramaEtapa[];
  fechaInicio: string | null;
}

type HitoStatus = "done" | "current" | "pending";

function getHitoStatus(
  hito: ProgramaEtapa,
  days: number | null
): HitoStatus {
  if (days === null) return "pending";
  const min = hito.dia_min ?? 0;
  const max = hito.dia_max ?? min + 14;
  if (days > max)  return "done";
  if (days >= min) return "current";
  return "pending";
}

export function HitoProgress({ etapas, fechaInicio }: HitoProgressProps) {
  const hitos = etapas
    .filter((e) => e.tipo === "hito")
    .sort((a, b) => a.orden - b.orden);

  const days = daysSince(fechaInicio);

  if (hitos.length === 0) {
    return (
      <p className="text-sm" style={{ color: "#8993b8" }}>
        Sin hitos definidos
      </p>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-start min-w-max gap-0">
        {hitos.map((hito, idx) => {
          const status = getHitoStatus(hito, days);
          const isLast = idx === hitos.length - 1;

          return (
            <div key={hito.id} className="flex items-start">
              {/* Circle + label */}
              <div className="flex flex-col items-center gap-2" style={{ width: 80 }}>
                {/* Circle */}
                <div className="relative flex items-center justify-center">
                  {status === "done" && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "#0B58A8", border: "2px solid #73ACCA" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7L5.5 10L11.5 4" stroke="#e8ecf5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  {status === "current" && (
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-full animate-pulse"
                        style={{
                          background: "rgba(11,88,168,0.25)",
                          border: "2px solid #0B58A8",
                          position: "absolute",
                          inset: "-4px",
                          borderRadius: "9999px",
                        }}
                      />
                      <div
                        className="w-8 h-8 rounded-full relative z-10 flex items-center justify-center"
                        style={{ background: "#1A3C96", border: "2px solid #73ACCA" }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: "#73ACCA" }}
                        />
                      </div>
                    </div>
                  )}
                  {status === "pending" && (
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{
                        background: "#111736",
                        border: "2px solid rgba(59,81,157,0.5)",
                      }}
                    />
                  )}
                </div>

                {/* Label */}
                <p
                  className="text-center leading-tight"
                  style={{
                    fontSize: "0.65rem",
                    color: status === "pending" ? "#8993b8" : "#e8ecf5",
                    maxWidth: 72,
                    wordBreak: "break-word",
                  }}
                >
                  {truncate(hito.nombre, 28)}
                </p>

                {/* Day range */}
                {(hito.dia_min !== null || hito.dia_max !== null) && (
                  <p
                    className="text-center"
                    style={{ fontSize: "0.6rem", color: "#8993b8" }}
                  >
                    {hito.dia_min ?? 0}–{hito.dia_max ?? "?"}d
                  </p>
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className="self-start mt-4 flex-shrink-0"
                  style={{
                    width: 32,
                    height: 2,
                    background:
                      status === "done"
                        ? "#0B58A8"
                        : "rgba(59,81,157,0.4)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress note */}
      {days !== null && (
        <p className="mt-4 text-xs" style={{ color: "#8993b8" }}>
          Día {days} del programa
        </p>
      )}
    </div>
  );
}
