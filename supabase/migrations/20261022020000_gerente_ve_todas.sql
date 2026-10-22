-- El gerente tiene los mismos permisos que el admin sobre cotizaciones
-- (ver, editar, eliminar y ver seguimiento), igual que en Cotizaciones.jsx.
-- Requiere 20261022010000_seguridad_rls.sql: su trigger impide que un
-- usuario se asigne puesto = 'gerente' por su cuenta.

create or replace function public.es_admin_o_gerente()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from perfiles
    where id = auth.uid() and (rol = 'admin' or puesto = 'gerente')
  );
$$;

revoke all on function public.es_admin_o_gerente() from public, anon;
grant execute on function public.es_admin_o_gerente() to authenticated;

-- ── cotizaciones (se reemplazan también las dos políticas de lectura duplicadas)
drop policy if exists "Ver cotizaciones" on public.cotizaciones;
drop policy if exists "ver cotizaciones" on public.cotizaciones;
drop policy if exists "actualizar propia cotizacion" on public.cotizaciones;
drop policy if exists "Eliminar cotizaciones" on public.cotizaciones;

create policy "ver cotizaciones" on public.cotizaciones
  for select to authenticated
  using (usuario_id = auth.uid() or es_admin_o_gerente());

create policy "actualizar cotizaciones" on public.cotizaciones
  for update to authenticated
  using (usuario_id = auth.uid() or es_admin_o_gerente());

create policy "eliminar cotizaciones" on public.cotizaciones
  for delete to authenticated
  using (usuario_id = auth.uid() or es_admin_o_gerente());

-- cotizacion_opciones ya sigue la visibilidad de su cotización, no requiere cambios.

-- ── cotizacion_seguimiento
drop policy if exists "ver propio seguimiento" on public.cotizacion_seguimiento;

create policy "ver seguimiento" on public.cotizacion_seguimiento
  for select to authenticated
  using (
    usuario_id = auth.uid()
    or es_admin_o_gerente()
    or cotizacion_id in (select id from cotizaciones where usuario_id = auth.uid())
  );
