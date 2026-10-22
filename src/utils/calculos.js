import { IVA } from './constantes'

export function calcularOpcionServicio(precio_lista, diasRecoleccion) {
  const subtotal = (Number(precio_lista) || 0) * (Number(diasRecoleccion) || 0)
  const iva      = subtotal * IVA
  const total    = subtotal + iva
  return { subtotal, iva, total }
}

export function formatMXN(n) {
  return Number(n).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function fechaHoy() {
  return new Date().toLocaleDateString('es-MX', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  }).toUpperCase()
}

const MESES = {
  'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
  'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
  'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
}

// "7 DÍAS" → 7, "15 DÍAS" → 15, "1 MES" (cotizaciones anteriores) → 30
export function diasVigencia(vigencia) {
  const texto = String(vigencia || '').toUpperCase()
  const n = parseInt(texto)
  if (isNaN(n)) return 30
  return texto.includes('MES') ? n * 30 : n
}

// Fecha como Date local (medianoche). Acepta un Date, "2026-10-22" (columna
// fecha_emision o un <input type="date">) o el texto "22 DE OCTUBRE DE 2026".
// new Date("2026-10-22") se interpreta en UTC y en Sonora cae el día anterior.
export function parsearFecha(valor) {
  if (!valor) return null
  if (valor instanceof Date) return valor

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor)
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))

  const partes = String(valor).toLowerCase().split(' de ')
  if (partes.length < 3) return null

  const dia = parseInt(partes[0])
  const mes = MESES[partes[1]]
  const año = parseInt(partes[2])

  if (isNaN(dia) || mes === undefined || isNaN(año)) return null
  return new Date(año, mes, dia)
}

// Fecha de emisión de una cotización: la columna de fecha real si existe, si no el texto
export const fechaDeCotizacion = (cot) =>
  parsearFecha(cot?.fechaEmision) ?? parsearFecha(cot?.fecha)

function fechaVencimiento(fecha, vigencia) {
  const emision = parsearFecha(fecha)
  if (!emision || !vigencia) return null
  return new Date(emision.getFullYear(), emision.getMonth(), emision.getDate() + diasVigencia(vigencia))
}

export function estaVencida(fecha, vigencia) {
  const fechaVence = fechaVencimiento(fecha, vigencia)
  return fechaVence ? new Date() > fechaVence : false
}

export function calcularServicio({ precioUnitario, numContenedores, precioDia, diasSemana }) {
  return (Number(precioUnitario) * Number(numContenedores)) + (Number(precioDia) * Number(diasSemana))
}

export function calcularTotalesOpcion(servicios) {
  const subtotal = servicios.reduce((acc, srv) => acc + calcularServicio(srv), 0)
  const iva      = subtotal * IVA
  const total    = subtotal + iva
  return { subtotal, iva, total }
}

export function diasParaVencer(fecha, vigencia) {
  const fechaVence = fechaVencimiento(fecha, vigencia)
  if (!fechaVence) return null
  return Math.ceil((fechaVence - new Date()) / 86400000) + 0 // + 0 evita -0; negativo = ya venció, positivo = días que faltan
}

// Texto para mostrar el resultado de diasParaVencer
export function textoVencimiento(dias) {
  if (dias < 0) return `Venció hace ${-dias} ${dias === -1 ? 'día' : 'días'}`
  if (dias === 0) return 'Venció hoy'
  return `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`
}
