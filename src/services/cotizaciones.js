import { supabase } from './supabase'

// ── Helper bitácora ──────────────────────────────────────────────
async function registrarBitacora({ accion, folio, detalle, sucursal }) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('nombre')
      .eq('id', user.id)
      .single()

    await supabase.from('bitacora').insert({
      usuario_id:     user.id,
      nombre_usuario: perfil?.nombre || 'Usuario',
      accion,
      folio:    folio    || null,
      detalle:  detalle  || null,
      sucursal: sucursal || null,
    })
  } catch (e) {
    console.warn('Error al registrar bitácora:', e.message)
  }
}

// ── guardarCotizacion ────────────────────────────────────────────
export async function guardarCotizacion(cot) {
  const { data, error } = await supabase
    .from('cotizaciones')
    .insert({
      folio:              cot.folio,
      fecha:              cot.fecha,
      usuario_id:         (await supabase.auth.getUser()).data.user.id,
      sucursal_id:        cot.sucursal.id,
      sucursal_tipo:      cot.sucursal.tipo,
      sucursal_nombre:    cot.sucursal.nombre,
      sucursal_direccion: cot.sucursal.direccion,
      sucursal_ciudad:    cot.sucursal.ciudad,
      sucursal_cp:        cot.sucursal.cp,
      cliente_atencion:   cot.cliente.atencion,
      cliente_contacto:   cot.cliente.contacto,
      cliente_vigencia:   cot.cliente.vigencia,
      cliente_pago:       cot.cliente.pago,
      cliente_email:      cot.cliente.email,
      cliente_notas:      cot.cliente.notas,
      bases_extra:        cot.basesExtra || [],
    })
    .select()
    .single()

  if (error) throw error

  const opciones = cot.opciones.map((op, i) => ({
    cotizacion_id: data.id,
    numero:        i + 1,
    servicios:     op.servicios,
    subtotal:      op.subtotal,
    iva:           op.iva,
    total:         op.total,
  }))

  const { error: errorOpciones } = await supabase
    .from('cotizacion_opciones')
    .insert(opciones)

  if (errorOpciones) throw errorOpciones

  // ← Registrar en bitácora
  await registrarBitacora({
    accion:   'CREÓ',
    folio:    cot.folio,
    detalle:  `Cliente: ${cot.cliente.contacto || cot.cliente.atencion}`,
    sucursal: cot.sucursal.tipo,
  })

  return data
}

// ── obtenerCotizaciones ──────────────────────────────────────────
export async function obtenerCotizaciones() {
  const { data, error } = await supabase
    .from('cotizaciones')
    .select('*, cotizacion_opciones(*)')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map(c => ({
    id:                c.id,
    folio:             c.folio,
    fecha:             c.fecha,
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
  }))
}

// ── eliminarCotizacion ───────────────────────────────────────────
export async function eliminarCotizacion(folio) {
  // Obtener datos antes de eliminar para la bitácora
  const { data: cot } = await supabase
    .from('cotizaciones')
    .select('cliente_contacto, sucursal_tipo')
    .eq('folio', folio)
    .single()

  const { error } = await supabase
    .from('cotizaciones')
    .delete()
    .eq('folio', folio)

  if (error) throw error

  // ← Registrar en bitácora
  await registrarBitacora({
    accion:   'ELIMINÓ',
    folio,
    detalle:  `Cliente: ${cot?.cliente_contacto || '—'}`,
    sucursal: cot?.sucursal_tipo,
  })
}

// ── obtenerCotizacion ────────────────────────────────────────────
export async function obtenerCotizacion(folio) {
  const todas = await obtenerCotizaciones()
  return todas.find(c => c.folio === folio) ?? null
}

// ── actualizarCotizacion ─────────────────────────────────────────
export async function actualizarCotizacion(cot) {
  const { data: cotExistente, error: errorGet } = await supabase
    .from('cotizaciones')
    .select('id')
    .eq('folio', cot.folio)
    .single()

  if (errorGet) throw errorGet
  if (!cotExistente) throw new Error('Cotización no encontrada')

  const { error: errorDelete } = await supabase
    .from('cotizacion_opciones')
    .delete()
    .eq('cotizacion_id', cotExistente.id)

  if (errorDelete) throw errorDelete

  const { error: errorUpdate } = await supabase
    .from('cotizaciones')
    .update({
      sucursal_id:        cot.sucursal.id,
      sucursal_tipo:      cot.sucursal.tipo,
      sucursal_nombre:    cot.sucursal.nombre,
      sucursal_direccion: cot.sucursal.direccion,
      sucursal_ciudad:    cot.sucursal.ciudad,
      sucursal_cp:        cot.sucursal.cp,
      cliente_atencion:   cot.cliente.atencion,
      cliente_contacto:   cot.cliente.contacto,
      cliente_vigencia:   cot.cliente.vigencia,
      cliente_pago:       cot.cliente.pago,
      cliente_email:      cot.cliente.email,
      cliente_notas:      cot.cliente.notas,
      bases_extra:        cot.basesExtra || [],
    })
    .eq('folio', cot.folio)

  if (errorUpdate) throw errorUpdate

  const opciones = cot.opciones.map((op, i) => ({
    cotizacion_id: cotExistente.id,
    numero:        i + 1,
    servicios:     op.servicios,
    subtotal:      op.subtotal,
    iva:           op.iva,
    total:         op.total,
  }))

  const { error: errorOpciones } = await supabase
    .from('cotizacion_opciones')
    .insert(opciones)

  if (errorOpciones) throw errorOpciones

  // ← Registrar en bitácora
  await registrarBitacora({
    accion:   'EDITÓ',
    folio:    cot.folio,
    detalle:  `Cliente: ${cot.cliente.contacto || cot.cliente.atencion}`,
    sucursal: cot.sucursal.tipo,
  })
}

// ── actualizarEstatus ────────────────────────────────────────────
export async function actualizarEstatus(folio, estatusNuevo, nota, perfil) {
  const { data: cot, error: errorGet } = await supabase
    .from('cotizaciones')
    .select('id, estatus, sucursal_tipo')
    .eq('folio', folio)
    .single()

  if (errorGet) throw errorGet

  const { error: errorUpdate } = await supabase
    .from('cotizaciones')
    .update({ estatus: estatusNuevo, notas_seguimiento: nota })
    .eq('folio', folio)

  if (errorUpdate) throw errorUpdate

  const { error: errorHist } = await supabase
    .from('cotizacion_seguimiento')
    .insert({
      cotizacion_id:    cot.id,
      usuario_id:       perfil.id,
      nombre_usuario:   perfil.nombre,
      estatus_anterior: cot.estatus,
      estatus_nuevo:    estatusNuevo,
      nota:             nota || null,
    })

  if (errorHist) throw errorHist

  // ← Registrar en bitácora
  await registrarBitacora({
    accion:   estatusNuevo === 'Aprobada' ? 'APROBÓ' : estatusNuevo === 'Rechazada' ? 'RECHAZÓ' : 'CAMBIÓ ESTATUS',
    folio,
    detalle:  `${cot.estatus} → ${estatusNuevo}${nota ? ` · ${nota}` : ''}`,
    sucursal: cot.sucursal_tipo,
  })
}

// ── obtenerSeguimiento ───────────────────────────────────────────
export async function obtenerSeguimiento(cotizacionId) {
  const { data, error } = await supabase
    .from('cotizacion_seguimiento')
    .select('*')
    .eq('cotizacion_id', cotizacionId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}