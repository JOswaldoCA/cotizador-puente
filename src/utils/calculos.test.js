import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  calcularServicio,
  calcularTotalesOpcion,
  diasParaVencer,
  diasVigencia,
  estaVencida,
} from './calculos'

describe('diasVigencia', () => {
  it.each([
    ['7 DÍAS', 7],
    ['10 DÍAS', 10],
    ['15 DÍAS', 15],
    ['20 DÍAS', 20],
    ['30 DÍAS', 30],
    ['1 MES', 30], // cotizaciones anteriores
    [undefined, 30],
    ['', 30],
  ])('%s → %i días', (vigencia, dias) => {
    expect(diasVigencia(vigencia)).toBe(dias)
  })
})

describe('vencimiento', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 22, 12, 0)) // 22 de octubre de 2026, mediodía
  })
  afterEach(() => vi.useRealTimers())

  it('7 días desde el 15 de octubre vence hoy', () => {
    expect(estaVencida('15 DE OCTUBRE DE 2026', '7 DÍAS')).toBe(true)
    expect(diasParaVencer('15 DE OCTUBRE DE 2026', '7 DÍAS')).toBe(0)
  })

  it('10 días desde el 15 de octubre sigue vigente 3 días más', () => {
    expect(estaVencida('15 DE OCTUBRE DE 2026', '10 DÍAS')).toBe(false)
    expect(diasParaVencer('15 DE OCTUBRE DE 2026', '10 DÍAS')).toBe(3)
  })

  it('"1 MES" desde el 1 de septiembre ya venció', () => {
    expect(estaVencida('01 DE SEPTIEMBRE DE 2026', '1 MES')).toBe(true)
    expect(diasParaVencer('01 DE SEPTIEMBRE DE 2026', '1 MES')).toBeLessThan(0)
  })

  it('cruza fin de mes y de año', () => {
    expect(diasParaVencer('20 DE DICIEMBRE DE 2026', '20 DÍAS')).toBe(79) // vence el 9 de enero de 2027
  })

  it('fecha que no se puede interpretar no se considera vencida', () => {
    expect(estaVencida('2026-10-22', '7 DÍAS')).toBe(false)
    expect(diasParaVencer('', '7 DÍAS')).toBeNull()
    expect(estaVencida('22 DE OCTUBRE DE 2026', null)).toBe(false)
  })
})

describe('totales', () => {
  const srv = { precioUnitario: 1500, numContenedores: 2, precioDia: 300, diasSemana: 3 }

  it('servicio = precio × contenedores + precio por día × días', () => {
    expect(calcularServicio(srv)).toBe(3900)
  })

  it('acepta números como texto, como llegan de los inputs', () => {
    expect(calcularServicio({ precioUnitario: '1500', numContenedores: '2', precioDia: '300', diasSemana: '3' })).toBe(3900)
  })

  it('suma los servicios de una opción y agrega IVA del 16%', () => {
    const { subtotal, iva, total } = calcularTotalesOpcion([srv, srv])
    expect(subtotal).toBe(7800)
    expect(iva).toBeCloseTo(1248)
    expect(total).toBeCloseTo(9048)
  })

  it('opción sin servicios da cero', () => {
    expect(calcularTotalesOpcion([])).toEqual({ subtotal: 0, iva: 0, total: 0 })
  })
})
