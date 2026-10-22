import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import { supabase } from '../services/supabase'
import PantallaAcceso, { Resultado } from '../components/PantallaAcceso'
import Boton from '../components/ui/Boton'
import { campo, etiqueta } from '../components/ui/estilos'

export default function NuevaPassword() {
  const navigate = useNavigate()
  const [password,  setPassword]  = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error,     setError]     = useState('')
  const [cargando,  setCargando]  = useState(false)
  const [listo,     setListo]     = useState(false)
  const [sesionLista, setSesionLista] = useState(false)

  useEffect(() => {
    // Supabase procesa el token del enlace al cargar la página
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSesionLista(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (password !== confirmar) return setError('La confirmación no coincide con la contraseña.')
    setCargando(true)
    const { error } = await supabase.auth.updateUser({ password })
    setCargando(false)
    if (error) return setError('No se pudo guardar la contraseña. Intenta de nuevo.')
    setListo(true)
    setTimeout(() => navigate('/login'), 3000)
  }

  if (listo) return (
    <PantallaAcceso>
      <Resultado icono={CircleCheck} titulo="Contraseña guardada">
        Te llevamos a iniciar sesión en unos segundos.
      </Resultado>
    </PantallaAcceso>
  )

  if (!sesionLista) return (
    <PantallaAcceso
      titulo="Verificando el enlace"
      pie={<>¿El enlace no funciona? <Link to="/recuperar" className="font-semibold text-primary-600 hover:underline">Pide uno nuevo</Link></>}
    >
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
        Un momento...
      </div>
    </PantallaAcceso>
  )

  return (
    <PantallaAcceso titulo="Elige una contraseña nueva">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="password" className={etiqueta}>Nueva contraseña</label>
          <input id="password" type="password" required autoComplete="new-password" className={campo}
            placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div>
          <label htmlFor="confirmar" className={etiqueta}>Confirmar contraseña</label>
          <input id="confirmar" type="password" required autoComplete="new-password" className={campo}
            value={confirmar} onChange={e => setConfirmar(e.target.value)} />
        </div>
        {error && <p className="text-sm text-estado-rechazada" role="alert">{error}</p>}
        <Boton type="submit" disabled={cargando} className="w-full">
          {cargando ? 'Guardando...' : 'Guardar contraseña'}
        </Boton>
      </form>
    </PantallaAcceso>
  )
}
