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

// Los textos los escriben los usuarios; se escapan antes de meterlos al HTML.
function esc(valor: unknown): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const sesion = await usuarioDeRequest(req)
    if (!sesion) return json({ error: 'No autenticado' }, 401)

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

    // Solo se recibe el folio: destinatario, estatus, nota y autor salen de la base.
    const { folio } = await req.json()

    const { data: cot } = await sesion.supabase
      .from('cotizaciones')
      .select('folio, estatus, notas_seguimiento, cliente_contacto, usuario_id')
      .eq('folio', folio)
      .maybeSingle()

    if (!cot) return json({ error: 'Cotización no encontrada' }, 404)

    // No se notifica al vendedor de sus propios cambios
    if (cot.usuario_id === sesion.user.id) return json({ ok: true, enviado: false })

    const { data: email } = await sesion.supabase.rpc('email_vendedor', { p_folio: cot.folio })
    if (!email) return json({ ok: true, enviado: false })

    const { data: autor } = await sesion.supabase
      .from('perfiles')
      .select('nombre')
      .eq('id', sesion.user.id)
      .maybeSingle()

    const estatus = cot.estatus || 'En revisión'
    const nota    = cot.notas_seguimiento
    const cliente = cot.cliente_contacto
    const admin   = autor?.nombre || 'Administrador'

    const icono      = estatus === 'Aprobada' ? '✅' : estatus === 'Rechazada' ? '❌' : '🔄'
    const colorEstatus = estatus === 'Aprobada' ? '#065F46' : estatus === 'Rechazada' ? '#991B1B' : '#92400E'
    const bgEstatus    = estatus === 'Aprobada' ? '#ECFDF5' : estatus === 'Rechazada' ? '#FFF5F5' : '#FFFBEB'
    const borderEstatus = estatus === 'Aprobada' ? '#A7F3D0' : estatus === 'Rechazada' ? '#FECACA' : '#FDE68A'

    const html = `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:32px 16px">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

      <!-- HEADER -->
      <tr>
        <td bgcolor="#1B3A6B" style="border-radius:12px 12px 0 0;padding:28px 32px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle">
                <img src="https://opsfwaippowqaervbvxe.supabase.co/storage/v1/object/public/assets/logoPA.png"
                  alt="Puente Ambiental del Noroeste" width="180" height="60" border="0"
                  style="display:block;max-width:180px;height:auto"/>
              </td>
              <td align="right" style="vertical-align:middle">
                <p style="color:#FFD700;font-size:12px;font-weight:700;margin:0;font-family:Arial,sans-serif;white-space:nowrap">Puente Ambiental del Noroeste S.A de C.V</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td bgcolor="#ffffff" style="padding:40px 32px;text-align:center">

          <!-- Icono estatus -->
          <p style="font-size:48px;margin:0 0 16px;font-family:Arial,sans-serif">${icono}</p>

          <!-- Título -->
          <h1 style="font-size:22px;color:#1B3A6B;margin:0 0 8px;font-weight:700;font-family:Arial,sans-serif">
            Actualización de cotización
          </h1>
          <p style="font-size:14px;color:#6B7280;margin:0 0 28px;line-height:1.6;font-family:Arial,sans-serif">
            Una de tus cotizaciones ha cambiado de estatus.
          </p>

          <!-- Card info cotización -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
            <tr>
              <td bgcolor="#F8FAFF" style="border:1px solid #E0E7FF;border-radius:12px;padding:20px 24px;text-align:left">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:12px;border-bottom:1px solid #E5E7EB">
                      <p style="font-size:11px;color:#6B7280;margin:0 0 4px;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:1px">Folio</p>
                      <p style="font-size:16px;color:#1B3A6B;margin:0;font-weight:700;font-family:monospace">${esc(cot.folio)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:12px;padding-bottom:12px;border-bottom:1px solid #E5E7EB">
                      <p style="font-size:11px;color:#6B7280;margin:0 0 4px;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:1px">Cliente</p>
                      <p style="font-size:14px;color:#111827;margin:0;font-weight:600;font-family:Arial,sans-serif">${esc(cliente || '—')}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:12px">
                      <p style="font-size:11px;color:#6B7280;margin:0 0 8px;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:1px">Nuevo estatus</p>
                      <span style="display:inline-block;background:${bgEstatus};border:1px solid ${borderEstatus};border-radius:8px;padding:6px 16px;font-size:14px;font-weight:700;color:${colorEstatus};font-family:Arial,sans-serif">
                        ${icono} ${esc(estatus)}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Nota si existe -->
          ${nota ? `
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
            <tr>
              <td bgcolor="#FFFBEB" style="border:1px solid #FDE68A;border-left:4px solid #FFD700;border-radius:8px;padding:14px 16px;text-align:left">
                <p style="font-size:11px;font-weight:700;color:#92400E;margin:0 0 4px;font-family:Arial,sans-serif;text-transform:uppercase">
                  📝 Nota de seguimiento
                </p>
                <p style="font-size:13px;color:#78350F;margin:0;line-height:1.6;font-family:Arial,sans-serif">${esc(nota)}</p>
              </td>
            </tr>
          </table>
          ` : ''}

          <!-- Info admin -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
            <tr>
              <td bgcolor="#F0F4F8" style="border-radius:8px;padding:14px 16px;text-align:center">
                <p style="font-size:12px;color:#6B7280;margin:0;font-family:Arial,sans-serif">
                  Cambio realizado por <strong style="color:#1B3A6B">${esc(admin)}</strong>
                </p>
              </td>
            </tr>
          </table>

          <!-- Botón ver cotización -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto">
            <tr>
              <td align="center">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
                  xmlns:w="urn:schemas-microsoft-com:office:word"
                  href="https://cotizador-puente.puenteambiental.com.mx/cotizaciones"
                  style="height:50px;v-text-anchor:middle;width:220px;"
                  arcsize="20%"
                  fillcolor="#1B3A6B"
                  strokecolor="#1B3A6B">
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;">
                    Ver historial &rarr;
                  </center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="https://cotizador-puente.puenteambiental.com.mx/cotizaciones"
                  style="background-color:#1B3A6B;border-radius:10px;color:#ffffff;display:inline-block;font-family:Arial,sans-serif;font-size:14px;font-weight:700;padding:14px 36px;text-decoration:none;">
                  Ver historial &rarr;
                </a>
                <!--<![endif]-->
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td bgcolor="#1B3A6B" style="border-radius:0 0 12px 12px;padding:24px 32px;text-align:center">
          <p style="color:#FFD700;font-weight:700;font-size:13px;margin:0 0 4px;font-family:Arial,sans-serif">
            Puente Ambiental del Noroeste S.A de C.V
          </p>
          <p style="color:#93C5FD;font-size:11px;margin:0;font-family:Arial,sans-serif">
            Sistema de Cotizaciones &middot; Hermosillo, Sonora
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding:16px;text-align:center">
          <p style="font-size:10px;color:#9CA3AF;margin:0;font-family:Arial,sans-serif">
            Este correo fue enviado autom&aacute;ticamente desde el sistema de cotizaciones.<br>
            Por favor no respondas a este mensaje.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>`

    const payload = {
      from:    'cotizaciones@puenteambiental.com.mx',
      to:      email,
      subject: `${icono} Cotización ${cot.folio} — ${estatus}`,
      html,
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

    return json({ ok: true, enviado: true })

  } catch (e) {
    console.log('Error:', e.message)
    return json({ error: e.message }, 500)
  }
})
