import { createServiceClient } from "@/lib/supabase/server";
import { Insight, CategoriaInsight } from "@/lib/supabase/types";
import { InsightCard } from "@/components/impulsados/InsightCard";
import { Lightbulb } from "lucide-react";

const CAT_LABELS: Record<CategoriaInsight, string> = {
  miedo_explicito: "Miedos explícitos", miedo_implicito: "Miedos implícitos",
  reto: "Retos", resolucion: "Resoluciones", compromiso: "Compromisos",
  logro: "Logros", bloqueo: "Bloqueos", objetivo_emergente: "Objetivos emergentes",
  estado_emocional: "Estado emocional", feedback_mentor: "Feedback del mentor",
  objetivo_cumplido: "Objetivos cumplidos", alerta: "Alertas",
};

async function getData() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("insights")
      .select("*, impulsados_cache(nombre_completo, provincia)")
      .order("fecha", { ascending: false });
    return (data ?? []) as (Insight & { impulsados_cache: { nombre_completo: string; provincia: string | null } | null })[];
  } catch { return []; }
}

export default async function InsightsPage() {
  const insights = await getData();
  const byCat = insights.reduce<Record<string, typeof insights>>((acc, ins) => {
    (acc[ins.categoria] = acc[ins.categoria] ?? []).push(ins);
    return acc;
  }, {});

  const cats = Object.keys(byCat) as CategoriaInsight[];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold" style={{ color: "#e8ecf5" }}>
          <span className="italic-editorial">Insights</span>
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#8993b8" }}>
          {insights.length} insights acumulados · ordenados por fecha
        </p>
      </div>

      {/* Category filter pills */}
      {cats.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {cats.map(cat => (
            <span key={cat} className="text-xs px-3 py-1 rounded-full cursor-pointer"
              style={{ background: "rgba(59,81,157,0.2)", color: "#73ACCA", border: "1px solid rgba(59,81,157,0.3)" }}>
              {CAT_LABELS[cat]} <span style={{ color: "#8993b8" }}>({byCat[cat].length})</span>
            </span>
          ))}
        </div>
      )}

      {insights.length === 0 ? (
        <div className="glass rounded-xl p-16 text-center">
          <Lightbulb size={40} className="mx-auto mb-4" style={{ color: "#8993b8" }} />
          <h3 className="font-display text-xl mb-2" style={{ color: "#e8ecf5" }}>Sin insights aún</h3>
          <p className="text-sm" style={{ color: "#8993b8" }}>
            Procesa sesiones en <a href="/meetings/nuevo" className="underline" style={{ color: "#73ACCA" }}>/meetings/nuevo</a> para generar insights con Claude.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {cats.map(cat => (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-display text-xl" style={{ color: "#e8ecf5" }}>{CAT_LABELS[cat]}</h2>
                <span className="text-sm px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(59,81,157,0.2)", color: "#8993b8" }}>
                  {byCat[cat].length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {byCat[cat].map(ins => (
                  <div key={ins.id}>
                    <InsightCard insight={ins} />
                    {ins.impulsados_cache && (
                      <p className="text-xs mt-1 pl-1" style={{ color: "#8993b8" }}>
                        {ins.impulsados_cache.nombre_completo}
                        {ins.impulsados_cache.provincia ? ` · ${ins.impulsados_cache.provincia}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
