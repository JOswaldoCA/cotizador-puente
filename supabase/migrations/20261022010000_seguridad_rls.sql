-- Cierra accesos que hoy están abiertos sin sesión y evita que un usuario se haga admin.

-- ── Helper: ¿el usuario actual es admin? ─────────────────────────
-- security definer para no depender de las políticas de perfiles.
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'admin');
$$;

revoke all on function public.es_admin() from public, anon;
grant execute on function public.es_admin() to authenticated;

-- ── 1. cotizacion_opciones: tenía RLS apagado ────────────────────
-- Una opción es visible/editable si su cotización lo es (dueño o admin,
-- según las políticas de cotizaciones). Cubre crear, editar y borrar.
drop policy if exists "Usuario inserta opciones" on public.cotizacion_opciones;
drop policy if exists "Ver opciones" on public.cotizacion_opciones;

create policy "opciones siguen a su cotizacion" on public.cotizacion_opciones
  for all to authenticated
  using (cotizacion_id in (select id from cotizaciones))
  with check (cotizacion_id in (select id from cotizaciones));

alter table public.cotizacion_opciones enable row level security;
revoke all on public.cotizacion_opciones from anon;

-- ── 2. usuarios_admin: vista con correos legible sin sesión ──────
-- Se quita el acceso directo y se expone solo a admins vía función.
revoke all on public.usuarios_admin from anon, authenticated;

create or replace function public.listar_usuarios()
returns setof public.usuarios_admin
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not es_admin() then
    raise exception 'Solo administradores';
  end if;
  return query select * from usuarios_admin;
end;
$$;

revoke all on function public.listar_usuarios() from public, anon;
grant execute on function public.listar_usuarios() to authenticated;

-- ── 3. perfiles: un usuario podía cambiarse su propio rol ────────
-- Solo un admin puede cambiar rol o puesto. Los registros nuevos
-- (incluido el trigger de alta de auth) siempre entran como 'usuario'.
create or replace function public.proteger_rol_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if es_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.rol := 'usuario';
  else
    new.rol    := old.rol;
    new.puesto := old.puesto;
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_rol_perfil on public.perfiles;
create trigger proteger_rol_perfil
  before insert or update on public.perfiles
  for each row execute function public.proteger_rol_perfil();

-- ── 4. notificaciones: se podían insertar sin sesión ─────────────
drop policy if exists "cualquiera puede insertar notificaciones" on public.notificaciones;
create policy "usuarios autenticados insertan notificaciones" on public.notificaciones
  for insert to authenticated
  with check (true);
revoke insert on public.notificaciones from anon;
