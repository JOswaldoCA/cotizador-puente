import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import { supabase } from '../services/supabase'
import PantallaAcceso, { Resultado } from '../components/PantallaAcceso'

export default function Confirmado() {
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase pasa el token en el hash de la URL y onAuthStateChange lo procesa
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Cerrar sesión y llevar al login con el mensaje de confirmación
        setTimeout(() => {
          supabase.auth.signOut().then(() => navigate('/login?confirmado=true'))
        }, 1500)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [navigate])

  return (
    <PantallaAcceso>
      <Resultado icono={CircleCheck} titulo="Cuenta confirmada">
        Te llevamos a iniciar sesión...
      </Resultado>
    </PantallaAcceso>
  )
}
