-- ================================================================
-- 002_rls.sql  —  Row Level Security
-- Roles: admin (ve todo), mentor (sus impulsados), viewer (lectura)
-- ================================================================

alter table impulsados_cache      enable row level security;
alter table meetings              enable row level security;
alter table entregables           enable row level security;
alter table chunks                enable row level security;
alter table insights              enable row level security;
alter table kcd_mensuales         enable row level security;
alter table informes              enable row level security;
alter table programa_etapas       enable row level security;
alter table user_roles            enable row level security;

-- ── Helper: obtener rol del usuario actual ────────────────────────

create or replace function get_user_rol()
returns rol_usuario language sql security definer stable as $$
  select rol from user_roles where user_id = auth.uid();
$$;

-- ── programa_etapas: lectura pública para autenticados ────────────

create policy "Autenticados leen etapas"
  on programa_etapas for select
  using (auth.uid() is not null);

-- ── impulsados_cache ──────────────────────────────────────────────

create policy "Admin ve todos los impulsados"
  on impulsados_cache for select
  using (get_user_rol() = 'admin');

create policy "Mentor ve sus impulsados"
  on impulsados_cache for select
  using (
    get_user_rol() = 'mentor'
    and (
      mentor_principal = (select email from auth.users where id = auth.uid())
      or (select email from auth.users where id = auth.uid()) = any(responsables)
    )
  );

create policy "Viewer lectura impulsados"
  on impulsados_cache for select
  using (get_user_rol() = 'viewer');

create policy "Admin gestiona impulsados"
  on impulsados_cache for all
  using (get_user_rol() = 'admin');

-- ── meetings ──────────────────────────────────────────────────────

create policy "Admin ve todos los meetings"
  on meetings for select
  using (get_user_rol() = 'admin');

create policy "Mentor ve meetings de sus impulsados"
  on meetings for select
  using (
    get_user_rol() = 'mentor'
    and exists (
      select 1 from impulsados_cache ic
      where ic.id = impulsado_id
      and (
        ic.mentor_principal = (select email from auth.users where id = auth.uid())
        or (select email from auth.users where id = auth.uid()) = any(ic.responsables)
      )
    )
  );

create policy "Viewer lectura meetings"
  on meetings for select
  using (get_user_rol() = 'viewer');

create policy "Admin y mentor crean meetings"
  on meetings for insert
  with check (get_user_rol() in ('admin', 'mentor'));

create policy "Admin y mentor modifican meetings"
  on meetings for update
  using (get_user_rol() in ('admin', 'mentor'));

-- ── Políticas simétricas para chunks, insights, entregables, kcd, informes ──

-- chunks
create policy "Lectura chunks" on chunks for select using (auth.uid() is not null);
create policy "Admin escribe chunks" on chunks for all using (get_user_rol() = 'admin');
create policy "Mentor escribe chunks" on chunks for insert
  with check (get_user_rol() in ('admin', 'mentor'));

-- insights
create policy "Lectura insights" on insights for select using (auth.uid() is not null);
create policy "Admin escribe insights" on insights for all using (get_user_rol() = 'admin');
create policy "Mentor escribe insights" on insights for insert
  with check (get_user_rol() in ('admin', 'mentor'));

-- entregables
create policy "Lectura entregables" on entregables for select using (auth.uid() is not null);
create policy "Admin gestiona entregables" on entregables for all using (get_user_rol() = 'admin');

-- kcd_mensuales
create policy "Lectura KCD" on kcd_mensuales for select using (auth.uid() is not null);
create policy "Admin gestiona KCD" on kcd_mensuales for all using (get_user_rol() = 'admin');

-- informes
create policy "Lectura informes" on informes for select using (auth.uid() is not null);
create policy "Admin gestiona informes" on informes for all using (get_user_rol() = 'admin');

-- user_roles: solo admin
create policy "Admin gestiona roles" on user_roles for all using (get_user_rol() = 'admin');
create policy "Usuario ve su propio rol" on user_roles for select
  using (user_id = auth.uid());

-- ── Service role bypass (para API routes del backend) ─────────────
-- Las API routes usan SUPABASE_SERVICE_ROLE_KEY y bypassean RLS automáticamente.
