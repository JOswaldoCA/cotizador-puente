-- Folio consecutivo por sucursal y año: COT-HMO-2026-0001, COT-HMO-2026-0002, ...
-- Reemplaza el folio aleatorio que se generaba en el navegador.

create table if not exists public.folio_contadores (
  prefijo text    not null,
  anio    integer not null,
  ultimo  integer not null default 0,
  primary key (prefijo, anio)
);

alter table public.folio_contadores enable row level security;
-- Sin políticas: solo se modifica a través de siguiente_folio().

create or replace function public.siguiente_folio(p_sucursal text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefijo text;
  v_anio    integer := extract(year from now() at time zone 'America/Hermosillo');
  v_numero  integer;
  v_folio   text;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  v_prefijo := case p_sucursal
    when 'guaymas' then 'GYM'
    when 'obregon' then 'OBR'
    else 'HMO'
  end;

  loop
    insert into folio_contadores (prefijo, anio, ultimo)
    values (v_prefijo, v_anio, 1)
    on conflict (prefijo, anio)
      do update set ultimo = folio_contadores.ultimo + 1
    returning ultimo into v_numero;

    v_folio := format('COT-%s-%s-%s', v_prefijo, v_anio, lpad(v_numero::text, 4, '0'));

    -- Saltar números que ya usó algún folio aleatorio anterior
    exit when not exists (select 1 from cotizaciones where folio = v_folio);
  end loop;

  return v_folio;
end;
$$;

revoke all on function public.siguiente_folio(text) from public, anon;
grant execute on function public.siguiente_folio(text) to authenticated;

-- Evita folios duplicados. Si falla, ya existen duplicados; revísalos con:
--   select folio, count(*) from cotizaciones group by folio having count(*) > 1;
create unique index if not exists cotizaciones_folio_key on public.cotizaciones (folio);
