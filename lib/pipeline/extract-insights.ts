import Anthropic from "@anthropic-ai/sdk";
import { CategoriaInsight } from "@/lib/supabase/types";

export interface ExtractedInsight {
  categoria: CategoriaInsight;
  titulo: string;
  descripcion: string;
  evidencia: string;
  confianza: number;
  tags: string[];
}

const SYSTEM_PROMPT = `Eres analista del programa **Impulsa by Promora**, una aceleradora de agentes inmobiliarios de lujo en España. Lees fragmentos de mentorías entre impulsados y sus mentores (Gonzalo, Laura). Extraes insights estructurados para construir informes y detectar patrones a escala.

Para cada fragmento identifica, cuando apliquen, elementos de estas categorías:
- \`miedo_explicito\` — lo que el impulsado verbaliza que le preocupa.
- \`miedo_implicito\` — lo que se intuye entre líneas (evasivas, justificaciones, tono).
- \`reto\` — obstáculos concretos que enfrenta.
- \`resolucion\` — cómo se está abordando un reto.
- \`compromiso\` — action items que asume el impulsado.
- \`logro\` — avances, pequeños o grandes.
- \`bloqueo\` — cosas que le paralizan.
- \`estado_emocional\` — cómo llega/sale de la sesión.
- \`feedback_mentor\` — observación relevante del mentor.
- \`objetivo_emergente\` — nuevos objetivos que surgen.
- \`objetivo_cumplido\` — objetivos marcados previamente que se cierran.
- \`alerta\` — señales que el equipo Promora debería conocer.

Devuelve **solo JSON válido** (sin markdown ni preámbulo) con array de insights. Cada uno: \`categoria\`, \`titulo\` (≤10 palabras), \`descripcion\` (1-3 frases), \`evidencia\` (cita literal del texto), \`confianza\` (0-1), \`tags\` (array). Si no detectas insights, devuelve []. No inventes. Sé sobrio y preciso. Español de España.`;

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export async function extractInsightsFromChunk(
  chunkText: string,
  contextInfo?: string
): Promise<ExtractedInsight[]> {
  const client = getClient();
  const userContent = contextInfo
    ? `[Contexto: ${contextInfo}]\n\n${chunkText}`
    : chunkText;

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const text = message.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("");

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed as ExtractedInsight[] : [];
  } catch {
    // Attempt to extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]) as ExtractedInsight[]; } catch {}
    }
    return [];
  }
}

export async function summarizeMeeting(
  transcriptText: string,
  meetingTitle: string,
  impulsadoNombre: string
): Promise<{ resumen: string; tokensUsed: number }> {
  const client = getClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Eres analista del programa Impulsa by Promora. Resume de forma densa (5-8 frases) la siguiente sesión entre el mentor y ${impulsadoNombre}. Titulada: "${meetingTitle}". Incluye: objetivos tratados, compromisos asumidos, bloqueos identificados y próximos pasos. Español de España, sin bullets, texto corrido.\n\n${transcriptText}`,
    }],
  });

  const resumen = message.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("");

  return { resumen, tokensUsed: message.usage.input_tokens + message.usage.output_tokens };
}
