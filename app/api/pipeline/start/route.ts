import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { runPipeline, PipelineProgress } from "@/lib/pipeline/runner";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    impulsado_id: string;
    fecha: string;
    duracion_minutos?: number;
    tipo: string;
    fuente: string;
    titulo: string;
    participantes?: string;
    resumen_nativo?: string;
    transcripcion_completa: string;
  };

  const supabase = createServiceClient();

  // Create the meeting record first
  const { data: meeting, error } = await supabase
    .from("meetings")
    .insert({
      impulsado_id: body.impulsado_id,
      fecha: body.fecha,
      duracion_minutos: body.duracion_minutos ?? null,
      tipo: body.tipo,
      fuente: body.fuente,
      titulo: body.titulo,
      participantes: body.participantes
        ? body.participantes.split(",").map(s => s.trim()).filter(Boolean)
        : [],
      resumen_nativo: body.resumen_nativo ?? null,
      transcripcion_completa: body.transcripcion_completa,
      estado_procesamiento: "pendiente",
    })
    .select("id")
    .single();

  if (error || !meeting) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: error?.message ?? "Failed to create meeting" })}\n\n`,
      { status: 500, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  // Stream SSE progress
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "meeting_created", meeting_id: meeting.id });

      try {
        await runPipeline(meeting.id, (progress: PipelineProgress) => {
          send({ type: "progress", ...progress });
        });
        send({ type: "done", meeting_id: meeting.id });
      } catch (err) {
        send({ type: "error", message: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
