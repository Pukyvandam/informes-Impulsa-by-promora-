-- ================================================================
-- 001_schema.sql  —  Impulsa Intelligence
-- Requires: Supabase project with pgvector enabled
-- ================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- ── Enums ─────────────────────────────────────────────────────────

create type fase_programa as enum (
  'fase_i_estrategia',
  'fase_ii_seguimiento'
);

create type tipo_etapa as enum (
  'hito',
  'mentoria',
  'teoria',
  'sesion_practica',
  'check_control',
  'resumen'
);

create type rango_propiedades as enum (
  '0-1',
  '1-3',
  '3+'
);

create type tipo_meeting as enum (
  'mentoria',
  'check_control',
  'sesion_practica',
  'otro'
);

create type fuente_meeting as enum (
  'zoom',
  'meet',
  'teams',
  'manual'
);

create type estado_procesamiento as enum (
  'pendiente',
  'procesando',
  'completado',
  'error'
);

create type tipo_fuente_chunk as enum (
  'transcripcion',
  'resumen',
  'nota',
  'insight',
  'hito',
  'entregable'
);

create type categoria_insight as enum (
  'miedo_explicito',
  'miedo_implicito',
  'reto',
  'resolucion',
  'compromiso',
  'logro',
  'bloqueo',
  'objetivo_emergente',
  'estado_emocional',
  'feedback_mentor',
  'objetivo_cumplido',
  'alerta'
);

create type canal_entregable as enum (
  'mail',
  'drive',
  'teams',
  'multicanal'
);

create type estado_informe as enum (
  'generando',
  'completado',
  'error'
);

create type rol_usuario as enum (
  'admin',
  'mentor',
  'viewer'
);

-- ── Catálogo del programa (seed, inmutable en runtime) ────────────

create table programa_etapas (
  id            uuid primary key default uuid_generate_v4(),
  codigo        text unique not null,
  nombre        text not null,
  fase          fase_programa not null,
  tipo          tipo_etapa not null,
  dia_min       int,
  dia_max       int,
  responsable_promora  text,
  ejecutor_promora     text,
  entregables   text[],
  canal         text,
  descripcion   text,
  orden         int not null
);

-- ── Impulsados (mirror de Notion) ────────────────────────────────

create table impulsados_cache (
  id                    uuid primary key default uuid_generate_v4(),
  notion_id             text unique not null,
  nombre_completo       text not null,
  email                 text,
  provincia             text,
  rango_propiedades     rango_propiedades,
  caso_real_curso       text,
  valor_caso_real       numeric,
  estado_programa       text,
  estado_documentacion  text,
  fecha_inicio          date,
  fecha_ultimo_entregable date,
  mentor_principal      text,
  responsables          text[],
  mentoria_1_fecha      date,
  mentoria_2_fecha      date,
  mentoria_3_fecha      date,
  mentorias_extra       jsonb default '[]'::jsonb,
  notas_entregables     text,
  observaciones         text,
  recursos_enviados     text,
  semana_entregable     text,
  foto_url              text,
  raw_notion            jsonb,
  last_synced_at        timestamptz default now(),
  created_at            timestamptz default now()
);

create index idx_impulsados_provincia on impulsados_cache(provincia);
create index idx_impulsados_mentor on impulsados_cache(mentor_principal);
create index idx_impulsados_estado on impulsados_cache(estado_programa);

-- ── Meetings ─────────────────────────────────────────────────────

create table meetings (
  id                    uuid primary key default uuid_generate_v4(),
  impulsado_id          uuid not null references impulsados_cache(id) on delete cascade,
  etapa_id              uuid references programa_etapas(id),
  fecha                 date not null,
  duracion_minutos      int,
  tipo                  tipo_meeting not null default 'mentoria',
  titulo                text not null,
  transcripcion_completa text,
  resumen_nativo        text,
  resumen_procesado     text,
  fuente                fuente_meeting not null default 'manual',
  participantes         text[],
  estado_procesamiento  estado_procesamiento not null default 'pendiente',
  tokens_consumidos     int,
  error_mensaje         text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index idx_meetings_impulsado on meetings(impulsado_id);
create index idx_meetings_fecha on meetings(fecha desc);
create index idx_meetings_estado on meetings(estado_procesamiento);

-- ── Entregables ───────────────────────────────────────────────────

create table entregables (
  id             uuid primary key default uuid_generate_v4(),
  impulsado_id   uuid not null references impulsados_cache(id) on delete cascade,
  etapa_id       uuid references programa_etapas(id),
  fecha_envio    date not null,
  tipo           text not null,
  titulo         text not null,
  canal          canal_entregable,
  enviado_por    text,
  valoracion_impulsado int check (valoracion_impulsado between 1 and 5),
  notas          text,
  created_at     timestamptz default now()
);

create index idx_entregables_impulsado on entregables(impulsado_id);

-- ── Chunks (índice vectorial) ─────────────────────────────────────

create table chunks (
  id              uuid primary key default uuid_generate_v4(),
  meeting_id      uuid references meetings(id) on delete cascade,
  impulsado_id    uuid not null references impulsados_cache(id) on delete cascade,
  contenido       text not null,
  contenido_limpio text,
  embedding       vector(1024),
  tipo_fuente     tipo_fuente_chunk not null default 'transcripcion',
  posicion        int not null default 0,
  metadatos       jsonb default '{}'::jsonb,
  fecha_contexto  timestamptz,
  created_at      timestamptz default now()
);

create index idx_chunks_impulsado on chunks(impulsado_id);
create index idx_chunks_meeting on chunks(meeting_id);
create index idx_chunks_tipo on chunks(tipo_fuente);
create index chunks_embedding_idx on chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- ── Insights ─────────────────────────────────────────────────────

create table insights (
  id                  uuid primary key default uuid_generate_v4(),
  impulsado_id        uuid not null references impulsados_cache(id) on delete cascade,
  meeting_id          uuid references meetings(id) on delete set null,
  chunk_id            uuid references chunks(id) on delete set null,
  etapa_programa_id   uuid references programa_etapas(id),
  categoria           categoria_insight not null,
  titulo              text not null,
  descripcion         text not null,
  evidencia           text,
  confianza           numeric check (confianza between 0 and 1),
  embedding           vector(1024),
  fecha               date,
  tags                text[],
  created_at          timestamptz default now()
);

create index idx_insights_impulsado on insights(impulsado_id);
create index idx_insights_categoria on insights(categoria);
create index idx_insights_meeting on insights(meeting_id);
create index insights_embedding_idx on insights
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- ── KCD mensual ───────────────────────────────────────────────────

create table kcd_mensuales (
  id                          uuid primary key default uuid_generate_v4(),
  impulsado_id                uuid not null references impulsados_cache(id) on delete cascade,
  mes                         date not null,
  leads_trabajados            int default 0,
  visitas_cliente             int default 0,
  propuestas_presentadas      int default 0,
  operaciones_cerradas        int default 0,
  formaciones_completadas     int default 0,
  formaciones_totales_programa int default 12,
  asistencia_mentorias_pct    numeric,
  facturacion_generada        numeric,
  notas                       text,
  created_at                  timestamptz default now(),
  unique (impulsado_id, mes)
);

create index idx_kcd_impulsado on kcd_mensuales(impulsado_id);

-- ── Informes ─────────────────────────────────────────────────────

create table informes (
  id              uuid primary key default uuid_generate_v4(),
  impulsado_id    uuid not null references impulsados_cache(id) on delete cascade,
  mes             date not null,
  contenido_json  jsonb,
  pdf_url         text,
  estado          estado_informe not null default 'generando',
  generado_por    text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (impulsado_id, mes)
);

create index idx_informes_impulsado on informes(impulsado_id);

-- ── Roles de usuario ─────────────────────────────────────────────

create table user_roles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  rol         rol_usuario not null default 'viewer',
  created_at  timestamptz default now(),
  unique (user_id)
);

-- ── Trigger: updated_at automático ───────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_meetings_updated_at
  before update on meetings
  for each row execute function set_updated_at();

create trigger trg_informes_updated_at
  before update on informes
  for each row execute function set_updated_at();

-- ── Helper: similitud semántica ───────────────────────────────────

create or replace function search_chunks(
  query_embedding vector(1024),
  match_count     int default 10,
  filter_impulsado uuid default null,
  filter_tipo     tipo_fuente_chunk default null,
  similarity_threshold float default 0.3
)
returns table (
  id              uuid,
  contenido       text,
  tipo_fuente     tipo_fuente_chunk,
  meeting_id      uuid,
  impulsado_id    uuid,
  metadatos       jsonb,
  fecha_contexto  timestamptz,
  similarity      float
)
language sql stable as $$
  select
    c.id,
    c.contenido,
    c.tipo_fuente,
    c.meeting_id,
    c.impulsado_id,
    c.metadatos,
    c.fecha_contexto,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  where
    (filter_impulsado is null or c.impulsado_id = filter_impulsado)
    and (filter_tipo is null or c.tipo_fuente = filter_tipo)
    and c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) > similarity_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function search_insights(
  query_embedding  vector(1024),
  match_count      int default 10,
  filter_impulsado uuid default null,
  filter_categoria categoria_insight default null,
  similarity_threshold float default 0.3
)
returns table (
  id           uuid,
  titulo       text,
  descripcion  text,
  evidencia    text,
  categoria    categoria_insight,
  impulsado_id uuid,
  meeting_id   uuid,
  confianza    numeric,
  fecha        date,
  similarity   float
)
language sql stable as $$
  select
    i.id,
    i.titulo,
    i.descripcion,
    i.evidencia,
    i.categoria,
    i.impulsado_id,
    i.meeting_id,
    i.confianza,
    i.fecha,
    1 - (i.embedding <=> query_embedding) as similarity
  from insights i
  where
    (filter_impulsado is null or i.impulsado_id = filter_impulsado)
    and (filter_categoria is null or i.categoria = filter_categoria)
    and i.embedding is not null
    and 1 - (i.embedding <=> query_embedding) > similarity_threshold
  order by i.embedding <=> query_embedding
  limit match_count;
$$;
