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
    <AuthContext.Provider value={{ usuario, perfil, cargando, login, registro, logout, recargarPerfil: () => cargarPerfil(usuario) }}>
      {/* Aviso de sesión expirada */}
      {sesionExpirada && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 bg-primary-900/70">
          <div role="alertdialog" aria-modal="true" aria-labelledby="sesion-titulo"
            className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-large">
            <div>
              <h3 id="sesion-titulo" className="text-base font-semibold text-primary-800">Tu sesión terminó</h3>
              <p className="text-sm text-gray-600 mt-1">
                Por seguridad se cerró después de un tiempo sin actividad. Vuelve a iniciar sesión para continuar.
              </p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden" aria-hidden="true">
              <div className="h-full rounded-full bg-primary-600 motion-reduce:hidden"
                style={{ width: '100%', animation: 'shrink 3s linear forwards' }}></div>
            </div>
            <button onClick={() => { setSesionExpirada(false); window.location.href = '/login' }}
              className="w-full text-white font-semibold text-sm py-2.5 rounded-xl bg-primary-600 hover:bg-primary-800">
              Iniciar sesión
            </button>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  )
}