import { supabase } from './supabase'

async function llamar(tipo) {
  const { data, error } = await supabase.functions.invoke('query-sqlserver', {
    body: { tipo },
  })
  if (error) throw error
  return data.data
}

export const obtenerClientes  = () => llamar('clientes')
export const obtenerServicios = () => llamar('servicios')