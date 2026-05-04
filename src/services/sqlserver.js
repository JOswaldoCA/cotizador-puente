const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY

async function llamar(tipo) {
  const body = JSON.stringify({ tipo })
  console.log('Enviando body:', body)

  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/query-sqlserver`,
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body,
    }
  )

  const text = await res.text()
  console.log('Respuesta raw:', text)

  const data = JSON.parse(text)
  if (!res.ok) throw new Error(data.error)
  return data.data
}

export const obtenerClientes  = () => llamar('clientes')
export const obtenerServicios = () => llamar('servicios')