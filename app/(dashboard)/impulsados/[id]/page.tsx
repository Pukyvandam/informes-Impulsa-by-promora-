import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ImpulsadoCache, Meeting, Insight, KcdMensual, ProgramaEtapa } from "@/lib/supabase/types";
import { HitoProgress } from "@/components/impulsados/HitoProgress";
import { InsightCard } from "@/components/impulsados/InsightCard";
import { KCDTable } from "@/components/impulsados/KCDTable";
import { formatDate, daysSince, programMonth } from "@/lib/utils";
import { MapPin, User, Calendar, ExternalLink, FileText, MessageSquare, CheckSquare, BookOpen } from "lucide-react";
import { Metadata } from "next";

interface PageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const supabase = createServiceClient();
    const { data } = await supabase.from("impulsados_cache").select("nombre_completo").eq("id", id).single();
    return { title: data?.nombre_completo ? `${data.nombre_completo} — Impulsa Intelligence` : "Impulsado" };
  } catch { return { title: "Impulsado — Impulsa Intelligence" }; }
}

async function getData(id: string) {
  const supabase = createServiceClient();
  const [impRes, meetRes, insRes, kcdRes, etapasRes] = await Promise.all([
    supabase.from("impulsados_cache").select("*").eq("id", id).single(),
    supabase.from("meetings").select("*").eq("impulsado_id", id).order("fecha", { ascending: false }),
    supabase.from("insights").select("*").eq("impulsado_id", id).order("fecha", { ascending: false }),
    supabase.from("kcd_mensuales").select("*").eq("impulsado_id", id).order("mes", { ascending: false }).limit(2),
    supabase.from("programa_etapas").select("*").order("orden"),
  ]);
  return {
    impulsado: impRes.data as ImpulsadoCache | null,
    meetings: (meetRes.data ?? []) as Meeting[],
    insights: (insRes.data ?? []) as Insight[],
    kcds: (kcdRes.data ?? []) as KcdMensual[],
    etapas: (etapasRes.data ?? []) as ProgramaEtapa[],
  };
}

const MEETING_TYPE_ICON: Record<string, React.ElementType> = {
  mentoria: MessageSquare, check_control: CheckSquare, teoria: BookOpen, otro: FileText,
};
const MEETING_TYPE_LABEL: Record<string, string> = {
  mentoria: "Mentoría", check_control: "Check Control", sesion_practica: "Sesión práctica", otro: "Sesión",
};

export default async function ImpulsadoPage({ params }: PageProps) {
  const { id } = await params;
  const { impulsado, meetings, insights, kcds, etapas } = await getData(id);
  if (!impulsado) notFound();

  const dias = daysSince(impulsado.fecha_inicio);
  const mes = programMonth(impulsado.fecha_inicio);
  const initials = impulsado.nombre_completo.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  // Group insights by category
  const insightsByCat = insights.reduce<Record<string, Insight[]>>((acc, ins) => {
    (acc[ins.categoria] = acc[ins.categoria] ?? []).push(ins);
    return acc;
  }, {});

  const CAT_LABELS: Record<string, string> = {
    miedo_explicito: "Miedos explícitos", miedo_implicito: "Miedos implícitos",
    reto: "Retos", resolucion: "Resoluciones", compromiso: "Compromisos",
    logro: "Logros", bloqueo: "Bloqueos", objetivo_emergente: "Objetivos emergentes",
    estado_emocional: "Estado emocional", feedback_mentor: "Feedback del mentor",
    objetivo_cumplido: "Objetivos cumplidos", alerta: "Alertas",
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-semibold shrink-0 text-white"
            style={{ background: "linear-gradient(135deg, #19137F 0%, #0B58A8 100%)" }}>
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="font-display text-2xl md:text-3xl font-semibold" style={{ color: "#e8ecf5" }}>
              {impulsado.nombre_completo}
            </h1>

            {/* Pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              {impulsado.estado_programa && (
                <span className="status-active text-xs px-3 py-1 rounded-full">
                  {impulsado.estado_programa}
                </span>
              )}
              {impulsado.provincia && (
                <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
                  style={{ background: "rgba(59,81,157,0.2)", color: "#73ACCA", border: "1px solid rgba(59,81,157,0.3)" }}>
                  <MapPin size={11} /> {impulsado.provincia}
                </span>
              )}
              {dias !== null && (
                <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
                  style={{ background: "rgba(59,81,157,0.2)", color: "#8993b8", border: "1px solid rgba(59,81,157,0.3)" }}>
                  <Calendar size={11} /> Día {dias} · Mes {mes}
                </span>
              )}
            </div>

            {/* Data grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 mt-5 text-sm">
              <DataField label="Mentor" value={impulsado.mentor_principal} />
              <DataField label="Fecha de inicio" value={formatDate(impulsado.fecha_inicio)} />
              <DataField label="Estado documentación" value={impulsado.estado_documentacion} />
              <DataField label="Responsables" value={impulsado.responsables?.join(", ")} />
              <DataField label="Caso real" value={impulsado.caso_real_curso} />
              <DataField label="Valor estimado"
                value={impulsado.valor_caso_real
                  ? `${impulsado.valor_caso_real.toLocaleString("es-ES")} €`
                  : undefined} />
              <DataField label="Semana entregable" value={impulsado.semana_entregable} />
              <DataField label="Último entregable" value={formatDate(impulsado.fecha_ultimo_entregable)} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <a href={`https://notion.so/${impulsado.notion_id.replace(/-/g, "")}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
              style={{ background: "rgba(59,81,157,0.2)", color: "#73ACCA", border: "1px solid rgba(59,81,157,0.3)" }}>
              <ExternalLink size={13} /> Ver en Notion
            </a>
            <GenerarInformeButton impulsadoId={id} />
          </div>
        </div>
      </div>

      {/* ── PROGRESO ─────────────────────────────────────────── */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-display text-lg mb-5" style={{ color: "#e8ecf5" }}>
          Progreso en el programa
        </h2>
        <HitoProgress etapas={etapas} fechaInicio={impulsado.fecha_inicio} />
      </div>

      {/* ── TIMELINE ─────────────────────────────────────────── */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-display text-lg mb-5" style={{ color: "#e8ecf5" }}>
          Timeline de sesiones
        </h2>
        {meetings.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "#8993b8" }}>Sin sesiones registradas.</p>
        ) : (
          <div className="space-y-4">
            {meetings.map(m => {
              const Icon = MEETING_TYPE_ICON[m.tipo] ?? FileText;
              const done = m.estado_procesamiento === "completado";
              return (
                <div key={m.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(11,88,168,0.25)" }}>
                      <Icon size={14} style={{ color: "#73ACCA" }} />
                    </div>
                    <div className="w-px flex-1 mt-2" style={{ background: "rgba(59,81,157,0.3)" }} />
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#e8ecf5" }}>{m.titulo}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs" style={{ color: "#8993b8" }}>
                            {MEETING_TYPE_LABEL[m.tipo] ?? "Sesión"} · {formatDate(m.fecha)}
                          </span>
                          {m.duracion_minutos && (
                            <span className="text-xs" style={{ color: "#8993b8" }}>· {m.duracion_minutos} min</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={done
                          ? { background: "rgba(108,182,122,0.15)", color: "#6cb67a", border: "1px solid rgba(108,182,122,0.3)" }
                          : { background: "rgba(224,169,84,0.15)", color: "#e0a954", border: "1px solid rgba(224,169,84,0.3)" }}>
                        {done ? "Procesado" : m.estado_procesamiento}
                      </span>
                    </div>
                    {m.resumen_procesado && (
                      <p className="text-xs mt-2 leading-relaxed line-clamp-3" style={{ color: "#8993b8" }}>
                        {m.resumen_procesado}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── INSIGHTS ─────────────────────────────────────────── */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg" style={{ color: "#e8ecf5" }}>Insights</h2>
          <span className="text-sm" style={{ color: "#8993b8" }}>{insights.length} total</span>
        </div>
        {insights.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "#8993b8" }}>
            Sin insights. Procesa una sesión para generarlos.
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(insightsByCat).map(([cat, catInsights]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-medium" style={{ color: "#e8ecf5" }}>
                    {CAT_LABELS[cat] ?? cat}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(59,81,157,0.2)", color: "#8993b8" }}>
                    {catInsights.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {catInsights.map(ins => <InsightCard key={ins.id} insight={ins} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MÉTRICAS KCD ─────────────────────────────────────── */}
      {kcds.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h2 className="font-display text-lg mb-5" style={{ color: "#e8ecf5" }}>
            Métricas KCD
          </h2>
          <KCDTable current={kcds[0] ?? null} previous={kcds[1] ?? null} />
        </div>
      )}
    </div>
  );
}

function DataField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide" style={{ color: "#8993b8" }}>{label}</p>
      <p className="mt-0.5 text-sm" style={{ color: value ? "#e8ecf5" : "#8993b8" }}>{value ?? "—"}</p>
    </div>
  );
}

function GenerarInformeButton({ impulsadoId }: { impulsadoId: string }) {
  return (
    <form action={`/api/informes/generate`} method="POST">
      <input type="hidden" name="impulsado_id" value={impulsadoId} />
      <a href={`/informes?impulsado=${impulsadoId}`}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
        style={{ background: "rgba(11,88,168,0.3)", color: "#e8ecf5", border: "1px solid rgba(11,88,168,0.4)" }}>
        <FileText size={13} /> Ver informes
      </a>
    </form>
  );
}
