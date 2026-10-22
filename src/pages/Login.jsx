import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import PantallaAcceso from '../components/PantallaAcceso'
import Boton from '../components/ui/Boton'
import { campo, etiqueta } from '../components/ui/estilos'

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [searchParams] = useSearchParams()
  const confirmado = searchParams.get('confirmado')

  const [form,     setForm]     = useState({ email: '', password: '' })
  const [error,    setError]    = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    const { error } = await login(form.email, form.password)
    setCargando(false)
    if (error) setError('El correo o la contraseña no son correctos.')
    else navigate('/')
  }

  return (
    <PantallaAcceso
      titulo="Iniciar sesión"
      descripcion="Entra con tu correo de trabajo."
      pie={<>¿No tienes cuenta? <Link to="/registro" className="font-semibold text-primary-600 hover:underline">Crear una cuenta</Link></>}
    >
      {confirmado && (
        <p className="mb-6 rounded-xl bg-estado-aprobada/10 px-4 py-3 text-sm text-estado-aprobada flex items-center gap-2" role="status">
          <CircleCheck size={16} aria-hidden="true" /> Tu cuenta está confirmada. Ya puedes entrar.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className={etiqueta}>Correo</label>
          <input id="email" type="email" required autoComplete="email" placeholder="nombre@puenteambiental.com.mx"
            value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={campo} />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className={etiqueta}>Contraseña</label>
            <Link to="/recuperar" className="text-xs font-medium text-primary-600 hover:underline">¿La olvidaste?</Link>
          </div>
          <input id="password" type="password" required autoComplete="current-password"
            value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className={campo} />
        </div>

        {error && <p className="text-sm text-estado-rechazada" role="alert">{error}</p>}

        <Boton type="submit" disabled={cargando} className="w-full mt-1">
          {cargando ? 'Entrando...' : 'Entrar'}
        </Boton>
      </form>
    </PantallaAcceso>
  )
}
