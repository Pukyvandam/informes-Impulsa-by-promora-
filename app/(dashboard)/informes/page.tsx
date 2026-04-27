import { createServiceClient } from "@/lib/supabase/server";
import { Informe, ImpulsadoCache } from "@/lib/supabase/types";
import { FileText, Download, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

async function getData() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("informes")
      .select("*, impulsados_cache(nombre_completo, provincia)")
      .order("mes", { ascending: false });
    return (data ?? []) as (Informe & { impulsados_cache: Pick<ImpulsadoCache, "nombre_completo" | "provincia"> | null })[];
  } catch { return []; }
}

const ESTADO_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  completado: { bg: "rgba(108,182,122,0.15)", color: "#6cb67a", border: "rgba(108,182,122,0.3)" },
  generando:  { bg: "rgba(224,169,84,0.15)",  color: "#e0a954", border: "rgba(224,169,84,0.3)" },
  error:      { bg: "rgba(214,117,117,0.15)", color: "#d67575", border: "rgba(214,117,117,0.3)" },
};

export default async function InformesPage() {
  const informes = await getData();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold" style={{ color: "#e8ecf5" }}>
          <span className="italic-editorial">Informes</span>
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#8993b8" }}>
          Informes mensuales generados por Claude
        </p>
      </div>

      {informes.length === 0 ? (
        <div className="glass rounded-xl p-16 text-center">
          <FileText size={40} className="mx-auto mb-4" style={{ color: "#8993b8" }} />
          <h3 className="font-display text-xl mb-2" style={{ color: "#e8ecf5" }}>Sin informes aún</h3>
          <p className="text-sm" style={{ color: "#8993b8" }}>
            Genera un informe desde la ficha de cualquier impulsado.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {informes.map(inf => {
            const st = ESTADO_STYLE[inf.estado] ?? ESTADO_STYLE.error;
            const mes = new Date(inf.mes + "T12:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" });
            return (
              <div key={inf.id} className="glass rounded-xl p-4 flex items-center gap-4">
                <div className="p-2.5 rounded-lg shrink-0" style={{ background: "rgba(11,88,168,0.2)" }}>
                  <FileText size={18} style={{ color: "#73ACCA" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "#e8ecf5" }}>
                    {inf.impulsados_cache?.nombre_completo ?? "Impulsado"} — {mes}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#8993b8" }}>
                    {inf.impulsados_cache?.provincia ?? ""}
                    {inf.generado_por ? ` · ${inf.generado_por}` : ""}
                    {` · ${formatDate(inf.created_at)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                    {inf.estado === "generando" && <Loader2 size={10} className="inline animate-spin mr-1" />}
                    {inf.estado}
                  </span>
                  <Link href={`/informes/${inf.id}`}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                    style={{ background: "rgba(59,81,157,0.2)", color: "#73ACCA", border: "1px solid rgba(59,81,157,0.3)" }}>
                    Ver
                  </Link>
                  {inf.pdf_url && (
                    <a href={inf.pdf_url} download target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                      style={{ background: "rgba(108,182,122,0.15)", color: "#6cb67a" }}>
                      <Download size={14} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
