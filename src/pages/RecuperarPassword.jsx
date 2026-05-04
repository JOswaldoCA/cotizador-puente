import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import logo from '../assets/logoPA.png'

export default function RecuperarPassword() {
  const [email,    setEmail]    = useState('')
  const [enviado,  setEnviado]  = useState(false)
  const [error,    setError]    = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nueva-password`,
    })
    setCargando(false)
    if (error) return setError('No se pudo enviar el correo. Verifica el email.')
    setEnviado(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#F0F4F8' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #1B3A6B, #0F2347)' }}>
            <img src={logo} alt="Puente Ambiental" className="h-10 object-contain" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100"
          style={{ boxShadow: '0 8px 32px rgba(27,58,107,0.1)' }}>

          {enviado ? (
            <div className="text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border: '1px solid #A7F3D0' }}>
                ✉️
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2" style={{ color: '#1B3A6B' }}>Correo enviado</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Revisa tu bandeja de entrada en <strong className="text-gray-700">{email}</strong> y sigue las instrucciones para restablecer tu contraseña.
                </p>
              </div>
              <Link to="/login"
                className="w-full text-white font-bold text-sm py-3.5 rounded-xl text-center transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)', boxShadow: '0 4px 16px rgba(27,58,107,0.3)' }}>
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#1B3A6B' }}>
                  Recuperar contraseña
                </h1>
                <p className="text-sm text-gray-400">
                  Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Correo electrónico
                  </label>
                  <input type="email" required
                    placeholder="usuario@empresa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-200 bg-gray-50" />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                    <span className="text-red-500">⚠️</span>
                    <p className="text-xs text-red-600 font-medium">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={cargando}
                  className="w-full text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: cargando ? '#6B7280' : 'linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)',
                    boxShadow: cargando ? 'none' : '0 4px 16px rgba(27,58,107,0.3)',
                  }}>
                  {cargando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Enviando...
                    </>
                  ) : 'Enviar enlace →'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <Link to="/login" className="text-xs font-bold hover:underline" style={{ color: '#1B3A6B' }}>
                  ← Volver al login
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
          <p className="text-xs text-gray-400">Conexión segura · Datos encriptados</p>
        </div>
      </div>
    </div>
  )
}