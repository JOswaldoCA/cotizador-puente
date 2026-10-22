import { supabase } from "./supabase";
import { esSupervisor } from "../utils/permisos";
import { generarPDFBase64 } from "../utils/generarPDF";

// ── Columnas y opciones en el formato de guardar_cotizacion / actualizar_cotizacion
function datosCotizacion(cot) {
  return {
    sucursal_id: cot.sucursal.id,
    sucursal_tipo: cot.sucursal.tipo,
    sucursal_nombre: cot.sucursal.nombre,
    sucursal_direccion: cot.sucursal.direccion,
    sucursal_ciudad: cot.sucursal.ciudad,
    sucursal_cp: cot.sucursal.cp,
    cliente_atencion: cot.cliente.atencion,
    cliente_contacto: cot.cliente.contacto,
    cliente_vigencia: cot.cliente.vigencia,
    cliente_pago: cot.cliente.pago,
    cliente_email: cot.cliente.email,
    cliente_notas: cot.cliente.notas,
    bases_extra: cot.basesExtra || [],
  };
}

function opcionesCotizacion(cot) {
  return cot.opciones.map((op, i) => ({
    numero: i + 1,
    servicios: op.servicios,
    subtotal: op.subtotal,
    iva: op.iva,
    total: op.total,
  }));
}

// ── guardarCotizacion ────────────────────────────────────────────
// Una sola transacción en la base; el folio lo asigna siguiente_folio()
export async function guardarCotizacion(cot) {
  const { data, error } = await supabase.rpc("guardar_cotizacion", {
    p_datos: { ...datosCotizacion(cot), fecha: cot.fecha },
    p_opciones: opcionesCotizacion(cot),
  });

  if (error) throw error;
  return data;
}

// ── Fila de la base → objeto que usan las pantallas ─────────────
const mapearCotizacion = (c) => ({
  id:                c.id,
  folio:             c.folio,
  fecha:             c.fecha,
  fechaEmision:      c.fecha_emision,
  estatus:           c.estatus || 'En revisión',
  notas_seguimiento: c.notas_seguimiento || '',
  usuario_id:        c.usuario_id,
  basesExtra:        c.bases_extra || [],
  sucursal: {
    id:        c.sucursal_id,
    tipo:      c.sucursal_tipo,
    nombre:    c.sucursal_nombre,
    direccion: c.sucursal_direccion,
    ciudad:    c.sucursal_ciudad,
    cp:        c.sucursal_cp,
  },
  cliente: {
    atencion: c.cliente_atencion,
    contacto: c.cliente_contacto,
    vigencia: c.cliente_vigencia,
    pago:     c.cliente_pago,
    email:    c.cliente_email,
    notas:    c.cliente_notas,
  },
  opciones: c.cotizacion_opciones
    .sort((a, b) => a.numero - b.numero)
    .map(op => ({
      servicios: op.servicios || [],
      subtotal:  op.subtotal,
      iva:       op.iva,
      total:     op.total,
    })),
})

// ── obtenerCotizaciones ──────────────────────────────────────────
export async function obtenerCotizaciones() {
  const { data: { user } } = await supabase.auth.getUser()
  
  // Obtener perfil para saber rol y puesto
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, puesto')
    .eq('id', user.id)
    .single()

  // Admin, gerente o coordinador ven todas

  let query = supabase
    .from('cotizaciones')
    .select('*, cotizacion_opciones(*)')
    .order('created_at', { ascending: false })

  // Los demás solo ven las suyas
  if (!esSupervisor(perfil)) {
    query = query.eq('usuario_id', user.id)
  }

  const { data, error } = await query
  if (error) throw error

  return data.map(mapearCotizacion)
}

// ── eliminarCotizacion ───────────────────────────────────────────
// La bitácora la registran triggers en la base
export async function eliminarCotizacion(folio) {
  const { error } = await supabase
    .from("cotizaciones")
    .delete()
    .eq("folio", folio);

  if (error) throw error;

}

// ── obtenerCotizacion ────────────────────────────────────────────
export async function obtenerCotizacion(folio) {
  const { data, error } = await supabase
    .from("cotizaciones")
    .select("*, cotizacion_opciones(*)")
    .eq("folio", folio)
    .maybeSingle();

  if (error) throw error;
  return data ? mapearCotizacion(data) : null;
}

// ── actualizarCotizacion ─────────────────────────────────────────
// Una sola transacción: si algo falla, la cotización queda como estaba
export async function actualizarCotizacion(cot) {
  const { error } = await supabase.rpc("actualizar_cotizacion", {
    p_folio: cot.folio,
    p_datos: datosCotizacion(cot),
    p_opciones: opcionesCotizacion(cot),
  });

  if (error) throw error;

}

// ── actualizarEstatus ────────────────────────────────────────────
export async function actualizarEstatus(folio, estatusNuevo, nota, perfil) {
  const { data: cot, error: errorGet } = await supabase
    .from("cotizaciones")
    .select("id, estatus, sucursal_tipo, usuario_id, cliente_contacto")
    .eq("folio", folio)
    .single();

  if (errorGet) throw errorGet;

  const { error: errorUpdate } = await supabase
    .from("cotizaciones")
    .update({ estatus: estatusNuevo, notas_seguimiento: nota })
    .eq("folio", folio);

  if (errorUpdate) throw errorUpdate;

  const { error: errorHist } = await supabase
    .from("cotizacion_seguimiento")
    .insert({
      cotizacion_id: cot.id,
      usuario_id: perfil.id,
      nombre_usuario: perfil.nombre,
      estatus_anterior: cot.estatus,
      estatus_nuevo: estatusNuevo,
      nota: nota || null,
    });

  if (errorHist) throw errorHist;

  // Notificar al vendedor solo si es distinto al que cambia el estatus
  if (cot.usuario_id && cot.usuario_id !== perfil.id) {
    const icono   = estatusNuevo === 'Aprobada' ? '✅' : estatusNuevo === 'Rechazada' ? '❌' : '🔄'
    const titulo  = `${icono} Cotización ${estatusNuevo.toLowerCase()}`
    const mensaje = `La cotización ${folio} de ${cot.cliente_contacto || 'cliente'} fue marcada como "${estatusNuevo}" por ${perfil.nombre}.${nota ? ` Nota: ${nota}` : ''}`

    // Notificación en app
    await supabase.from('notificaciones').insert({
      usuario_id: cot.usuario_id,
      titulo,
      mensaje,
      folio,
    })

    // Correo al vendedor: la función obtiene destinatario, estatus y nota de la base
    try {
      const { error: errorCorreo } = await supabase.functions.invoke('notificar-estatus', {
        body: { folio },
      })
      if (errorCorreo) throw errorCorreo
    } catch (e) {
      console.warn('Error al enviar notificación por correo:', e.message)
    }
  }
}

// ── obtenerSeguimiento ───────────────────────────────────────────
export async function obtenerSeguimiento(cotizacionId) {
  const { data, error } = await supabase
    .from("cotizacion_seguimiento")
    .select("*")
    .eq("cotizacion_id", cotizacionId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// ── enviarCotizacionPorCorreo ────────────────────────────────────
// Genera el PDF en el navegador y lo manda con la Edge Function
export async function enviarCotizacionPorCorreo(folio, destinatarios) {
  const cot = await obtenerCotizacion(folio);
  if (!cot) throw new Error("Cotización no encontrada");
  const pdfBase64 = await generarPDFBase64(cot);
  const { error } = await supabase.functions.invoke("enviar-cotizacion", {
    body: { folio, email: destinatarios, pdfBase64 },
  });
  if (error) {
    const detalle = await error.context?.json?.().catch(() => null);
    throw new Error(detalle?.error || error.message);
  }
}
