import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";

export interface ReportData {
  portada: { nombre: string; mes: string; mentor: string; provincia: string; fase: string };
  resumen_ejecutivo: string;
  progreso_programa: { etapas_completadas: string[]; etapas_pendientes: string[]; porcentaje: number };
  caso_real: { titulo: string; valor: number | null; estado: string; descripcion: string };
  evolucion_insights: { categoria: string; titulo: string; descripcion: string; evidencia: string }[];
  highlights_mentorias: { fecha: string; titulo: string; cita: string; compromiso: string }[];
  kcd: { mes: string; leads: number; visitas: number; propuestas: number; cierres: number; formaciones: string };
  logros: string[];
  areas_mejora: string[];
  proximos_pasos: string[];
  observaciones_mentor: string;
}

export async function generateMonthlyReport(
  impulsadoId: string,
  mes: Date
): Promise<ReportData> {
  const supabase = createServiceClient();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const mesStr = mes.toISOString().slice(0, 7);
  const mesStart = `${mesStr}-01`;
  const mesEnd = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).toISOString().slice(0, 10);

  // Fetch all data for the month
  const [impulsadoRes, meetingsRes, insightsRes, kcdRes, etapasRes] = await Promise.all([
    supabase.from("impulsados_cache").select("*").eq("id", impulsadoId).single(),
    supabase.from("meetings").select("*").eq("impulsado_id", impulsadoId)
      .gte("fecha", mesStart).lte("fecha", mesEnd).order("fecha"),
    supabase.from("insights").select("*").eq("impulsado_id", impulsadoId)
      .gte("fecha", mesStart).lte("fecha", mesEnd).order("created_at"),
    supabase.from("kcd_mensuales").select("*").eq("impulsado_id", impulsadoId)
      .gte("mes", mesStart).lte("mes", mesEnd).maybeSingle(),
    supabase.from("programa_etapas").select("*").order("orden"),
  ]);

  const impulsado = impulsadoRes.data!;
  const meetings = (meetingsRes.data ?? []) as Array<{ fecha: string; titulo: string; resumen_procesado: string | null; resumen_nativo: string | null }>;
  const insights = (insightsRes.data ?? []) as Array<{ categoria: string; titulo: string; descripcion: string; evidencia: string | null }>;
  const kcd = kcdRes.data as { leads_trabajados: number; visitas_cliente: number; propuestas_presentadas: number; operaciones_cerradas: number; formaciones_completadas: number; formaciones_totales_programa: number } | null;
  const etapas = (etapasRes.data ?? []) as Array<{ codigo: string; nombre: string; dia_min: number | null; dia_max: number | null }>;

  // Build context for Claude
  const context = `
IMPULSADO: ${impulsado.nombre_completo}
PROVINCIA: ${impulsado.provincia ?? "—"}
MENTOR: ${impulsado.mentor_principal ?? "—"}
FASE: ${impulsado.estado_programa ?? "—"}
CASO REAL: ${impulsado.caso_real_curso ?? "—"} ${impulsado.valor_caso_real ? `(${impulsado.valor_caso_real.toLocaleString("es-ES")}€)` : ""}
MES: ${mesStr}

MEETINGS DEL MES (${meetings.length}):
${meetings.map(m => `- ${m.fecha} | ${m.titulo}\n  Resumen: ${m.resumen_procesado ?? m.resumen_nativo ?? "Sin resumen"}`).join("\n")}

INSIGHTS DEL MES (${insights.length}):
${insights.map(i => `[${i.categoria}] ${i.titulo}: ${i.descripcion} | Evidencia: "${i.evidencia}"`).join("\n")}

KCD DEL MES:
${kcd ? `Leads: ${kcd.leads_trabajados} | Visitas: ${kcd.visitas_cliente} | Propuestas: ${kcd.propuestas_presentadas} | Cierres: ${kcd.operaciones_cerradas} | Formaciones: ${kcd.formaciones_completadas}/${kcd.formaciones_totales_programa}` : "Sin datos KCD"}

PROGRAMA (etapas):
${etapas.map(e => `${e.codigo}: ${e.nombre} (días ${e.dia_min}-${e.dia_max})`).join("\n")}
  `.trim();

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Eres redactor del informe mensual del programa Impulsa by Promora. Genera un informe estructurado en JSON para el mes indicado, basándote en los datos reales proporcionados. No inventes datos no presentes. Español de España, tono profesional y empático.\n\nDatos:\n${context}\n\nDevuelve SOLO JSON válido con esta estructura exacta:\n{"portada":{"nombre":"","mes":"","mentor":"","provincia":"","fase":""},"resumen_ejecutivo":"","progreso_programa":{"etapas_completadas":[],"etapas_pendientes":[],"porcentaje":0},"caso_real":{"titulo":"","valor":null,"estado":"","descripcion":""},"evolucion_insights":[{"categoria":"","titulo":"","descripcion":"","evidencia":""}],"highlights_mentorias":[{"fecha":"","titulo":"","cita":"","compromiso":""}],"kcd":{"mes":"","leads":0,"visitas":0,"propuestas":0,"cierres":0,"formaciones":""},"logros":[],"areas_mejora":[],"proximos_pasos":[],"observaciones_mentor":""}`,
    }],
  });

  const text = message.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("");

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude did not return valid JSON");
  return JSON.parse(match[0]) as ReportData;
}
