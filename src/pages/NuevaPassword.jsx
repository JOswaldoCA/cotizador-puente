import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import logo from '../assets/logoPA.png'

export default function NuevaPassword() {
  const navigate = useNavigate()
  const [password,  setPassword]  = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error,     setError]     = useState('')
  const [cargando,  setCargando]  = useState(false)
  const [listo,     setListo]     = useState(false)
  const [sesionLista, setSesionLista] = useState(false)

  useEffect(() => {
    // Supabase maneja el token automáticamente al cargar la página
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSesionLista(true)
      }
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (password !== confirmar) return setError('Las contraseñas no coinciden.')
    setCargando(true)
    const { error } = await supabase.auth.updateUser({ password })
    setCargando(false)
    if (error) return setError('No se pudo actualizar la contraseña. Intenta de nuevo.')
    setListo(true)
    setTimeout(() => navigate('/login'), 3000)
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

          {listo ? (
            <div className="text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border: '1px solid #A7F3D0' }}>
                ✅
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2" style={{ color: '#1B3A6B' }}>¡Contraseña actualizada!</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Tu contraseña fue cambiada exitosamente. Serás redirigido al login en unos segundos...
                </p>
              </div>
              <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
          ) : !sesionLista ? (
            <div className="text-center flex flex-col items-center gap-4">
              <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400">Verificando enlace...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#1B3A6B' }}>
                  Nueva contraseña
                </h1>
                <p className="text-sm text-gray-400">Ingresa tu nueva contraseña para continuar.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Nueva contraseña
                  </label>
                  <input type="password" required
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-200 bg-gray-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Confirmar contraseña
                  </label>
                  <input type="password" required
                    placeholder="Repite la contraseña"
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
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
                      Actualizando...
                    </>
                  ) : 'Guardar contraseña →'}
                </button>
              </form>
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