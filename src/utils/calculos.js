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

// Fecha guardada como "22 DE OCTUBRE DE 2026" + días de vigencia
function fechaVencimiento(fecha, vigencia) {
  if (!fecha || !vigencia) return null

  const partes = fecha.toLowerCase().split(' de ')
  if (partes.length < 3) return null

  const dia = parseInt(partes[0])
  const mes = MESES[partes[1]]
  const año = parseInt(partes[2])

  if (isNaN(dia) || mes === undefined || isNaN(año)) return null

  return new Date(año, mes, dia + diasVigencia(vigencia))
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
