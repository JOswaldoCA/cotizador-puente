import { useState, useEffect, useRef } from "react";
import { useCotizacion } from "../hooks/useCotizacion";
import { SUCURSALES } from "../utils/constantes";
import {
  fechaHoy,
  calcularServicio,
  calcularTotalesOpcion,
} from "../utils/calculos";
import { guardarCotizacion } from "../services/cotizaciones";
import { obtenerClientes, obtenerServicios } from "../services/sqlserver";
import ModalCotizacion from "../components/ModalCotizacion";
import { useAuth } from "../hooks/useAuth";
import BasesEditor from "../components/BasesEditor";

const input =
  "border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 w-full bg-white transition-all duration-200";
const inputSm =
  "border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 w-full bg-white transition-all duration-200";
const label =
  "text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide";
const PAGOS = ["MES SERVIDO", "MES CORRIENTE"];
const btnCounter =
  "w-9 h-9 rounded-xl border border-gray-200 text-gray-500 hover:border-primary-600 hover:text-primary-600 hover:bg-primary-50 font-bold flex items-center justify-center flex-shrink-0 transition-all duration-200";

const SectionHeader = ({ title, icon }) => (
  <div
    className="px-6 py-4 border-b border-white/10 flex items-center gap-3"
    style={{ background: "linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)" }}
  >
    {icon && <span className="text-lg">{icon}</span>}
    <h2 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
      {title}
    </h2>
  </div>
);

export default function NuevaCotizacion() {
  const {
    folio,
    sucursal,
    setSucursal,
    opciones,
    agregarOpcion,
    quitarOpcion,
    agregarServicio,
    quitarServicio,
    actualizarServicio,
    cliente,
    setCliente,
    basesExtra,
    setBasesExtra,
  } = useCotizacion();

  const { perfil } = useAuth();
  const buscadorRef = useRef(null);

  const [catalogoServicios, setCatalogoServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [modalFolio, setModalFolio] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [cargandoDB, setCargandoDB] = useState(true);

  useEffect(() => {
    if (perfil?.sucursal_id) {
      const s = SUCURSALES.find((x) => x.id === perfil.sucursal_id);
      if (s) setSucursal(s);
    }
  }, [perfil]);

  useEffect(() => {
    Promise.all([obtenerClientes(), obtenerServicios()])
      .then(([c, s]) => {
        setClientes(c);
        setCatalogoServicios(s);
      })
      .catch(console.error)
      .finally(() => setCargandoDB(false));
  }, []);

  // Cerrar lista al hacer clic fuera
  useEffect(() => {
    const cerrar = (e) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target)) {
        setMostrarLista(false);
      }
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, []);

  const clientesFiltrados = clientes
    .filter((c) =>
      c.razon_social
        ?.trim()
        .toLowerCase()
        .includes(busquedaCliente.toLowerCase()),
    )
    .slice(0, 10);

  const seleccionarCliente = (razonSocial) => {
    setClienteSeleccionado(razonSocial);
    if (!razonSocial) return;
    const c = clientes.find((x) => x.razon_social?.trim() === razonSocial);
    if (!c) return;
    setCliente((p) => ({
      ...p,
      atencion: c.nom_comercial?.trim() || "",
      contacto: c.razon_social?.trim() || "",
      email: c.e_mail?.trim() || "",
    }));
  };

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
      await guardarCotizacion({
        folio,
        fecha: fechaHoy(),
        sucursal,
        cliente: {
          ...cliente,
          atencion: cliente.atencion?.toUpperCase(),
          contacto: cliente.contacto?.toUpperCase(),
        },
        opciones: opcionesConTotales,
        basesExtra,
      });
      setModalFolio(folio);
    } catch (e) {
      alert("Error al guardar: " + e.message);
    }
    setGuardando(false);
  };

  return (
    <>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Título */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary-600 tracking-tight">
              Nueva cotización
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Folio:{" "}
              <span className="text-primary-600 font-semibold">{folio}</span>
            </p>
          </div>
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border"
            style={{
              background: "rgba(255,215,0,0.1)",
              borderColor: "rgba(255,215,0,0.3)",
              color: "#92700a",
            }}
          >
            📅 {fechaHoy()}
          </span>
        </div>

        {/* Sucursal */}
        <div
          className="flex items-center gap-4 rounded-2xl px-5 py-4 border"
          style={{
            background: "linear-gradient(135deg, #EEF2FF, #DBEAFE)",
            borderColor: "rgba(27,58,107,0.15)",
            boxShadow: "0 1px 3px rgba(27,58,107,0.06)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #1B3A6B, #0F2347)" }}
          >
            🏢
          </div>
          <div>
            <p className="text-sm font-bold text-primary-600">
              {sucursal?.tipo}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{sucursal?.ciudad}</p>
          </div>
        </div>

        {/* Cliente */}
        <div
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(27,58,107,0.06)" }}
        >
          <SectionHeader title="Datos del cliente" icon="👤" />
          <div className="p-6 flex flex-col gap-5">
            {/* Buscador con autocomplete */}
            <div ref={buscadorRef}>
              <label className={label}>Buscar cliente existente</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder={
                    cargandoDB
                      ? "⏳ Cargando clientes..."
                      : "Escribe para buscar cliente..."
                  }
                  value={busquedaCliente}
                  disabled={cargandoDB}
                  onChange={(e) => {
                    setBusquedaCliente(e.target.value);
                    setMostrarLista(true);
                  }}
                  onFocus={() => {
                    if (busquedaCliente) setMostrarLista(true);
                  }}
                  className={input + " pl-9 pr-8"}
                />
                {busquedaCliente && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusquedaCliente("");
                      setMostrarLista(false);
                      setClienteSeleccionado("");
                      setCliente((p) => ({
                        ...p,
                        atencion: "",
                        contacto: "",
                        email: "",
                      }));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg font-bold"
                  >
                    ×
                  </button>
                )}

                {/* Lista desplegable */}
                {mostrarLista && busquedaCliente && (
                  <div
                    className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto"
                    style={{ boxShadow: "0 8px 24px rgba(27,58,107,0.12)" }}
                  >
                    {clientesFiltrados.length > 0 ? (
                      clientesFiltrados.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setBusquedaCliente(c.razon_social?.trim() || "");
                            setMostrarLista(false);
                            seleccionarCliente(c.razon_social?.trim());
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <p className="text-sm font-semibold text-gray-800">
                            {c.razon_social?.trim()}
                          </p>
                          {c.e_mail && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {c.e_mail}
                            </p>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-400">
                        No se encontraron clientes
                      </div>
                    )}
                  </div>
                )}
              </div>

              {clienteSeleccionado && (
                <div className="flex items-center gap-2 mt-2 bg-primary-50 border border-primary-100 rounded-xl px-3 py-2">
                  <span className="text-xs text-primary-600 font-semibold flex-1 truncate">
                    ✓ {clienteSeleccionado}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setBusquedaCliente("");
                      setClienteSeleccionado("");
                      setCliente((p) => ({
                        ...p,
                        atencion: "",
                        contacto: "",
                        email: "",
                      }));
                    }}
                    className="text-xs text-red-400 hover:text-red-600 font-medium whitespace-nowrap"
                  >
                    × Limpiar
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Atención a (negocio) *</label>
                <input
                  className={input + " uppercase"}
                  placeholder="Nombre del negocio"
                  value={cliente.atencion}
                  onChange={(e) =>
                    setCliente((p) => ({ ...p, atencion: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className={label}>Contacto / Razón social</label>
                <input
                  className={input + " uppercase"}
                  placeholder="Razón social"
                  value={cliente.contacto || ""}
                  onChange={(e) =>
                    setCliente((p) => ({ ...p, contacto: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className={label}>Fecha de cotización</label>
                <input
                  className={input}
                  value={fechaHoy()}
                  readOnly
                  style={{ background: "#F8FAFF", color: "#6B7280" }}
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
                  placeholder="Observaciones, accesos especiales, horarios..."
                  value={cliente.notas || ""}
                  onChange={(e) =>
                    setCliente((p) => ({ ...p, notas: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Opciones de servicio */}
        <div
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(27,58,107,0.06)" }}
        >
          <SectionHeader title="Conceptos de servicio" icon="📦" />
          <div className="p-6 flex flex-col gap-5">
            {opciones.map((op, opIdx) => {
              const { subtotal, iva, total } = calcularTotalesOpcion(
                op.servicios,
              );
              return (
                <div
                  key={op.id}
                  className="border border-gray-200 rounded-2xl overflow-hidden"
                  style={{ boxShadow: "0 1px 3px rgba(27,58,107,0.04)" }}
                >
                  <div
                    className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100"
                    style={{
                      background: "linear-gradient(135deg, #F8FAFF, #EEF2FF)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                        style={{
                          background:
                            "linear-gradient(135deg, #1B3A6B, #0F2347)",
                        }}
                      >
                        {opIdx + 1}
                      </div>
                      <span className="text-sm font-bold text-primary-600 tracking-wide">
                        OPCIÓN {opIdx + 1}
                      </span>
                    </div>
                    {opciones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => quitarOpcion(op.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        × Eliminar opción
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-gray-50">
                    {op.servicios.map((srv, srvIdx) => {
                      const lineTotal = calcularServicio(srv);
                      return (
                        <div key={srv.id} className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                {srvIdx + 1}
                              </div>
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Servicio {srvIdx + 1}
                              </span>
                            </div>
                            {op.servicios.length > 1 && (
                              <button
                                type="button"
                                onClick={() => quitarServicio(op.id, srv.id)}
                                className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                × Quitar
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className={label}>
                                Concepto de servicio
                              </label>
                              <select
                                className={inputSm}
                                value={srv.servicioId || ""}
                                onChange={(e) =>
                                  alSeleccionarServicio(
                                    op.id,
                                    srv.id,
                                    e.target.value,
                                  )
                                }
                                disabled={cargandoDB}
                              >
                                <option value="">
                                  {cargandoDB
                                    ? "Cargando..."
                                    : "— Seleccionar servicio —"}
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
                                placeholder="0.00"
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
                                  className={
                                    inputSm + " text-center font-semibold"
                                  }
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
                                placeholder="0.00"
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
                                  className={
                                    inputSm + " text-center font-semibold"
                                  }
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
                            <div className="col-span-2">
                              <div className="flex items-center justify-end gap-2 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                                <span className="text-xs text-gray-400 font-medium">
                                  Subtotal línea:
                                </span>
                                <span className="text-sm font-bold text-primary-600 font-mono">
                                  $
                                  {lineTotal.toLocaleString("es-MX", {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-5 pb-4">
                    <button
                      type="button"
                      onClick={() => agregarServicio(op.id)}
                      className="w-full border-2 border-dashed border-gray-200 hover:border-primary-600 text-gray-400 hover:text-primary-600 text-xs font-semibold py-2.5 rounded-xl transition-all duration-200 hover:bg-primary-50"
                    >
                      + Agregar servicio
                    </button>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
                    {[
                      { l: "Subtotal", v: subtotal },
                      { l: "IVA 16%", v: iva },
                      { l: "Neto mensual", v: total, highlight: true },
                    ].map(({ l, v, highlight }) => (
                      <div
                        key={l}
                        className="text-center py-4 px-2"
                        style={
                          highlight
                            ? {
                                background:
                                  "linear-gradient(135deg, #EEF2FF, #DBEAFE)",
                              }
                            : {}
                        }
                      >
                        <p className="text-xs text-gray-400 font-medium mb-1">
                          {l}
                        </p>
                        <p
                          className={`text-sm font-bold font-mono ${highlight ? "text-primary-600" : "text-gray-700"}`}
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
              className="w-full border-2 border-dashed border-gray-200 hover:border-primary-600 text-gray-400 hover:text-primary-600 text-sm font-semibold py-4 rounded-2xl transition-all duration-200 hover:bg-primary-50"
            >
              + Agregar opción
            </button>
          </div>
        </div>

        {/* Bases */}
        <div
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(27,58,107,0.06)" }}
        >
          <SectionHeader title="Bases de la cotización" icon="📄" />
          <div className="p-6">
            <BasesEditor
              basesExtra={basesExtra}
              setBasesExtra={setBasesExtra}
            />
          </div>
        </div>

        {/* Botón guardar */}
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="w-full text-white font-bold text-sm py-4 rounded-2xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
          style={{
            background: guardando
              ? "#6B7280"
              : "linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)",
            boxShadow: guardando ? "none" : "0 4px 16px rgba(27,58,107,0.3)",
          }}
        >
          {guardando ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Guardando...
            </>
          ) : (
            <>💾 Guardar cotización</>
          )}
        </button>
      </div>

      {modalFolio && (
        <ModalCotizacion
          folio={modalFolio}
          emailCliente={cliente.email || ""}
          onCerrar={() => setModalFolio(null)}
        />
      )}
    </>
  );
}
