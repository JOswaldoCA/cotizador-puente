import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [usuario,  setUsuario]  = useState(null)
  const [perfil,   setPerfil]   = useState(null)
  const [cargando, setCargando] = useState(true)

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

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      setUsuario(user)
      cargarPerfil(user)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const login = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const registro = (email, password) =>
    supabase.auth.signUp({ email, password })

  const logout = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ usuario, perfil, cargando, login, registro, logout }}>
      {children}
    </AuthContext.Provider>
  )
}