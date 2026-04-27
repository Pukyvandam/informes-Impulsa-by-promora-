import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { embedText } from "@/lib/pipeline/embed";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { query, impulsado_id, tipo, limit = 10, threshold = 0.3 } = await req.json() as {
    query: string;
    impulsado_id?: string;
    tipo?: string;
    limit?: number;
    threshold?: number;
  };

  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  const supabase = createServiceClient();
  const embedding = await embedText(query);
  const vectorStr = `[${embedding.join(",")}]`;

  const { data: chunks, error: chunksErr } = await supabase.rpc("search_chunks", {
    query_embedding: vectorStr,
    match_count: limit,
    filter_impulsado: impulsado_id ?? null,
    filter_tipo: tipo ?? null,
    similarity_threshold: threshold,
  });

  const { data: insights, error: insightsErr } = await supabase.rpc("search_insights", {
    query_embedding: vectorStr,
    match_count: limit,
    filter_impulsado: impulsado_id ?? null,
    filter_categoria: null,
    similarity_threshold: threshold,
  });

  if (chunksErr || insightsErr) {
    return NextResponse.json({ error: chunksErr?.message ?? insightsErr?.message }, { status: 500 });
  }

  return NextResponse.json({ chunks: chunks ?? [], insights: insights ?? [] });
}
