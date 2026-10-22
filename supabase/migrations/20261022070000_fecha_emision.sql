-- Fecha de emisión como fecha real, para ordenar, filtrar y calcular vencimientos.
-- La columna "fecha" ("22 DE OCTUBRE DE 2026") se conserva: es la que se muestra
-- en el PDF, el correo y el Excel.

alter table public.cotizaciones
  add column if not exists fecha_emision date
  default (now() at time zone 'America/Hermosillo')::date;

-- Cotizaciones existentes: se interpreta el texto; si no se puede, la fecha de creación.
-- Sin triggers durante el llenado para no registrar un "EDITÓ" por cada cotización.
set session_replication_role = replica;

update public.cotizaciones c
set fecha_emision = coalesce(
  (
    select make_date(
      split_part(t.f, ' de ', 3)::int,
      array_position(
        array['enero','febrero','marzo','abril','mayo','junio','julio',
              'agosto','septiembre','octubre','noviembre','diciembre'],
        split_part(t.f, ' de ', 2)
      ),
      split_part(t.f, ' de ', 1)::int
    )
    from (select lower(trim(c.fecha)) as f) t
    where t.f ~ '^\d{1,2} de [a-z]+ de \d{4}$'
      and array_position(
        array['enero','febrero','marzo','abril','mayo','junio','julio',
              'agosto','septiembre','octubre','noviembre','diciembre'],
        split_part(t.f, ' de ', 2)
      ) is not null
  ),
  (c.created_at at time zone 'America/Hermosillo')::date
);

set session_replication_role = default;

alter table public.cotizaciones alter column fecha_emision set not null;

create index if not exists cotizaciones_fecha_emision_idx on public.cotizaciones (fecha_emision);

-- Para revisar: cotizaciones cuyo texto no se pudo interpretar y tomaron la fecha de creación
--   select folio, fecha, fecha_emision, created_at from cotizaciones
--   where lower(trim(fecha)) !~ '^\d{1,2} de [a-z]+ de \d{4}$';
