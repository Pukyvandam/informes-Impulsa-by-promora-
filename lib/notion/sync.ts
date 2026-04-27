import { getNotionClient, extractTitle, extractRichText, extractSelect, extractMultiSelect, extractDate } from "./client";
import { IMPULSADOS_FIELDS, MENTORIA_EXTRA_PATTERN, MENTORIA_BASE_NUMBERS } from "./mapping";
import { createServiceClient } from "@/lib/supabase/server";

export interface SyncResult {
  synced: number;
  errors: number;
  details: string[];
}

export async function syncImpulsados(): Promise<SyncResult> {
  const notion = getNotionClient();
  const supabase = createServiceClient();
  const dbId = process.env.NOTION_IMPULSADOS_DB_ID;

  if (!dbId) throw new Error("NOTION_IMPULSADOS_DB_ID not set");

  let synced = 0;
  let errors = 0;
  const details: string[] = [];
  let cursor: string | undefined;

  do {
    // Notion SDK v5: databases.query moved to dataSources.query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (notion as any).dataSources.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of response.results) {
      if (page.object !== "page") continue;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const props = (page as any).properties as Record<string, any>;
        const F = IMPULSADOS_FIELDS;

        // Collect mentorías extra (N ≥ 4)
        const mentoriasExtra: Array<{ numero: number; fecha: string }> = [];
        for (const [key, val] of Object.entries(props)) {
          const match = key.match(MENTORIA_EXTRA_PATTERN);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!MENTORIA_BASE_NUMBERS.has(num)) {
              const fecha = extractDate(val);
              if (fecha) mentoriasExtra.push({ numero: num, fecha });
            }
          }
        }
        mentoriasExtra.sort((a, b) => a.numero - b.numero);

        const row = {
          notion_id:             page.id,
          nombre_completo:       extractTitle(props[F.nombre]) || "Sin nombre",
          estado_documentacion:  extractSelect(props[F.estado_documentacion]),
          estado_programa:       extractSelect(props[F.estado_programa]),
          fecha_inicio:          extractDate(props[F.fecha_inicio]),
          fecha_ultimo_entregable: extractDate(props[F.fecha_ultimo_entregable]),
          mentoria_1_fecha:      extractDate(props[F.mentoria_1]),
          mentoria_2_fecha:      extractDate(props[F.mentoria_2]),
          mentoria_3_fecha:      extractDate(props[F.mentoria_3]),
          notas_entregables:     extractRichText(props[F.notas_entregables]),
          observaciones:         extractRichText(props[F.observaciones]),
          recursos_enviados:     extractRichText(props[F.recursos_enviados]),
          responsables:          extractMultiSelect(props[F.responsable]),
          mentor_principal:      extractSelect(props[F.seguimiento_mentor]),
          semana_entregable:     extractSelect(props[F.semana_entregable]),
          provincia:             extractSelect(props[F.provincia]),
          mentorias_extra:       mentoriasExtra,
          raw_notion:            props,
          last_synced_at:        new Date().toISOString(),
        };

        const { error } = await supabase
          .from("impulsados_cache")
          .upsert(row, { onConflict: "notion_id" });

        if (error) {
          errors++;
          details.push(`Error ${row.nombre_completo}: ${error.message}`);
        } else {
          synced++;
        }
      } catch (err) {
        errors++;
        details.push(`Error page ${page.id}: ${String(err)}`);
      }
    }

    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  return { synced, errors, details };
}
