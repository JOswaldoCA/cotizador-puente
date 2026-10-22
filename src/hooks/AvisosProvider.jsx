import { useCallback, useMemo, useRef, useState } from 'react'
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { AvisosContext } from './AvisosContext'

const ESTILO_AVISO = {
  error: { clase: 'text-estado-rechazada', icono: TriangleAlert },
  exito: { clase: 'text-estado-aprobada',  icono: CircleCheck },
  info:  { clase: 'text-primary-600',      icono: Info },
}

const DURACION_MS = 5000

// Reemplaza alert() y confirm() del navegador con avisos y diálogos de la app
export function AvisosProvider({ children }) {
  const [avisos,   setAvisos]   = useState([])
  const [dialogo,  setDialogo]  = useState(null)
  const siguienteId = useRef(0)

  const cerrarAviso = useCallback((id) => {
    setAvisos((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const avisar = useCallback((mensaje, tipo = 'error') => {
    const id = ++siguienteId.current
    setAvisos((prev) => [...prev, { id, mensaje, tipo }])
    setTimeout(() => cerrarAviso(id), DURACION_MS)
  }, [cerrarAviso])

  const confirmar = useCallback((mensaje, { titulo = 'Confirmar', textoAceptar = 'Aceptar', peligro = false } = {}) =>
    new Promise((resolve) => {
      setDialogo({ mensaje, titulo, textoAceptar, peligro, resolve })
    }), [])

  const responder = (valor) => {
    dialogo?.resolve(valor)
    setDialogo(null)
  }

  // En acciones destructivas el foco inicial va en Cancelar para que Enter no borre por accidente
  const valor = useMemo(() => ({ avisar, confirmar }), [avisar, confirmar])

  return (
    <AvisosContext.Provider value={valor}>
      {children}

      {/* Avisos */}
      <div className="fixed top-4 right-4 left-4 sm:left-auto z-[80] flex flex-col gap-2 sm:w-96 pointer-events-none" aria-live="polite">
        {avisos.map((a) => {
          const e = ESTILO_AVISO[a.tipo] || ESTILO_AVISO.info
          const Icono = e.icono
          return (
            <div
              key={a.id}
              role={a.tipo === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-linea bg-white px-4 py-3 text-sm text-gray-800 shadow-large"
            >
              <Icono size={18} className={`flex-shrink-0 mt-0.5 ${e.clase}`} aria-hidden="true" />
              <p className="flex-1 whitespace-pre-line">{a.mensaje}</p>
              <button
                type="button"
                onClick={() => cerrarAviso(a.id)}
                className="text-gray-400 hover:text-gray-700 -mr-1"
                aria-label="Cerrar aviso"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Diálogo de confirmación */}
      {dialogo && (
        <div className="fixed inset-0 flex items-center justify-center z-[70] p-4 bg-primary-900/60" onClick={() => responder(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialogo-titulo"
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-large"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="px-6 pt-5">
              <h2 id="dialogo-titulo" className="text-base font-semibold text-primary-800">{dialogo.titulo}</h2>
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{dialogo.mensaje}</p>
            </div>
            <div className="flex gap-3 px-6 py-5">
              <button
                type="button"
                autoFocus={dialogo.peligro}
                onClick={() => responder(false)}
                className="flex-1 border border-linea text-gray-700 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                autoFocus={!dialogo.peligro}
                onClick={() => responder(true)}
                className={`flex-1 text-white font-semibold text-sm py-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  dialogo.peligro ? 'bg-estado-rechazada hover:bg-estado-rechazada/90 focus-visible:ring-estado-rechazada' : 'bg-primary-600 hover:bg-primary-800 focus-visible:ring-primary-600'
                }`}
              >
                {dialogo.textoAceptar}
              </button>
            </div>
          </div>
        </div>
      )}
    </AvisosContext.Provider>
  )
}
