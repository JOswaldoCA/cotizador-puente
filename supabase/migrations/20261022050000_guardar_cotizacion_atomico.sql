-- Crear y editar una cotización en una sola transacción: si falla cualquier
-- paso, no se guarda nada. Antes se hacía en varias llamadas desde el
-- navegador y una falla a la mitad dejaba la cotización sin opciones.
--
-- Son security invoker: corren con los permisos del usuario, así que las
-- políticas RLS y los triggers de cotizaciones siguen aplicando.
--
-- p_datos:    columnas de cotizaciones (sucursal_*, cliente_*, bases_extra, fecha)
-- p_opciones: arreglo de { numero, servicios, subtotal, iva, total }

create or replace function public.guardar_cotizacion(p_datos jsonb, p_opciones jsonb)
returns public.cotizaciones
language plpgsql
set search_path = public
as $$
declare
  d   cotizaciones := jsonb_populate_record(null::cotizaciones, p_datos);
  cot cotizaciones;
begin
  insert into cotizaciones (
    folio, fecha, usuario_id,
    sucursal_id, sucursal_tipo, sucursal_nombre, sucursal_direccion, sucursal_ciudad, sucursal_cp,
    cliente_atencion, cliente_contacto, cliente_vigencia, cliente_pago, cliente_email, cliente_notas,
    bases_extra
  ) values (
    siguiente_folio(d.sucursal_id), d.fecha, auth.uid(),
    d.sucursal_id, d.sucursal_tipo, d.sucursal_nombre, d.sucursal_direccion, d.sucursal_ciudad, d.sucursal_cp,
    d.cliente_atencion, d.cliente_contacto, d.cliente_vigencia, d.cliente_pago, d.cliente_email, d.cliente_notas,
    d.bases_extra
  )
  returning * into cot;

  insert into cotizacion_opciones (cotizacion_id, numero, servicios, subtotal, iva, total)
  select cot.id, o.numero, o.servicios, o.subtotal, o.iva, o.total
  from jsonb_populate_recordset(null::cotizacion_opciones, p_opciones) o;

  return cot;
end;
$$;

create or replace function public.actualizar_cotizacion(p_folio text, p_datos jsonb, p_opciones jsonb)
returns void
language plpgsql
set search_path = public
as $$
declare
  d    cotizaciones := jsonb_populate_record(null::cotizaciones, p_datos);
  v_id cotizaciones.id%type;
begin
  update cotizaciones set
    sucursal_id        = d.sucursal_id,
    sucursal_tipo      = d.sucursal_tipo,
    sucursal_nombre    = d.sucursal_nombre,
    sucursal_direccion = d.sucursal_direccion,
    sucursal_ciudad    = d.sucursal_ciudad,
    sucursal_cp        = d.sucursal_cp,
    cliente_atencion   = d.cliente_atencion,
    cliente_contacto   = d.cliente_contacto,
    cliente_vigencia   = d.cliente_vigencia,
    cliente_pago       = d.cliente_pago,
    cliente_email      = d.cliente_email,
    cliente_notas      = d.cliente_notas,
    bases_extra        = d.bases_extra
  where folio = p_folio
  returning id into v_id;

  -- Sin fila: no existe o RLS no deja editarla
  if v_id is null then
    raise exception 'Cotización no encontrada';
  end if;

  delete from cotizacion_opciones where cotizacion_id = v_id;

  insert into cotizacion_opciones (cotizacion_id, numero, servicios, subtotal, iva, total)
  select v_id, o.numero, o.servicios, o.subtotal, o.iva, o.total
  from jsonb_populate_recordset(null::cotizacion_opciones, p_opciones) o;
end;
$$;

revoke all on function public.guardar_cotizacion(jsonb, jsonb) from public, anon;
revoke all on function public.actualizar_cotizacion(text, jsonb, jsonb) from public, anon;
grant execute on function public.guardar_cotizacion(jsonb, jsonb) to authenticated;
grant execute on function public.actualizar_cotizacion(text, jsonb, jsonb) to authenticated;
