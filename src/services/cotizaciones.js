import { supabase } from "./supabase";

export async function guardarCotizacion(cot) {
  // Insertar cotización principal
  const { data, error } = await supabase
    .from("cotizaciones")
    .insert({
      folio: cot.folio,
      fecha: cot.fecha,
      usuario_id: (await supabase.auth.getUser()).data.user.id,
      sucursal_id: cot.sucursal.id,
      sucursal_tipo: cot.sucursal.tipo,
      sucursal_nombre: cot.sucursal.nombre,
      sucursal_direccion: cot.sucursal.direccion,
      sucursal_ciudad: cot.sucursal.ciudad,
      sucursal_cp: cot.sucursal.cp,
      cliente_atencion: cot.cliente.atencion,
      cliente_contacto: cot.cliente.contacto,
      cliente_vigencia: cot.cliente.vigencia,
      cliente_notas: cot.cliente.notas,
    })
    .select()
    .single();

  if (error) throw error;

  // Insertar opciones
  const opciones = cot.opciones.map((op, i) => ({
    cotizacion_id: data.id,
    numero: i + 1,
    frecuencia: op.frecuencia,
    capacidad: op.capacidad,
    contenedores: op.contenedores,
    precio: op.precio,
    subtotal: op.subtotal,
    iva: op.iva,
    total: op.total,
  }));

  const { error: errorOpciones } = await supabase
    .from("cotizacion_opciones")
    .insert(opciones);

  if (errorOpciones) throw errorOpciones;

  return data;
}

export async function obtenerCotizaciones() {
  const { data, error } = await supabase
    .from("cotizaciones")
    .select(`*, cotizacion_opciones(*)`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((c) => ({
    folio: c.folio,
    fecha: c.fecha,
    sucursal: {
      id: c.sucursal_id,
      tipo: c.sucursal_tipo,
      nombre: c.sucursal_nombre,
      direccion: c.sucursal_direccion,
      ciudad: c.sucursal_ciudad,
      cp: c.sucursal_cp,
    },
    cliente: {
      atencion: c.cliente_atencion,
      contacto: c.cliente_contacto,
      vigencia: c.cliente_vigencia,
      notas: c.cliente_notas
    },
    opciones: c.cotizacion_opciones
      .sort((a, b) => a.numero - b.numero)
      .map((op) => ({
        frecuencia: op.frecuencia,
        capacidad: op.capacidad,
        contenedores: op.contenedores,
        precio: op.precio,
        subtotal: op.subtotal,
        iva: op.iva,
        total: op.total,
      })),
  }));
}

export async function eliminarCotizacion(folio) {
  const { error } = await supabase
    .from("cotizaciones")
    .delete()
    .eq("folio", folio);

  if (error) throw error;
}

export async function obtenerCotizacion(folio) {
  const todas = await obtenerCotizaciones();
  return todas.find((c) => c.folio === folio) ?? null;
}
