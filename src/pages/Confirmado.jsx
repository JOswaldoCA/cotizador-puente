import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

export default function Confirmado() {
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase pasa el token en el hash de la URL
    // onAuthStateChange lo procesa automáticamente
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Cerrar sesión y redirigir al login con mensaje
        setTimeout(() => {
          supabase.auth.signOut().then(() => {
            navigate('/login?confirmado=true')
          })
        }, 1500) // Pequeña espera para mostrar el mensaje
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center px-6"
      style={{ background: '#F0F4F8' }}>
      <div className="bg-white rounded-3xl p-10 border border-gray-100 text-center flex flex-col items-center gap-5 w-full max-w-sm"
        style={{ boxShadow: '0 8px 32px rgba(27,58,107,0.1)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border: '1px solid #A7F3D0' }}>
          ✅
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1B3A6B' }}>
            ¡Cuenta confirmada!
          </h2>
          <p className="text-sm text-gray-400">
            Redirigiendo al login...
          </p>
        </div>
        <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    </div>
  )
}