import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileSpreadsheet,
  History,
  Inbox,
  Mail,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  obtenerCotizaciones,
  eliminarCotizacion,
  actualizarEstatus,
  obtenerSeguimiento,
} from "../services/cotizaciones";
import {
  diasParaVencer,
  fechaDeCotizacion,
  formatMXN,
  parsearFecha,
  textoVencimiento,
} from "../utils/calculos";
import {
  esSupervisor,
  puedeEditar as permisoEditar,
  puedeEliminar as permisoEliminar,
  puedeCambiarEstatus,
} from "../utils/permisos";
import { useAuth } from "../hooks/useAuth";
import { SUCURSALES, SUCURSAL_CORTA } from "../utils/constantes";
import { supabase } from "../services/supabase";
import { exportarCotizacionesExcel } from "../utils/exportarExcel";
import { useAvisos } from "../hooks/useAvisos";
import Boton from "../components/ui/Boton";
import BotonIcono from "../components/ui/BotonIcono";
import Modal from "../components/ui/Modal";
import { EtiquetaEstatus } from "../components/ui/Estatus";
import { campo, etiqueta } from "../components/ui/estilos";
import EnvioCorreo from "../components/EnvioCorreo";

const ESTATUS = ["En revisión", "Aprobada", "Rechazada"];
const POR_PAGINA = 15;

const fechaCorta = (cot) =>
  fechaDeCotizacion(cot)?.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) || cot.fecha;

// Solo las que siguen en revisión: aprobadas y rechazadas ya no requieren acción
function vencimiento(cot) {
  if (cot.estatus && cot.estatus !== "En revisión") return null;
  const dias = diasParaVencer(fechaDeCotizacion(cot), cot.cliente?.vigencia);
  if (dias === null || dias > 7) return null;
  return { dias, texto: textoVencimiento(dias), vencida: dias <= 0 };
}

const Vencimiento = ({ v }) =>
  v && (
    <span className={`block text-xs font-medium mt-1 ${v.vencida ? "text-estado-rechazada" : "text-estado-revision"}`}>
      {v.texto}
    </span>
  );

const Total = ({ opciones }) => {
  if (!opciones?.length) return <span className="text-gray-400">—</span>;
  return (
    <div className="whitespace-nowrap">
      <p className="text-sm font-medium text-gray-800">${formatMXN(opciones[0].total)}</p>
      {opciones.length > 1 && (
        <p className="text-xs text-gray-500">
          y {opciones.length - 1} {opciones.length === 2 ? "opción más" : "opciones más"}
        </p>
      )}
    </div>
  );
};

export default function Cotizaciones() {
  const { perfil } = useAuth();
  const { avisar, confirmar } = useAvisos();
  const navigate = useNavigate();
  const supervisor = esSupervisor(perfil);

  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");
  const [filtroSucursal, setFiltroSucursal] = useState("");
  const [filtroVendedor, setFiltroVendedor] = useState("");
  const [nombres, setNombres] = useState({});
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [correoModal, setCorreoModal] = useState(null);
  const [seguimientoModal, setSeguimientoModal] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargandoHist, setCargandoHist] = useState(false);
  const [nuevoEstatus, setNuevoEstatus] = useState("");
  const [notaEstatus, setNotaEstatus] = useState("");
  const [guardandoEst, setGuardandoEst] = useState(false);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    obtenerCotizaciones()
      .then(setCotizaciones)
      .finally(() => setCargando(false));
  }, []);

  // Nombres de quienes crearon cada cotización (supervisores ven las de todos)
  useEffect(() => {
    if (!supervisor) return;
    supabase
      .from("perfiles")
      .select("id, nombre")
      .then(({ data }) => setNombres(Object.fromEntries((data || []).map((p) => [p.id, p.nombre]))));
  }, [supervisor]);

  const vendedores = useMemo(
    () =>
      [...new Set(cotizaciones.map((c) => c.usuario_id))]
        .map((id) => ({ id, nombre: nombres[id] || "Usuario" }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [cotizaciones, nombres],
  );

  // Cualquier filtro regresa a la primera página
  const conFiltro = (set) => (e) => {
    set(e.target.value);
    setPagina(1);
  };

  const eliminar = async (folio) => {
    const ok = await confirmar(`¿Eliminar la cotización ${folio}? No se puede deshacer.`, {
      titulo: "Eliminar cotización",
      textoAceptar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    try {
      await eliminarCotizacion(folio);
      setCotizaciones((prev) => prev.filter((c) => c.folio !== folio));
      avisar(`Cotización ${folio} eliminada.`, "exito");
    } catch (e) {
      avisar("No se pudo eliminar: " + e.message);
    }
  };

  const abrirSeguimiento = async (cot) => {
    setSeguimientoModal(cot);
    setNuevoEstatus(cot.estatus || "En revisión");
    setNotaEstatus("");
    setCargandoHist(true);
    try {
      setHistorial(await obtenerSeguimiento(cot.id));
    } catch {
      setHistorial([]);
    }
    setCargandoHist(false);
  };

  const guardarEstatus = async () => {
    const estatusActual = seguimientoModal.estatus || "En revisión";
    if (!nuevoEstatus || nuevoEstatus === estatusActual) return;

    const ok = await confirmar(
      `¿Cambiar el estatus de "${estatusActual}" a "${nuevoEstatus}"?${notaEstatus ? `\n\nNota: ${notaEstatus}` : ""}`,
      { titulo: "Cambiar estatus", textoAceptar: "Cambiar" },
    );
    if (!ok) return;

    setGuardandoEst(true);
    try {
      await actualizarEstatus(seguimientoModal.folio, nuevoEstatus, notaEstatus, perfil);
      setCotizaciones((prev) =>
        prev.map((c) =>
          c.folio === seguimientoModal.folio ? { ...c, estatus: nuevoEstatus, notas_seguimiento: notaEstatus } : c,
        ),
      );
      setHistorial(await obtenerSeguimiento(seguimientoModal.id));
      setNotaEstatus("");
      setSeguimientoModal((prev) => ({ ...prev, estatus: nuevoEstatus }));
      avisar(`Estatus cambiado a ${nuevoEstatus}.`, "exito");
    } catch (e) {
      avisar("No se pudo cambiar el estatus: " + e.message);
    }
    setGuardandoEst(false);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstatus("");
    setFiltroSucursal("");
    setFiltroVendedor("");
    setFechaDesde("");
    setFechaHasta("");
    setPagina(1);
  };

  const hayFiltros = busqueda || filtroEstatus || filtroSucursal || filtroVendedor || fechaDesde || fechaHasta;

  const filtradas = cotizaciones.filter((c) => {
    const q = busqueda.toLowerCase();
    const matchBusqueda =
      c.cliente?.contacto?.toLowerCase().includes(q) ||
      c.cliente?.atencion?.toLowerCase().includes(q) ||
      c.folio?.toLowerCase().includes(q);
    const matchEstatus = !filtroEstatus || (c.estatus || "En revisión") === filtroEstatus;
    const matchSucursal = !filtroSucursal || c.sucursal?.id === filtroSucursal;
    const matchVendedor = !filtroVendedor || c.usuario_id === filtroVendedor;
    let matchFecha = true;
    const fechaCot = fechaDeCotizacion(c);
    if (fechaCot && fechaDesde) matchFecha = matchFecha && fechaCot >= parsearFecha(fechaDesde);
    if (fechaCot && fechaHasta) matchFecha = matchFecha && fechaCot <= parsearFecha(fechaHasta);
    return matchBusqueda && matchEstatus && matchSucursal && matchVendedor && matchFecha;
  });

  const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA);
  const paginadas = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const desde = filtradas.length === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1;
  const hasta = Math.min(pagina * POR_PAGINA, filtradas.length);

  const acciones = (cot) => (
    <>
      <BotonIcono icono={FileDown} etiqueta="Ver PDF" onClick={() => window.open(`/preview/${cot.folio}`, "_blank")} />
      {permisoEditar(perfil, cot) && (
        <BotonIcono icono={Pencil} etiqueta="Editar" onClick={() => navigate(`/cotizaciones/${cot.folio}/editar`)} />
      )}
      <BotonIcono icono={Mail} etiqueta="Enviar por correo" onClick={() => setCorreoModal(cot)} />
      <BotonIcono icono={History} etiqueta="Seguimiento" onClick={() => abrirSeguimiento(cot)} />
      {permisoEliminar(perfil, cot) && (
        <BotonIcono icono={Trash2} etiqueta="Eliminar" peligro onClick={() => eliminar(cot.folio)} />
      )}
    </>
  );

  if (cargando)
    return (
      <div className="flex justify-center items-center py-20 gap-3 text-gray-400 text-sm">
        <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
        Cargando cotizaciones...
      </div>
    );

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-primary-800">Cotizaciones</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {filtradas.length === 0
                ? "Ninguna coincide con los filtros"
                : `Mostrando ${desde} a ${hasta} de ${filtradas.length}`}
            </p>
          </div>
          <Boton
            variante="secundario"
            icono={FileSpreadsheet}
            onClick={() => exportarCotizacionesExcel(filtradas, "Cotizaciones-Puente-Ambiental")}
            disabled={filtradas.length === 0}
          >
            Exportar a Excel
          </Boton>
        </div>

        {/* Filtros */}
        <div
          className={`bg-white rounded-2xl border border-linea p-4 grid gap-3 grid-cols-2 items-end ${
            supervisor ? "lg:grid-cols-[2fr_repeat(5,minmax(0,1fr))]" : "lg:grid-cols-[2fr_repeat(3,minmax(0,1fr))]"
          }`}
        >
          <div className="relative col-span-2 lg:col-span-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar"
              placeholder="Buscar por cliente o folio"
              value={busqueda}
              onChange={conFiltro(setBusqueda)}
              className={`${campo} pl-9`}
            />
          </div>
          <label>
            <span className={etiqueta}>Estatus</span>
            <select value={filtroEstatus} onChange={conFiltro(setFiltroEstatus)} className={campo}>
              <option value="">Todos</option>
              {ESTATUS.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </label>
          {supervisor && (
            <>
              <label>
                <span className={etiqueta}>Sucursal</span>
                <select value={filtroSucursal} onChange={conFiltro(setFiltroSucursal)} className={campo}>
                  <option value="">Todas</option>
                  {SUCURSALES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {SUCURSAL_CORTA[s.id]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={etiqueta}>Vendedor</span>
                <select value={filtroVendedor} onChange={conFiltro(setFiltroVendedor)} className={campo}>
                  <option value="">Todos</option>
                  {vendedores.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label>
            <span className={etiqueta}>Desde</span>
            <input type="date" value={fechaDesde} onChange={conFiltro(setFechaDesde)} className={campo} />
          </label>
          <label>
            <span className={etiqueta}>Hasta</span>
            <input type="date" value={fechaHasta} onChange={conFiltro(setFechaHasta)} className={campo} />
          </label>
          {hayFiltros && (
            <div className="col-span-full flex justify-end -mb-1">
              <Boton variante="fantasma" tamaño="sm" icono={X} onClick={limpiarFiltros}>
                Quitar filtros
              </Boton>
            </div>
          )}
        </div>

        {/* Lista */}
        {filtradas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-linea py-16 flex flex-col items-center gap-3 text-center">
            <Inbox size={32} strokeWidth={1.5} className="text-gray-300" aria-hidden="true" />
            <p className="text-sm text-gray-600">
              {cotizaciones.length === 0 ? "Todavía no hay cotizaciones." : "Ninguna cotización coincide con los filtros."}
            </p>
            {hayFiltros && (
              <Boton variante="secundario" tamaño="sm" onClick={limpiarFiltros}>
                Quitar filtros
              </Boton>
            )}
          </div>
        ) : (
          <>
            {/* Tarjetas móvil */}
            <ul className="flex flex-col gap-3 lg:hidden">
              {paginadas.map((cot) => (
                <li key={cot.folio} className="bg-white rounded-2xl border border-linea p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 text-sm">{cot.cliente?.contacto || "Sin cliente"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className="font-mono">{cot.folio}</span>
                        <span className="ml-2">{fechaCorta(cot)}</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <EtiquetaEstatus estatus={cot.estatus} />
                      <Vencimiento v={vencimiento(cot)} />
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <Total opciones={cot.opciones} />
                      <p className="text-xs text-gray-500 mt-0.5">
                        {SUCURSAL_CORTA[cot.sucursal?.id]}
                        {supervisor && `, ${nombres[cot.usuario_id] || "Usuario"}`}
                      </p>
                    </div>
                    <div className="flex items-center -mr-1">{acciones(cot)}</div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Tabla escritorio */}
            <div className="hidden lg:block bg-white rounded-2xl border border-linea overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-linea text-left text-xs font-medium text-gray-500">
                    <th className="px-5 py-3 font-medium">Cliente y folio</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Estatus</th>
                    {supervisor && <th className="px-4 py-3 font-medium">Vendedor</th>}
                    <th className="px-4 py-3">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-linea">
                  {paginadas.map((cot) => (
                    <tr key={cot.folio} className="hover:bg-primary-50/30 transition-colors align-top">
                      <td className="px-5 py-3.5 max-w-[18rem]">
                        <p className="font-medium text-gray-800 truncate" title={cot.cliente?.contacto}>
                          {cot.cliente?.contacto || "Sin cliente"}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{cot.folio}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-gray-700">{fechaCorta(cot)}</p>
                        <p className="text-xs text-gray-500">{SUCURSAL_CORTA[cot.sucursal?.id]}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <Total opciones={cot.opciones} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <EtiquetaEstatus estatus={cot.estatus} />
                        <Vencimiento v={vencimiento(cot)} />
                      </td>
                      {supervisor && (
                        <td className="px-4 py-3.5 text-gray-600 max-w-[8rem] truncate">{nombres[cot.usuario_id] || "Usuario"}</td>
                      )}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-0.5">{acciones(cot)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <nav className="flex items-center justify-center gap-1" aria-label="Paginación">
                <Boton
                  variante="fantasma"
                  tamaño="sm"
                  icono={ChevronLeft}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                >
                  Anterior
                </Boton>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  const p = Math.min(Math.max(1, pagina - 2), Math.max(1, totalPaginas - 4)) + i;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPagina(p)}
                      aria-current={p === pagina ? "page" : undefined}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                        p === pagina ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-primary-50"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <Boton
                  variante="fantasma"
                  tamaño="sm"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                >
                  Siguiente
                  <ChevronRight size={14} aria-hidden="true" />
                </Boton>
              </nav>
            )}
          </>
        )}
      </div>

      {/* Enviar por correo */}
      {correoModal && (
        <Modal titulo="Enviar cotización" subtitulo={correoModal.folio} onCerrar={() => setCorreoModal(null)}>
          <EnvioCorreo folio={correoModal.folio} emailInicial={correoModal.cliente?.email || ""} />
        </Modal>
      )}

      {/* Seguimiento */}
      {seguimientoModal && (
        <Modal titulo="Seguimiento" subtitulo={seguimientoModal.folio} onCerrar={() => setSeguimientoModal(null)}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Estatus actual</span>
            <EtiquetaEstatus estatus={seguimientoModal.estatus} />
          </div>

          {puedeCambiarEstatus(perfil) && (
            <div className="rounded-xl border border-linea p-4 flex flex-col gap-3">
              <div>
                <label htmlFor="nuevo-estatus" className={etiqueta}>
                  Cambiar a
                </label>
                <select
                  id="nuevo-estatus"
                  value={nuevoEstatus}
                  onChange={(e) => setNuevoEstatus(e.target.value)}
                  className={campo}
                >
                  {ESTATUS.map((e) => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="nota-estatus" className={etiqueta}>
                  Nota para el vendedor (opcional)
                </label>
                <textarea
                  id="nota-estatus"
                  value={notaEstatus}
                  onChange={(e) => setNotaEstatus(e.target.value)}
                  rows={2}
                  className={`${campo} resize-none`}
                />
              </div>
              <Boton
                onClick={guardarEstatus}
                disabled={guardandoEst || nuevoEstatus === (seguimientoModal.estatus || "En revisión")}
              >
                {guardandoEst ? "Guardando..." : "Guardar estatus"}
              </Boton>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-primary-800 mb-3">Historial</h3>
            {cargandoHist ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
              </div>
            ) : historial.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">Aún no hay cambios de estatus.</p>
            ) : (
              <ol className="flex flex-col gap-4 border-l border-linea ml-1.5">
                {historial.map((h) => (
                  <li key={h.id} className="pl-4 relative">
                    <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary-600" aria-hidden="true" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <EtiquetaEstatus estatus={h.estatus_anterior} />
                      <ChevronRight size={14} className="text-gray-400" aria-label="a" />
                      <EtiquetaEstatus estatus={h.estatus_nuevo} />
                    </div>
                    {h.nota && <p className="text-sm text-gray-700 mt-2">{h.nota}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      {h.nombre_usuario || "Usuario"},{" "}
                      {new Date(h.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
