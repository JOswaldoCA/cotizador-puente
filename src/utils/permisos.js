// Mismas reglas que las políticas RLS en supabase/migrations

const esAdmin = (perfil) => perfil?.rol === 'admin'

// Admin, gerente o coordinador: ven y editan todas las cotizaciones y cambian su estatus
export const esSupervisor = (perfil) =>
  esAdmin(perfil) || ['gerente', 'coordinador'].includes(perfil?.puesto)

export const puedeEditar = (perfil, cot) =>
  esSupervisor(perfil) || cot?.usuario_id === perfil?.id

export const puedeEliminar = (perfil, cot) =>
  esAdmin(perfil) || perfil?.puesto === 'gerente' || cot?.usuario_id === perfil?.id

export const puedeCambiarEstatus = (perfil) => esSupervisor(perfil)
