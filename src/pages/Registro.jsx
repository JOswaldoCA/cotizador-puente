import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { supabase } from '../services/supabase'
import { SUCURSALES, SUCURSAL_CORTA } from '../utils/constantes'
import PantallaAcceso, { Resultado } from '../components/PantallaAcceso'
import Boton from '../components/ui/Boton'
import { campo, etiqueta } from '../components/ui/estilos'

export default function Registro() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: '', email: '', sucursal: 'matriz', password: '', confirmar: '',
  })
  const [error,    setError]    = useState('')
  const [exito,    setExito]    = useState(false)
  const [cargando, setCargando] = useState(false)

  const set = (c) => (e) => setForm(p => ({ ...p, [c]: e.target.value }))

  const validar = () => {
    if (!form.nombre.trim())              return 'Escribe tu nombre.'
    if (form.password.length < 8)         return 'La contraseña debe tener al menos 8 caracteres.'
    if (form.password !== form.confirmar) return 'La confirmación no coincide con la contraseña.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const err = validar()
    if (err) return setError(err)
    setCargando(true)

    const { data, error: errAuth } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options: {
        data: {
          nombre:      form.nombre,
          sucursal_id: form.sucursal,
        },
      },
    })

    setCargando(false)
    if (errAuth) return setError('No se pudo crear la cuenta. Intenta de nuevo.')

    // Si identities viene vacío el correo ya está registrado
    if (data?.user && data.user.identities?.length === 0)
      return setError('Ese correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.')

    setExito(true)
  }

  if (exito) return (
    <PantallaAcceso>
      <Resultado
        icono={MailCheck}
        titulo="Revisa tu correo"
        accion={<Boton onClick={() => navigate('/login')} className="w-full">Ir a iniciar sesión</Boton>}
      >
        Te enviamos un enlace a <strong className="text-gray-800">{form.email}</strong>. Ábrelo para confirmar tu
        cuenta y después inicia sesión.
      </Resultado>
    </PantallaAcceso>
  )

  return (
    <PantallaAcceso
      titulo="Crear cuenta"
      descripcion="Un administrador asigna tu puesto después de que te registres."
      pie={<>¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-primary-600 hover:underline">Iniciar sesión</Link></>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="nombre" className={etiqueta}>Nombre completo</label>
          <input id="nombre" type="text" required autoComplete="name" className={campo}
            value={form.nombre} onChange={set('nombre')} />
        </div>
        <div>
          <label htmlFor="email" className={etiqueta}>Correo</label>
          <input id="email" type="email" required autoComplete="email" className={campo}
            placeholder="nombre@puenteambiental.com.mx"
            value={form.email} onChange={set('email')} />
        </div>

        <fieldset>
          <legend className={etiqueta}>Sucursal</legend>
          <div className="grid grid-cols-3 gap-2">
            {SUCURSALES.map(s => {
              const activa = form.sucursal === s.id
              return (
                <label key={s.id}
                  className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-600 ${
                    activa ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-linea text-gray-600 hover:border-primary-600/40'
                  }`}>
                  <input type="radio" name="sucursal" value={s.id} checked={activa}
                    onChange={() => setForm(p => ({ ...p, sucursal: s.id }))} className="sr-only" />
                  {SUCURSAL_CORTA[s.id]}
                </label>
              )
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="password" className={etiqueta}>Contraseña</label>
          <input id="password" type="password" required autoComplete="new-password" className={campo}
            placeholder="Mínimo 8 caracteres"
            value={form.password} onChange={set('password')} />
        </div>
        <div>
          <label htmlFor="confirmar" className={etiqueta}>Confirmar contraseña</label>
          <input id="confirmar" type="password" required autoComplete="new-password" className={campo}
            value={form.confirmar} onChange={set('confirmar')} />
        </div>

        {error && <p className="text-sm text-estado-rechazada" role="alert">{error}</p>}

        <Boton type="submit" disabled={cargando} className="w-full mt-1">
          {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
        </Boton>
      </form>
    </PantallaAcceso>
  )
}
