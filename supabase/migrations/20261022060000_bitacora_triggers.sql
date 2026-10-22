-- La bitácora se escribe desde la base con triggers en cotizaciones, ya no desde
-- el navegador (donde se podía omitir o falsificar). Mismas acciones que muestra
-- Bitacora.jsx: CREÓ, EDITÓ, ELIMINÓ, APROBÓ, RECHAZÓ, CAMBIÓ ESTATUS.
-- "ENVIÓ CORREO" lo registra la Edge Function enviar-cotizacion.

create or replace function public.registrar_bitacora_cotizacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  c        cotizaciones := coalesce(new, old);
  v_accion text;
  v_detalle text;
  v_nombre text;
begin
  if tg_op = 'INSERT' then
    v_accion  := 'CREÓ';
    v_detalle := 'Cliente: ' || coalesce(c.cliente_contacto, c.cliente_atencion, '—');

  elsif tg_op = 'DELETE' then
    v_accion  := 'ELIMINÓ';
    v_detalle := 'Cliente: ' || coalesce(c.cliente_contacto, '—');

  elsif new.estatus is distinct from old.estatus then
    v_accion := case new.estatus
      when 'Aprobada'  then 'APROBÓ'
      when 'Rechazada' then 'RECHAZÓ'
      else 'CAMBIÓ ESTATUS'
    end;
    v_detalle := coalesce(old.estatus, 'En revisión') || ' → ' || coalesce(new.estatus, 'En revisión')
      || coalesce(' · ' || nullif(new.notas_seguimiento, ''), '');

  else
    v_accion  := 'EDITÓ';
    v_detalle := 'Cliente: ' || coalesce(c.cliente_contacto, c.cliente_atencion, '—');
  end if;

  select nombre into v_nombre from perfiles where id = auth.uid();

  -- Un error al registrar nunca debe impedir la operación sobre la cotización
  begin
    insert into bitacora (usuario_id, nombre_usuario, accion, folio, detalle, sucursal)
    values (auth.uid(), coalesce(v_nombre, 'Sistema'), v_accion, c.folio, v_detalle, c.sucursal_tipo);
  exception when others then
    raise warning 'No se pudo registrar en bitácora: %', sqlerrm;
  end;

  return null;
end;
$$;

drop trigger if exists registrar_bitacora on public.cotizaciones;
create trigger registrar_bitacora
  after insert or update or delete on public.cotizaciones
  for each row execute function public.registrar_bitacora_cotizacion();

-- El navegador ya no escribe en la bitácora
drop policy if exists "cualquier usuario puede insertar" on public.bitacora;
revoke insert, update, delete on public.bitacora from anon, authenticated;
