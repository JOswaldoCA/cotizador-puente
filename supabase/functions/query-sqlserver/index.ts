import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Connection, Request as SqlRequest } from 'npm:tedious@16'
import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Cliente con la sesión del usuario que llama: las consultas respetan RLS.
// Devuelve null si no hay una sesión válida (por ejemplo, solo la anon key).
async function usuarioDeRequest(
  req: Request,
): Promise<{ user: User; supabase: SupabaseClient } | null> {
  const authorization = req.headers.get('Authorization')
  if (!authorization) return null

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authorization } } },
  )

  const { data: { user } } = await supabase.auth.getUser()
  return user ? { user, supabase } : null
}

function query(config: any, sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const conn = new Connection({
      server: config.host,
      authentication: {
        type: 'default',
        options: { userName: config.user, password: config.password },
      },
      options: {
        port:                   config.port,
        database:               config.database,
        encrypt:                false,
        trustServerCertificate: true,
        connectTimeout:         30000,
        requestTimeout:         30000,
        tdsVersion:             '7_2',
      },
    })

    conn.on('connect', (err: any) => {
      if (err) {
        console.log('Error al conectar:', err.message)
        conn.close()
        return reject(err)
      }

      const rows: any[] = []

      const req = new SqlRequest(sql, (err: any) => {
        conn.close()
        if (err) {
          console.log('Error en query:', err.message)
          return reject(err)
        }
        resolve(rows)
      })

      req.on('row', (columns: any[]) => {
        const obj: any = {}
        columns.forEach((col: any) => {
          obj[col.metadata.colName] = col.value
        })
        rows.push(obj)
      })

      conn.execSql(req)
    })

    conn.on('error', (err: any) => {
      console.log('Error conexión:', err.message)
      conn.close()
      reject(err)
    })

    conn.connect()
  })
}

const CONSULTAS: Record<string, string> = {
  clientes:  `SELECT TOP 500 nom_comercial, razon_social, e_mail FROM BMSPA.dbo.clientes ORDER BY nom_comercial`,
  servicios: `SELECT TOP 200 nombre, precio_lista FROM BMSPA.dbo.conceptos_servicio ORDER BY nombre`,
  test:      `SELECT TOP 1 DB_NAME() as bd_actual`,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!(await usuarioDeRequest(req))) return json({ error: 'No autenticado' }, 401)

    const { tipo } = await req.json().catch(() => ({}))
    const sql = CONSULTAS[tipo]
    if (!sql) return json({ error: 'Tipo no reconocido' }, 400)

    const config = {
      host:     Deno.env.get('SQL_SERVER_HOST') ?? 'NO_HOST',
      port:     Number(Deno.env.get('SQL_SERVER_PORT') ?? '1433'),
      user:     Deno.env.get('SQL_SERVER_USER') ?? 'NO_USER',
      password: Deno.env.get('SQL_SERVER_PASSWORD') ?? 'NO_PASS',
      database: Deno.env.get('SQL_SERVER_DATABASE') ?? 'BMSPA',
    }

    const data = await query(config, sql)
    return json({ data })

  } catch (e) {
    console.log('Error catch:', e.message)
    return json({ error: e.message }, 500)
  }
})
