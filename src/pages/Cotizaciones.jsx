import { useState, useEffect } from "react";
import {
  obtenerCotizaciones,
  eliminarCotizacion,
  obtenerCotizacion,
} from "../services/cotizaciones";
import { generarPDFBase64 } from "../utils/generarPDF";
import { estaVencida } from "../utils/calculos";

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [emailModal, setEmailModal] = useState(null);
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorEmail, setErrorEmail] = useState("");
  const [busqueda, setBusqueda] = useState("");

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
          body: JSON.stringify({ folio: emailModal.folio, email, pdfBase64 }),
        },
      );
      if (!res.ok) throw new Error();
      setEnviado(true);
    } catch (e) {
      setErrorEmail("No se pudo enviar: " + e.message);
    }
    setEnviando(false);
  };

  const filtradas = cotizaciones.filter(
    (c) =>
      c.cliente?.atencion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.folio?.toLowerCase().includes(busqueda.toLowerCase()),
  );

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
              {cotizaciones.length} cotización
              {cotizaciones.length !== 1 ? "es" : ""} en total
            </p>
          </div>
        </div>

        {/* Buscador */}
        <input
          type="text"
          placeholder="Buscar por cliente o folio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
        />
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
            <span>Cotización vencida</span>
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
                  <th className="px-6 py-3 text-left text-accent-400">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-gray-200">Folio</th>
                  <th className="px-6 py-3 text-left text-gray-200">Fecha</th>
                  <th className="px-6 py-3 text-left text-gray-200">
                    Sucursal
                  </th>
                  <th className="px-6 py-3 text-left text-gray-200">
                    Opciones
                  </th>
                  <th className="px-6 py-3 text-right text-gray-200">
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
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">
                          {cot.cliente?.atencion || "—"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {cot.cliente?.contacto}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {cot.folio}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {cot.fecha}
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              window.open(`/preview/${cot.folio}`, "_blank")
                            }
                            className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 transition-colors"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => abrirEmailModal(cot)}
                            className="text-xs border border-primary-600 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                          >
                            ✉️
                          </button>
                          <button
                            onClick={() => eliminar(cot.folio)}
                            className="text-xs border border-red-200 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            🗑️
                          </button>
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
                  Se envió a {email}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Correo del cliente
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@correo.com"
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
    </>
  );
}
