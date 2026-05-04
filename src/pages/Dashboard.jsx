import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerCotizaciones } from '../services/cotizaciones'
import { useAuth } from '../hooks/useAuth'
import { estaVencida } from '../utils/calculos'

const badgeEstatus = (e) => {
  if (e === 'Aprobada')  return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (e === 'Rechazada') return 'bg-red-50 text-red-600 border border-red-200'
  return 'bg-amber-50 text-amber-700 border border-amber-200'
}

const meses = {
  'enero':0,'febrero':1,'marzo':2,'abril':3,'mayo':4,'junio':5,
  'julio':6,'agosto':7,'septiembre':8,'octubre':9,'noviembre':10,'diciembre':11,
}

const parsearFecha = (fechaStr) => {
  if (!fechaStr) return null
  const partes = fechaStr.toLowerCase().split(' de ')
  if (partes.length !== 3) return null
  return new Date(parseInt(partes[2]), meses[partes[1]], parseInt(partes[0]))
}

const StatCard = ({ icon, label, value, color, onClick, gradient }) => (
  <div onClick={onClick}
    className={`rounded-2xl p-4 lg:p-5 flex items-center gap-3 lg:gap-4 border transition-all duration-200 ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
    style={{
      background: gradient || 'white',
      borderColor: 'rgba(27,58,107,0.08)',
      boxShadow: '0 1px 3px rgba(27,58,107,0.06)',
    }}>
    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
      style={{ background: color }}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-2xl lg:text-3xl font-bold mt-0.5" style={{ color: '#1B3A6B' }}>{value}</p>
    </div>
  </div>
)

export default function Dashboard() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [periodo,      setPeriodo]      = useState('mes')
  const { perfil } = useAuth()
  const navigate   = useNavigate()

  useEffect(() => {
    obtenerCotizaciones().then(setCotizaciones).finally(() => setCargando(false))
  }, [])

  const hoy      = new Date()
  const total    = cotizaciones.length
  const vencidas = cotizaciones.filter(c => estaVencida(c.fecha, c.cliente?.vigencia)).length

  const delPeriodo = cotizaciones.filter(c => {
    const f = parsearFecha(c.fecha)
    if (!f) return false
    if (periodo === 'dia') return f.toDateString() === hoy.toDateString()
    if (periodo === 'mes') return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()
    if (periodo === 'año') return f.getFullYear() === hoy.getFullYear()
    return false
  })

  const aprobadas  = cotizaciones.filter(c => c.estatus === 'Aprobada').length
  const rechazadas = cotizaciones.filter(c => c.estatus === 'Rechazada').length
  const enRevision = cotizaciones.filter(c => !c.estatus || c.estatus === 'En revisión').length

  if (cargando) return (
    <div className="flex justify-center items-center py-20 gap-3 text-gray-400 text-sm">
      <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
      Cargando dashboard...
    </div>
  )

  return (
    <div className="flex flex-col gap-5 lg:gap-6">

      {/* Saludo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight" style={{ color: '#1B3A6B' }}>
            Hola, {perfil?.nombre?.split(' ')[0] || 'Usuario'} 👋
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {perfil?.rol === 'admin'
              ? '👁️ Vista global — todas las sucursales'
              : 'Aquí está el resumen de tu actividad'}
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs text-gray-400 font-medium">
            {hoy.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Selector de período */}
      <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 w-full sm:w-fit"
        style={{ boxShadow: '0 1px 3px rgba(27,58,107,0.06)' }}>
        {[
          { key: 'dia', label: '📆 Hoy' },
          { key: 'mes', label: '🗓️ Este mes' },
          { key: 'año', label: '📊 Este año' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setPeriodo(key)}
            className="flex-1 sm:flex-none text-xs font-semibold px-3 lg:px-5 py-2 rounded-xl transition-all duration-200"
            style={periodo === key ? {
              background: 'linear-gradient(135deg, #1B3A6B, #0F2347)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(27,58,107,0.3)',
            } : { color: '#6B7280' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard icon="📋" label="Total" value={total} color="rgba(27,58,107,0.08)" />
        <StatCard
          icon="📅"
          label={periodo === 'dia' ? 'Hoy' : periodo === 'mes' ? 'Este mes' : 'Este año'}
          value={delPeriodo.length}
          color="rgba(255,215,0,0.2)"
        />
        <StatCard icon="⚠️" label="Vencidas" value={vencidas} color="rgba(239,68,68,0.1)"
          gradient={vencidas > 0 ? 'linear-gradient(135deg, #FFF5F5, #FEE2E2)' : 'white'} />
        <StatCard icon="➕" label="Nueva" value="Crear"
          color="rgba(27,58,107,0.9)"
          onClick={() => navigate('/nueva')}
          gradient="linear-gradient(135deg, #EEF2FF, #DBEAFE)" />
      </div>

      {/* Tarjetas estatus */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        <div className="rounded-2xl p-3 lg:p-5 border border-amber-200 flex items-center gap-2 lg:gap-4"
          style={{ background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', boxShadow: '0 1px 3px rgba(217,119,6,0.08)' }}>
          <div className="w-9 h-9 lg:w-12 lg:h-12 rounded-xl bg-amber-100 flex items-center justify-center text-lg lg:text-2xl flex-shrink-0">🔍</div>
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide hidden sm:block">En revisión</p>
            <p className="text-xs font-bold text-amber-600 sm:hidden">Revisión</p>
            <p className="text-2xl lg:text-3xl font-bold text-amber-700">{enRevision}</p>
          </div>
        </div>
        <div className="rounded-2xl p-3 lg:p-5 border border-emerald-200 flex items-center gap-2 lg:gap-4"
          style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', boxShadow: '0 1px 3px rgba(16,185,129,0.08)' }}>
          <div className="w-9 h-9 lg:w-12 lg:h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-lg lg:text-2xl flex-shrink-0">✅</div>
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Aprobadas</p>
            <p className="text-2xl lg:text-3xl font-bold text-emerald-700">{aprobadas}</p>
          </div>
        </div>
        <div className="rounded-2xl p-3 lg:p-5 border border-red-200 flex items-center gap-2 lg:gap-4"
          style={{ background: 'linear-gradient(135deg, #FFF5F5, #FEE2E2)', boxShadow: '0 1px 3px rgba(239,68,68,0.08)' }}>
          <div className="w-9 h-9 lg:w-12 lg:h-12 rounded-xl bg-red-100 flex items-center justify-center text-lg lg:text-2xl flex-shrink-0">❌</div>
          <div>
            <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Rechazadas</p>
            <p className="text-2xl lg:text-3xl font-bold text-red-700">{rechazadas}</p>
          </div>
        </div>
      </div>

      {/* Resumen por sucursal — solo admin */}
      {perfil?.rol === 'admin' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(27,58,107,0.06)' }}>
          <div className="px-4 lg:px-6 py-4 border-b border-gray-100 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #F8FAFF, #EEF2FF)' }}>
            <span className="text-lg">🏢</span>
            <h3 className="text-sm font-bold text-primary-600">Resumen por sucursal</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { tipo: 'SUC. MATRIZ',  icon: '🏙️' },
              { tipo: 'SUC. GUAYMAS', icon: '⚓' },
              { tipo: 'SUC. OBREGON', icon: '🌵' },
            ].map(({ tipo, icon }) => {
              const tots       = cotizaciones.filter(c => c.sucursal?.tipo === tipo).length
              const aprobadas  = cotizaciones.filter(c => c.sucursal?.tipo === tipo && c.estatus === 'Aprobada').length
              const rechazadas = cotizaciones.filter(c => c.sucursal?.tipo === tipo && c.estatus === 'Rechazada').length
              const revision   = cotizaciones.filter(c => c.sucursal?.tipo === tipo && (!c.estatus || c.estatus === 'En revisión')).length
              return (
                <div key={tipo} className="px-4 lg:px-6 py-3 lg:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-700">{tipo}</p>
                      <p className="text-xs text-gray-400">{tots} totales</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-lg border border-amber-200">
                      {revision} revisión
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-lg border border-emerald-200">
                      {aprobadas} aprobadas
                    </span>
                    <span className="bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-lg border border-red-200">
                      {rechazadas} rechazadas
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Últimas cotizaciones */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(27,58,107,0.06)' }}>
        <div className="px-4 lg:px-6 py-4 border-b border-gray-100 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #F8FAFF, #EEF2FF)' }}>
          <div className="flex items-center gap-3">
            <span className="text-lg">📋</span>
            <h3 className="text-sm font-bold text-primary-600">Últimas cotizaciones</h3>
          </div>
          <button onClick={() => navigate('/cotizaciones')}
            className="text-xs font-semibold text-primary-600 hover:text-primary-800 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors border border-primary-100">
            Ver todas →
          </button>
        </div>

        {cotizaciones.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm font-medium text-gray-500">No hay cotizaciones aún</p>
            <button onClick={() => navigate('/nueva')}
              className="mt-4 text-xs font-semibold text-primary-600 hover:underline">
              Crear primera cotización →
            </button>
          </div>
        ) : (
          <>
            {/* Cards móvil */}
            <div className="lg:hidden divide-y divide-gray-50">
              {cotizaciones.slice(0, 5).map((cot) => (
                <div key={cot.folio} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{cot.cliente?.contacto || '—'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {cot.folio.split('-').slice(-1)[0]}
                      </span>
                      <span className="text-xs text-gray-400">{cot.fecha?.split(' ').slice(0,3).join(' ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${badgeEstatus(cot.estatus)}`}>
                      {cot.estatus || 'Revisión'}
                    </span>
                    <button onClick={() => window.open(`/preview/${cot.folio}`, '_blank')}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                      style={{ background: 'linear-gradient(135deg, #1B3A6B, #0F2347)' }}>
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabla desktop */}
            <table className="w-full hidden lg:table">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #1B3A6B, #0F2347)' }}>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-amber-300">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-blue-200">Folio</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-blue-200">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-blue-200">Sucursal</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-blue-200">Estatus</th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-blue-200">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cotizaciones.slice(0, 8).map((cot, i) => (
                  <tr key={cot.folio}
                    className={`hover:bg-primary-50/20 transition-colors duration-150 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-gray-800 text-sm">{cot.cliente?.contacto || '—'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{cot.cliente?.atencion}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{cot.folio}</span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">{cot.fecha}</td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs bg-primary-50 text-primary-600 px-2.5 py-1 rounded-lg font-semibold border border-primary-100">
                        {cot.sucursal?.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${badgeEstatus(cot.estatus)}`}>
                        {cot.estatus || 'En revisión'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button onClick={() => window.open(`/preview/${cot.folio}`, '_blank')}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-800 px-3 py-1.5 rounded-lg hover:bg-primary-50 border border-primary-100 transition-colors">
                        Ver PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

    </div>
  )
}