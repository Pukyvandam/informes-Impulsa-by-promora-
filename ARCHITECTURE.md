# Arquitectura — Impulsa Intelligence

## Principios de diseño

### 1. Notion es el máster de datos operativos
La app **no gestiona altas de impulsados, leads ni datos personales**. Esos viven en Notion. `impulsados_cache` es un espejo de sólo lectura que se actualiza cada 15 min. La app nunca escribe en Notion.

### 2. El flujograma es el modelo canónico
La tabla `programa_etapas` (seed, inmutable en runtime) define las 35 etapas del programa. Cada meeting y entregable se vincula a su etapa. Esto permite ubicar a cada impulsado en el programa y correlacionar insights con el momento del programa.

### 3. BBDD vectorial como memoria viva
Las transcripciones nunca se pasan enteras a Claude. Se fragmentan semánticamente, se vectorizan y se almacenan en pgvector. El retrieval es híbrido: búsqueda vectorial por similitud coseno + filtros SQL.

---

## Flujo vectorial

```
Transcripción
     │
     ▼
normalizeTranscript()          → Turnos por speaker, sin timestamps ni muletillas
     │
     ▼
chunkTranscript()              → Chunks de 700 tokens por turno (solapamiento 100t)
     │                           Para texto escrito: chunkText() por párrafo
     ▼
embedTexts()                   → vector(1024) por chunk via multilingual-e5-large
     │
     ▼
INSERT chunks (pgvector)       → índice HNSW para búsqueda aproximada rápida
     │
     ▼
extractInsightsFromChunk()     → Claude Sonnet 4.5 → JSON de insights por chunk
     │
     ▼
INSERT insights                → con FK a chunk, meeting, impulsado, etapa
     │
     ▼
summarizeMeeting()             → Claude genera resumen denso
     │
     ▼
embed(resumen) → INSERT chunk  → tipo_fuente='resumen', vectorizado también
```

### Por qué chunking por turno de speaker y no por párrafo

Las transcripciones de mentorías tienen una estructura conversacional donde:
- El cambio de speaker es la frontera semántica natural
- Un turno largo de Gonzalo tiene coherencia interna distinta a uno de Carmen
- El solapamiento garantiza que el contexto de la pregunta anterior está en el chunk de la respuesta

Para texto escrito (resúmenes, notas), el párrafo es la unidad natural → `chunkText()`.

---

## Decisión: dónde corre el pipeline

**Situación actual**: Route Handler con `runtime = 'nodejs'` y `maxDuration = 300s`. El progreso se transmite al frontend vía Server-Sent Events. Esto funciona bien para:
- Transcripciones de hasta ~2h (≈ 200 chunks)
- Carga de ≤ 10 meetings simultáneos

**Cuándo migrar**:
1. Si el volumen supera 50 meetings/día → mover a **Supabase Edge Functions** + Cola (pg_cron o Inngest)
2. Si el tiempo de procesamiento supera 5 min habitualmente → usar **Vercel Queues** o **n8n** como orquestador
3. Si se quiere reintentos granulares por paso → implementar una tabla `pipeline_jobs` como state machine

La abstracción actual (`runPipeline` con callback de progreso) hace trivial este cambio: el callback se convierte en un event emitter o una actualización de base de datos en vez de SSE.

---

## Cómo añadir nuevas categorías de insights

1. Añade el nuevo valor al enum en SQL:
```sql
ALTER TYPE categoria_insight ADD VALUE 'nueva_categoria';
```

2. Actualiza el tipo TypeScript en `lib/supabase/types.ts`:
```ts
export type CategoriaInsight = ... | 'nueva_categoria';
```

3. Añade la descripción en el system prompt de `lib/pipeline/extract-insights.ts`.

4. Añade el chip de color en `globals.css`:
```css
.chip-nueva_categoria { background: ...; color: ...; border: ...; }
```

5. Actualiza `components/impulsados/InsightCard.tsx` para mapear la nueva categoría al chip.

No hay migración de datos existentes necesaria.

---

## Modelo de datos simplificado

```
programa_etapas (seed)
    ↑ FK
impulsados_cache (sync Notion)
    ↑ FK
meetings ──────── chunks ──── insights
    │                              │
    └──────────────────────────────┘ (FK impulsado, meeting, chunk, etapa)

kcd_mensuales → impulsados_cache
informes      → impulsados_cache
```

---

## Seguridad

- Las API routes usan `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS) → nunca exponer al frontend
- El frontend usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` con RLS activo
- El endpoint de sync está protegido por `SYNC_SECRET` (Bearer token)
- Vercel Cron añade automáticamente el header `Authorization: Bearer {CRON_SECRET}` si se configura en el dashboard
