-- actualizarEstatus() leía el correo del vendedor desde usuarios_admin, que ya
-- no es accesible. Esta función lo devuelve solo a quien puede ver la cotización.

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
    and (c.usuario_id = auth.uid() or es_admin_o_gerente());
$$;

revoke all on function public.email_vendedor(text) from public, anon;
grant execute on function public.email_vendedor(text) to authenticated;
