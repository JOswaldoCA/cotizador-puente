import { IVA } from './constantes'

export function calcularOpcion(precio) {
  const subtotal = Number(precio) || 0
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

export function generarFolio() {
  const año  = new Date().getFullYear()
  const rand = String(Math.floor(Math.random() * 9000) + 1000)
  return `COT-${año}-${rand}`
}

export function fechaHoy() {
  return new Date().toLocaleDateString('es-MX', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  }).toUpperCase()
}

export function estaVencida(fecha, vigencia) {
  if (!fecha || !vigencia) return false

  // Parsear fecha de la cotización
  const meses = {
    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
    'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
    'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
  }

  const partes = fecha.toLowerCase().split(' de ')
  if (partes.length < 3) return false

  const dia  = parseInt(partes[0])
  const mes  = meses[partes[1]]
  const año  = parseInt(partes[2])

  if (isNaN(dia) || mes === undefined || isNaN(año)) return false

  const fechaCot = new Date(año, mes, dia)

  // Calcular días de vigencia
  let dias = 30
  if (vigencia.includes('15')) dias = 15
  if (vigencia.includes('30')) dias = 30
  if (vigencia.includes('1 MES')) dias = 30

  const fechaVence = new Date(fechaCot)
  fechaVence.setDate(fechaVence.getDate() + dias)

  return new Date() > fechaVence
}