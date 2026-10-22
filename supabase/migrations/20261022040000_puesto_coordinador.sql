-- Nuevo puesto "coordinador": ve y edita las cotizaciones de todas las sucursales
-- y las aprueba o rechaza, pero no las elimina.
-- Solo admin, gerente y coordinador pueden cambiar el estatus de una cotización;
-- el vendedor ya no puede aprobar ni rechazar las suyas.

-- ── Helper: admin, gerente o coordinador ─────────────────────────
create or replace function public.es_supervisor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from perfiles
    where id = auth.uid()
      and (rol = 'admin' or puesto in ('gerente', 'coordinador'))
  );
$$;

revoke all on function public.es_supervisor() from public, anon;
grant execute on function public.es_supervisor() to authenticated;

-- ── cotizaciones: ver y editar incluye al coordinador; eliminar no
drop policy if exists "ver cotizaciones" on public.cotizaciones;
drop policy if exists "actualizar cotizaciones" on public.cotizaciones;

create policy "ver cotizaciones" on public.cotizaciones
  for select to authenticated
  using (usuario_id = auth.uid() or es_supervisor());

create policy "actualizar cotizaciones" on public.cotizaciones
  for update to authenticated
  using (usuario_id = auth.uid() or es_supervisor());

-- "eliminar cotizaciones" se queda con es_admin_o_gerente()

-- ── Solo supervisores cambian el estatus ─────────────────────────
create or replace function public.proteger_estatus_cotizacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if es_supervisor() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.estatus is not null and new.estatus <> 'En revisión' then
      new.estatus := 'En revisión';
    end if;
  elsif new.estatus is distinct from old.estatus then
    raise exception 'Solo un coordinador, gerente o administrador puede cambiar el estatus';
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_estatus_cotizacion on public.cotizaciones;
create trigger proteger_estatus_cotizacion
  before insert or update on public.cotizaciones
  for each row execute function public.proteger_estatus_cotizacion();

-- ── cotizacion_seguimiento: solo supervisores registran cambios de estatus
drop policy if exists "insertar seguimiento" on public.cotizacion_seguimiento;
create policy "insertar seguimiento" on public.cotizacion_seguimiento
  for insert to authenticated
  with check (usuario_id = auth.uid() and es_supervisor());

drop policy if exists "ver seguimiento" on public.cotizacion_seguimiento;
create policy "ver seguimiento" on public.cotizacion_seguimiento
  for select to authenticated
  using (
    usuario_id = auth.uid()
    or es_supervisor()
    or cotizacion_id in (select id from cotizaciones where usuario_id = auth.uid())
  );

-- ── email_vendedor: el coordinador también notifica al vendedor ──
create or replace function public.email_vendedor(p_folio text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from cotizaciones c
  join usuarios_admin u on u.id = c.usuario_id
  where c.folio = p_folio
    and (c.usuario_id = auth.uid() or es_supervisor());
$$;
