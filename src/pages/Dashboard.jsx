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

export default function Dashboard() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [cargando, setCargando]         = useState(true)
  const { perfil } = useAuth()
  const navigate   = useNavigate()

  useEffect(() => {
    obtenerCotizaciones()
      .then(setCotizaciones)
      .finally(() => setCargando(false))
  }, [])

  const total      = cotizaciones.length
  const esteAño    = cotizaciones.filter(c =>
    c.fecha?.includes(String(new Date().getFullYear()))
  ).length
  const aprobadas  = cotizaciones.filter(c => c.estatus === 'Aprobada').length
  const rechazadas = cotizaciones.filter(c => c.estatus === 'Rechazada').length
  const enRevision = cotizaciones.filter(c => !c.estatus || c.estatus === 'En revisión').length
  const vencidas   = cotizaciones.filter(c => estaVencida(c.fecha, c.cliente?.vigencia)).length

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
            <p className="text-xs text-gray-400 uppercase tracking-widest">Este año</p>
            <p className="text-3xl font-bold text-primary-600">{esteAño}</p>
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