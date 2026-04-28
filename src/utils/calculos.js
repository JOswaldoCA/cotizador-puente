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