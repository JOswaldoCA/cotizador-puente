import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerCotizaciones } from '../services/cotizaciones'
import { useAuth } from '../hooks/useAuth'
import { estaVencida } from '../utils/calculos'

const badgeEstatus = (e) => {
  if (e === 'Aprobada')  return 'bg-green-100 text-green-700'
  if (e === 'Rechazada') return 'bg-red-100 text-red-600'
  return 'bg-yellow-100 text-yellow-700'
}

const meses = {
  'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
  'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
  'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
}

const parsearFecha = (fechaStr) => {
  if (!fechaStr) return null
  const partes = fechaStr.toLowerCase().split(' de ')
  if (partes.length !== 3) return null
  return new Date(parseInt(partes[2]), meses[partes[1]], parseInt(partes[0]))
}

export default function Dashboard() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [periodo,      setPeriodo]      = useState('mes')
  const { perfil } = useAuth()
  const navigate   = useNavigate()

  useEffect(() => {
    obtenerCotizaciones()
      .then(setCotizaciones)
      .finally(() => setCargando(false))
  }, [])

  const hoy      = new Date()
  const total    = cotizaciones.length
  const vencidas = cotizaciones.filter(c => estaVencida(c.fecha, c.cliente?.vigencia)).length

  const delPeriodo = cotizaciones.filter(c => {
    const f = parsearFecha(c.fecha)
    if (!f) return false
    if (periodo === 'dia')  return f.toDateString() === hoy.toDateString()
    if (periodo === 'mes')  return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()
    if (periodo === 'año')  return f.getFullYear() === hoy.getFullYear()
    return false
  })

  const aprobadas  = cotizaciones.filter(c => c.estatus === 'Aprobada').length
  const rechazadas = cotizaciones.filter(c => c.estatus === 'Rechazada').length
  const enRevision = cotizaciones.filter(c => !c.estatus || c.estatus === 'En revisión').length

  if (cargando) return (
    <div className="flex justify-center py-20 text-gray-400 text-sm">Cargando...</div>
  )

  return (
    <div className="flex flex-col gap-6">

      {/* Saludo */}
      <div>
        <h2 className="text-xl font-bold text-primary-600">
          Hola, {perfil?.nombre?.split(' ')[0] || 'Usuario'} 👋
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {perfil?.rol === 'admin' ? 'Vista global — todas las sucursales.' : 'Aquí está el resumen de tu actividad.'}
        </p>
      </div>

      {/* Selector de período */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {[
          { key: 'dia', label: 'Hoy' },
          { key: 'mes', label: 'Este mes' },
          { key: 'año', label: 'Este año' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setPeriodo(key)}
            className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${
              periodo === key
                ? 'bg-primary-600 text-white'
                : 'text-gray-500 hover:text-primary-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl">📋</div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Total</p>
            <p className="text-3xl font-bold text-primary-600">{total}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-300/30 flex items-center justify-center text-2xl">📅</div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">
              {periodo === 'dia' ? 'Hoy' : periodo === 'mes' ? 'Este mes' : 'Este año'}
            </p>
            <p className="text-3xl font-bold text-primary-600">{delPeriodo.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-2xl">⚠️</div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Vencidas</p>
            <p className="text-3xl font-bold text-red-500">{vencidas}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-primary-600 transition-colors"
          onClick={() => navigate('/nueva')}>
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-2xl">➕</div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Acción</p>
            <p className="text-sm font-semibold text-primary-600">Nueva cotización</p>
          </div>
        </div>
      </div>

      {/* Tarjetas de estatus */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center text-2xl">🔍</div>
          <div>
            <p className="text-xs text-yellow-600 uppercase tracking-widest font-medium">En revisión</p>
            <p className="text-3xl font-bold text-yellow-700">{enRevision}</p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">✅</div>
          <div>
            <p className="text-xs text-green-600 uppercase tracking-widest font-medium">Aprobadas</p>
            <p className="text-3xl font-bold text-green-700">{aprobadas}</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-2xl">❌</div>
          <div>
            <p className="text-xs text-red-600 uppercase tracking-widest font-medium">Rechazadas</p>
            <p className="text-3xl font-bold text-red-700">{rechazadas}</p>
          </div>
        </div>
      </div>

      {/* Solo admin — resumen por sucursal */}
      {perfil?.rol === 'admin' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-primary-600">Resumen por sucursal</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {['SUC. MATRIZ', 'SUC. GUAYMAS', 'SUC. OBREGON'].map(tipo => {
              const tots       = cotizaciones.filter(c => c.sucursal?.tipo === tipo).length
              const aprobadas  = cotizaciones.filter(c => c.sucursal?.tipo === tipo && c.estatus === 'Aprobada').length
              const rechazadas = cotizaciones.filter(c => c.sucursal?.tipo === tipo && c.estatus === 'Rechazada').length
              const revision   = cotizaciones.filter(c => c.sucursal?.tipo === tipo && (!c.estatus || c.estatus === 'En revisión')).length
              return (
                <div key={tipo} className="px-6 py-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{tipo}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400">{tots} total</span>
                    <span className="bg-yellow-100 text-yellow-700 font-medium px-2 py-0.5 rounded-lg">{revision} en revisión</span>
                    <span className="bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-lg">{aprobadas} aprobadas</span>
                    <span className="bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-lg">{rechazadas} rechazadas</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Últimas cotizaciones */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary-600">Últimas cotizaciones</h3>
          <button onClick={() => navigate('/cotizaciones')}
            className="text-xs text-primary-600 hover:underline">Ver todas</button>
        </div>
        {cotizaciones.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            No hay cotizaciones aún.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3 text-left">Cliente</th>
                <th className="px-6 py-3 text-left">Folio</th>
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Sucursal</th>
                <th className="px-6 py-3 text-left">Estatus</th>
                <th className="px-6 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.slice(0, 8).map((cot, i) => (
                <tr key={cot.folio}
                  className={`text-sm border-t border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-800">{cot.cliente?.contacto || '—'}</p>
                    <p className="text-xs text-gray-400">{cot.cliente?.atencion}</p>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-gray-500">{cot.folio}</td>
                  <td className="px-6 py-3 text-gray-500 text-xs">{cot.fecha}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded-lg font-medium">
                      {cot.sucursal?.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${badgeEstatus(cot.estatus)}`}>
                      {cot.estatus || 'En revisión'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => window.open(`/preview/${cot.folio}`, '_blank')}
                      className="text-xs text-primary-600 hover:underline">Ver PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}