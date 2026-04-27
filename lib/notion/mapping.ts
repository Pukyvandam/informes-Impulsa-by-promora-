// Centralised Notion field name mapping.
// Override any field via the corresponding env var without touching logic.

function f(envVar: string, fallback: string): string {
  return process.env[envVar] ?? fallback;
}

export const IMPULSADOS_FIELDS = {
  nombre:                  f("NOTION_FIELD_NOMBRE",                 "Nombre"),
  estado_documentacion:    f("NOTION_FIELD_ESTADO_DOC",             "Estado documentación"),
  estado_programa:         f("NOTION_FIELD_ESTADO_PROGRAMA",        "Estado programa"),
  fecha_inicio:            f("NOTION_FIELD_FECHA_INICIO",           "Fecha de inicio"),
  fecha_ultimo_entregable: f("NOTION_FIELD_FECHA_ULTIMO_ENTREGABLE","Fecha último entregable"),
  mentoria_1:              f("NOTION_FIELD_MENTORIA_1",             "Mentoría 1"),
  mentoria_2:              f("NOTION_FIELD_MENTORIA_2",             "Mentoría 2"),
  mentoria_3:              f("NOTION_FIELD_MENTORIA_3",             "Mentoría 3"),
  notas_entregables:       f("NOTION_FIELD_NOTAS_ENTREGABLES",      "Notas entregables"),
  observaciones:           f("NOTION_FIELD_OBSERVACIONES",          "Observaciones"),
  recursos_enviados:       f("NOTION_FIELD_RECURSOS_ENVIADOS",      "Recursos enviados"),
  responsable:             f("NOTION_FIELD_RESPONSABLE",            "Responsable"),
  seguimiento_mentor:      f("NOTION_FIELD_SEGUIMIENTO_MENTOR",     "Seguimiento mentor"),
  semana_entregable:       f("NOTION_FIELD_SEMANA_ENTREGABLE",      "Semana entregable"),
  provincia:               f("NOTION_FIELD_PROVINCIA",              "Provincia"),
} as const;

// Pattern: any property named "Mentoría N" where N ≥ 4
export const MENTORIA_EXTRA_PATTERN = /^Mentoría (\d+)$/;
export const MENTORIA_BASE_NUMBERS = new Set([1, 2, 3]);
