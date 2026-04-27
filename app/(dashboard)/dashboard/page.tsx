import { createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Users, MessageSquare, Lightbulb, FileText, MapPin, Calendar } from "lucide-react";

async function getData() {
  try {
    const supabase = createServiceClient();
    const now = new Date();
    const mesStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    const [impulsadosRes, meetingsRes, insightsRes, informesRes, recentMeetingsRes] = await Promise.all([
      supabase.from("impulsados_cache").select("id, nombre_completo, provincia, estado_programa, mentor_principal, created_at").order("created_at", { ascending: false }),
      supabase.from("meetings").select("id", { count: "exact" }).gte("fecha", mesStart),
      supabase.from("insights").select("id", { count: "exact" }),
      supabase.from("informes").select("id", { count: "exact" }),
      supabase.from("meetings").select("id, titulo, fecha, estado_procesamiento, impulsado_id, impulsados_cache(nombre_completo)").order("fecha", { ascending: false }).limit(5),
    ]);

    return {
      impulsados: impulsadosRes.data ?? [],
      meetingsThisMonth: meetingsRes.count ?? 0,
      totalInsights: insightsRes.count ?? 0,
      totalInformes: informesRes.count ?? 0,
      recentMeetings: recentMeetingsRes.data ?? [],
    };
  } catch {
    return { impulsados: [], meetingsThisMonth: 0, totalInsights: 0, totalInformes: 0, recentMeetings: [] };
  }
}

const KPI_CARD = ({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number | string; sub?: string }) => (
  <div className="glass rounded-xl p-5">
    <div className="flex items-start justify-between mb-3">
      <div className="p-2 rounded-lg" style={{ background: "rgba(11,88,168,0.2)" }}>
        <Icon size={18} style={{ color: "#73ACCA" }} />
      </div>
    </div>
    <p className="text-3xl font-semibold" style={{ color: "#e8ecf5" }}>{value}</p>
    <p className="text-sm mt-1" style={{ color: "#8993b8" }}>{label}</p>
    {sub && <p className="text-xs mt-0.5" style={{ color: "#73ACCA" }}>{sub}</p>}
  </div>
);

export default async function DashboardPage() {
  const { impulsados, meetingsThisMonth, totalInsights, totalInformes, recentMeetings } = await getData();
  const activos = impulsados.filter((i: { estado_programa?: string | null }) => i.estado_programa?.toLowerCase().includes("activ"));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold" style={{ color: "#e8ecf5" }}>
          <span className="italic-editorial">Dashboard</span>
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#8993b8" }}>
          Vista general del programa Impulsa by Promora
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPI_CARD icon={Users} label="Impulsados activos" value={activos.length} sub={`de ${impulsados.length} totales`} />
        <KPI_CARD icon={MessageSquare} label="Sesiones este mes" value={meetingsThisMonth} />
        <KPI_CARD icon={Lightbulb} label="Insights generados" value={totalInsights} />
        <KPI_CARD icon={FileText} label="Informes creados" value={totalInformes} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent impulsados */}
        <div className="glass rounded-xl p-5">
          <h2 className="font-display text-lg mb-4" style={{ color: "#e8ecf5" }}>Impulsados recientes</h2>
          <div className="space-y-3">
            {impulsados.slice(0, 5).map((imp: { id: string; nombre_completo: string; provincia?: string | null; estado_programa?: string | null }) => (
              <a key={imp.id} href={`/impulsados/${imp.id}`}
                className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-white/5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-medium"
                  style={{ background: "linear-gradient(135deg, #1A3C96, #0B58A8)" }}>
                  {imp.nombre_completo.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#e8ecf5" }}>{imp.nombre_completo}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin size={11} style={{ color: "#8993b8" }} />
                    <span className="text-xs" style={{ color: "#8993b8" }}>{imp.provincia ?? "—"}</span>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "rgba(108,182,122,0.15)", color: "#6cb67a", border: "1px solid rgba(108,182,122,0.3)" }}>
                  {imp.estado_programa ?? "—"}
                </span>
              </a>
            ))}
            {impulsados.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: "#8993b8" }}>
                Sin impulsados. Sincroniza con Notion o añade datos de demo.
              </p>
            )}
          </div>
        </div>

        {/* Recent meetings */}
        <div className="glass rounded-xl p-5">
          <h2 className="font-display text-lg mb-4" style={{ color: "#e8ecf5" }}>Últimas sesiones</h2>
          <div className="space-y-3">
            {recentMeetings.map((m: { id: string; titulo: string; fecha: string; estado_procesamiento: string; impulsado_id: string; impulsados_cache?: { nombre_completo?: string } | null }) => {
              const nombre = m.impulsados_cache?.nombre_completo ?? "—";
              const done = m.estado_procesamiento === "completado";
              return (
                <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="p-1.5 rounded-lg mt-0.5 shrink-0" style={{ background: "rgba(11,88,168,0.2)" }}>
                    <MessageSquare size={13} style={{ color: "#73ACCA" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#e8ecf5" }}>{m.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: "#8993b8" }}>{nombre}</span>
                      <span className="text-xs" style={{ color: "#8993b8" }}>·</span>
                      <div className="flex items-center gap-1">
                        <Calendar size={10} style={{ color: "#8993b8" }} />
                        <span className="text-xs" style={{ color: "#8993b8" }}>{formatDate(m.fecha)}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                    style={done
                      ? { background: "rgba(108,182,122,0.15)", color: "#6cb67a", border: "1px solid rgba(108,182,122,0.3)" }
                      : { background: "rgba(224,169,84,0.15)", color: "#e0a954", border: "1px solid rgba(224,169,84,0.3)" }}>
                    {done ? "Procesado" : m.estado_procesamiento}
                  </span>
                </div>
              );
            })}
            {recentMeetings.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: "#8993b8" }}>
                Sin sesiones registradas.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
