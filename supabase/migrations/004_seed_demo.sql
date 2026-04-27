-- ================================================================
-- 004_seed_demo.sql  —  Datos ficticios para desarrollo local
-- 3 impulsados (Málaga, Sevilla, Valencia), 6 meetings, 2 meses KCD
-- ================================================================

-- IDs fijos para referencias cruzadas
do $$
declare
  id_mal  uuid := 'aaaaaaaa-0001-0001-0001-000000000001';
  id_sev  uuid := 'aaaaaaaa-0002-0002-0002-000000000002';
  id_val  uuid := 'aaaaaaaa-0003-0003-0003-000000000003';

  -- etapas
  etapa_hito0   uuid;
  etapa_ment1   uuid;
  etapa_ment2   uuid;
  etapa_cc1     uuid;

  -- meetings
  m1 uuid := 'bbbbbbbb-0001-0001-0001-000000000001';
  m2 uuid := 'bbbbbbbb-0002-0002-0002-000000000002';
  m3 uuid := 'bbbbbbbb-0003-0003-0003-000000000003';
  m4 uuid := 'bbbbbbbb-0004-0004-0004-000000000004';
  m5 uuid := 'bbbbbbbb-0005-0005-0005-000000000005';
  m6 uuid := 'bbbbbbbb-0006-0006-0006-000000000006';
begin

  -- Obtener IDs de etapas
  select id into etapa_hito0 from programa_etapas where codigo = 'HITO_0';
  select id into etapa_ment1 from programa_etapas where codigo = 'MENTORIA_1';
  select id into etapa_ment2 from programa_etapas where codigo = 'MENTORIA_2';
  select id into etapa_cc1   from programa_etapas where codigo = 'CC1';

  -- ── Impulsados ────────────────────────────────────────────────

  insert into impulsados_cache (
    id, notion_id, nombre_completo, provincia, rango_propiedades,
    caso_real_curso, valor_caso_real, estado_programa, estado_documentacion,
    fecha_inicio, mentor_principal, responsables,
    mentoria_1_fecha, mentoria_2_fecha,
    mentorias_extra, semana_entregable, last_synced_at
  ) values
  (
    id_mal, 'notion-demo-001', 'Carmen López Vega',
    'Málaga', '3+',
    'Villa en Marbella — La Zagaleta', 2800000,
    'Fase II activa', 'Completa',
    '2026-01-10', 'gonzalo@promora.es', ARRAY['gonzalo@promora.es','laura@promora.es'],
    '2026-01-24', '2026-02-21',
    '[]'::jsonb, 'Semana 10', now()
  ),
  (
    id_sev, 'notion-demo-002', 'Marcos Ruiz Herrera',
    'Sevilla', '1-3',
    'Piso en Triana — Calle Betis', 680000,
    'Fase I activa', 'Pendiente',
    '2026-02-03', 'gonzalo@promora.es', ARRAY['gonzalo@promora.es'],
    '2026-02-17', null,
    '[]'::jsonb, 'Semana 4', now()
  ),
  (
    id_val, 'notion-demo-003', 'Sofía Martínez Palau',
    'Valencia', '1-3',
    'Ático en Ruzafa — Calle Cuba', 490000,
    'Fase I activa', 'Completa',
    '2026-02-17', 'laura@promora.es', ARRAY['laura@promora.es'],
    null, null,
    '[]'::jsonb, 'Semana 2', now()
  );

  -- ── Meetings ──────────────────────────────────────────────────

  insert into meetings (
    id, impulsado_id, etapa_id, fecha, duracion_minutos, tipo, titulo,
    fuente, participantes, estado_procesamiento,
    transcripcion_completa, resumen_procesado
  ) values
  (
    m1, id_mal, etapa_ment1, '2026-01-24', 75, 'mentoria', 'Mentoría 1 — Carmen López',
    'zoom', ARRAY['Gonzalo Lopez','Carmen López'],
    'completado',
    E'Gonzalo: Buenos días Carmen, cuéntame cómo llevas estas primeras semanas.\n'
    E'Carmen: Pues la verdad que bien pero con muchas dudas sobre cómo acercarme a los propietarios de La Zagaleta. Es un mundo muy cerrado.\n'
    E'Gonzalo: Exacto, y esa es precisamente la clave. No vas a entrar llamando a la puerta, vas a entrar por las relaciones. ¿Tienes ya algún contacto de arquitecto o abogado en la zona?\n'
    E'Carmen: Tengo un arquitecto que trabaja rehabilitando villas allí, nos conocemos del colegio profesional.\n'
    E'Gonzalo: Perfecto, ese es tu primer paso. No le pidas negocio, invítale a un café y escucha qué propietarios están pensando en vender. Ese tipo de información vale oro.\n'
    E'Carmen: Me da un poco de reparo porque no somos tan cercanos...\n'
    E'Gonzalo: Ese reparo es exactamente el miedo que tienes que superar. En el lujo, la relación va antes que la transacción, siempre. ¿Compromiso para esta semana?\n'
    E'Carmen: Llamo al arquitecto antes del viernes.\n'
    E'Gonzalo: Bien. Y registra en el CRM la Villa de La Zagaleta aunque no tengas aún confirmación del propietario. ¿Qué más te preocupa?\n'
    E'Carmen: El precio. No sé cómo defender 2,8 millones si el propietario quiere 3,2.\n'
    E'Gonzalo: Vamos a trabajar eso en la formación de negociación la próxima semana. Pero el principio básico es: datos, no opiniones. Traes tres comparables recientes y el propietario tiene que llegar a la conclusión solo.',
    'Primera mentoría estratégica de Carmen. Define territorio en La Zagaleta vía contacto arquitecto. Compromiso: llamada antes del viernes. Bloqueador identificado: miedo al rechazo en relaciones de red. Próximo paso: formación de negociación.'
  ),
  (
    m2, id_mal, etapa_ment2, '2026-02-21', 90, 'mentoria', 'Mentoría 2 — Seguimiento Carmen',
    'zoom', ARRAY['Gonzalo Lopez','Carmen López'],
    'completado',
    E'Gonzalo: Carmen, ¡cuéntame! Llevas casi 6 semanas. ¿Cómo va La Zagaleta?\n'
    E'Carmen: El arquitecto me presentó a un propietario que lleva un año pensando en vender una villa de 2.800 metros. He tenido ya dos reuniones.\n'
    E'Gonzalo: Eso es un logro enorme. ¿Cómo se llama el propietario?\n'
    E'Carmen: Prefiero no decirlo por ahora, es muy reservado.\n'
    E'Gonzalo: Perfecto, lo entiendo. ¿En qué punto está la decisión de venta?\n'
    E'Carmen: Quiere vender pero tiene miedo de que salga en prensa. Su familia es conocida.\n'
    E'Gonzalo: Ahí tienes una palanca de venta poderosa: discreción total. ¿Le has hablado de nuestro protocolo de venta privada?\n'
    E'Carmen: No, no sabía que existía eso.\n'
    E'Gonzalo: Es algo que diferencia a Promora. Hay una carpeta en Drive con el protocolo. Pero Carmen, lo que me preocupa es que ya llevas dos reuniones y no tienes un mandato firmado. ¿Por qué?\n'
    E'Carmen: Porque me da miedo presionar y perder la relación.\n'
    E'Gonzalo: Ese miedo te está costando el mandato. El propietario que no firma es el propietario que otro agente se lleva. La pregunta no es "¿me das el mandato?" sino "¿cuándo empezamos?". Hay diferencia.\n'
    E'Carmen: Tienes razón. Esta semana le llevo el protocolo de discreción y le propongo una fecha para el mandato.\n'
    E'Gonzalo: Perfecto. Eso es lo que quiero ver en el Check Control 1. ¿Algo más que te esté bloqueando?\n'
    E'Carmen: La parte digital. Tengo el LinkedIn hecho pero no sé qué publicar.\n'
    E'Gonzalo: Patricia te va a ayudar esta semana con un calendario editorial. Tres publicaciones al mes son suficientes para empezar.',
    'Progreso significativo: propietario cualificado en La Zagaleta identificado vía red. Bloqueador crítico: miedo a pedir mandato por no perder relación. Compromiso: presentar protocolo de discreción y proponer fecha de mandato esta semana. Insight de alerta: 6 semanas sin mandato firmado con contacto activo.'
  ),
  (
    m3, id_mal, etapa_cc1, '2026-03-07', 60, 'check_control', 'Check Control 1 — Carmen López',
    'meet', ARRAY['Gonzalo Lopez','Laura Fernández','Carmen López'],
    'completado',
    E'Gonzalo: Carmen, llegamos al Check Control 1. Laura está aquí para tomar notas. ¿Cómo presentarías tu situación actual?\n'
    E'Carmen: Tengo un lead cualificado en La Zagaleta, dos reuniones hechas, el mandato casi cerrado y cinco contactos más en el CRM.\n'
    E'Laura: ¿Formaciones completadas?\n'
    E'Carmen: Siete de las doce. Me faltan negociación avanzada, cierre y referrals.\n'
    E'Gonzalo: ¿Cómo ha ido la semana del mandato?\n'
    E'Carmen: Le llevé el protocolo de discreción. Le gustó mucho. Quedamos en firmar el mandato el 12 de marzo.\n'
    E'Gonzalo: Excelente. Eso ya es un hito. ¿Cómo estás tú emocionalmente?\n'
    E'Carmen: Nerviosa pero con energía. A veces me da el síndrome del impostor — ¿quién soy yo para vender una villa de 2,8 millones?\n'
    E'Gonzalo: Eso lo tiene todo el mundo en este programa. La diferencia es que tú ya tienes la mesa puesta. El propietario te eligió a ti. ¿Qué te dice eso?\n'
    E'Carmen: Que algo estoy haciendo bien. [risas]\n'
    E'Gonzalo: Exactamente. Laura, ¿evaluación?\n'
    E'Laura: CC1 superado. Nota: actividad alta, posicionamiento en construcción, caso real tangible. Área de mejora: consistencia digital y cierre de mandato pendiente.',
    'CC1 superado. Carmen: lead cualificado con mandato en proceso de firma (12/03). Síndrome del impostor presente pero manejado. 7/12 formaciones completadas. Área de mejora: contenido digital y ritmo de publicación.'
  ),
  (
    m4, id_sev, etapa_ment1, '2026-02-17', 65, 'mentoria', 'Mentoría 1 — Marcos Ruiz',
    'zoom', ARRAY['Gonzalo Lopez','Marcos Ruiz'],
    'completado',
    E'Gonzalo: Marcos, primera mentoría. ¿Cómo ves el mercado de Sevilla desde dentro?\n'
    E'Marcos: Hay mucho movimiento en Triana y en el centro histórico, pero la competencia es brutal. Hay agencias por todos lados.\n'
    E'Gonzalo: ¿Cuál es tu diferenciación ahora mismo?\n'
    E'Marcos: Soy de aquí, conozco el barrio. Pero la verdad es que no sé cómo comunicarlo.\n'
    E'Gonzalo: Ahí está el trabajo. Ser de aquí no es un diferenciador, es una condición de partida. El diferenciador es lo que haces con ese conocimiento. ¿Tienes ya alguna propiedad en mente?\n'
    E'Marcos: Un piso en Calle Betis que lleva meses en el mercado. El propietario está frustrado con su agente actual.\n'
    E'Gonzalo: Eso es una oportunidad perfecta. ¿Has hablado con él?\n'
    E'Marcos: Tengo el contacto por un vecino en común pero no me he atrevido a llamar.\n'
    E'Gonzalo: ¿Y qué te frena exactamente?\n'
    E'Marcos: Que el piso está captado por otra agencia. No sé si es ético llamar.\n'
    E'Gonzalo: Si el propietario quiere hablar, no hay nada de no ético. El mandato exclusivo es entre ellos. Tu conversación con el propietario es libre. Llama esta semana.\n'
    E'Marcos: Bien, lo haré.\n'
    E'Gonzalo: Y una cosa más. Vi tu LinkedIn. Tienes el perfil vacío desde hace dos meses. Eso en el lujo es invisible. Necesitas una foto profesional y una bio esta semana.',
    'Primera mentoría Marcos. Oportunidad identificada en Calle Betis (propietario insatisfecho). Bloqueador: inseguridad sobre ética de llamar a propietario con agencia. Compromiso: llamar esta semana. Área de mejora urgente: perfil LinkedIn vacío.'
  ),
  (
    m5, id_val, etapa_hito0, '2026-02-17', 45, 'mentoria', 'Onboarding — Sofía Martínez',
    'meet', ARRAY['Gonzalo Lopez','Laura Fernández','Sofía Martínez'],
    'completado',
    E'Gonzalo: Sofía, bienvenida al programa Impulsa. Laura te va a ir guiando en los primeros pasos. ¿Cómo describes tu situación actual en el mercado de Valencia?\n'
    E'Sofía: Llevo dos años como agente generalista, he hecho operaciones pero ninguna por encima de 600.000. Quiero dar el salto al segmento alto.\n'
    E'Gonzalo: ¿Qué zonas de Valencia ves con más potencial premium?\n'
    E'Sofía: Ruzafa está muy de moda, pero me parece que hay un público más internacional que no está bien atendido. El barrio de Malilla y la zona de la Marina también están creciendo.\n'
    E'Gonzalo: Interesante. Ruzafa tiene sentido como punto de entrada, pero si quieres ir a alto ticket de verdad, mira Patacona y los chalets de La Eliana. ¿Tienes contactos en esas zonas?\n'
    E'Sofía: En Ruzafa sí, por vivir allí. En las otras zonas, no.\n'
    E'Laura: Sofía, esta semana tu tarea es completar el perfil en GoHighLevel y revisar las formaciones 1 y 2. ¿Tienes claro cómo acceder?\n'
    E'Sofía: Sí, me llegó el email con el acceso.\n'
    E'Gonzalo: Sofía, una pregunta directa. ¿Qué es lo que más te asusta de este salto al lujo?\n'
    E'Sofía: Que los clientes de ese segmento me vean como una agente normal, sin experiencia en lujo. El síndrome del impostor total.\n'
    E'Gonzalo: Perfecto. Eso es honesto y es el punto de partida correcto. El programa está diseñado exactamente para eso.',
    'Onboarding Sofía. Perfil: 2 años de experiencia generalista, primera operación premium pendiente. Zona identificada: Ruzafa como entrada, potencial en Patacona. Miedo explícito: síndrome del impostor ante clientes de lujo. Primeros pasos: GoHighLevel + Formaciones 1 y 2.'
  ),
  (
    m6, id_val, etapa_ment1, '2026-03-03', 60, 'mentoria', 'Mentoría 1 — Sofía Martínez',
    'zoom', ARRAY['Gonzalo Lopez','Sofía Martínez'],
    'completado',
    E'Gonzalo: Sofía, ¿cómo van las dos primeras semanas?\n'
    E'Sofía: Bien, he completado las formaciones 1 a 4 y tengo ya 8 contactos en el CRM.\n'
    E'Gonzalo: ¡Muy bien! ¿De dónde vienen esos contactos?\n'
    E'Sofía: Cuatro son vecinos de Ruzafa que sé que tienen piso y están pensando en vender. Los otros cuatro son propietarios de Patacona que conseguí por LinkedIn.\n'
    E'Gonzalo: Excelente inicio. El de LinkedIn me sorprende. ¿Qué publicaste?\n'
    E'Sofía: Publiqué un artículo sobre el mercado inmobiliario de Ruzafa con datos propios. Tuvo bastante alcance.\n'
    E'Gonzalo: Eso es exactamente lo que diferencia a un agente de lujo. No vendes propiedades, compartes conocimiento. ¿Cuál es el contacto más avanzado?\n'
    E'Sofía: Una señora en Ruzafa con un ático de 490.000. No tiene agencia, quiere discreción.\n'
    E'Gonzalo: Perfecto. ¿Cuándo os volvéis a ver?\n'
    E'Sofía: La semana que viene. Pero me da miedo que el precio sea muy bajo para el segmento premium.\n'
    E'Gonzalo: 490.000 en Ruzafa es prime hoy. No te autodescartes. ¿Qué te frena de proponer el mandato?\n'
    E'Sofía: El precio. Si luego no encuentro comprador a ese precio me sentiré mal.\n'
    E'Gonzalo: Ese miedo es al fracaso, no al precio. Y es muy normal. Vamos a trabajarlo: documenta tres operaciones similares en Ruzafa de los últimos 6 meses. Cuando llegues a esa reunión con datos, el miedo baja.',
    'Excelente inicio: 8 contactos CRM en 2 semanas, artículo LinkedIn con alcance orgánico. Contacto clave: propietaria ático Ruzafa 490K. Bloqueador: miedo al fracaso si no encuentra comprador al precio. Compromiso: documentar 3 comparables antes de la próxima reunión.'
  );

  -- ── KCD mensual ───────────────────────────────────────────────

  insert into kcd_mensuales (
    impulsado_id, mes,
    leads_trabajados, visitas_cliente, propuestas_presentadas, operaciones_cerradas,
    formaciones_completadas, asistencia_mentorias_pct, facturacion_generada, notas
  ) values
  -- Carmen: mes 1
  (id_mal, '2026-02-01', 5, 3, 1, 0, 7, 100, null,
   'Mes de arranque sólido. Lead principal en La Zagaleta en proceso.'),
  -- Carmen: mes 2
  (id_mal, '2026-03-01', 8, 6, 2, 0, 10, 100, null,
   'Mandato firmado el 12/03. Segunda propuesta en preparación.'),
  -- Marcos: mes 1
  (id_sev, '2026-03-01', 3, 2, 0, 0, 4, 100, null,
   'Arranque más lento. Perfil LinkedIn en construcción. Lead Calle Betis avanzando.'),
  -- Sofía: mes 1
  (id_val, '2026-03-01', 8, 4, 1, 0, 5, 100, null,
   'Inicio muy activo. Artículo LinkedIn con buen alcance. Propuesta ático Ruzafa en preparación.');

  -- ── Chunks stub (sin embedding real para el seed) ─────────────
  -- En producción, los chunks se generan via pipeline con embeddings reales.
  -- Aquí insertamos chunks sin vector para que las páginas carguen.

  insert into chunks (meeting_id, impulsado_id, contenido, tipo_fuente, posicion, fecha_contexto)
  values
  (m1, id_mal, 'Primera mentoría estratégica de Carmen. Define territorio en La Zagaleta vía contacto arquitecto.', 'resumen', 0, '2026-01-24'),
  (m2, id_mal, 'Progreso significativo: propietario cualificado en La Zagaleta. Mandato en proceso.', 'resumen', 0, '2026-02-21'),
  (m3, id_mal, 'CC1 superado. Carmen: lead cualificado con mandato en proceso de firma.', 'resumen', 0, '2026-03-07'),
  (m4, id_sev, 'Primera mentoría Marcos. Oportunidad identificada en Calle Betis.', 'resumen', 0, '2026-02-17'),
  (m5, id_val, 'Onboarding Sofía. Zona identificada: Ruzafa. Miedo explícito: síndrome del impostor.', 'resumen', 0, '2026-02-17'),
  (m6, id_val, 'Excelente inicio Sofía: 8 contactos CRM en 2 semanas, artículo LinkedIn con alcance.', 'resumen', 0, '2026-03-03');

  -- ── Insights stub ─────────────────────────────────────────────

  insert into insights (impulsado_id, meeting_id, categoria, titulo, descripcion, evidencia, confianza, fecha)
  values
  (id_mal, m1, 'miedo_implicito', 'Miedo al rechazo en relaciones de red',
   'Carmen muestra resistencia a contactar a su arquitecto conocido por inseguridad sobre la relación.',
   'Me da un poco de reparo porque no somos tan cercanos', 0.88, '2026-01-24'),
  (id_mal, m1, 'compromiso', 'Llamar al arquitecto antes del viernes',
   'Carmen se compromete a contactar al arquitecto de La Zagaleta en los próximos días.',
   'Llamo al arquitecto antes del viernes', 0.95, '2026-01-24'),
  (id_mal, m2, 'bloqueo', 'Miedo a pedir el mandato por no perder la relación',
   'Después de 6 semanas y dos reuniones, Carmen no ha pedido el mandato por miedo a presionar.',
   'Me da miedo presionar y perder la relación', 0.92, '2026-02-21'),
  (id_mal, m2, 'alerta', 'Sin mandato firmado tras 6 semanas con contacto activo',
   'Señal de alerta: propietario cualificado activo sin mandato. Riesgo de pérdida ante otro agente.',
   'Ya llevas dos reuniones y no tienes un mandato firmado', 0.97, '2026-02-21'),
  (id_mal, m2, 'compromiso', 'Presentar protocolo de discreción y proponer fecha de mandato',
   'Carmen se compromete a llevar el protocolo de venta privada y proponer fecha.',
   'Esta semana le llevo el protocolo de discreción y le propongo una fecha para el mandato', 0.95, '2026-02-21'),
  (id_mal, m3, 'estado_emocional', 'Síndrome del impostor presente pero manejado',
   'Carmen verbaliza inseguridad ante el tamaño de la operación, pero con capacidad de autogestión.',
   '¿Quién soy yo para vender una villa de 2,8 millones?', 0.85, '2026-03-07'),
  (id_mal, m3, 'logro', 'Mandato en proceso de firma el 12 de marzo',
   'Hito clave: propietario de La Zagaleta comprometido con la firma del mandato.',
   'Quedamos en firmar el mandato el 12 de marzo', 0.97, '2026-03-07'),
  (id_sev, m4, 'miedo_explicito', 'Inseguridad sobre ética de contactar propietario con agencia',
   'Marcos no llama al propietario interesante por creer que no es ético.',
   'No sé si es ético llamar', 0.90, '2026-02-17'),
  (id_sev, m4, 'alerta', 'Perfil LinkedIn vacío',
   'LinkedIn sin actividad en 2 meses. Visibilidad nula en el segmento premium digital.',
   'Vi tu LinkedIn. Tienes el perfil vacío desde hace dos meses', 0.95, '2026-02-17'),
  (id_val, m5, 'miedo_explicito', 'Síndrome del impostor ante clientes de lujo',
   'Sofía teme que clientes premium la perciban como agente sin experiencia en el segmento.',
   'Que los clientes de ese segmento me vean como una agente normal, sin experiencia en lujo', 0.92, '2026-02-17'),
  (id_val, m6, 'logro', 'Artículo LinkedIn con alcance orgánico en semana 1',
   'Sofía generó visibilidad publicando análisis de mercado propio. 4 leads entrantes vía LinkedIn.',
   'Publiqué un artículo sobre el mercado inmobiliario de Ruzafa con datos propios. Tuvo bastante alcance', 0.90, '2026-03-03'),
  (id_val, m6, 'miedo_implicito', 'Miedo al fracaso si no encuentra comprador al precio',
   'Sofía evita proponer el mandato por temor a no poder cumplir las expectativas de precio.',
   'Si luego no encuentro comprador a ese precio me sentiré mal', 0.88, '2026-03-03');

end $$;
