import { useState } from 'react'
import { SUCURSALES } from '../utils/constantes'
import { generarFolio, calcularOpcion } from '../utils/calculos'

const opcionVacia = () => ({
  id: Date.now(),
  precio: '',
  frecuencia: '3 visitas a la semana',
  capacidad: '1.5 MTS CÚBICOS',
  contenedores: '1',
})

export function useCotizacion() {
  const [folio]       = useState(generarFolio)
  const [sucursal, setSucursal] = useState(SUCURSALES[0])
  const [opciones, setOpciones] = useState([opcionVacia()])
  const [cliente, setCliente]   = useState({
    atencion: '', contacto: '', vigencia: '1 MES',
  })

  const agregarOpcion = () =>
    setOpciones(prev => [...prev, opcionVacia()])

  const quitarOpcion = (id) =>
    setOpciones(prev => prev.filter(o => o.id !== id))

  const actualizarOpcion = (id, campo, valor) =>
    setOpciones(prev =>
      prev.map(o => o.id === id ? { ...o, [campo]: valor } : o)
    )

  const opcionesCalculadas = opciones.map(o => ({
    ...o,
    ...calcularOpcion(o.precio),
  }))

  return {
    folio, sucursal, setSucursal,
    opciones, opcionesCalculadas,
    agregarOpcion, quitarOpcion, actualizarOpcion,
    cliente, setCliente,
  }
}