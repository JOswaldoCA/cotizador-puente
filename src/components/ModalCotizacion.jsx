import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generarPDFBase64 } from '../utils/generarPDF'
import { obtenerCotizacion } from '../services/cotizaciones'

export default function ModalCotizacion({ folio, emailCliente, onCerrar }) {
  const navigate = useNavigate()
  const [email, setEmail]       = useState(emailCliente || '')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado]   = useState(false)
  const [error, setError]       = useState('')
  const [progreso, setProgreso] = useState('')

  const exportarPDF = () => window.open(`/preview/${folio}`, '_blank')

  const enviarCorreo = async () => {
    if (!email) return setError('Escribe un correo electrónico.')
    setError('')
    setEnviando(true)
    try {
      setProgreso('Obteniendo cotización...')
      const cot = await obtenerCotizacion(folio)
      if (!cot) throw new Error('Cotización no encontrada')

      setProgreso('Generando PDF...')
      const pdfBase64 = await generarPDFBase64(cot)

      setProgreso('Enviando correo...')
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enviar-cotizacion`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ folio, email, pdfBase64 }),
        }
      )
      if (!res.ok) { const msg = await res.text(); throw new Error(msg) }
      setEnviado(true)
    } catch (e) {
      setError('No se pudo enviar: ' + e.message)
    }
    setProgreso('')
    setEnviando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden">

        <div className="bg-primary-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Cotización guardada</h2>
            <p className="text-xs text-blue-300 font-mono mt-0.5">{folio}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-accent-400 flex items-center justify-center text-primary-600 text-lg font-bold">✓</div>
        </div>

        <div className="p-6 flex flex-col gap-4">

          <button onClick={exportarPDF}
            className="flex items-center gap-4 border-2 border-gray-200 hover:border-primary-600 rounded-xl px-4 py-3 transition-all text-left w-full group">
            <div className="w-10 h-10 rounded-lg bg-primary-50 group-hover:bg-primary-600 flex items-center justify-center text-xl transition-colors">📄</div>
            <div>
              <p className="text-sm font-semibold text-primary-600">Ver e imprimir PDF</p>
              <p className="text-xs text-gray-400">Abre la vista previa para imprimir o guardar</p>
            </div>
          </button>

          <div className="border-2 border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-xl">✉️</div>
              <div>
                <p className="text-sm font-semibold text-primary-600">Enviar por correo</p>
                <p className="text-xs text-gray-400">Se adjunta el PDF de la cotización</p>
              </div>
            </div>
            {enviado ? (
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                <p className="text-xs font-semibold text-green-700">✓ Correo enviado a {email}</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input type="email" placeholder="correo@cliente.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" />
                  <button onClick={enviarCorreo} disabled={enviando}
                    className="bg-primary-600 hover:bg-primary-800 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                    {enviando ? '...' : 'Enviar'}
                  </button>
                </div>
                {progreso && (
                  <p className="text-xs text-primary-600 bg-primary-50 rounded-lg px-3 py-2 flex items-center gap-2">
                    <span className="animate-spin">⏳</span> {progreso}
                  </p>
                )}
                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                )}
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => navigate('/cotizaciones')}
              className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              Ver historial
            </button>
            <button onClick={onCerrar}
              className="flex-1 bg-primary-600 hover:bg-primary-800 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              Nueva cotización
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}