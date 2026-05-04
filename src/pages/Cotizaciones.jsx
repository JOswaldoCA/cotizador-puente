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
  if (e === "Aprobada") return "bg-green-100 text-green-700";
  if (e === "Rechazada") return "bg-red-100 text-red-600";
  return "bg-yellow-100 text-yellow-700";
};

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

  // Modal correo
  const [emailModal, setEmailModal] = useState(null);
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorEmail, setErrorEmail] = useState("");

  // Modal seguimiento
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
      // Recargar historial
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

  const filtradas = cotizaciones.filter((c) => {
    const matchBusqueda =
      c.cliente?.contacto?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.folio?.toLowerCase().includes(busqueda.toLowerCase());

    const matchEstatus = filtroEstatus ? c.estatus === filtroEstatus : true;

    const matchSucursal = filtroSucursal
      ? c.sucursal?.tipo === filtroSucursal
      : true;

    // Parsear fecha de la cotización para comparar
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
      <div className="flex justify-center py-20 text-gray-400 text-sm">
        Cargando...
      </div>
    );

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-primary-600">
              Historial de cotizaciones
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {filtradas.length} de {cotizaciones.length} cotización
              {cotizaciones.length !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Buscar por cliente o folio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
            />
            <select
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
            >
              <option value="">Todos los estatus</option>
              {ESTATUS.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            {/* Filtro sucursal — solo admin */}
            {perfil?.rol === "admin" && (
              <select
                value={filtroSucursal}
                onChange={(e) => setFiltroSucursal(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
              >
                <option value="">Todas las sucursales</option>
                {SUCURSALES.map((s) => (
                  <option key={s.id} value={s.tipo}>
                    {s.tipo}
                  </option>
                ))}
              </select>
            )}
            {/* Filtro fechas */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-gray-400 whitespace-nowrap">
                Desde
              </span>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
              />
              <span className="text-xs text-gray-400 whitespace-nowrap">
                Hasta
              </span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
              />
              {(fechaDesde || fechaHasta) && (
                <button
                  onClick={() => {
                    setFechaDesde("");
                    setFechaHasta("");
                  }}
                  className="text-xs text-red-400 hover:text-red-600 whitespace-nowrap"
                >
                  × Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
            <span>Vencida</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-white border border-gray-200"></div>
            <span>Vigente</span>
          </div>
        </div>

        {/* Tabla */}
        {filtradas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">No se encontraron cotizaciones.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-primary-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left text-accent-400">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-gray-200">Folio</th>
                  <th className="px-4 py-3 text-left text-gray-200">Fecha</th>
                  <th className="px-4 py-3 text-left text-gray-200">
                    Sucursal
                  </th>
                  <th className="px-4 py-3 text-left text-gray-200">
                    Opciones
                  </th>
                  <th className="px-4 py-3 text-left text-gray-200">Estatus</th>
                  <th className="px-4 py-3 text-right text-gray-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((cot, i) => {
                  const vencida = estaVencida(cot.fecha, cot.cliente?.vigencia);
                  return (
                    <tr
                      key={cot.folio}
                      className={`border-t border-gray-100 hover:bg-gray-50 transition-colors text-sm ${
                        vencida
                          ? "bg-red-50"
                          : i % 2 === 0
                            ? "bg-white"
                            : "bg-gray-50/40"
                      }`}
                    >
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-800">
                          {cot.cliente?.contacto || "—"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {cot.cliente?.atencion}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-gray-500">
                        {cot.folio}
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-xs">
                        {cot.fecha}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs bg-primary-50 text-primary-600 font-medium px-2 py-1 rounded-lg w-fit">
                            {cot.sucursal?.tipo}
                          </span>
                          {vencida && (
                            <span className="text-xs bg-red-100 text-red-600 font-medium px-2 py-1 rounded-lg w-fit">
                              ⚠️ Vencida
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          {cot.opciones?.map((op, j) => (
                            <div key={j} className="text-xs text-gray-500">
                              <span className="font-medium text-primary-600">
                                Op.{j + 1}
                              </span>{" "}
                              $
                              {op.total?.toLocaleString("es-MX", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              MXN
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-lg ${badgeEstatus(cot.estatus)}`}
                        >
                          {cot.estatus || "En revisión"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              window.open(`/preview/${cot.folio}`, "_blank")
                            }
                            className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 transition-colors"
                          >
                            PDF
                          </button>
                          {puedeEditar(cot) && (
                            <button
                              onClick={() =>
                                navigate(`/cotizaciones/${cot.folio}/editar`)
                              }
                              className="text-xs border border-gray-300 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              ✏️
                            </button>
                          )}
                          <button
                            onClick={() => abrirEmailModal(cot)}
                            className="text-xs border border-primary-600 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                          >
                            ✉️
                          </button>
                          <button
                            onClick={() => abrirSeguimiento(cot)}
                            className="text-xs border border-yellow-400 text-yellow-600 px-3 py-1.5 rounded-lg hover:bg-yellow-50 transition-colors"
                          >
                            📋
                          </button>
                          {puedeEditar(cot) && (
                            <button
                              onClick={() => eliminar(cot.folio)}
                              className="text-xs border border-red-200 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-primary-600">
                  Enviar cotización
                </h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  {emailModal.folio}
                </p>
              </div>
              <span className="text-2xl">✉️</span>
            </div>
            {enviado ? (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                <p className="text-sm font-semibold text-green-700">
                  ✓ Correo enviado
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Se envió a{" "}
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
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Correo del cliente
                  </label>
                  <input
                    type="text"
                    placeholder="correo1@mail.com; correo2@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                {errorEmail && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {errorEmail}
                  </p>
                )}
                <button
                  onClick={enviarCorreo}
                  disabled={enviando}
                  className="w-full bg-primary-600 hover:bg-primary-800 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
                >
                  {enviando
                    ? "⏳ Generando PDF y enviando..."
                    : "Enviar correo"}
                </button>
              </>
            )}
            <button
              onClick={() => setEmailModal(null)}
              className="w-full border border-gray-200 text-gray-500 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal seguimiento */}
      {seguimientoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-primary-600 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Seguimiento</h2>
                <p className="text-xs text-blue-300 font-mono mt-0.5">
                  {seguimientoModal.folio}
                </p>
              </div>
              <span className="text-2xl">📋</span>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {/* Cambiar estatus */}
              {puedeEditar(seguimientoModal) && (
                <div className="flex flex-col gap-3 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Actualizar estatus
                  </p>
                  <select
                    value={nuevoEstatus}
                    onChange={(e) => setNuevoEstatus(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
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
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 resize-none"
                  />
                  <button
                    onClick={guardarEstatus}
                    disabled={guardandoEst}
                    className="bg-primary-600 hover:bg-primary-800 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                  >
                    {guardandoEst ? "Guardando..." : "Guardar cambio"}
                  </button>
                </div>
              )}

              {/* Historial */}
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Historial de cambios
                </p>
                {cargandoHist ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    Cargando...
                  </p>
                ) : historial.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    Sin cambios registrados aún.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {historial.map((h) => (
                      <div
                        key={h.id}
                        className="border border-gray-100 rounded-lg px-3 py-2 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeEstatus(h.estatus_anterior)}`}
                            >
                              {h.estatus_anterior}
                            </span>
                            <span className="text-xs text-gray-400">→</span>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeEstatus(h.estatus_nuevo)}`}
                            >
                              {h.estatus_nuevo}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(h.created_at).toLocaleDateString("es-MX")}
                          </span>
                        </div>
                        {h.nota && (
                          <p className="text-xs text-gray-500 mt-1">{h.nota}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          por {h.nombre_usuario || "Usuario"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setSeguimientoModal(null)}
                className="w-full border border-gray-200 text-gray-500 text-sm py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
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
