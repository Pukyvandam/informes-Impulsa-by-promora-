import { createServiceClient } from "@/lib/supabase/server";
import { ImpulsadoCache } from "@/lib/supabase/types";
import { ImpulsadoCard } from "@/components/impulsados/ImpulsadoCard";
import { Users, Search } from "lucide-react";

async function getImpulsados(): Promise<ImpulsadoCache[]> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("impulsados_cache")
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  } catch { return []; }
}

export default async function ImpulsadosPage() {
  const impulsados = await getImpulsados();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold" style={{ color: "#e8ecf5" }}>
            <span className="italic-editorial">Impulsados</span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#8993b8" }}>
            {impulsados.length} participantes en el programa
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ background: "rgba(115,172,202,0.1)", color: "#73ACCA", border: "1px solid rgba(115,172,202,0.2)" }}>
          <Search size={14} />
          <span>Búsqueda semántica en <a href="/insights" className="underline">/insights</a></span>
        </div>
      </div>

      {impulsados.length === 0 ? (
        <div className="glass rounded-xl p-16 text-center">
          <Users size={40} className="mx-auto mb-4" style={{ color: "#8993b8" }} />
          <h3 className="font-display text-xl mb-2" style={{ color: "#e8ecf5" }}>Sin impulsados</h3>
          <p className="text-sm" style={{ color: "#8993b8" }}>
            Sincroniza con Notion para importar los datos, o ejecuta el seed de demo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {impulsados.map(imp => <ImpulsadoCard key={imp.id} impulsado={imp} />)}
        </div>
      )}
    </div>
  );
}
