import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Building2,
  Check,
  MapPin,
  Minus,
  Package,
  Plus,
  Receipt,
  Save,
  ScrollText,
  Search,
  Trash2,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";
import { useCotizacion } from "../hooks/useCotizacion";
import { SUCURSALES, SUCURSAL_CORTA, VIGENCIAS } from "../utils/constantes";
import {
  fechaHoy,
  calcularServicio,
  calcularTotalesOpcion,
  estaVencida,
  fechaDeCotizacion,
  formatMXN,
} from "../utils/calculos";
import {
  obtenerCotizacion,
  guardarCotizacion,
  actualizarCotizacion,
} from "../services/cotizaciones";
import { obtenerClientes, obtenerServicios } from "../services/sqlserver";
import ModalCotizacion from "../components/ModalCotizacion";
import { useAuth } from "../hooks/useAuth";
import BasesEditor from "../components/BasesEditor";
import { esSupervisor } from "../utils/permisos";
import { useAvisos } from "../hooks/useAvisos";
import Boton from "../components/ui/Boton";
import BotonIcono from "../components/ui/BotonIcono";
import Seccion from "../components/ui/Seccion";
import { campo, etiqueta } from "../components/ui/estilos";

const PAGOS = ["MES SERVIDO", "MES CORRIENTE"];

// Número entero con botones − / +
function Contador({ id, etiqueta: texto, valor, onCambio, min = 1, max = Infinity }) {
  const boton =
    "w-9 h-10 flex items-center justify-center text-gray-500 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div>
      <label htmlFor={id} className={etiqueta}>
        {texto}
      </label>
      <div className="flex items-stretch border border-linea rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-600/20 focus-within:border-primary-600">
        <button type="button" className={boton} onClick={() => onCambio(Math.max(min, valor - 1))} disabled={valor <= min} aria-label={`Menos ${texto.toLowerCase()}`}>
          <Minus size={14} aria-hidden="true" />
        </button>
        <input
          id={id}
          type="number"
          min={min}
          max={max === Infinity ? undefined : max}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          className="w-full min-w-0 text-center text-sm font-medium text-gray-800 border-x border-linea focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button type="button" className={boton} onClick={() => onCambio(Math.min(max, valor + 1))} disabled={valor >= max} aria-label={`Más ${texto.toLowerCase()}`}>
          <Plus size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function CampoDinero({ id, etiqueta: texto, valor, onCambio }) {
  return (
    <div>
      <label htmlFor={id} className={etiqueta}>
        {texto}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" aria-hidden="true">$</span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={valor || ""}
          onChange={(e) => onCambio(e.target.value)}
          className={`${campo} pl-7`}
        />
      </div>
    </div>
  );
}

// Nueva (/nueva) y edición (/cotizaciones/:folio/editar) usan este formulario.
// Al editar una cotización vencida se guarda como una nueva con otro folio.
export default function FormularioCotizacion() {
  const { folio: folioParam } = useParams();
  const editando = Boolean(folioParam);
  const navigate = useNavigate();

  const {
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
    cargarCotizacion,
  } = useCotizacion();

  const { perfil } = useAuth();
  const { avisar } = useAvisos();
  const buscadorRef = useRef(null);

  const [catalogoServicios, setCatalogoServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [modalFolio, setModalFolio] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [cargandoDB, setCargandoDB] = useState(true);
  const [cargando, setCargando] = useState(editando);
  const [esVencida, setEsVencida] = useState(false);

  // Cotización nueva: arranca con la sucursal del usuario
  useEffect(() => {
    if (!editando && perfil?.sucursal_id) {
      const s = SUCURSALES.find((x) => x.id === perfil.sucursal_id);
      if (s) setSucursal(s);
    }
  }, [perfil, editando]);

  const puedeElegirSucursal = esSupervisor(perfil);

  useEffect(() => {
    Promise.all([
      obtenerClientes(),
      obtenerServicios(),
      editando ? obtenerCotizacion(folioParam) : null,
    ])
      .then(([c, s, cot]) => {
        setClientes(c);
        setCatalogoServicios(s);
        if (!editando) return;
        if (!cot) return navigate("/cotizaciones");
        cargarCotizacion(cot);
        setEsVencida(estaVencida(fechaDeCotizacion(cot), cot.cliente?.vigencia));
        // Prellenar buscador con el cliente actual
        if (cot.cliente?.contacto) {
          setBusquedaCliente(cot.cliente.contacto);
          setClienteSeleccionado(cot.cliente.contacto);
        }
      })
      .catch(console.error)
      .finally(() => {
        setCargandoDB(false);
        setCargando(false);
      });
  }, [folioParam]);

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
      return avisar("Escribe o selecciona el nombre del cliente.");
    setGuardando(true);
    try {
      const opcionesConTotales = opciones.map((op) => ({
        ...op,
        ...calcularTotalesOpcion(op.servicios),
      }));
      const datos = {
        sucursal,
        cliente: {
          ...cliente,
          atencion: cliente.atencion?.toUpperCase(),
          contacto: cliente.contacto?.toUpperCase(),
        },
        opciones: opcionesConTotales,
        basesExtra,
      };
      if (editando && !esVencida) {
        await actualizarCotizacion({ ...datos, folio: folioParam });
        setModalFolio(folioParam);
      } else {
        const guardada = await guardarCotizacion({ ...datos, fecha: fechaHoy() });
        setModalFolio(guardada.folio);
      }
    } catch (e) {
      avisar("Error al guardar: " + e.message);
    }
    setGuardando(false);
  };

  if (cargando)
    return (
      <div className="flex justify-center items-center py-20 gap-3 text-gray-400 text-sm">
        <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
        Cargando cotización...
      </div>
    );

  const limpiarCliente = () => {
    setBusquedaCliente("");
    setMostrarLista(false);
    setClienteSeleccionado("");
    setCliente((p) => ({ ...p, atencion: "", contacto: "", email: "" }));
  };

  const totales = opciones.map((op) => calcularTotalesOpcion(op.servicios));
  const textoGuardar = guardando
    ? "Guardando..."
    : !editando
      ? "Guardar cotización"
      : esVencida
        ? "Generar nueva cotización"
        : "Guardar cambios";

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Título */}
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-primary-800">
            {!editando ? "Nueva cotización" : esVencida ? "Renovar cotización" : "Editar cotización"}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {!editando ? (
              "El folio se asigna al guardar"
            ) : (
              <>
                {esVencida ? "A partir de " : "Folio "}
                <span className="font-mono">{folioParam}</span>
              </>
            )}
          </p>
        </div>

        {esVencida && (
          <div className="rounded-2xl bg-estado-rechazada/10 px-4 py-3 flex items-start gap-3 text-sm text-estado-rechazada" role="status">
            <TriangleAlert size={18} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              Esta cotización ya venció. Al guardar se crea una nueva con otro folio y la fecha de hoy; la original no cambia.
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] items-start">
          <div className="flex flex-col gap-6 min-w-0">
            {/* Sucursal */}
            {puedeElegirSucursal && (
              <Seccion icono={Building2} titulo="Sucursal">
                <div className="p-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Sucursal">
                  {SUCURSALES.map((s) => {
                    const activa = sucursal?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="radio"
                        aria-checked={activa}
                        onClick={() => setSucursal(s)}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
                          activa ? "border-primary-600 bg-primary-50" : "border-linea hover:border-primary-600/40"
                        }`}
                      >
                        <MapPin size={18} className={activa ? "text-primary-600" : "text-gray-400"} aria-hidden="true" />
                        <span className="min-w-0">
                          <span className={`block text-sm font-medium ${activa ? "text-primary-800" : "text-gray-700"}`}>
                            {SUCURSAL_CORTA[s.id]}
                          </span>
                        </span>
                        {activa && <Check size={16} className="ml-auto text-primary-600" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </Seccion>
            )}

            {/* Cliente */}
            <Seccion icono={UserRound} titulo="Cliente">
              <div className="p-4 lg:p-6 flex flex-col gap-4">
                <div ref={buscadorRef}>
                  <label htmlFor="buscar-cliente" className={etiqueta}>
                    Buscar en el catálogo de clientes
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                    <input
                      id="buscar-cliente"
                      type="text"
                      autoComplete="off"
                      placeholder={cargandoDB ? "Cargando clientes..." : "Escribe la razón social"}
                      value={busquedaCliente}
                      disabled={cargandoDB}
                      onChange={(e) => {
                        setBusquedaCliente(e.target.value);
                        setMostrarLista(true);
                      }}
                      onFocus={() => busquedaCliente && setMostrarLista(true)}
                      className={`${campo} pl-9 pr-9`}
                    />
                    {busquedaCliente && (
                      <button
                        type="button"
                        onClick={limpiarCliente}
                        aria-label="Quitar cliente"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    )}

                    {mostrarLista && busquedaCliente && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-linea rounded-xl overflow-hidden max-h-64 overflow-y-auto shadow-medium">
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
                              className="w-full text-left px-4 py-2.5 hover:bg-primary-50 border-b border-linea last:border-0"
                            >
                              <span className="block text-sm font-medium text-gray-800">{c.razon_social?.trim()}</span>
                              {c.e_mail && <span className="block text-xs text-gray-500 truncate">{c.e_mail}</span>}
                            </button>
                          ))
                        ) : (
                          <p className="px-4 py-3 text-sm text-gray-500">
                            No está en el catálogo. Captura los datos abajo.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {clienteSeleccionado && (
                    <p className="text-xs text-estado-aprobada mt-1.5 flex items-center gap-1">
                      <Check size={14} aria-hidden="true" /> Datos tomados del catálogo
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="atencion" className={etiqueta}>
                      Atención a (negocio)
                    </label>
                    <input
                      id="atencion"
                      className={`${campo} uppercase`}
                      value={cliente.atencion || ""}
                      onChange={(e) => setCliente((p) => ({ ...p, atencion: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="contacto" className={etiqueta}>
                      Razón social
                    </label>
                    <input
                      id="contacto"
                      className={`${campo} uppercase`}
                      value={cliente.contacto || ""}
                      onChange={(e) => setCliente((p) => ({ ...p, contacto: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="vigencia" className={etiqueta}>
                      Vigencia
                    </label>
                    <select
                      id="vigencia"
                      className={campo}
                      value={cliente.vigencia}
                      onChange={(e) => setCliente((p) => ({ ...p, vigencia: e.target.value }))}
                    >
                      {VIGENCIAS.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="pago" className={etiqueta}>
                      Facturación
                    </label>
                    <select
                      id="pago"
                      className={campo}
                      value={cliente.pago || "MES SERVIDO"}
                      onChange={(e) => setCliente((p) => ({ ...p, pago: e.target.value }))}
                    >
                      {PAGOS.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="email-cliente" className={etiqueta}>
                      Correo del cliente
                    </label>
                    <input
                      id="email-cliente"
                      className={campo}
                      type="text"
                      inputMode="email"
                      placeholder="compras@cliente.com"
                      value={cliente.email || ""}
                      onChange={(e) => setCliente((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="notas" className={etiqueta}>
                      Observaciones (aparecen en el PDF)
                    </label>
                    <textarea
                      id="notas"
                      className={`${campo} resize-y`}
                      rows={2}
                      placeholder="Accesos, horarios, indicaciones especiales"
                      value={cliente.notas || ""}
                      onChange={(e) => setCliente((p) => ({ ...p, notas: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </Seccion>

            {/* Opciones de servicio */}
            <Seccion
              icono={Package}
              titulo="Servicios"
              descripcion="Cada opción es una propuesta distinta para el cliente"
            >
              <div className="p-4 lg:p-6 flex flex-col gap-5">
                {opciones.map((op, opIdx) => (
                  <div key={op.id} className="rounded-xl border border-linea">
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-gray-50 border-b border-linea rounded-t-xl">
                      <p className="text-sm font-semibold text-primary-800">Opción {opIdx + 1}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">${formatMXN(totales[opIdx].total)} con IVA</span>
                        {opciones.length > 1 && (
                          <BotonIcono icono={Trash2} etiqueta={`Eliminar opción ${opIdx + 1}`} peligro onClick={() => quitarOpcion(op.id)} />
                        )}
                      </div>
                    </div>

                    <ul className="divide-y divide-linea">
                      {op.servicios.map((srv, srvIdx) => {
                        const id = `${op.id}-${srv.id}`;
                        return (
                          <li key={srv.id} className="p-4 flex flex-col gap-3">
                            <div className="flex items-end gap-2">
                              <div className="flex-1 min-w-0">
                                <label htmlFor={`concepto-${id}`} className={etiqueta}>
                                  Servicio {op.servicios.length > 1 ? srvIdx + 1 : ""}
                                </label>
                                <select
                                  id={`concepto-${id}`}
                                  className={campo}
                                  value={srv.servicioId || srv.nombre || ""}
                                  onChange={(e) => alSeleccionarServicio(op.id, srv.id, e.target.value)}
                                  disabled={cargandoDB}
                                >
                                  <option value="">{cargandoDB ? "Cargando..." : "Selecciona un servicio"}</option>
                                  {catalogoServicios.map((s, i) => (
                                    <option key={i} value={s.nombre}>
                                      {s.nombre}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {op.servicios.length > 1 && (
                                <div className="pb-1">
                                  <BotonIcono icono={Trash2} etiqueta="Quitar servicio" peligro onClick={() => quitarServicio(op.id, srv.id)} />
                                </div>
                              )}
                            </div>
                            <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                              <CampoDinero
                                id={`precio-${id}`}
                                etiqueta="Precio por contenedor"
                                valor={srv.precioUnitario}
                                onCambio={(v) => cambiarCampo(op.id, srv.id, "precioUnitario", v)}
                              />
                              <Contador
                                id={`contenedores-${id}`}
                                etiqueta="Contenedores"
                                valor={srv.numContenedores}
                                min={1}
                                onCambio={(v) => cambiarCampo(op.id, srv.id, "numContenedores", v)}
                              />
                              <CampoDinero
                                id={`dia-${id}`}
                                etiqueta="Precio por visita"
                                valor={srv.precioDia}
                                onCambio={(v) => cambiarCampo(op.id, srv.id, "precioDia", v)}
                              />
                              <Contador
                                id={`visitas-${id}`}
                                etiqueta="Visitas por semana"
                                valor={srv.diasSemana}
                                min={1}
                                max={7}
                                onCambio={(v) => cambiarCampo(op.id, srv.id, "diasSemana", v)}
                              />
                            </div>
                            <p className="text-sm text-gray-600 text-right">
                              Subtotal del servicio{" "}
                              <span className="font-semibold text-gray-800">${formatMXN(calcularServicio(srv))}</span>
                            </p>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="px-4 pb-4">
                      <Boton variante="fantasma" tamaño="sm" icono={Plus} onClick={() => agregarServicio(op.id)}>
                        Agregar servicio a la opción {opIdx + 1}
                      </Boton>
                    </div>
                  </div>
                ))}

                <Boton variante="secundario" icono={Plus} onClick={agregarOpcion} className="w-full border-dashed">
                  Agregar otra opción
                </Boton>
              </div>
            </Seccion>

            {/* Bases */}
            <Seccion icono={ScrollText} titulo="Bases de la cotización">
              <div className="p-4 lg:p-6">
                <BasesEditor basesExtra={basesExtra} setBasesExtra={setBasesExtra} />
              </div>
            </Seccion>
          </div>

          {/* Resumen fijo */}
          <aside className="lg:sticky lg:top-24 flex flex-col gap-4">
            <Seccion icono={Receipt} titulo="Resumen">
              <dl className="px-4 lg:px-5 py-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm border-b border-linea">
                <dt className="text-gray-500">Sucursal</dt>
                <dd className="text-gray-800 text-right">{SUCURSAL_CORTA[sucursal?.id]}</dd>
                <dt className="text-gray-500">Fecha</dt>
                <dd className="text-gray-800 text-right">{editando && !esVencida ? "La original" : fechaHoy().toLowerCase()}</dd>
                <dt className="text-gray-500">Vigencia</dt>
                <dd className="text-gray-800 text-right">{cliente.vigencia?.toLowerCase()}</dd>
              </dl>
              <ul className="divide-y divide-linea">
                {totales.map((t, i) => (
                  <li key={i} className="px-4 lg:px-5 py-3 text-sm">
                    <p className="font-medium text-primary-800 mb-1">Opción {i + 1}</p>
                    <div className="grid grid-cols-[1fr_auto] gap-y-0.5 text-gray-600">
                      <span>Subtotal</span>
                      <span className="text-right">${formatMXN(t.subtotal)}</span>
                      <span>IVA 16%</span>
                      <span className="text-right">${formatMXN(t.iva)}</span>
                      <span className="font-semibold text-gray-800">Neto mensual</span>
                      <span className="text-right font-semibold text-gray-800">${formatMXN(t.total)}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="p-4 lg:p-5 border-t border-linea flex flex-col gap-2">
                <Boton icono={Save} onClick={guardar} disabled={guardando} className="w-full">
                  {textoGuardar}
                </Boton>
                {editando && (
                  <Boton variante="secundario" onClick={() => navigate("/cotizaciones")} className="w-full">
                    Cancelar
                  </Boton>
                )}
              </div>
            </Seccion>
          </aside>
        </div>
      </div>

      {modalFolio && (
        <ModalCotizacion
          folio={modalFolio}
          emailCliente={cliente.email || ""}
          onCerrar={() => (editando ? navigate("/cotizaciones") : setModalFolio(null))}
        />
      )}
    </>
  );
}
