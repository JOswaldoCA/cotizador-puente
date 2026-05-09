import * as XLSX from 'xlsx'

export function exportarCotizacionesExcel(cotizaciones, nombreArchivo = 'Cotizaciones') {
  const filas = []

  cotizaciones.forEach(cot => {
    if (!cot.opciones || cot.opciones.length === 0) {
      filas.push({
        'Folio':          cot.folio         || '—',
        'Fecha':          cot.fecha         || '—',
        'Cliente':        cot.cliente?.atencion?.toUpperCase() || '—',
        'Razón Social':   cot.cliente?.contacto?.toUpperCase() || '—',
        'Correo':         cot.cliente?.email   || '—',
        'Vigencia':       cot.cliente?.vigencia || '—',
        'Forma de Pago':  cot.cliente?.pago     || '—',
        'Sucursal':       cot.sucursal?.tipo    || '—',
        'Estatus':        cot.estatus           || 'En revisión',
        'Opción':         '—',
        'Subtotal':       0,
        'IVA':            0,
        'Total':          0,
      })
    } else {
      cot.opciones.forEach((op, i) => {
        filas.push({
          'Folio':         cot.folio          || '—',
          'Fecha':         cot.fecha          || '—',
          'Cliente':       cot.cliente?.atencion?.toUpperCase() || '—',
          'Razón Social':  cot.cliente?.contacto?.toUpperCase() || '—',
          'Correo':        cot.cliente?.email    || '—',
          'Vigencia':      cot.cliente?.vigencia || '—',
          'Forma de Pago': cot.cliente?.pago     || '—',
          'Sucursal':      cot.sucursal?.tipo    || '—',
          'Estatus':       cot.estatus           || 'En revisión',
          'Opción':        `Opción ${i + 1}`,
          'Subtotal':      op.subtotal || 0,
          'IVA':           op.iva      || 0,
          'Total':         op.total    || 0,
        })
      })
    }
  })

  const hoja = XLSX.utils.json_to_sheet(filas)

  // Ancho de columnas
  hoja['!cols'] = [
    { wch: 22 }, // Folio
    { wch: 20 }, // Fecha
    { wch: 30 }, // Cliente
    { wch: 30 }, // Razón Social
    { wch: 30 }, // Correo
    { wch: 12 }, // Vigencia
    { wch: 25 }, // Forma de Pago
    { wch: 15 }, // Sucursal
    { wch: 14 }, // Estatus
    { wch: 10 }, // Opción
    { wch: 14 }, // Subtotal
    { wch: 14 }, // IVA
    { wch: 14 }, // Total
  ]

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Cotizaciones')

  const fecha = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).replace(/\//g, '-')

  XLSX.writeFile(libro, `${nombreArchivo}-${fecha}.xlsx`)
}