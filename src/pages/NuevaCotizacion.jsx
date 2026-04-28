import { useState, useEffect } from 'react'
import { useCotizacion } from '../hooks/useCotizacion'
import { SUCURSALES, FRECUENCIAS, CAPACIDADES } from '../utils/constantes'
import { fechaHoy } from '../utils/calculos'
import { guardarCotizacion } from '../services/cotizaciones'
import ModalCotizacion from '../components/ModalCotizacion'
import { useAuth } from '../hooks/useAuth'

const input   = 'border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-600 w-full bg-white'
const label   = 'text-xs font-medium text-gray-600 mb-1 block'
const section = 'bg-white rounded-xl border border-gray-200 overflow-hidden'

const PAGOS = ['Mensual', 'Trimestral', 'Anual', 'Por evento']

export default function NuevaCotizacion() {
  const {
    folio, sucursal, setSucursal,
    opciones, opcionesCalculadas,
    agregarOpcion, quitarOpcion, actualizarOpcion,
    cliente, setCliente,
  } = useCotizacion()

  const { perfil } = useAuth()
  const [modalFolio, setModalFolio] = useState(null)
  const [guardando, setGuardando]   = useState(false)

  // Tomar sucursal del perfil del usuario
  useEffect(() => {
    if (perfil?.sucursal_id) {
      const sucursalPerfil = SUCURSALES.find(s => s.id === perfil.sucursal_id)
      if (sucursalPerfil) setSucursal(sucursalPerfil)
    }
  }, [perfil])

  const guardar = async () => {
    if (!cliente.atencion) return alert('Escribe el nombre del cliente.')
    setGuardando(true)
    try {
      const cotizacion = {
        folio, fecha: fechaHoy(), sucursal, cliente,
        opciones: opcionesCalculadas,
      }
      await guardarCotizacion(cotizacion)
      setModalFolio(folio)
    } catch (e) {
      alert('Error al guardar: ' + e.message)
    }
    setGuardando(false)
  }

  const sectionHeader = (title) => (
    <div className="px-6 py-4 border-b border-gray-100 bg-primary-600">
      <h2 className="text-xs font-semibold text-accent-400 uppercase tracking-widest">{title}</h2>
    </div>
  )

  return (
    <>
      <div className="max-w-3xl mx-auto flex flex-col gap-5">

        {/* Título */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-primary-600">Nueva cotización</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">Folio: {folio}</p>
          </div>
          <span className="text-xs bg-accent-300/40 text-primary-600 font-medium px-3 py-1.5 rounded-lg">
            {fechaHoy()}
          </span>
        </div>

        {/* Sucursal — solo informativo */}
        <div className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            🏢
          </div>
          <div>
            <p className="text-xs font-semibold text-primary-600">{sucursal?.tipo}</p>
            <p className="text-xs text-gray-400">{sucursal?.ciudad}</p>
          </div>
        </div>

        {/* Cliente */}
        <div className={section}>
          {sectionHeader('Datos del cliente')}
          <div className="p-6 grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Atención a *</label>
              <input className={input} placeholder="Nombre del negocio"
                value={cliente.atencion}
                onChange={e => setCliente(p => ({ ...p, atencion: e.target.value }))} />
            </div>
            <div>
              <label className={label}>Contacto / Responsable</label>
              <input className={input} placeholder="Nombre del contacto"
                value={cliente.contacto}
                onChange={e => setCliente(p => ({ ...p, contacto: e.target.value }))} />
            </div>
            <div>
              <label className={label}>Fecha de cotización</label>
              <input className={input} value={fechaHoy()} readOnly />
            </div>
            <div>
              <label className={label}>Vigencia</label>
              <select className={input} value={cliente.vigencia}
                onChange={e => setCliente(p => ({ ...p, vigencia: e.target.value }))}>
                <option>1 MES</option>
                <option>15 DÍAS</option>
                <option>30 DÍAS</option>
              </select>
            </div>
            <div>
              <label className={label}>Forma de pago</label>
              <select className={input} value={cliente.pago || 'Mensual'}
                onChange={e => setCliente(p => ({ ...p, pago: e.target.value }))}>
                {PAGOS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Correo del cliente</label>
              <input className={input} type="email" placeholder="cliente@correo.com"
                value={cliente.email || ''}
                onChange={e => setCliente(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className={label}>Notas adicionales</label>
              <textarea className={input} rows={3}
                placeholder="Observaciones, accesos especiales, horarios..."
                value={cliente.notas || ''}
                onChange={e => setCliente(p => ({ ...p, notas: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Opciones de servicio */}
        <div className={section}>
          {sectionHeader('Opciones de servicio')}
          <div className="p-6 flex flex-col gap-4">
            {opcionesCalculadas.map((op, i) => (
              <div key={op.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                      {i + 1}
                    </div>
                    <span className="text-sm font-semibold text-primary-600">OPCIÓN {i + 1}</span>
                  </div>
                  {opciones.length > 1 && (
                    <button type="button" onClick={() => quitarOpcion(op.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors">
                      Eliminar
                    </button>
                  )}
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Días de recolección</label>
                    <select className={input} value={op.frecuencia}
                      onChange={e => actualizarOpcion(op.id, 'frecuencia', e.target.value)}>
                      {FRECUENCIAS.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Capacidad del contenedor</label>
                    <select className={input} value={op.capacidad}
                      onChange={e => actualizarOpcion(op.id, 'capacidad', e.target.value)}>
                      {CAPACIDADES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Cantidad de contenedores</label>
                    <input className={input} type="number" min="1"
                      value={op.contenedores}
                      onChange={e => actualizarOpcion(op.id, 'contenedores', e.target.value)}
                      placeholder="1" />
                  </div>
                  <div>
                    <label className={label}>Precio (subtotal sin IVA)</label>
                    <input className={input} type="number" min="0"
                      value={op.precio}
                      onChange={e => actualizarOpcion(op.id, 'precio', e.target.value)}
                      placeholder="0.00" />
                  </div>
                </div>
                {/* Resumen opción */}
                <div className="grid grid-cols-3 divide-x divide-gray-200 border-t border-gray-200">
                  {[
                    { label: 'Subtotal',     value: op.subtotal },
                    { label: 'IVA 16%',      value: op.iva },
                    { label: 'Neto mensual', value: op.total, highlight: true },
                  ].map(({ label: l, value, highlight }) => (
                    <div key={l} className={`text-center py-3 px-2 ${highlight ? 'bg-primary-50' : ''}`}>
                      <p className="text-xs text-gray-400">{l}</p>
                      <p className={`text-sm font-bold ${highlight ? 'text-primary-600' : 'text-gray-700'}`}>
                        ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button type="button" onClick={agregarOpcion}
              className="w-full border-2 border-dashed border-gray-300 hover:border-primary-600 text-gray-400 hover:text-primary-600 text-sm font-medium py-3 rounded-xl transition-colors">
              + Agregar opción
            </button>
          </div>
        </div>

        {/* Botón guardar */}
        <button type="button" onClick={guardar} disabled={guardando}
          className="w-full bg-primary-600 hover:bg-primary-800 disabled:opacity-50 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
          {guardando ? 'Guardando...' : '💾 Guardar cotización'}
        </button>

      </div>

      {modalFolio && (
        <ModalCotizacion
          folio={modalFolio}
          emailCliente={cliente.email || ''}
          onCerrar={() => setModalFolio(null)}
        />
      )}
    </>
  )
}