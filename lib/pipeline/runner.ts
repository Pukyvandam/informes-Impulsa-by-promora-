// Pipeline orchestrator.
// Emits progress events via a callback so the API route can stream them as SSE.
import { createServiceClient } from "@/lib/supabase/server";
import { normalizeTranscript, turnsToText } from "./normalize";
import { chunkTranscript, chunkText } from "./chunk";
import { embedTexts } from "./embed";
import { detectEtapa } from "./detect-etapa";
import { extractInsightsFromChunk, summarizeMeeting } from "./extract-insights";

export type PipelineStep =
  | "normalizacion"
  | "chunking"
  | "embeddings"
  | "deteccion_etapa"
  | "extraccion_insights"
  | "resumen"
  | "guardado";

export type StepStatus = "idle" | "running" | "done" | "error";

export interface PipelineProgress {
  step: PipelineStep;
  status: StepStatus;
  detail?: string;
}

export type ProgressCallback = (p: PipelineProgress) => void;

export async function runPipeline(
  meetingId: string,
  onProgress: ProgressCallback
): Promise<void> {
  const supabase = createServiceClient();
  const emit = onProgress;

  const { data: meeting, error: meetingErr } = await supabase
    .from("meetings")
    .select("*, impulsados_cache(nombre_completo)")
    .eq("id", meetingId)
    .single();

  if (meetingErr || !meeting) throw new Error("Meeting not found");
  if (!meeting.transcripcion_completa) throw new Error("No transcript");

  // Mark as processing
  await supabase.from("meetings").update({ estado_procesamiento: "procesando" }).eq("id", meetingId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const impulsadoNombre = (meeting as any).impulsados_cache?.nombre_completo ?? "el impulsado";

  let totalTokens = 0;

  try {
    // ── Step 1: Normalización ────────────────────────────────────
    emit({ step: "normalizacion", status: "running" });
    const turns = normalizeTranscript(meeting.transcripcion_completa);
    const cleanText = turnsToText(turns);
    emit({ step: "normalizacion", status: "done", detail: `${turns.length} turnos extraídos` });

    // ── Step 2: Chunking ────────────────────────────────────────
    emit({ step: "chunking", status: "running" });
    const rawChunks = chunkTranscript(turns);
    emit({ step: "chunking", status: "done", detail: `${rawChunks.length} chunks` });

    // ── Step 3: Embeddings ──────────────────────────────────────
    emit({ step: "embeddings", status: "running" });
    const texts = rawChunks.map(c => c.contenido);
    const vectors = await embedTexts(texts);
    emit({ step: "embeddings", status: "done", detail: `${vectors.length} vectores (1024 dims)` });

    // ── Step 4: Detección de etapa ──────────────────────────────
    emit({ step: "deteccion_etapa", status: "running" });
    const etapaId = await detectEtapa(meeting.titulo, meeting.fecha);
    if (etapaId) {
      await supabase.from("meetings").update({ etapa_id: etapaId }).eq("id", meetingId);
    }
    emit({ step: "deteccion_etapa", status: "done", detail: etapaId ? "Etapa asignada" : "Sin match" });

    // ── Step 5: Extracción de insights ──────────────────────────
    emit({ step: "extraccion_insights", status: "running" });
    let insightCount = 0;

    // Save chunks first so insights can reference them
    const chunkInserts = rawChunks.map((c, i) => ({
      meeting_id: meetingId,
      impulsado_id: meeting.impulsado_id,
      contenido: c.contenido,
      contenido_limpio: c.contenido,
      embedding: `[${vectors[i].join(",")}]`,
      tipo_fuente: "transcripcion" as const,
      posicion: c.posicion,
      metadatos: c.metadatos,
      fecha_contexto: meeting.fecha ? new Date(meeting.fecha).toISOString() : null,
    }));

    const { data: savedChunks } = await supabase
      .from("chunks")
      .insert(chunkInserts)
      .select("id");

    const chunkIds = savedChunks?.map((c: { id: string }) => c.id) ?? [];

    for (let i = 0; i < rawChunks.length; i++) {
      const insights = await extractInsightsFromChunk(
        rawChunks[i].contenido,
        `Meeting: ${meeting.titulo}, Impulsado: ${impulsadoNombre}`
      );
      for (const ins of insights) {
        await supabase.from("insights").insert({
          impulsado_id: meeting.impulsado_id,
          meeting_id: meetingId,
          chunk_id: chunkIds[i] ?? null,
          etapa_programa_id: etapaId,
          categoria: ins.categoria,
          titulo: ins.titulo,
          descripcion: ins.descripcion,
          evidencia: ins.evidencia,
          confianza: ins.confianza,
          tags: ins.tags,
          fecha: meeting.fecha,
        });
        insightCount++;
      }
    }
    emit({ step: "extraccion_insights", status: "done", detail: `${insightCount} insights` });

    // ── Step 6: Resumen procesado ────────────────────────────────
    emit({ step: "resumen", status: "running" });
    const { resumen, tokensUsed } = await summarizeMeeting(cleanText, meeting.titulo, impulsadoNombre);
    totalTokens += tokensUsed;

    // Embed the summary and save as a chunk
    const [summaryVec] = await embedTexts([resumen]);
    await supabase.from("chunks").insert({
      meeting_id: meetingId,
      impulsado_id: meeting.impulsado_id,
      contenido: resumen,
      embedding: `[${summaryVec.join(",")}]`,
      tipo_fuente: "resumen",
      posicion: rawChunks.length,
      metadatos: { tipo: "resumen_procesado" },
      fecha_contexto: meeting.fecha ? new Date(meeting.fecha).toISOString() : null,
    });
    emit({ step: "resumen", status: "done" });

    // ── Step 7: Guardado final ───────────────────────────────────
    emit({ step: "guardado", status: "running" });
    await supabase.from("meetings").update({
      resumen_procesado: resumen,
      estado_procesamiento: "completado",
      tokens_consumidos: totalTokens,
      error_mensaje: null,
    }).eq("id", meetingId);
    emit({ step: "guardado", status: "done" });

  } catch (err) {
    const msg = String(err);
    await supabase.from("meetings").update({
      estado_procesamiento: "error",
      error_mensaje: msg,
    }).eq("id", meetingId);
    throw err;
  }
}
