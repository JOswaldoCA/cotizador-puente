import { useCallback, useMemo, useRef, useState } from 'react'
import { AvisosContext } from './AvisosContext'

const ESTILO_AVISO = {
  error: { bg: '#FFF5F5', border: '#FECACA', color: '#991B1B', icon: '⚠️' },
  exito: { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46', icon: '✅' },
  info:  { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF', icon: 'ℹ️' },
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

  const valor = useMemo(() => ({ avisar, confirmar }), [avisar, confirmar])

  return (
    <AvisosContext.Provider value={valor}>
      {children}

      {/* Avisos */}
      <div className="fixed top-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 sm:w-96 pointer-events-none">
        {avisos.map((a) => {
          const e = ESTILO_AVISO[a.tipo] || ESTILO_AVISO.info
          return (
            <div
              key={a.id}
              role={a.tipo === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
              style={{ background: e.bg, borderColor: e.border, color: e.color, boxShadow: '0 10px 25px rgba(9,22,41,0.12)' }}
            >
              <span>{e.icon}</span>
              <p className="flex-1 whitespace-pre-line">{a.mensaje}</p>
              <button
                type="button"
                onClick={() => cerrarAviso(a.id)}
                className="opacity-60 hover:opacity-100"
                aria-label="Cerrar aviso"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>

      {/* Diálogo de confirmación */}
      {dialogo && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[70] px-4"
          style={{ background: 'rgba(9,22,41,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => responder(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-2xl w-full max-w-sm flex flex-col overflow-hidden"
            style={{ boxShadow: '0 25px 50px rgba(9,22,41,0.25)' }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)' }}>
              <h2 className="text-base font-bold text-white">{dialogo.titulo}</h2>
            </div>
            <p className="px-6 py-5 text-sm text-gray-700 whitespace-pre-line">{dialogo.mensaje}</p>
            <div className="flex gap-3 px-6 pb-5">
              <button
                type="button"
                onClick={() => responder(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => responder(true)}
                className="flex-1 text-white font-bold text-sm py-2.5 rounded-xl"
                style={{ background: dialogo.peligro ? '#B91C1C' : 'linear-gradient(135deg, #1B3A6B, #0F2347)' }}
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
