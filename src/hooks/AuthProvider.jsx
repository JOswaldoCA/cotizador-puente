import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [usuario,         setUsuario]         = useState(null)
  const [perfil,          setPerfil]          = useState(null)
  const [cargando,        setCargando]        = useState(true)
  const [sesionExpirada,  setSesionExpirada]  = useState(false)

  const cargarPerfil = async (user) => {
    if (!user) { setPerfil(null); return }
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setPerfil(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null
      setUsuario(user)
      cargarPerfil(user).finally(() => setCargando(false))
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null
      setUsuario(user)
      cargarPerfil(user)

      // Detectar sesión expirada
      if (event === 'TOKEN_REFRESHED') {
        setSesionExpirada(false)
      }
      if (event === 'SIGNED_OUT' && usuario) {
        // Solo mostrar aviso si había un usuario activo
        setSesionExpirada(true)
        setTimeout(() => {
          setSesionExpirada(false)
          window.location.href = '/login'
        }, 3000)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const login   = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const registro = (email, password) => supabase.auth.signUp({ email, password })
  const logout  = () => {
    setSesionExpirada(false)
    supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ usuario, perfil, cargando, login, registro, logout }}>
      {/* Banner sesión expirada */}
      {sesionExpirada && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999]"
          style={{ background: 'rgba(9,22,41,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center flex flex-col items-center gap-4"
            style={{ boxShadow: '0 25px 50px rgba(9,22,41,0.3)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'linear-gradient(135deg, #FFF5F5, #FEE2E2)' }}>
              ⏰
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Sesión expirada</h3>
              <p className="text-sm text-gray-500 mt-1">
                Tu sesión ha expirado por inactividad. Serás redirigido al inicio de sesión.
              </p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full rounded-full animate-pulse"
                style={{ background: 'linear-gradient(135deg, #1B3A6B, #0F2347)', width: '100%',
                  animation: 'shrink 3s linear forwards' }}></div>
            </div>
            <button onClick={() => { setSesionExpirada(false); window.location.href = '/login' }}
              className="w-full text-white font-bold text-sm py-3 rounded-xl transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #1B3A6B, #0F2347)', boxShadow: '0 4px 16px rgba(27,58,107,0.3)' }}>
              Ir al login ahora →
            </button>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  )
}