import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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

// Los textos de la cotización los escriben los usuarios; se escapan antes de meterlos al HTML.
function esc(valor: unknown): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const MAX_DESTINATARIOS = 10
const MAX_PDF_BASE64    = 10 * 1024 * 1024 // ~7.5 MB de PDF
const EMAIL_RE          = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const sesion = await usuarioDeRequest(req)
    if (!sesion) return json({ error: 'No autenticado' }, 401)

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

    const { folio, email, pdfBase64 } = await req.json()

    const destinatarios = Array.isArray(email) ? email : [email]
    if (
      destinatarios.length === 0 ||
      destinatarios.length > MAX_DESTINATARIOS ||
      !destinatarios.every((e) => typeof e === 'string' && EMAIL_RE.test(e))
    ) {
      return json({ error: `Destinatarios inválidos (máximo ${MAX_DESTINATARIOS})` }, 400)
    }

    if (pdfBase64 && (
      typeof pdfBase64 !== 'string' ||
      pdfBase64.length > MAX_PDF_BASE64 ||
      !pdfBase64.startsWith('JVBERi0') // "%PDF-" en base64
    )) {
      return json({ error: 'El adjunto debe ser un PDF' }, 400)
    }

    // Con la sesión del usuario: solo encuentra cotizaciones que el usuario puede ver
    const { data: cot } = await sesion.supabase
      .from('cotizaciones')
      .select('*, cotizacion_opciones(*)')
      .eq('folio', folio)
      .maybeSingle()

    if (!cot) return json({ error: 'Cotización no encontrada' }, 404)

    const opciones = cot.cotizacion_opciones
      .sort((a: any, b: any) => a.numero - b.numero)

    const opcionesHTML = opciones.map((op: any, i: number) => {
      const servicios = (op.servicios || []).map((srv: any) => `
        <tr>
          <td style="padding:8px 16px;border-bottom:1px solid #E8F5F0;color:#374151">
            ${esc(srv.nombre || '—')}
          </td>
          <td style="padding:8px 16px;border-bottom:1px solid #E8F5F0;color:#374151;text-align:center">
            ${Number(srv.numContenedores) || 0} pza
          </td>
          <td style="padding:8px 16px;border-bottom:1px solid #E8F5F0;color:#374151;text-align:center">
            ${Number(srv.diasSemana) || 0} visita${Number(srv.diasSemana) !== 1 ? 's' : ''}/sem
          </td>
          <td style="padding:8px 16px;border-bottom:1px solid #E8F5F0;text-align:right;color:#374151">
            $${Number((srv.precioUnitario * srv.numContenedores) + (srv.precioDia * srv.diasSemana))
              .toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </td>
        </tr>
      `).join('')

      return `
        <tr>
          <td colspan="4" style="padding:10px 16px;background:#F0F9FF;font-weight:700;color:#0F6E56;font-size:12px;border-bottom:1px solid #E8F5F0">
            OPCIÓN ${i + 1}
          </td>
        </tr>
        ${servicios}
        <tr>
          <td colspan="3" style="padding:8px 16px;text-align:right;font-size:11px;color:#6B7280;border-bottom:1px solid #E8F5F0">
            IVA 16%
          </td>
          <td style="padding:8px 16px;text-align:right;color:#6B7280;border-bottom:1px solid #E8F5F0">
            $${Number(op.iva).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </td>
        </tr>
        <tr style="background:#EEF2FF">
  <td colspan="3" style="padding:10px 16px;text-align:right;font-weight:700;color:#1B3A6B">
    NETO MENSUAL
  </td>
  <td style="padding:10px 16px;text-align:right;font-weight:700;color:#1B3A6B">
    $${Number(op.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
  </td>
</tr>
      `
    }).join('')

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- HEADER -->
        <tr>
          <td style="background:#1B3A6B;border-radius:12px 12px 0 0;padding:28px 32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <img src="https://opsfwaippowqaervbvxe.supabase.co/storage/v1/object/public/assets/logoPA.png"
                    alt="Puente Ambiental" width="200" style="display:block;max-width:200px"/>
                  <p style="color:#93C5FD;margin:8px 0 0;font-size:12px">${esc(cot.sucursal_tipo)} · ${esc(cot.sucursal_ciudad)}</p>
                </td>
                <td align="right" style="vertical-align:top">
                  <div style="background:rgba(255,255,255,0.1);border-radius:8px;padding:8px 14px">
                    <p style="color:#E5E7EB;font-size:10px;margin:0;text-transform:uppercase;letter-spacing:1px">Folio</p>
                    <p style="color:#FFD700;font-size:14px;font-weight:700;margin:2px 0 0;font-family:monospace">${esc(cot.folio)}</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- INTRO -->
        <tr>
          <td style="background:#ffffff;padding:32px 32px 0">
            <h1 style="font-size:22px;color:#1B3A6B;margin:0 0 8px;font-weight:700">Cotización de servicio</h1>
            <p style="font-size:14px;color:#6B7280;margin:0 0 24px;line-height:1.6">
              Estimado(a) <strong style="color:#111827">${esc(cot.cliente_contacto || cot.cliente_atencion || 'cliente')}</strong>,<br>
              Nos complace presentarle la siguiente propuesta económica para el servicio de recolección y transporte de residuos sólidos urbanos.
            </p>
            <div style="background:#F0FDF4;border-left:4px solid #1D9E75;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:24px">
              <p style="margin:0;font-size:12px;color:#065F46">
                📅 Fecha: <strong>${esc(cot.fecha)}</strong> &nbsp;·&nbsp; ⏳ Vigencia: <strong>${esc(cot.cliente_vigencia)}</strong>
              </p>
            </div>
          </td>
        </tr>

        <!-- TABLA OPCIONES -->
        <tr>
          <td style="background:#ffffff;padding:0 32px">
            <p style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">
              Propuesta económica
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden">
              <thead>
                <tr style="background:#1B3A6B">
                  <th style="padding:12px 16px;text-align:left;font-size:11px;color:#FFD700;font-weight:600;text-transform:uppercase">Servicio</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;color:#E5E7EB;font-weight:600;text-transform:uppercase">Contenedores</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;color:#E5E7EB;font-weight:600;text-transform:uppercase">Visitas/sem</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;color:#FFD700;font-weight:600;text-transform:uppercase">Total</th>
                </tr>
              </thead>
              <tbody>${opcionesHTML}</tbody>
            </table>
          </td>
        </tr>

        <!-- OBSERVACIONES -->
        ${cot.cliente_notas ? `
        <tr>
          <td style="background:#ffffff;padding:20px 32px 0">
            <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:14px 16px">
              <p style="font-size:11px;font-weight:700;color:#92400E;margin:0 0 4px;text-transform:uppercase">📝 Observaciones</p>
              <p style="font-size:13px;color:#78350F;margin:0;line-height:1.6">${esc(cot.cliente_notas)}</p>
            </div>
          </td>
        </tr>` : ''}

        <!-- BASES -->
<tr>
  <td style="background:#ffffff;padding:20px 32px 0">
    <div style="background:#F9FAFB;border-radius:8px;padding:16px">
      <p style="font-size:11px;font-weight:700;color:#6B7280;margin:0 0 8px;text-transform:uppercase">Bases de la cotización</p>
      <ul style="margin:0;padding-left:16px;font-size:11px;color:#6B7280;line-height:1.8">
        <li>Precios más IVA del 16%</li>
        <li>Recolección, transporte y disposición final correcta</li>
        <li>Manifiesto de disposición</li>
        <li>Permiso ambiental para la recolección RSU y Recolección especial</li>
        <li>Personal capacitado, IMSS</li>
        <li>Cualquier concepto no incluido en esta cotización no estará incluido en el precio</li>
        <li>Precio por cada servicio solicitado</li>
        <li>Propuesta del servicio grupal (RSU y Recolección especial) y servicio de Trampa de grasa. En caso de requerir manifiesto para procesos lleva un costo adicional por tonelada.</li>
        ${(cot.bases_extra || []).map((b: string) => `<li>${esc(b)}</li>`).join('')}
      </ul>
    </div>
  </td>
</tr>

        <!-- ADJUNTO -->
        <tr>
          <td style="background:#ffffff;padding:20px 32px 32px">
            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:14px 16px;text-align:center">
              <p style="font-size:13px;color:#1E40AF;margin:0">📎 Se adjunta el PDF de la cotización para su revisión e impresión.</p>
            </div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#1B3A6B;border-radius:0 0 12px 12px;padding:24px 32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="color:#FFD700;font-weight:700;font-size:13px;margin:0 0 4px">Puente Ambiental del Noroeste S.A de C.V</p>
                  <p style="color:#93C5FD;font-size:11px;margin:0;line-height:1.6">
                    ${esc(cot.sucursal_direccion)}<br>${esc(cot.sucursal_ciudad)} · ${esc(cot.sucursal_cp)}
                  </p>
                </td>
                <td align="right" style="vertical-align:top">
                  <p style="color:#6B7280;font-size:10px;margin:0">${esc(cot.sucursal_tipo)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:16px;text-align:center">
            <p style="font-size:10px;color:#9CA3AF;margin:0">Este correo fue enviado desde el sistema de cotizaciones de Puente Ambiental del Noroeste.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

    const payload: any = {
      from:    'cotizaciones@puenteambiental.com.mx',
      to:      destinatarios,
      subject: `Cotización ${cot.folio} — Puente Ambiental del Noroeste`,
      html,
    }

    if (pdfBase64) {
      payload.attachments = [{
        filename: `Cotizacion-${cot.folio}.pdf`,
        content:  pdfBase64,
        encoding: 'base64',
      }]
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      console.log('Resend error:', JSON.stringify(resendData))
      return json({ error: resendData }, 500)
    }

    console.log(`Enviada ${cot.folio} por ${sesion.user.id} a ${destinatarios.length} destinatario(s)`)
    return json({ ok: true })

  } catch (e) {
    console.log('Error catch:', e.message)
    return json({ error: e.message }, 500)
  }
})
