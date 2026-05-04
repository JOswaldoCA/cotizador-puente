import { supabase } from './supabase'

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
      bases_extra: cot.basesExtra || [],
    })
    .select()
    .single()

  if (error) throw error

  // Insertar opciones con servicios como JSON
  const opciones = cot.opciones.map((op, i) => ({
    cotizacion_id: data.id,
    numero:        i + 1,
    servicios:     op.servicios,  // ← array de servicios como jsonb
    subtotal:      op.subtotal,
    iva:           op.iva,
    total:         op.total,
  }))

  const { error: errorOpciones } = await supabase
    .from('cotizacion_opciones')
    .insert(opciones)

  if (errorOpciones) throw errorOpciones

  return data
}

export async function obtenerCotizaciones() {
  const { data, error } = await supabase
    .from('cotizaciones')
    .select('*, cotizacion_opciones(*)')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map(c => ({
  id:     c.id,           // ← agregar
  folio:  c.folio,
  fecha:  c.fecha,
  estatus: c.estatus || 'En revisión',          // ← agregar
  notas_seguimiento: c.notas_seguimiento || '', // ← agregar
  usuario_id: c.usuario_id,  
  basesExtra:        c.bases_extra || [],                   // ← agregar para puedeEditar
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

export async function eliminarCotizacion(folio) {
  const { error } = await supabase
    .from('cotizaciones')
    .delete()
    .eq('folio', folio)

  if (error) throw error
}

export async function obtenerCotizacion(folio) {
  const todas = await obtenerCotizaciones()
  return todas.find(c => c.folio === folio) ?? null
}

export async function actualizarCotizacion(cot) {
  // 1. Obtener id de la cotización
  const { data: cotExistente, error: errorGet } = await supabase
    .from('cotizaciones')
    .select('id')
    .eq('folio', cot.folio)
    .single()

  if (errorGet) throw errorGet
  if (!cotExistente) throw new Error('Cotización no encontrada')

  console.log('cotizacion id:', cotExistente.id) // ← verifica que tenga valor

  // 2. Borrar opciones viejas PRIMERO
  const { error: errorDelete } = await supabase
    .from('cotizacion_opciones')
    .delete()
    .eq('cotizacion_id', cotExistente.id)

  if (errorDelete) throw errorDelete

  console.log('opciones borradas ok')

  // 3. Actualizar cotización principal
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
      bases_extra:        cot.basesExtra || [],  // ← agregar
    })
    .eq('folio', cot.folio)

  if (errorUpdate) throw errorUpdate

  // 4. Insertar nuevas opciones
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

  console.log('opciones nuevas insertadas ok')
}

export async function actualizarEstatus(folio, estatusNuevo, nota, perfil) {
  // Obtener cotización actual
  const { data: cot, error: errorGet } = await supabase
    .from('cotizaciones')
    .select('id, estatus')
    .eq('folio', folio)
    .single()

  if (errorGet) throw errorGet

  // Actualizar estatus
  const { error: errorUpdate } = await supabase
    .from('cotizaciones')
    .update({ estatus: estatusNuevo, notas_seguimiento: nota })
    .eq('folio', folio)

  if (errorUpdate) throw errorUpdate

  // Insertar historial
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
}

export async function obtenerSeguimiento(cotizacionId) {
  const { data, error } = await supabase
    .from('cotizacion_seguimiento')
    .select('*')
    .eq('cotizacion_id', cotizacionId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}