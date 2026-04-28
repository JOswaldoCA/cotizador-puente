import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logoPA.png'

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-600'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]         = useState({ email: '', password: '' })
  const [error, setError]       = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    const { error } = await login(form.email, form.password)
    setCargando(false)
    if (error) setError('Correo o contraseña incorrectos.')
    else navigate('/')
  }

  return (
    <div className="min-h-screen flex">

      {/* Panel izquierdo */}
      <div className="hidden lg:flex w-1/2 bg-primary-600 flex-col items-center justify-center p-12">
        <img src={logo} alt="Puente Ambiental" className="w-56 object-contain mb-8" />
        <h2 className="text-white text-2xl font-bold text-center mb-3">
          Sistema de Cotizaciones
        </h2>
        <p className="text-blue-200 text-sm text-center leading-relaxed max-w-xs">
          Gestiona y envía cotizaciones profesionales para el servicio de recolección de residuos sólidos urbanos.
        </p>
        <div className="mt-10 flex flex-col gap-3 w-full max-w-xs">
          {['Genera cotizaciones en segundos', 'Envía por correo al cliente', 'Historial completo de propuestas'].map(f => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-accent-400 flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">✓</div>
              <p className="text-blue-200 text-xs">{f}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logo} alt="Puente Ambiental" className="h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-primary-600 mb-1">Bienvenido</h1>
          <p className="text-sm text-gray-400 mb-8">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Correo electrónico</label>
              <input type="email" required className={input} placeholder="usuario@empresa.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Contraseña</label>
              <input type="password" required className={input} placeholder="••••••••"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            <button type="submit" disabled={cargando}
              className="w-full bg-primary-600 hover:bg-primary-800 disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-lg transition-colors mt-1">
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-primary-600 font-semibold hover:underline">Registrarse</Link>
          </p>
        </div>
      </div>

    </div>
  )
}