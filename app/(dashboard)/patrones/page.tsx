"use client";
import { useState } from "react";
import { TrendingUp, Loader2, Users } from "lucide-react";
import { CategoriaInsight } from "@/lib/supabase/types";

const CATEGORIAS: { value: CategoriaInsight; label: string }[] = [
  { value: "miedo_explicito",   label: "Miedos explícitos" },
  { value: "miedo_implicito",   label: "Miedos implícitos" },
  { value: "reto",              label: "Retos" },
  { value: "compromiso",        label: "Compromisos" },
  { value: "logro",             label: "Logros" },
  { value: "bloqueo",           label: "Bloqueos" },
  { value: "alerta",            label: "Alertas" },
  { value: "estado_emocional",  label: "Estado emocional" },
];

interface Pattern { titulo: string; descripcion: string; frecuencia: number; ejemplos: string[]; recomendacion: string }

export default function PatronesPage() {
  const [categoria, setCategoria] = useState<CategoriaInsight>("miedo_explicito");
  const [loading, setLoading] = useState(false);
  const [patterns, setPatterns] = useState<Pattern[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setPatterns(null);
    try {
      const res = await fetch("/api/search/patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria }),
      });
      const data = await res.json() as { patterns: Pattern[]; total_insights: number };
      setPatterns(data.patterns ?? []);
      setTotal(data.total_insights ?? 0);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const selectStyle = {
    background: "#171e42", color: "#e8ecf5", border: "1px solid rgba(59,81,157,0.4)",
    borderRadius: "0.5rem", padding: "0.5rem 0.75rem", fontSize: "0.9375rem",
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold" style={{ color: "#e8ecf5" }}>
          <span className="italic-editorial">Patrones</span>
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#8993b8" }}>
          Análisis transversal de insights. Claude identifica patrones comunes entre impulsados.
        </p>
      </div>

      {/* Controls */}
      <div className="glass rounded-xl p-5 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "#8993b8" }}>Categoría a analizar</label>
          <select style={selectStyle} value={categoria}
            onChange={e => setCategoria(e.target.value as CategoriaInsight)}>
            {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <button onClick={analyze} disabled={loading}
          className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: loading ? "rgba(11,88,168,0.3)" : "linear-gradient(135deg, #1A3C96, #0B58A8)",
            color: "#e8ecf5", cursor: loading ? "not-allowed" : "pointer",
          }}>
          {loading ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Analizando…</span> : "Analizar patrones →"}
        </button>
      </div>

      {/* Results */}
      {!patterns && !loading && (
        <div className="glass rounded-xl p-16 text-center">
          <TrendingUp size={40} className="mx-auto mb-4" style={{ color: "#8993b8" }} />
          <p className="text-sm" style={{ color: "#8993b8" }}>
            Selecciona una categoría y pulsa "Analizar patrones" para descubrir tendencias entre todos los impulsados.
          </p>
        </div>
      )}

      {error && (
        <div className="glass rounded-xl p-5 text-sm" style={{ color: "#d67575" }}>Error: {error}</div>
      )}

      {patterns && (
        <div>
          <p className="text-sm mb-5" style={{ color: "#8993b8" }}>
            {total} insights analizados · {patterns.length} patrones detectados
          </p>
          {patterns.length === 0 && (
            <div className="glass rounded-xl p-10 text-center">
              <p className="text-sm" style={{ color: "#8993b8" }}>No se detectaron patrones claros en esta categoría.</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.map((p, i) => (
              <div key={i} className="glass rounded-xl p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-display text-base" style={{ color: "#e8ecf5" }}>{p.titulo}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: "rgba(115,172,202,0.15)", color: "#73ACCA", border: "1px solid rgba(115,172,202,0.3)" }}>
                    ×{p.frecuencia}
                  </span>
                </div>
                <p className="text-sm mb-3" style={{ color: "#8993b8" }}>{p.descripcion}</p>
                {p.ejemplos?.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {p.ejemplos.map((ej, j) => (
                      <p key={j} className="text-xs italic pl-3" style={{ color: "#8993b8", borderLeft: "2px solid rgba(59,81,157,0.4)" }}>
                        "{ej}"
                      </p>
                    ))}
                  </div>
                )}
                {p.recomendacion && (
                  <div className="p-3 rounded-lg mt-2" style={{ background: "rgba(11,88,168,0.15)" }}>
                    <p className="text-xs" style={{ color: "#73ACCA" }}>
                      <span className="font-medium">Recomendación: </span>{p.recomendacion}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
