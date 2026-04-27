import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { CategoriaInsight } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { categoria, etapa_codigo, provincia } = await req.json() as {
    categoria?: CategoriaInsight;
    etapa_codigo?: string;
    provincia?: string;
  };

  const supabase = createServiceClient();

  let query = supabase
    .from("insights")
    .select("*, impulsados_cache(nombre_completo, provincia), programa_etapas(nombre)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (categoria) query = query.eq("categoria", categoria);

  const { data: insights, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!insights?.length) return NextResponse.json({ patterns: [] });

  // Filter by provincia if specified
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = provincia
    ? insights.filter((i: any) => i.impulsados_cache?.provincia === provincia)
    : insights;

  if (!filtered.length) return NextResponse.json({ patterns: [] });

  // Ask Claude to find patterns
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insightsList = (filtered as any[])
    .map((i: any) => `[${i.categoria}] ${i.titulo}: ${i.descripcion} (${i.impulsados_cache?.nombre_completo ?? "—"})`)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `Eres analista del programa Impulsa by Promora. Analiza los siguientes insights de varios impulsados y encuentra patrones recurrentes. Agrupa los que sean similares en clusters temáticos.\n\nInsights:\n${insightsList}\n\nDevuelve SOLO JSON: array de objetos {"titulo":"","descripcion":"","frecuencia":0,"ejemplos":[""],"recomendacion":""}. Máximo 6 patrones. Español de España.`,
    }],
  });

  const text = message.content.filter(b => b.type === "text").map(b => (b as { type: "text"; text: string }).text).join("");
  const match = text.match(/\[[\s\S]*\]/);
  const patterns = match ? JSON.parse(match[0]) : [];

  return NextResponse.json({ patterns, total_insights: filtered.length });
}
