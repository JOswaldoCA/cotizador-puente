import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const AHORA = Date.now()

const accionConfig = (accion) => {
  const map = {
    'CREÓ':           { color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0', icon: '✨' },
    'EDITÓ':          { color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE', icon: '✏️' },
    'ELIMINÓ':        { color: '#991B1B', bg: '#FFF5F5', border: '#FECACA', icon: '🗑️' },
    'APROBÓ':         { color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0', icon: '✅' },
    'RECHAZÓ':        { color: '#991B1B', bg: '#FFF5F5', border: '#FECACA', icon: '❌' },
    'CAMBIÓ ESTATUS': { color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', icon: '🔄' },
    'ENVIÓ CORREO':   { color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE', icon: '✉️' },
  }
  return map[accion] || { color: '#374151', bg: '#F3F4F6', border: '#E5E7EB', icon: '📋' }
}

const sucursalColor = (s) => {
  if (!s) return { bg: '#F3F4F6', border: '#E5E7EB', text: '#374151' }
  if (s.includes('MATRIZ'))  return { bg: '#EEF2FF', border: '#C7D2FE', text: '#3730A3' }
  if (s.includes('GUAYMAS')) return { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' }
  if (s.includes('OBREGON') || s.includes('OBREGÓN')) return { bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412' }
  return { bg: '#F3F4F6', border: '#E5E7EB', text: '#374151' }
}

const tiempoDesde = (fecha) => {
  if (!fecha) return '—'
  const diff = AHORA - new Date(fecha).getTime()
  const min  = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const dias = Math.floor(diff / 86400000)
  if (min < 2)   return 'ahora mismo'
  if (min < 60)  return `hace ${min} min`
  if (hrs < 24)  return `hace ${hrs}h`
  if (dias < 30) return `hace ${dias}d`
  return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatFecha = (fecha) => {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const ACCIONES = ['CREÓ', 'EDITÓ', 'ELIMINÓ', 'APROBÓ', 'RECHAZÓ', 'CAMBIÓ ESTATUS', 'ENVIÓ CORREO']

export default function Bitacora() {
  const { perfil } = useAuth()
  const navigate   = useNavigate()

  const [registros,      setRegistros]      = useState([])
  const [cargando,       setCargando]       = useState(true)
  const [busqueda,       setBusqueda]       = useState('')
  const [filtroAccion,   setFiltroAccion]   = useState('')
  const [filtroSucursal, setFiltroSucursal] = useState('')
  const [pagina,         setPagina]         = useState(1)
  const POR_PAGINA = 20

  useEffect(() => {
    if (!perfil) return
    if (perfil.rol !== 'admin') { navigate('/'); return }
    const fetchData = async () => {
      setCargando(true)
      const { data, error } = await supabase
        .from('bitacora')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)
      if (!error) setRegistros(data || [])
      setCargando(false)
    }
    fetchData()
  }, [perfil, navigate])

  const filtrados = registros.filter(r => {
    const matchBusqueda = !busqueda ||
      r.nombre_usuario?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.folio?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.detalle?.toLowerCase().includes(busqueda.toLowerCase())
    const matchAccion   = !filtroAccion   || r.accion === filtroAccion
    const matchSucursal = !filtroSucursal || r.sucursal?.includes(filtroSucursal)
    return matchBusqueda && matchAccion && matchSucursal
  })

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA)
  const paginados    = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const resumen = ACCIONES.reduce((acc, a) => {
    acc[a] = registros.filter(r => r.accion === a).length
    return acc
  }, {})

  if (cargando) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: 'linear-gradient(135deg, #1B3A6B, #0F2347)' }}>📋</div>
      <div className="flex items-center gap-3 text-sm">
        <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
        Cargando bitácora...
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">

      {/* Header con breadcrumb */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1 hover:text-primary-600 transition-colors font-medium">
            📊 Dashboard
          </button>
          <span>›</span>
          <span className="text-primary-600 font-semibold">Bitácora</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold tracking-tight" style={{ color: '#1B3A6B' }}>
              Bitácora de operaciones
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Registro de todas las acciones realizadas en el sistema
            </p>
          </div>
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-primary-600 hover:text-primary-600 transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0">
            ← Volver
          </button>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: '📋', label: 'Total', value: registros.length, bg: 'linear-gradient(135deg, #1B3A6B, #0F2347)', text: 'text-white', sub: 'text-blue-300', shadow: '0 4px 16px rgba(27,58,107,0.3)' },
          { icon: '✨', label: 'Creadas', value: resumen['CREÓ'] || 0, bg: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border: '#A7F3D0', text: 'text-emerald-800', sub: 'text-emerald-600' },
          { icon: '✅', label: 'Aprobadas', value: resumen['APROBÓ'] || 0, bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '#BFDBFE', text: 'text-blue-800', sub: 'text-blue-600' },
          { icon: '❌', label: 'Rechazadas', value: resumen['RECHAZÓ'] || 0, bg: 'linear-gradient(135deg, #FFF5F5, #FEE2E2)', border: '#FECACA', text: 'text-red-800', sub: 'text-red-600' },
        ].map(({ icon, label, value, bg, border, text, sub, shadow }) => (
          <div key={label} className="rounded-2xl p-4 border flex flex-col gap-2"
            style={{ background: bg, borderColor: border || 'transparent', boxShadow: shadow || '0 1px 3px rgba(27,58,107,0.06)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xl">{icon}</span>
              <span className={`text-2xl lg:text-3xl font-bold ${text}`}>{value}</span>
            </div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${sub}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3"
        style={{ boxShadow: '0 1px 3px rgba(27,58,107,0.06)' }}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input type="text" placeholder="Buscar por usuario, folio o detalle..."
              value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-gray-50 transition-all duration-200" />
            {busqueda && (
              <button onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
            )}
          </div>
          <select value={filtroAccion} onChange={e => { setFiltroAccion(e.target.value); setPagina(1) }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-gray-50 transition-all duration-200">
            <option value="">Todas las acciones</option>
            {ACCIONES.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          {['MATRIZ', 'GUAYMAS', 'OBREGON'].map(s => (
            <button key={s} onClick={() => { setFiltroSucursal(filtroSucursal === s ? '' : s); setPagina(1) }}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all duration-200 ${filtroSucursal === s ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              {s === 'MATRIZ' ? '🏙️' : s === 'GUAYMAS' ? '⚓' : '🌵'} {s}
            </button>
          ))}
          {(busqueda || filtroAccion || filtroSucursal) && (
            <button onClick={() => { setBusqueda(''); setFiltroAccion(''); setFiltroSucursal(''); setPagina(1) }}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all duration-200 ml-auto">
              × Limpiar filtros
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">
          Mostrando <span className="font-semibold text-primary-600">{filtrados.length}</span> de{' '}
          <span className="font-semibold">{registros.length}</span> registros
        </p>
      </div>

      {/* Timeline — móvil */}
      <div className="flex flex-col gap-3 lg:hidden">
        {paginados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center"
            style={{ boxShadow: '0 1px 3px rgba(27,58,107,0.06)' }}>
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm font-medium text-gray-500">No hay registros</p>
          </div>
        ) : paginados.map((r) => {
          const cfg = accionConfig(r.accion)
          const sc  = sucursalColor(r.sucursal)
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              style={{ boxShadow: '0 2px 8px rgba(27,58,107,0.06)' }}>
              <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-50">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg border"
                      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
                      {r.accion}
                    </span>
                    {r.folio && (
                      <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg truncate">
                        {r.folio}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{tiempoDesde(r.created_at)}</p>
                </div>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Usuario</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, #FFE566, #FFD700)', color: '#1B3A6B' }}>
                      {r.nombre_usuario?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-semibold text-gray-700">{r.nombre_usuario || '—'}</span>
                  </div>
                </div>
                {r.sucursal && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Sucursal</span>
                    <span className="font-bold px-2 py-0.5 rounded-lg border text-xs"
                      style={{ background: sc.bg, borderColor: sc.border, color: sc.text }}>
                      {r.sucursal}
                    </span>
                  </div>
                )}
                {r.detalle && (
                  <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                    <p className="text-xs text-gray-500">{r.detalle}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: '0 2px 12px rgba(27,58,107,0.08)' }}>

        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #F8FAFF, #EEF2FF)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
              style={{ background: 'linear-gradient(135deg, #1B3A6B, #0F2347)' }}>📋</div>
            <div>
              <p className="text-sm font-bold text-primary-600">Registro de operaciones</p>
              <p className="text-xs text-gray-400">
                Página {pagina} de {totalPaginas || 1} · {filtrados.length} registros
              </p>
            </div>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)' }}>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-amber-300">Acción</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-blue-200">Usuario</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-blue-200">Folio</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-blue-200">Detalle</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-blue-200">Sucursal</th>
              <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-blue-200">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginados.map((r, i) => {
              const cfg = accionConfig(r.accion)
              const sc  = sucursalColor(r.sucursal)
              return (
                <tr key={r.id}
                  className={`transition-colors duration-150 hover:bg-primary-50/20 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}>

                  {/* Acción */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        {cfg.icon}
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg border"
                        style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
                        {r.accion}
                      </span>
                    </div>
                  </td>

                  {/* Usuario */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #FFE566, #FFD700)', color: '#1B3A6B' }}>
                        {r.nombre_usuario?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <p className="text-xs font-semibold text-gray-700">{r.nombre_usuario || '—'}</p>
                    </div>
                  </td>

                  {/* Folio */}
                  <td className="px-5 py-3.5">
                    {r.folio ? (
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                        {r.folio}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Detalle */}
                  <td className="px-5 py-3.5">
                    <p className="text-xs text-gray-500 max-w-xs truncate">{r.detalle || '—'}</p>
                  </td>

                  {/* Sucursal */}
                  <td className="px-5 py-3.5">
                    {r.sucursal ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg border"
                        style={{ background: sc.bg, borderColor: sc.border, color: sc.text }}>
                        {r.sucursal}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Fecha */}
                  <td className="px-5 py-3.5 text-right">
                    <p className="text-xs font-medium text-gray-600">{tiempoDesde(r.created_at)}</p>
                    <p className="text-xs text-gray-400">{formatFecha(r.created_at)}</p>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {paginados.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-sm font-semibold text-gray-500 mb-1">No hay registros</p>
            <p className="text-xs text-gray-400">Intenta ajustar los filtros</p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all duration-200 hover:scale-105 active:scale-95">
            ← Anterior
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              const p = pagina <= 3 ? i + 1 : pagina - 2 + i
              if (p < 1 || p > totalPaginas) return null
              return (
                <button key={p} onClick={() => setPagina(p)}
                  className="w-9 h-9 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105"
                  style={p === pagina ? {
                    background: 'linear-gradient(135deg, #1B3A6B, #0F2347)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(27,58,107,0.3)',
                  } : { border: '1px solid #E5E7EB', color: '#6B7280' }}>
                  {p}
                </button>
              )
            })}
          </div>
          <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all duration-200 hover:scale-105 active:scale-95">
            Siguiente →
          </button>
        </div>
      )}

    </div>
  )
}