import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCotizacion } from "../hooks/useCotizacion";
import {
  obtenerCotizacion,
  guardarCotizacion,
  actualizarCotizacion,
} from "../services/cotizaciones";
import {
  fechaHoy,
  calcularServicio,
  calcularTotalesOpcion,
  estaVencida,
} from "../utils/calculos";
import ModalCotizacion from "../components/ModalCotizacion";
import BasesEditor from "../components/BasesEditor";

const input =
  "border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-600 w-full bg-white";
const inputSm =
  "border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-600 w-full bg-white";
const label = "text-xs font-medium text-gray-600 mb-1 block";
const section = "bg-white rounded-xl border border-gray-200 overflow-hidden";
const PAGOS = ["Mensual", "Trimestral", "Anual", "Por evento"];
const btnCounter =
  "w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:border-primary-600 hover:text-primary-600 font-bold flex items-center justify-center flex-shrink-0 text-base";

export default function EditarCotizacion() {
  const { folio: folioParam } = useParams();
  const navigate = useNavigate();

  const {
    folio, // ← quita setFolio
    sucursal, // ← quita setSucursal
    opciones, // ← quita setOpciones
    agregarOpcion,
    quitarOpcion,
    agregarServicio,
    quitarServicio,
    actualizarServicio,
    cliente,
    setCliente,
    cargarCotizacion,
    basesExtra,
    setBasesExtra,
  } = useCotizacion();

  const [catalogoServicios, setCatalogoServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [esVencida, setEsVencida] = useState(false);
  const [modalFolio, setModalFolio] = useState(null);

  useEffect(() => {
    Promise.all([
      obtenerCotizacion(folioParam),
      import("../services/sqlserver").then((m) => m.obtenerServicios()),
    ])
      .then(([cot, servicios]) => {
        if (!cot) return navigate("/cotizaciones");
        cargarCotizacion(cot);
        setCatalogoServicios(servicios);
        setEsVencida(estaVencida(cot.fecha, cot.cliente?.vigencia));
      })
      .finally(() => setCargando(false));
  }, [folioParam]);

  const alSeleccionarServicio = (opId, srvId, nombre) => {
    const srv = catalogoServicios.find((s) => s.nombre === nombre);
    actualizarServicio(opId, srvId, {
      servicioId: nombre,
      nombre,
      precioUnitario: srv?.precio_lista || 0,
    });
  };

  const cambiarCampo = (opId, srvId, campo, valor) => {
    actualizarServicio(opId, srvId, { [campo]: Number(valor) || 0 });
  };

  const guardar = async () => {
    if (!cliente.atencion && !cliente.contacto)
      return alert("Escribe o selecciona el nombre del cliente.");
    setGuardando(true);
    try {
      const opcionesConTotales = opciones.map((op) => ({
        ...op,
        ...calcularTotalesOpcion(op.servicios),
      }));

      if (esVencida) {
        // Generar nuevo folio
        await guardarCotizacion({
          folio, // ya tiene nuevo folio generado por cargarCotizacion en vencida
          fecha: fechaHoy(),
          sucursal,
          cliente,
          opciones: opcionesConTotales,
          basesExtra,
        });
      } else {
        // Sobreescribir misma cotización
        await actualizarCotizacion({
          folio: folioParam,
          sucursal,
          cliente,
          opciones: opcionesConTotales,
          basesExtra,
        });
      }
      setModalFolio(esVencida ? folio : folioParam);
    } catch (e) {
      alert("Error al guardar: " + e.message);
    }
    setGuardando(false);
  };

  const sectionHeader = (title) => (
    <div className="px-6 py-4 border-b border-gray-100 bg-primary-600">
      <h2 className="text-xs font-semibold text-accent-400 uppercase tracking-widest">
        {title}
      </h2>
    </div>
  );

  if (cargando)
    return (
      <div className="flex justify-center py-20 text-gray-400 text-sm">
        Cargando...
      </div>
    );

  return (
    <>
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        {/* Título */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-primary-600">
              {esVencida ? "Renovar cotización" : "Editar cotización"}
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {esVencida
                ? `Nueva desde: ${folioParam}`
                : `Folio: ${folioParam}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {esVencida && (
              <span className="text-xs bg-red-100 text-red-600 font-medium px-3 py-1.5 rounded-lg">
                ⚠️ Vencida — se generará nuevo folio
              </span>
            )}
            <span className="text-xs bg-accent-300/40 text-primary-600 font-medium px-3 py-1.5 rounded-lg">
              {fechaHoy()}
            </span>
          </div>
        </div>

        {/* Sucursal */}
        <div className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            🏢
          </div>
          <div>
            <p className="text-xs font-semibold text-primary-600">
              {sucursal?.tipo}
            </p>
            <p className="text-xs text-gray-400">{sucursal?.ciudad}</p>
          </div>
        </div>

        {/* Cliente */}
        <div className={section}>
          {sectionHeader("Datos del cliente")}
          <div className="p-6 grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Atención a (negocio)</label>
              <input
                className={input}
                value={cliente.atencion || ""}
                onChange={(e) =>
                  setCliente((p) => ({ ...p, atencion: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={label}>Contacto / Razón social</label>
              <input
                className={input}
                value={cliente.contacto || ""}
                onChange={(e) =>
                  setCliente((p) => ({ ...p, contacto: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={label}>Vigencia</label>
              <select
                className={input}
                value={cliente.vigencia}
                onChange={(e) =>
                  setCliente((p) => ({ ...p, vigencia: e.target.value }))
                }
              >
                {["1 MES", "15 DÍAS", "30 DÍAS"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Forma de pago</label>
              <select
                className={input}
                value={cliente.pago || "Mensual"}
                onChange={(e) =>
                  setCliente((p) => ({ ...p, pago: e.target.value }))
                }
              >
                {PAGOS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Correo del cliente</label>
              <input
                className={input}
                type="text"
                placeholder="correo1@mail.com; correo2@mail.com"
                value={cliente.email || ""}
                onChange={(e) =>
                  setCliente((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2">
              <label className={label}>Notas adicionales</label>
              <textarea
                className={input}
                rows={3}
                value={cliente.notas || ""}
                onChange={(e) =>
                  setCliente((p) => ({ ...p, notas: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* Opciones */}
        <div className={section}>
          {sectionHeader("Conceptos de servicio")}
          <div className="p-6 flex flex-col gap-6">
            {opciones.map((op, opIdx) => {
              const { subtotal, iva, total } = calcularTotalesOpcion(
                op.servicios,
              );
              return (
                <div
                  key={op.id}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                        {opIdx + 1}
                      </div>
                      <span className="text-sm font-semibold text-primary-600">
                        OPCIÓN {opIdx + 1}
                      </span>
                    </div>
                    {opciones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => quitarOpcion(op.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Eliminar opción
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100">
                    {op.servicios.map((srv, srvIdx) => {
                      const lineTotal = calcularServicio(srv);
                      return (
                        <div key={srv.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              Servicio {srvIdx + 1}
                            </span>
                            {op.servicios.length > 1 && (
                              <button
                                type="button"
                                onClick={() => quitarServicio(op.id, srv.id)}
                                className="text-xs text-red-400 hover:text-red-600"
                              >
                                × Quitar
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className={label}>Concepto</label>
                              <select
                                className={inputSm}
                                value={srv.nombre || ""}
                                onChange={(e) =>
                                  alSeleccionarServicio(
                                    op.id,
                                    srv.id,
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="">
                                  — Seleccionar servicio —
                                </option>
                                {catalogoServicios.map((s, i) => (
                                  <option key={i} value={s.nombre}>
                                    {s.nombre}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={label}>
                                Precio unitario ($)
                              </label>
                              <input
                                className={inputSm}
                                type="number"
                                min="0"
                                step="0.01"
                                value={srv.precioUnitario || ""}
                                onChange={(e) =>
                                  cambiarCampo(
                                    op.id,
                                    srv.id,
                                    "precioUnitario",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className={label}>N° contenedores</label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  className={btnCounter}
                                  onClick={() =>
                                    cambiarCampo(
                                      op.id,
                                      srv.id,
                                      "numContenedores",
                                      Math.max(1, srv.numContenedores - 1),
                                    )
                                  }
                                >
                                  −
                                </button>
                                <input
                                  className={inputSm + " text-center"}
                                  type="number"
                                  min="1"
                                  value={srv.numContenedores}
                                  onChange={(e) =>
                                    cambiarCampo(
                                      op.id,
                                      srv.id,
                                      "numContenedores",
                                      e.target.value,
                                    )
                                  }
                                />
                                <button
                                  type="button"
                                  className={btnCounter}
                                  onClick={() =>
                                    cambiarCampo(
                                      op.id,
                                      srv.id,
                                      "numContenedores",
                                      srv.numContenedores + 1,
                                    )
                                  }
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className={label}>
                                Precio por día ($)
                              </label>
                              <input
                                className={inputSm}
                                type="number"
                                min="0"
                                step="0.01"
                                value={srv.precioDia || ""}
                                onChange={(e) =>
                                  cambiarCampo(
                                    op.id,
                                    srv.id,
                                    "precioDia",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className={label}>
                                Visitas por semana
                              </label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  className={btnCounter}
                                  onClick={() =>
                                    cambiarCampo(
                                      op.id,
                                      srv.id,
                                      "diasSemana",
                                      Math.max(1, srv.diasSemana - 1),
                                    )
                                  }
                                >
                                  −
                                </button>
                                <input
                                  className={inputSm + " text-center"}
                                  type="number"
                                  min="1"
                                  max="7"
                                  value={srv.diasSemana}
                                  onChange={(e) =>
                                    cambiarCampo(
                                      op.id,
                                      srv.id,
                                      "diasSemana",
                                      e.target.value,
                                    )
                                  }
                                />
                                <button
                                  type="button"
                                  className={btnCounter}
                                  onClick={() =>
                                    cambiarCampo(
                                      op.id,
                                      srv.id,
                                      "diasSemana",
                                      Math.min(7, srv.diasSemana + 1),
                                    )
                                  }
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div className="col-span-2 flex justify-end">
                              <span className="text-xs text-gray-400">
                                Subtotal línea:{" "}
                              </span>
                              <span className="text-xs font-bold text-primary-600 ml-1">
                                $
                                {lineTotal.toLocaleString("es-MX", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-4 pb-3">
                    <button
                      type="button"
                      onClick={() => agregarServicio(op.id)}
                      className="w-full border border-dashed border-gray-300 hover:border-primary-600 text-gray-400 hover:text-primary-600 text-xs font-medium py-2 rounded-lg transition-colors"
                    >
                      + Agregar servicio
                    </button>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-gray-200 border-t border-gray-200">
                    {[
                      { l: "Subtotal", v: subtotal },
                      { l: "IVA 16%", v: iva },
                      { l: "Neto mensual", v: total, highlight: true },
                    ].map(({ l, v, highlight }) => (
                      <div
                        key={l}
                        className={`text-center py-3 px-2 ${highlight ? "bg-primary-50" : ""}`}
                      >
                        <p className="text-xs text-gray-400">{l}</p>
                        <p
                          className={`text-sm font-bold ${highlight ? "text-primary-600" : "text-gray-700"}`}
                        >
                          $
                          {(v || 0).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={agregarOpcion}
              className="w-full border-2 border-dashed border-gray-300 hover:border-primary-600 text-gray-400 hover:text-primary-600 text-sm font-medium py-3 rounded-xl transition-colors"
            >
              + Agregar opción
            </button>
          </div>
        </div>

        <div className={section}>
          {sectionHeader("Bases de la cotización")}
          <div className="p-6">
            <BasesEditor
              basesExtra={basesExtra}
              setBasesExtra={setBasesExtra}
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/cotizaciones")}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="flex-1 bg-primary-600 hover:bg-primary-800 disabled:opacity-50 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors"
          >
            {guardando
              ? "Guardando..."
              : esVencida
                ? "📋 Generar nueva cotización"
                : "💾 Guardar cambios"}
          </button>
        </div>
      </div>

      {modalFolio && (
        <ModalCotizacion
          folio={modalFolio}
          emailCliente={cliente.email || ""}
          onCerrar={() => navigate("/cotizaciones")} // ← Cerrar va al historial
        />
      )}
    </>
  );
}
