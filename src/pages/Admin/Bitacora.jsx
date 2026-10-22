import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheck, CircleX, FilePlus2, Pencil, RefreshCw, ScrollText, Search, Send, Trash2, X } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'
import Boton from '../../components/ui/Boton'
import Paginacion from '../../components/ui/Paginacion'
import { campo, etiqueta } from '../../components/ui/estilos'

// Cada acción como verbo para leer el registro como una frase
const ACCIONES = {
  'CREÓ':           { verbo: 'creó',                  icono: FilePlus2,   tono: 'text-primary-600 bg-primary-50' },
  'EDITÓ':          { verbo: 'editó',                 icono: Pencil,      tono: 'text-primary-600 bg-primary-50' },
  'ENVIÓ CORREO':   { verbo: 'envió por correo',      icono: Send,        tono: 'text-primary-600 bg-primary-50' },
  'CAMBIÓ ESTATUS': { verbo: 'cambió el estatus de',  icono: RefreshCw,   tono: 'text-estado-revision bg-estado-revision/10' },
  'APROBÓ':         { verbo: 'aprobó',                icono: CircleCheck, tono: 'text-estado-aprobada bg-estado-aprobada/10' },
  'RECHAZÓ':        { verbo: 'rechazó',               icono: CircleX,     tono: 'text-estado-rechazada bg-estado-rechazada/10' },
  'ELIMINÓ':        { verbo: 'eliminó',               icono: Trash2,      tono: 'text-estado-rechazada bg-estado-rechazada/10' },
}
const accion = (a) => ACCIONES[a] || { verbo: a?.toLowerCase(), icono: ScrollText, tono: 'text-gray-500 bg-gray-100' }

const SUCURSALES_FILTRO = [
  { id: 'MATRIZ', label: 'Matriz' },
  { id: 'GUAYMAS', label: 'Guaymas' },
  { id: 'OBREGON', label: 'Obregón' },
]
// Registros anteriores pueden traer "OBREGON" u "OBREGÓN"
const normalizar = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()

const POR_PAGINA = 30

const tituloDia = (fecha, hoy) => {
  const d = new Date(fecha)
  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)
  if (d.toDateString() === hoy.toDateString()) return 'Hoy'
  if (d.toDateString() === ayer.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
    ...(d.getFullYear() !== hoy.getFullYear() && { year: 'numeric' }),
  })
}

export default function Bitacora() {
  const { perfil } = useAuth()
  const navigate   = useNavigate()

  const [registros,      setRegistros]      = useState([])
  const [cargando,       setCargando]       = useState(true)
  const [hoy,            setHoy]            = useState(() => new Date())
  const [busqueda,       setBusqueda]       = useState('')
  const [filtroAccion,   setFiltroAccion]   = useState('')
  const [filtroSucursal, setFiltroSucursal] = useState('')
  const [pagina,         setPagina]         = useState(1)

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
      setHoy(new Date())
      setCargando(false)
    }
    fetchData()
  }, [perfil, navigate])

  const conFiltro = (set) => (e) => { set(e.target.value); setPagina(1) }

  const filtrados = registros.filter(r => {
    const q = busqueda.toLowerCase()
    const matchBusqueda = !q ||
      r.nombre_usuario?.toLowerCase().includes(q) ||
      r.folio?.toLowerCase().includes(q) ||
      r.detalle?.toLowerCase().includes(q)
    const matchAccion   = !filtroAccion   || r.accion === filtroAccion
    const matchSucursal = !filtroSucursal || normalizar(r.sucursal).includes(filtroSucursal)
    return matchBusqueda && matchAccion && matchSucursal
  })

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA)
  const paginados    = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const hayFiltros   = busqueda || filtroAccion || filtroSucursal

  // Agrupa la página actual por día
  const porDia = useMemo(() => {
    const grupos = []
    for (const r of paginados) {
      const titulo = tituloDia(r.created_at, hoy)
      if (grupos.at(-1)?.titulo !== titulo) grupos.push({ titulo, registros: [] })
      grupos.at(-1).registros.push(r)
    }
    return grupos
  }, [paginados, hoy])

  if (cargando) return (
    <div className="flex justify-center items-center py-20 gap-3 text-gray-400 text-sm">
      <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
      Cargando bitácora...
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-primary-800">Bitácora</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Quién hizo qué con cada cotización. Se registra automáticamente.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-linea p-4 grid gap-3 grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] items-end">
        <div className="relative col-span-2 lg:col-span-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar"
            placeholder="Buscar por persona, folio o detalle"
            value={busqueda}
            onChange={conFiltro(setBusqueda)}
            className={`${campo} pl-9`}
          />
        </div>
        <label>
          <span className={etiqueta}>Acción</span>
          <select value={filtroAccion} onChange={conFiltro(setFiltroAccion)} className={campo}>
            <option value="">Todas</option>
            {Object.entries(ACCIONES).map(([a, { verbo }]) => (
              <option key={a} value={a}>{verbo.charAt(0).toUpperCase() + verbo.slice(1)}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={etiqueta}>Sucursal</span>
          <select value={filtroSucursal} onChange={conFiltro(setFiltroSucursal)} className={campo}>
            <option value="">Todas</option>
            {SUCURSALES_FILTRO.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <div className="col-span-full flex items-center justify-between -mb-1">
          <p className="text-xs text-gray-500">
            {filtrados.length} de {registros.length} registros
            {registros.length === 500 && ' (se muestran los 500 más recientes)'}
          </p>
          {hayFiltros && (
            <Boton variante="fantasma" tamaño="sm" icono={X}
              onClick={() => { setBusqueda(''); setFiltroAccion(''); setFiltroSucursal(''); setPagina(1) }}>
              Quitar filtros
            </Boton>
          )}
        </div>
      </div>

      {/* Registro por día */}
      {porDia.length === 0 ? (
        <div className="bg-white rounded-2xl border border-linea py-16 text-center">
          <p className="text-sm text-gray-600">
            {registros.length === 0 ? 'Todavía no hay movimientos registrados.' : 'Ningún registro coincide con los filtros.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {porDia.map(({ titulo, registros: delDia }) => (
            <section key={titulo} className="bg-white rounded-2xl border border-linea overflow-hidden">
              <h3 className="px-4 lg:px-5 py-2.5 border-b border-linea bg-gray-50 text-xs font-semibold text-gray-600 first-letter:uppercase">
                {titulo}
              </h3>
              <ol className="divide-y divide-linea">
                {delDia.map(r => {
                  const a = accion(r.accion)
                  const Icono = a.icono
                  return (
                    <li key={r.id} className="px-4 lg:px-5 py-3 flex items-start gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.tono}`} aria-hidden="true">
                        <Icono size={16} strokeWidth={2} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-gray-900">{r.nombre_usuario || 'Usuario'}</span>{' '}
                          {a.verbo}{' '}
                          {r.folio && <span className="font-mono text-xs text-primary-800 bg-primary-50 px-1.5 py-0.5 rounded">{r.folio}</span>}
                        </p>
                        {r.detalle && <p className="text-xs text-gray-500 mt-0.5 break-words">{r.detalle}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-600 tabular-nums">
                          {new Date(r.created_at).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                        {r.sucursal && <p className="text-xs text-gray-400 capitalize">{r.sucursal.replace('SUC. ', '').toLowerCase()}</p>}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

      <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
    </div>
  )
}
