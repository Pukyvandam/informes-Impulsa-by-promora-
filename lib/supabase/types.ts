export type FasePrograma = "fase_i_estrategia" | "fase_ii_seguimiento";
export type TipoEtapa = "hito" | "mentoria" | "teoria" | "sesion_practica" | "check_control" | "resumen";
export type RangoPropiedades = "0-1" | "1-3" | "3+";
export type TipoMeeting = "mentoria" | "check_control" | "sesion_practica" | "otro";
export type FuenteMeeting = "zoom" | "meet" | "teams" | "manual";
export type EstadoProcesamiento = "pendiente" | "procesando" | "completado" | "error";
export type TipoFuenteChunk = "transcripcion" | "resumen" | "nota" | "insight" | "hito" | "entregable";
export type CategoriaInsight =
  | "miedo_explicito" | "miedo_implicito" | "reto" | "resolucion"
  | "compromiso" | "logro" | "bloqueo" | "objetivo_emergente"
  | "estado_emocional" | "feedback_mentor" | "objetivo_cumplido" | "alerta";
export type CanalEntregable = "mail" | "drive" | "teams" | "multicanal";
export type EstadoInforme = "generando" | "completado" | "error";
export type RolUsuario = "admin" | "mentor" | "viewer";

export interface ProgramaEtapa {
  id: string;
  codigo: string;
  nombre: string;
  fase: FasePrograma;
  tipo: TipoEtapa;
  dia_min: number | null;
  dia_max: number | null;
  responsable_promora: string | null;
  ejecutor_promora: string | null;
  entregables: string[] | null;
  canal: string | null;
  descripcion: string | null;
  orden: number;
}

export interface ImpulsadoCache {
  id: string;
  notion_id: string;
  nombre_completo: string;
  email: string | null;
  provincia: string | null;
  rango_propiedades: RangoPropiedades | null;
  caso_real_curso: string | null;
  valor_caso_real: number | null;
  estado_programa: string | null;
  estado_documentacion: string | null;
  fecha_inicio: string | null;
  fecha_ultimo_entregable: string | null;
  mentor_principal: string | null;
  responsables: string[] | null;
  mentoria_1_fecha: string | null;
  mentoria_2_fecha: string | null;
  mentoria_3_fecha: string | null;
  mentorias_extra: Array<{ numero: number; fecha: string }>;
  notas_entregables: string | null;
  observaciones: string | null;
  recursos_enviados: string | null;
  semana_entregable: string | null;
  foto_url: string | null;
  raw_notion: Record<string, unknown> | null;
  last_synced_at: string;
  created_at: string;
}

export interface Meeting {
  id: string;
  impulsado_id: string;
  etapa_id: string | null;
  fecha: string;
  duracion_minutos: number | null;
  tipo: TipoMeeting;
  titulo: string;
  transcripcion_completa: string | null;
  resumen_nativo: string | null;
  resumen_procesado: string | null;
  fuente: FuenteMeeting;
  participantes: string[] | null;
  estado_procesamiento: EstadoProcesamiento;
  tokens_consumidos: number | null;
  error_mensaje: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chunk {
  id: string;
  meeting_id: string | null;
  impulsado_id: string;
  contenido: string;
  contenido_limpio: string | null;
  tipo_fuente: TipoFuenteChunk;
  posicion: number;
  metadatos: Record<string, unknown>;
  fecha_contexto: string | null;
  created_at: string;
}

export interface Insight {
  id: string;
  impulsado_id: string;
  meeting_id: string | null;
  chunk_id: string | null;
  etapa_programa_id: string | null;
  categoria: CategoriaInsight;
  titulo: string;
  descripcion: string;
  evidencia: string | null;
  confianza: number | null;
  fecha: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface KcdMensual {
  id: string;
  impulsado_id: string;
  mes: string;
  leads_trabajados: number;
  visitas_cliente: number;
  propuestas_presentadas: number;
  operaciones_cerradas: number;
  formaciones_completadas: number;
  formaciones_totales_programa: number;
  asistencia_mentorias_pct: number | null;
  facturacion_generada: number | null;
  notas: string | null;
  created_at: string;
}

export interface Informe {
  id: string;
  impulsado_id: string;
  mes: string;
  contenido_json: Record<string, unknown> | null;
  pdf_url: string | null;
  estado: EstadoInforme;
  generado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface Entregable {
  id: string;
  impulsado_id: string;
  etapa_id: string | null;
  fecha_envio: string;
  tipo: string;
  titulo: string;
  canal: CanalEntregable | null;
  enviado_por: string | null;
  valoracion_impulsado: number | null;
  notas: string | null;
  created_at: string;
}
