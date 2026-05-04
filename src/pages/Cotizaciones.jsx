import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerCotizaciones,
  eliminarCotizacion,
  obtenerCotizacion,
  actualizarEstatus,
  obtenerSeguimiento,
} from "../services/cotizaciones";
import { generarPDFBase64 } from "../utils/generarPDF";
import { estaVencida } from "../utils/calculos";
import { useAuth } from "../hooks/useAuth";
import { SUCURSALES } from "../utils/constantes";

const ESTATUS = ["En revisión", "Aprobada", "Rechazada"];

const badgeEstatus = (e) => {
  if (e === "Aprobada")
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (e === "Rechazada") return "bg-red-50 text-red-600 border border-red-200";
  return "bg-amber-50 text-amber-700 border border-amber-200";
};

const inputCls =
  "border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-200";

export default function Cotizaciones() {
  const { perfil } = useAuth();
  const navigate = useNavigate();

  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");
  const [filtroSucursal, setFiltroSucursal] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [emailModal, setEmailModal] = useState(null);
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorEmail, setErrorEmail] = useState("");
  const [seguimientoModal, setSeguimientoModal] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargandoHist, setCargandoHist] = useState(false);
  const [nuevoEstatus, setNuevoEstatus] = useState("");
  const [notaEstatus, setNotaEstatus] = useState("");
  const [guardandoEst, setGuardandoEst] = useState(false);

  useEffect(() => {
    obtenerCotizaciones()
      .then(setCotizaciones)
      .finally(() => setCargando(false));
  }, []);

  const eliminar = async (folio) => {
    if (!confirm(`¿Eliminar la cotización ${folio}?`)) return;
    await eliminarCotizacion(folio);
    setCotizaciones((prev) => prev.filter((c) => c.folio !== folio));
  };

  const abrirEmailModal = (cot) => {
    setEmail(cot.cliente?.email || "");
    setEnviado(false);
    setErrorEmail("");
    setEmailModal({ folio: cot.folio });
  };

  const enviarCorreo = async () => {
    if (!email) return setErrorEmail("Escribe un correo electrónico.");
    const dest = email
      .split(";")
      .map((e) => e.trim())
      .filter(Boolean);
    if (dest.length === 0) return setErrorEmail("Correo inválido.");
    setErrorEmail("");
    setEnviando(true);
    try {
      const cot = await obtenerCotizacion(emailModal.folio);
      if (!cot) throw new Error("Cotización no encontrada");
      const pdfBase64 = await generarPDFBase64(cot);
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enviar-cotizacion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            folio: emailModal.folio,
            email: dest,
            pdfBase64,
          }),
        },
      );
      if (!res.ok) throw new Error();
      setEnviado(true);
    } catch (e) {
      setErrorEmail("No se pudo enviar: " + e.message);
    }
    setEnviando(false);
  };

  const abrirSeguimiento = async (cot) => {
    setSeguimientoModal(cot);
    setNuevoEstatus(cot.estatus || "En revisión");
    setNotaEstatus("");
    setCargandoHist(true);
    try {
      const hist = await obtenerSeguimiento(cot.id);
      setHistorial(hist);
    } catch {
      setHistorial([]);
    }
    setCargandoHist(false);
  };

  const guardarEstatus = async () => {
    if (!nuevoEstatus) return;
    setGuardandoEst(true);
    try {
      await actualizarEstatus(
        seguimientoModal.folio,
        nuevoEstatus,
        notaEstatus,
        perfil,
      );
      setCotizaciones((prev) =>
        prev.map((c) =>
          c.folio === seguimientoModal.folio
            ? { ...c, estatus: nuevoEstatus, notas_seguimiento: notaEstatus }
            : c,
        ),
      );
      const hist = await obtenerSeguimiento(seguimientoModal.id);
      setHistorial(hist);
      setNotaEstatus("");
      setSeguimientoModal((prev) => ({ ...prev, estatus: nuevoEstatus }));
    } catch (e) {
      alert("Error: " + e.message);
    }
    setGuardandoEst(false);
  };

  const puedeEditar = (cot) =>
    perfil?.rol === "admin" || cot.usuario_id === perfil?.id;

  const meses = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11,
  };
  const filtradas = cotizaciones.filter((c) => {
    const matchBusqueda =
      c.cliente?.contacto?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.folio?.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstatus = filtroEstatus ? c.estatus === filtroEstatus : true;
    const matchSucursal = filtroSucursal
      ? c.sucursal?.tipo === filtroSucursal
      : true;
    let matchFecha = true;
    if (fechaDesde || fechaHasta) {
      const partes = c.fecha?.toLowerCase().split(" de ");
      if (partes?.length === 3) {
        const fechaCot = new Date(
          parseInt(partes[2]),
          meses[partes[1]],
          parseInt(partes[0]),
        );
        if (fechaDesde)
          matchFecha = matchFecha && fechaCot >= new Date(fechaDesde);
        if (fechaHasta)
          matchFecha = matchFecha && fechaCot <= new Date(fechaHasta);
      }
    }
    return matchBusqueda && matchEstatus && matchSucursal && matchFecha;
  });

  if (cargando)
    return (
      <div className="flex justify-center items-center py-20 gap-3 text-gray-400 text-sm">
        <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
        Cargando cotizaciones...
      </div>
    );

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary-600 tracking-tight">
              Historial de cotizaciones
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              <span className="font-semibold text-primary-600">
                {filtradas.length}
              </span>{" "}
              de <span className="font-semibold">{cotizaciones.length}</span>{" "}
              cotizaciones
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div
          className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3"
          style={{ boxShadow: "0 1px 3px rgba(27,58,107,0.06)" }}
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Buscar por cliente o folio..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={inputCls + " w-full pl-9"}
              />
            </div>
            <select
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value)}
              className={inputCls}
            >
              <option value="">Todos los estatus</option>
              {ESTATUS.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 items-center">
            {perfil?.rol === "admin" && (
              <select
                value={filtroSucursal}
                onChange={(e) => setFiltroSucursal(e.target.value)}
                className={inputCls}
              >
                <option value="">Todas las sucursales</option>
                {SUCURSALES.map((s) => (
                  <option key={s.id} value={s.tipo}>
                    {s.tipo}
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-gray-400 whitespace-nowrap font-medium">
                Desde
              </span>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className={inputCls + " flex-1"}
              />
              <span className="text-xs text-gray-400 whitespace-nowrap font-medium">
                Hasta
              </span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className={inputCls + " flex-1"}
              />
              {(fechaDesde || fechaHasta) && (
                <button
                  onClick={() => {
                    setFechaDesde("");
                    setFechaHasta("");
                  }}
                  className="text-xs text-red-400 hover:text-red-600 whitespace-nowrap font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                >
                  × Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-200 border border-red-300"></div>
              <span>Vencida</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-gray-300"></div>
              <span>Vigente</span>
            </div>
          </div>
        </div>

        {/* Tabla */}
        {filtradas.length === 0 ? (
          <div
            className="bg-white rounded-2xl border border-gray-100 py-20 text-center"
            style={{ boxShadow: "0 1px 3px rgba(27,58,107,0.06)" }}
          >
            <p className="text-5xl mb-4">📋</p>
            <p className="text-sm font-medium text-gray-500">
              No se encontraron cotizaciones
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        ) : (
          <div
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: "0 1px 3px rgba(27,58,107,0.06)" }}
          >
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    background:
                      "linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)",
                  }}
                >
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-amber-300">
                    Cliente
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-blue-200">
                    Folio
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-blue-200">
                    Fecha
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-blue-200">
                    Sucursal
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-blue-200">
                    Opciones
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-blue-200">
                    Estatus
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-blue-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtradas.map((cot, i) => {
                  const vencida = estaVencida(cot.fecha, cot.cliente?.vigencia);
                  return (
                    <tr
                      key={cot.folio}
                      className={`hover:bg-primary-50/30 transition-colors duration-150 ${
                        vencida
                          ? "bg-red-50/60"
                          : i % 2 === 0
                            ? "bg-white"
                            : "bg-gray-50/30"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-800 text-sm">
                          {cot.cliente?.contacto || "—"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {cot.cliente?.atencion}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                          {cot.folio}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">
                        {cot.fecha}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs bg-primary-50 text-primary-600 font-semibold px-2.5 py-1 rounded-lg w-fit border border-primary-100">
                            {cot.sucursal?.tipo}
                          </span>
                          {vencida && (
                            <span className="text-xs bg-red-50 text-red-500 font-medium px-2.5 py-1 rounded-lg w-fit border border-red-200">
                              ⚠️ Vencida
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          {cot.opciones?.map((op, j) => (
                            <div key={j} className="text-xs text-gray-500">
                              <span className="font-semibold text-primary-600">
                                Op.{j + 1}
                              </span>{" "}
                              <span className="font-mono">
                                $
                                {op.total?.toLocaleString("es-MX", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${badgeEstatus(cot.estatus)}`}
                        >
                          {cot.estatus || "En revisión"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              window.open(`/preview/${cot.folio}`, "_blank")
                            }
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all duration-200"
                            style={{
                              background:
                                "linear-gradient(135deg, #1B3A6B, #0F2347)",
                            }}
                            title="Ver PDF"
                          >
                            PDF
                          </button>
                          {puedeEditar(cot) && (
                            <button
                              onClick={() =>
                                navigate(`/cotizaciones/${cot.folio}/editar`)
                              }
                              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
                              title="Editar"
                            >
                              ✏️
                            </button>
                          )}
                          <button
                            onClick={() => abrirEmailModal(cot)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-primary-100 text-primary-600 hover:bg-primary-50 hover:border-primary-600 transition-all duration-200"
                            title="Enviar correo"
                          >
                            ✉️
                          </button>
                          <button
                            onClick={() => abrirSeguimiento(cot)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-400 transition-all duration-200"
                            title="Seguimiento"
                          >
                            📋
                          </button>
                          {puedeEditar(cot) && (
                            <button
                              onClick={() => eliminar(cot.folio)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal correo */}
      {emailModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{
            background: "rgba(9,22,41,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm flex flex-col overflow-hidden"
            style={{ boxShadow: "0 25px 50px rgba(9,22,41,0.25)" }}
          >
            <div
              className="px-6 py-5 flex items-center justify-between"
              style={{
                background: "linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)",
              }}
            >
              <div>
                <h2 className="text-base font-bold text-white">
                  Enviar cotización
                </h2>
                <p className="text-xs text-blue-300 font-mono mt-0.5">
                  {emailModal.folio}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
                ✉️
              </div>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {enviado ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4 text-center">
                  <p className="text-2xl mb-2">✅</p>
                  <p className="text-sm font-bold text-emerald-700">
                    ¡Correo enviado!
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {email
                      .split(";")
                      .map((e) => e.trim())
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      Correo del cliente
                    </label>
                    <input
                      type="text"
                      placeholder="correo1@mail.com; correo2@mail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls + " w-full"}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Separa múltiples correos con punto y coma (;)
                    </p>
                  </div>
                  {errorEmail && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      <p className="text-xs text-red-600">{errorEmail}</p>
                    </div>
                  )}
                  <button
                    onClick={enviarCorreo}
                    disabled={enviando}
                    className="w-full text-white font-semibold text-sm py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #1B3A6B, #0F2347)",
                    }}
                  >
                    {enviando
                      ? "⏳ Generando PDF y enviando..."
                      : "📤 Enviar correo"}
                  </button>
                </>
              )}
              <button
                onClick={() => setEmailModal(null)}
                className="w-full border border-gray-200 text-gray-500 text-sm py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal seguimiento */}
      {seguimientoModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{
            background: "rgba(9,22,41,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md flex flex-col overflow-hidden"
            style={{ boxShadow: "0 25px 50px rgba(9,22,41,0.25)" }}
          >
            <div
              className="px-6 py-5 flex items-center justify-between"
              style={{
                background: "linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)",
              }}
            >
              <div>
                <h2 className="text-base font-bold text-white">Seguimiento</h2>
                <p className="text-xs text-blue-300 font-mono mt-0.5">
                  {seguimientoModal.folio}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
                📋
              </div>
            </div>

            <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              {/* Estatus actual */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Estatus actual
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-lg ${badgeEstatus(seguimientoModal.estatus)}`}
                >
                  {seguimientoModal.estatus || "En revisión"}
                </span>
              </div>

              {/* Cambiar estatus */}
              {puedeEditar(seguimientoModal) && (
                <div
                  className="flex flex-col gap-3 border border-gray-200 rounded-xl p-4"
                  style={{
                    background: "linear-gradient(135deg, #F8FAFF, #F0F4FF)",
                  }}
                >
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Actualizar estatus
                  </p>
                  <select
                    value={nuevoEstatus}
                    onChange={(e) => setNuevoEstatus(e.target.value)}
                    className={inputCls + " w-full"}
                  >
                    {ESTATUS.map((e) => (
                      <option key={e}>{e}</option>
                    ))}
                  </select>
                  <textarea
                    placeholder="Nota de seguimiento (opcional)..."
                    value={notaEstatus}
                    onChange={(e) => setNotaEstatus(e.target.value)}
                    rows={2}
                    className={inputCls + " w-full resize-none"}
                  />
                  <button
                    onClick={guardarEstatus}
                    disabled={guardandoEst}
                    className="text-white text-sm font-bold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #1B3A6B, #0F2347)",
                    }}
                  >
                    {guardandoEst ? "Guardando..." : "💾 Guardar cambio"}
                  </button>
                </div>
              )}

              {/* Historial */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Historial de cambios
                </p>
                {cargandoHist ? (
                  <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
                  </div>
                ) : historial.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-2xl mb-2">📭</p>
                    <p className="text-xs">Sin cambios registrados aún</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {historial.map((h) => (
                      <div
                        key={h.id}
                        className="border border-gray-100 rounded-xl px-4 py-3 bg-white"
                        style={{ boxShadow: "0 1px 3px rgba(27,58,107,0.04)" }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${badgeEstatus(h.estatus_anterior)}`}
                            >
                              {h.estatus_anterior}
                            </span>
                            <span className="text-gray-300 text-xs">→</span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${badgeEstatus(h.estatus_nuevo)}`}
                            >
                              {h.estatus_nuevo}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 font-mono">
                            {new Date(h.created_at).toLocaleDateString("es-MX")}
                          </span>
                        </div>
                        {h.nota && (
                          <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mt-1">
                            "{h.nota}"
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1.5">
                          por{" "}
                          <span className="font-medium text-gray-500">
                            {h.nombre_usuario || "Usuario"}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSeguimientoModal(null)}
                className="w-full border border-gray-200 text-gray-500 text-sm py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
