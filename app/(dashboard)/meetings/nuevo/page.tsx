"use client";
import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Circle, Loader2, XCircle, AlertCircle } from "lucide-react";

type StepStatus = "idle" | "running" | "done" | "error";
type StepKey = "normalizacion" | "chunking" | "embeddings" | "deteccion_etapa" | "extraccion_insights" | "resumen" | "guardado";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "normalizacion",       label: "Normalización de transcripción" },
  { key: "chunking",            label: "Chunking semántico" },
  { key: "embeddings",          label: "Generación de embeddings" },
  { key: "deteccion_etapa",     label: "Detección de etapa del programa" },
  { key: "extraccion_insights", label: "Extracción de insights (Claude)" },
  { key: "resumen",             label: "Generación de resumen" },
  { key: "guardado",            label: "Guardado en base de datos" },
];

interface Impulsado { id: string; nombre_completo: string; provincia: string | null }

export default function NuevaSesionPage() {
  const [impulsados, setImpulsados] = useState<Impulsado[]>([]);
  const [form, setForm] = useState({
    impulsado_id: "", fecha: new Date().toISOString().slice(0, 10),
    duracion_minutos: "", tipo: "mentoria", fuente: "zoom",
    titulo: "", participantes: "", resumen_nativo: "", transcripcion_completa: "",
  });
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Record<StepKey, { status: StepStatus; detail?: string }>>(
    Object.fromEntries(STEPS.map(s => [s.key, { status: "idle" }])) as Record<StepKey, { status: StepStatus; detail?: string }>
  );
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetch("/api/impulsados").then(r => r.json()).then(setImpulsados).catch(() => {});
  }, []);

  const setStep = (key: StepKey, status: StepStatus, detail?: string) =>
    setSteps(prev => ({ ...prev, [key]: { status, detail } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.impulsado_id || !form.transcripcion_completa || !form.titulo) return;
    setRunning(true);
    setDone(false);
    setError(null);
    setSteps(Object.fromEntries(STEPS.map(s => [s.key, { status: "idle" }])) as Record<StepKey, { status: StepStatus }>);

    // Start SSE stream
    const res = await fetch("/api/pipeline/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        duracion_minutos: form.duracion_minutos ? parseInt(form.duracion_minutos) : undefined,
      }),
    });

    if (!res.ok || !res.body) {
      setError("Error al iniciar el pipeline");
      setRunning(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const process = async () => {
      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "meeting_created") setMeetingId(data.meeting_id);
            if (data.type === "progress") setStep(data.step, data.status, data.detail);
            if (data.type === "done") { setDone(true); setRunning(false); }
            if (data.type === "error") { setError(data.message); setRunning(false); }
          } catch {}
        }
      }
    };

    process().catch(err => { setError(String(err)); setRunning(false); });
  };

  const inputStyle = {
    background: "#171e42", color: "#e8ecf5", border: "1px solid rgba(59,81,157,0.4)",
    borderRadius: "0.5rem", padding: "0.5rem 0.75rem", width: "100%", fontSize: "0.9375rem",
  };
  const labelStyle = { color: "#8993b8", fontSize: "0.8125rem", marginBottom: "0.375rem", display: "block" };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold" style={{ color: "#e8ecf5" }}>
          <span className="italic-editorial">Nueva sesión</span>
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#8993b8" }}>
          Pega la transcripción y el pipeline generará insights, embeddings y resumen automáticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={labelStyle}>Impulsado *</label>
            <select style={inputStyle} value={form.impulsado_id}
              onChange={e => setForm(f => ({ ...f, impulsado_id: e.target.value }))} required>
              <option value="">Seleccionar…</option>
              {impulsados.map(i => (
                <option key={i.id} value={i.id}>{i.nombre_completo}{i.provincia ? ` — ${i.provincia}` : ""}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Fecha *</label>
              <input type="date" style={inputStyle} value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} required />
            </div>
            <div>
              <label style={labelStyle}>Duración (min)</label>
              <input type="number" style={inputStyle} value={form.duracion_minutos} min="1" max="480"
                placeholder="60"
                onChange={e => setForm(f => ({ ...f, duracion_minutos: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Tipo</label>
              <select style={inputStyle} value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="mentoria">Mentoría</option>
                <option value="check_control">Check Control</option>
                <option value="sesion_practica">Sesión práctica</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Fuente</label>
              <select style={inputStyle} value={form.fuente}
                onChange={e => setForm(f => ({ ...f, fuente: e.target.value }))}>
                <option value="zoom">Zoom</option>
                <option value="meet">Google Meet</option>
                <option value="teams">Teams</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Título *</label>
            <input type="text" style={inputStyle} value={form.titulo}
              placeholder="Mentoría 1 — Carmen López" required
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>Participantes (separados por coma)</label>
            <input type="text" style={inputStyle} value={form.participantes}
              placeholder="Gonzalo Lopez, Carmen López"
              onChange={e => setForm(f => ({ ...f, participantes: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>Resumen nativo (Zoom/Meet, opcional)</label>
            <textarea style={{ ...inputStyle, resize: "vertical" }} rows={3} value={form.resumen_nativo}
              placeholder="Resumen automático de Zoom…"
              onChange={e => setForm(f => ({ ...f, resumen_nativo: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>Transcripción completa *</label>
            <textarea style={{ ...inputStyle, resize: "vertical" }} rows={12} value={form.transcripcion_completa}
              placeholder={"Gonzalo: Buenos días…\nCarmen: Hola Gonzalo, pues…"}
              required
              onChange={e => setForm(f => ({ ...f, transcripcion_completa: e.target.value }))} />
          </div>

          <button type="submit" disabled={running}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: running ? "rgba(11,88,168,0.3)" : "linear-gradient(135deg, #1A3C96, #0B58A8)",
              color: "#e8ecf5", cursor: running ? "not-allowed" : "pointer",
            }}>
            {running ? "Procesando…" : "Iniciar pipeline →"}
          </button>
        </form>

        {/* Pipeline progress */}
        <div className="glass rounded-xl p-5 h-fit sticky top-6">
          <h3 className="font-display text-base mb-4" style={{ color: "#e8ecf5" }}>Pipeline de procesamiento</h3>
          <div className="space-y-3">
            {STEPS.map(({ key, label }) => {
              const s = steps[key];
              return (
                <div key={key} className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {s.status === "idle"    && <Circle size={16} style={{ color: "#8993b8" }} />}
                    {s.status === "running" && <Loader2 size={16} className="animate-spin" style={{ color: "#73ACCA" }} />}
                    {s.status === "done"    && <CheckCircle2 size={16} style={{ color: "#6cb67a" }} />}
                    {s.status === "error"   && <XCircle size={16} style={{ color: "#d67575" }} />}
                  </div>
                  <div>
                    <p className="text-sm" style={{
                      color: s.status === "idle" ? "#8993b8" : s.status === "running" ? "#e8ecf5" : s.status === "done" ? "#6cb67a" : "#d67575"
                    }}>{label}</p>
                    {s.detail && <p className="text-xs mt-0.5" style={{ color: "#8993b8" }}>{s.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {done && meetingId && (
            <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(108,182,122,0.1)", border: "1px solid rgba(108,182,122,0.3)" }}>
              <p className="text-sm" style={{ color: "#6cb67a" }}>✓ Sesión procesada correctamente</p>
              <a href={`/impulsados/${form.impulsado_id}`} className="text-xs mt-1 block underline" style={{ color: "#73ACCA" }}>
                Ver ficha del impulsado →
              </a>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg flex gap-2" style={{ background: "rgba(214,117,117,0.1)", border: "1px solid rgba(214,117,117,0.3)" }}>
              <AlertCircle size={14} style={{ color: "#d67575" }} className="mt-0.5 shrink-0" />
              <p className="text-xs" style={{ color: "#d67575" }}>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
