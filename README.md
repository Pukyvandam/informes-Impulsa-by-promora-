# Impulsa Intelligence

Plataforma de inteligencia semántica para el programa de mentoría **Impulsa by Promora**. Convierte transcripciones de mentorías en insights estructurados, informes mensuales y búsqueda semántica sobre el conocimiento acumulado de cada impulsado.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Radix UI |
| Backend | API Routes de Next.js (Node.js runtime) |
| Base de datos | Supabase (PostgreSQL + pgvector) |
| Embeddings | `@xenova/transformers` con `multilingual-e5-large` (1024 dims, gratuito) |
| LLM | Anthropic Claude Sonnet 4.5 |
| Integración | Notion API oficial (sólo lectura) |
| PDF | @react-pdf/renderer |
| Despliegue | Vercel + Supabase Cloud |

## Setup local

### 1. Prerrequisitos

- Node.js ≥ 20.9
- pnpm ≥ 9
- Cuenta de Supabase (tier gratuito suficiente para desarrollo)
- API key de Anthropic

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Variables de entorno

```bash
cp .env.local.example .env.local
```

Rellena las variables obligatorias:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (sólo backend) |
| `ANTHROPIC_API_KEY` | Tu clave de Anthropic |
| `NOTION_API_KEY` | Integration token de Notion |
| `NOTION_IMPULSADOS_DB_ID` | ID de la base de datos de impulsados en Notion |
| `SYNC_SECRET` | Token aleatorio para proteger el endpoint de sync |

### 4. Inicializar base de datos Supabase

En el panel de Supabase → SQL Editor, ejecuta en orden:

```sql
-- 1. Esquema completo (tablas, enums, funciones)
\i supabase/migrations/001_schema.sql

-- 2. Row Level Security
\i supabase/migrations/002_rls.sql

-- 3. Catálogo del programa (35 etapas)
\i supabase/migrations/003_seed_programa.sql

-- 4. Datos de demostración (opcional)
\i supabase/migrations/004_seed_demo.sql
```

O con Supabase CLI:

```bash
supabase db push
```

### 5. Arrancar en desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000). La primera vez que se use el pipeline de embeddings, `@xenova/transformers` descargará el modelo `multilingual-e5-large` (~560 MB) a `.cache/transformers/`. Esto puede tardar varios minutos.

## Configuración del mapeo de Notion

Los nombres de columnas de tu base de datos de Notion se configuran en `.env.local`. Los valores por defecto están en `lib/notion/mapping.ts`.

Si tu base de datos usa nombres distintos (tildes, capitalización diferente), sobrescribe la variable correspondiente:

```bash
# Ejemplo: si tu columna se llama "Provincia/Ciudad" en lugar de "Provincia"
NOTION_FIELD_PROVINCIA=Provincia/Ciudad

# Si "Mentoría 1" se llama "1ª Mentoría"
NOTION_FIELD_MENTORIA_1=1ª Mentoría
```

**Mentorías extra (N ≥ 4)**: se detectan automáticamente por patrón `Mentoría N`. No requieren configuración adicional. Se guardan en `mentorias_extra` (JSONB).

### Sincronización

- **Manual**: botón "Refrescar Notion" en el sidebar (usuarios admin)
- **Automática**: Vercel Cron cada 15 min via `POST /api/sync/notion` con header `Authorization: Bearer {SYNC_SECRET}`

## Pipeline de ingesta

Al crear una nueva sesión en `/meetings/nuevo`, el pipeline corre 7 pasos:

1. **Normalización** — limpia timestamps y separa por speaker
2. **Chunking** — fragmentos semánticos de 700 tokens por turno de speaker
3. **Embeddings** — vectores 1024-dim con `multilingual-e5-large`
4. **Detección de etapa** — asigna automáticamente la etapa del flujograma
5. **Extracción de insights** — Claude Sonnet 4.5 identifica miedos, logros, compromisos, alertas, etc.
6. **Resumen** — Claude genera un resumen denso de la sesión
7. **Guardado** — todo persiste en Supabase

El progreso se transmite en tiempo real vía Server-Sent Events.

## Despliegue en Vercel

```bash
vercel --prod
```

Variables de entorno necesarias en el panel de Vercel: todas las de `.env.local.example`.

El cron de sincronización con Notion está configurado en `vercel.json` (cada 15 min). Asegúrate de que `SYNC_SECRET` está configurado en Vercel para que el cron funcione.

## Cambiar proveedor de embeddings a Voyage AI

Para mayor calidad en español (especialmente en producción):

```bash
EMBEDDING_PROVIDER=voyage
VOYAGE_API_KEY=pa-...
EMBEDDING_MODEL=voyage-3
```

La dimensión 1024 es compatible con el esquema actual sin migración.

## Roles de usuario

| Rol | Permisos |
|---|---|
| `admin` | Todo: leer, escribir, sincronizar, generar informes |
| `mentor` | Ver sólo sus impulsados (por email en `responsables` o `mentor_principal`) |
| `viewer` | Lectura sin descarga |

Asignar rol desde Supabase SQL:

```sql
insert into user_roles (user_id, rol) values ('<uuid>', 'mentor');
```
