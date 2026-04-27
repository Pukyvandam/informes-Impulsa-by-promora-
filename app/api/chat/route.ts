import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { embedText } from "@/lib/pipeline/embed";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { question, impulsado_id } = await req.json() as {
    question: string;
    impulsado_id?: string;
  };

  if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });

  const supabase = createServiceClient();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  // Retrieval: embed question and search chunks + insights
  const embedding = await embedText(question);
  const vectorStr = `[${embedding.join(",")}]`;

  const [chunksRes, insightsRes] = await Promise.all([
    supabase.rpc("search_chunks", {
      query_embedding: vectorStr,
      match_count: 8,
      filter_impulsado: impulsado_id ?? null,
      filter_tipo: null,
      similarity_threshold: 0.3,
    }),
    supabase.rpc("search_insights", {
      query_embedding: vectorStr,
      match_count: 5,
      filter_impulsado: impulsado_id ?? null,
      filter_categoria: null,
      similarity_threshold: 0.3,
    }),
  ]);

  const context = [
    ...(chunksRes.data ?? []).map((c: { contenido: string }) => `[Transcripción] ${c.contenido}`),
    ...(insightsRes.data ?? []).map((i: { titulo: string; descripcion: string; evidencia: string }) =>
      `[Insight: ${i.titulo}] ${i.descripcion} — "${i.evidencia}"`
    ),
  ].join("\n\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: `Eres asistente del programa Impulsa by Promora. Responde preguntas basándote en el contexto de transcripciones e insights. Sé preciso, cita evidencias cuando puedas. Si no hay contexto suficiente, dilo. Español de España.`,
    messages: [{
      role: "user",
      content: `Contexto:\n${context || "Sin contexto disponible."}\n\nPregunta: ${question}`,
    }],
  });

  const answer = message.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("");

  return NextResponse.json({
    answer,
    sources: {
      chunks: (chunksRes.data ?? []).length,
      insights: (insightsRes.data ?? []).length,
    },
  });
}
