import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../services/supabase'
import { SUCURSALES } from '../utils/constantes'
import logo from '../assets/logoPA.png'

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white'
const label = 'text-xs font-medium text-gray-600 mb-1 block'

export default function Registro() {
  const { registro } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: '', email: '', sucursal: 'matriz', password: '', confirmar: '',
  })
  const [error, setError]       = useState('')
  const [exito, setExito]       = useState(false)
  const [cargando, setCargando] = useState(false)

  const set = (campo) => (e) => setForm(p => ({ ...p, [campo]: e.target.value }))

  const validar = () => {
    if (!form.nombre.trim())              return 'El nombre es obligatorio.'
    if (form.password.length < 8)         return 'La contraseña debe tener al menos 8 caracteres.'
    if (form.password !== form.confirmar) return 'Las contraseñas no coinciden.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const err = validar()
    if (err) return setError(err)
    setCargando(true)
    const { data, error: errAuth } = await registro(form.email, form.password)
    if (errAuth) { setCargando(false); return setError(errAuth.message) }
    if (data?.user) {
      await supabase.from('perfiles')
        .update({ nombre: form.nombre, sucursal_id: form.sucursal })
        .eq('id', data.user.id)
    }
    setCargando(false)
    setExito(true)
  }

  if (exito) return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-primary-600 items-center justify-center p-12">
        <img src={logo} alt="Puente Ambiental" className="w-56 object-contain" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">✓</div>
          <h2 className="text-xl font-bold text-primary-600">Cuenta creada</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Revisa tu correo <strong className="text-gray-700">{form.email}</strong> y confirma tu cuenta antes de iniciar sesión.
          </p>
          <button onClick={() => navigate('/login')}
            className="w-full bg-primary-600 text-white text-sm font-semibold py-3 rounded-lg hover:bg-primary-800 transition-colors">
            Ir al login
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex">

      {/* Panel izquierdo */}
      <div className="hidden lg:flex w-1/2 bg-primary-600 flex-col items-center justify-center p-12">
        <img src={logo} alt="Puente Ambiental" className="w-56 object-contain mb-8" />
        <h2 className="text-white text-2xl font-bold text-center mb-3">Únete al sistema</h2>
        <p className="text-blue-200 text-sm text-center leading-relaxed max-w-xs">
          Crea tu cuenta para acceder al sistema de cotizaciones de Puente Ambiental del Noroeste.
        </p>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logo} alt="Puente Ambiental" className="h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-primary-600 mb-1">Crear cuenta</h1>
          <p className="text-sm text-gray-400 mb-8">Completa los datos para registrarte</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div>
              <label className={label}>Nombre completo</label>
              <input type="text" required className={input}
                placeholder="Tu nombre completo"
                value={form.nombre} onChange={set('nombre')} />
            </div>

            <div>
              <label className={label}>Correo electrónico</label>
              <input type="email" required className={input}
                placeholder="usuario@empresa.com"
                value={form.email} onChange={set('email')} />
            </div>

            <div>
              <label className={label}>Sucursal</label>
              <div className="flex gap-2">
                {SUCURSALES.map(s => (
                  <button key={s.id} type="button"
                    onClick={() => setForm(p => ({ ...p, sucursal: s.id }))}
                    className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                      form.sucursal === s.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <p className={`text-xs font-semibold ${form.sucursal === s.id ? 'text-primary-600' : 'text-gray-700'}`}>
                      {s.tipo}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.ciudad}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={label}>Contraseña</label>
              <input type="password" required className={input}
                placeholder="Mínimo 8 caracteres"
                value={form.password} onChange={set('password')} />
            </div>

            <div>
              <label className={label}>Confirmar contraseña</label>
              <input type="password" required className={input}
                placeholder="Repite la contraseña"
                value={form.confirmar} onChange={set('confirmar')} />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={cargando}
              className="w-full bg-primary-600 hover:bg-primary-800 disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-lg transition-colors mt-1">
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}