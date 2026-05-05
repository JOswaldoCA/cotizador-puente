import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { SUCURSALES } from '../utils/constantes'
import logo from '../assets/logoPA.png'

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-200 bg-gray-50'
const labelCls = 'text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block'

const PanelIzquierdo = () => (
    <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #1B3A6B 0%, #0F2347 60%, #091629 100%)' }}>
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #FFD700, transparent)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-5"
        style={{ background: 'radial-gradient(circle, #3B6DB5, transparent)', transform: 'translate(-30%, 30%)' }} />
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/10">
          <img src={logo} alt="Puente Ambiental" className="w-44 object-contain" />
        </div>
        <h2 className="text-white text-2xl font-bold text-center mb-3 tracking-tight">Únete al sistema</h2>
        <p className="text-blue-300/80 text-sm text-center leading-relaxed mb-8">
          Crea tu cuenta para acceder al sistema de cotizaciones de Puente Ambiental del Noroeste.
        </p>
        <div className="flex flex-col gap-3 w-full">
          {[
            { icon: '🔐', text: 'Acceso seguro con autenticación' },
            { icon: '🏢', text: 'Asignado a tu sucursal' },
            { icon: '📊', text: 'Dashboard personalizado' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                style={{ background: 'rgba(255,215,0,0.15)' }}>
                {icon}
              </div>
              <p className="text-blue-200/90 text-xs font-medium">{text}</p>
            </div>
          ))}
        </div>
        <p className="text-blue-400/40 text-xs mt-10 text-center">
          © {new Date().getFullYear()} Puente Ambiental del Noroeste S.A de C.V
        </p>
      </div>
    </div>
  )

export default function Registro() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: '', email: '', sucursal: 'matriz', password: '', confirmar: '',
  })
  const [error,    setError]    = useState('')
  const [exito,    setExito]    = useState(false)
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

  // Pasar nombre y sucursal como metadata
  const { error: errAuth } = await supabase.auth.signUp({
    email:    form.email,
    password: form.password,
    options: {
      data: {
        nombre:      form.nombre,
        sucursal_id: form.sucursal,
      }
    }
  })

  if (errAuth) {
    setCargando(false)
    if (errAuth.message.includes('already registered')) {
      return setError('Este correo ya está registrado. Intenta iniciar sesión.')
    }
    return setError(errAuth.message)
  }

  setCargando(false)
  setExito(true)
}
  

  if (exito) return (
    <div className="min-h-screen flex" style={{ background: '#F0F4F8' }}>
      <PanelIzquierdo />
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center flex flex-col items-center gap-5"
            style={{ boxShadow: '0 8px 32px rgba(27,58,107,0.1)' }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
              style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border: '1px solid #A7F3D0' }}>
              ✅
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#1B3A6B' }}>¡Cuenta creada!</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Revisa tu correo <strong className="text-gray-700">{form.email}</strong> y confirma tu cuenta antes de iniciar sesión.
              </p>
            </div>
            <button onClick={() => navigate('/login')}
              className="w-full text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)',
                boxShadow: '0 4px 16px rgba(27,58,107,0.3)',
              }}>
              Ir al login →
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ background: '#F0F4F8' }}>
      <PanelIzquierdo />

      {/* Panel derecho */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #1B3A6B, #0F2347)' }}>
              <img src={logo} alt="Puente Ambiental" className="h-10 object-contain" />
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100"
            style={{ boxShadow: '0 8px 32px rgba(27,58,107,0.1), 0 1px 3px rgba(27,58,107,0.06)' }}>

            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#1B3A6B' }}>
                Crear cuenta
              </h1>
              <p className="text-sm text-gray-400">Completa los datos para registrarte</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              <div>
                <label className={labelCls}>Nombre completo</label>
                <input type="text" required className={inputCls}
                  placeholder="Tu nombre completo"
                  value={form.nombre} onChange={set('nombre')} />
              </div>

              <div>
                <label className={labelCls}>Correo electrónico</label>
                <input type="email" required className={inputCls}
                  placeholder="usuario@empresa.com"
                  value={form.email} onChange={set('email')} />
              </div>

              {/* Selector sucursal */}
              <div>
                <label className={labelCls}>Sucursal</label>
                <div className="flex flex-col gap-2">
                  {SUCURSALES.map(s => (
                    <button key={s.id} type="button"
                      onClick={() => setForm(p => ({ ...p, sucursal: s.id }))}
                      className="w-full rounded-xl border-2 px-4 py-3 text-left transition-all duration-200 flex items-center gap-3"
                      style={form.sucursal === s.id ? {
                        borderColor: '#1B3A6B',
                        background: 'linear-gradient(135deg, #EEF2FF, #DBEAFE)',
                      } : {
                        borderColor: '#E5E7EB',
                        background: 'white',
                      }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{
                          background: form.sucursal === s.id
                            ? 'linear-gradient(135deg, #1B3A6B, #0F2347)'
                            : '#F3F4F6',
                        }}>
                        🏢
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${form.sucursal === s.id ? 'text-primary-600' : 'text-gray-600'}`}>
                          {s.tipo}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.ciudad}</p>
                      </div>
                      {form.sucursal === s.id && (
                        <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: '#1B3A6B' }}>
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Contraseña</label>
                <input type="password" required className={inputCls}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password} onChange={set('password')} />
              </div>

              <div>
                <label className={labelCls}>Confirmar contraseña</label>
                <input type="password" required className={inputCls}
                  placeholder="Repite la contraseña"
                  value={form.confirmar} onChange={set('confirmar')} />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="text-red-500">⚠️</span>
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}

              <button type="submit" disabled={cargando}
                className="w-full text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                style={{
                  background: cargando ? '#6B7280' : 'linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)',
                  boxShadow: cargando ? 'none' : '0 4px 16px rgba(27,58,107,0.3)',
                }}>
                {cargando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creando cuenta...
                  </>
                ) : 'Crear cuenta →'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="font-bold hover:underline" style={{ color: '#1B3A6B' }}>
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
            <p className="text-xs text-gray-400">Conexión segura · Datos encriptados</p>
          </div>

        </div>
      </div>
    </div>
  )
}