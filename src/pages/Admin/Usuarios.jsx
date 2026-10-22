import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, CircleAlert, Search, ShieldCheck, Users, X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useAvisos } from "../../hooks/useAvisos";
import { SUCURSALES, SUCURSAL_CORTA } from "../../utils/constantes";
import Boton from "../../components/ui/Boton";
import { campo, campoSm, etiqueta } from "../../components/ui/estilos";

const PUESTOS = [
  { id: "vendedor", label: "Vendedor" },
  { id: "administrativo", label: "Administrativo" },
  { id: "coordinador", label: "Coordinador" },
  { id: "gerente", label: "Gerente" },
];
const etiquetaPuesto = (id) => PUESTOS.find((p) => p.id === (id || "vendedor"))?.label || id;

const DIA_MS = 86400000;

const formatFecha = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "—";

const Avatar = ({ u, reciente }) => (
  <div className="relative flex-shrink-0">
    <div className="w-10 h-10 rounded-xl bg-accent-400 text-primary-800 flex items-center justify-center text-sm font-semibold">
      {u.nombre?.charAt(0)?.toUpperCase() || "U"}
    </div>
    {reciente && (
      <span
        className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-estado-aprobada border-2 border-white"
        title="Entró en las últimas 24 horas"
      />
    )}
  </div>
);

const Etiqueta = ({ children, tono }) => (
  <span
    className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
      tono === "alerta"
        ? "bg-estado-rechazada/10 text-estado-rechazada"
        : tono === "oro"
          ? "bg-accent-400/25 text-primary-800"
          : "bg-primary-50 text-primary-600"
    }`}
  >
    {children}
  </span>
);

const Etiquetas = ({ u, propio }) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    {propio && <Etiqueta>Tú</Etiqueta>}
    {u.rol === "admin" && <Etiqueta tono="oro">Admin</Etiqueta>}
    {!u.confirmed_at && <Etiqueta tono="alerta">Correo sin confirmar</Etiqueta>}
  </div>
);

const Cotizaciones = ({ c }) =>
  c ? (
    <div>
      <p className="text-sm font-medium text-gray-800">{c.total}</p>
      <p className="text-xs text-gray-500">{c.aprobadas} {c.aprobadas === 1 ? "aprobada" : "aprobadas"}</p>
    </div>
  ) : (
    <span className="text-sm text-gray-400">Ninguna</span>
  );

export default function Usuarios() {
  const { perfil } = useAuth();
  const { avisar, confirmar } = useAvisos();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [cotizacionesPorUsuario, setCotizacionesPorUsuario] = useState({});
  const [cargando, setCargando] = useState(true);
  const [ahora, setAhora] = useState(() => Date.now());
  const [busqueda, setBusqueda] = useState("");
  const [filtroPuesto, setFiltroPuesto] = useState("");
  const [filtroSucursal, setFiltroSucursal] = useState("");
  const [guardando, setGuardando] = useState(null);

  useEffect(() => {
    if (!perfil) return;
    if (perfil.rol !== "admin") {
      navigate("/");
      return;
    }
    const fetchData = async () => {
      setCargando(true);
      const [{ data, error }, { data: cots }] = await Promise.all([
        supabase.rpc("listar_usuarios").order("created_at", { ascending: false }),
        supabase.from("cotizaciones").select("usuario_id, estatus"),
      ]);
      if (error) avisar("No se pudieron cargar los usuarios: " + error.message);
      else setUsuarios(data || []);
      setCotizacionesPorUsuario(
        (cots || []).reduce((acc, c) => {
          const u = (acc[c.usuario_id] ||= { total: 0, aprobadas: 0 });
          u.total++;
          if (c.estatus === "Aprobada") u.aprobadas++;
          return acc;
        }, {}),
      );
      setAhora(Date.now());
      setCargando(false);
    };
    fetchData();
  }, [perfil, navigate, avisar]);

  // Actualiza un campo del perfil y la lista local; avisa si falla
  const actualizar = async (u, campos, mensajeExito) => {
    setGuardando(u.id);
    const { error } = await supabase.from("perfiles").update(campos).eq("id", u.id);
    setGuardando(null);
    if (error) return avisar("No se pudo guardar: " + error.message);
    setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...campos } : x)));
    avisar(mensajeExito, "exito");
  };

  const cambiarRol = async (u) => {
    const nuevoRol = u.rol === "admin" ? "usuario" : "admin";
    const ok = await confirmar(
      nuevoRol === "admin"
        ? `${u.nombre} tendrá acceso a Usuarios, Bitácora y a todas las cotizaciones.`
        : `${u.nombre} dejará de ser administrador.`,
      { titulo: nuevoRol === "admin" ? "Hacer administrador" : "Quitar administrador", textoAceptar: "Confirmar" },
    );
    if (ok) actualizar(u, { rol: nuevoRol }, `${u.nombre} ahora es ${nuevoRol === "admin" ? "administrador" : "usuario"}.`);
  };

  const cambiarPuesto = async (u, puesto) => {
    const supervisa = ["coordinador", "gerente"].includes(puesto);
    const ok = await confirmar(
      `¿Cambiar el puesto de ${u.nombre} a ${etiquetaPuesto(puesto)}?` +
        (supervisa ? "\n\nPodrá ver, editar y aprobar las cotizaciones de todas las sucursales." : ""),
      { titulo: "Cambiar puesto", textoAceptar: "Cambiar" },
    );
    if (ok) actualizar(u, { puesto }, `Puesto de ${u.nombre}: ${etiquetaPuesto(puesto)}.`);
  };

  const cambiarSucursal = async (u, sucursal_id) => {
    const ok = await confirmar(`¿Asignar a ${u.nombre} a ${SUCURSAL_CORTA[sucursal_id]}?`, {
      titulo: "Cambiar sucursal",
      textoAceptar: "Cambiar",
    });
    if (ok) actualizar(u, { sucursal_id }, `${u.nombre} ahora pertenece a ${SUCURSAL_CORTA[sucursal_id]}.`);
  };

  const esReciente = (fecha) => fecha && ahora - new Date(fecha).getTime() < DIA_MS;

  const tiempoDesde = (fecha) => {
    if (!fecha) return "Nunca ha entrado";
    const diff = ahora - new Date(fecha).getTime();
    const min = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / DIA_MS);
    if (min < 2) return "Ahora mismo";
    if (min < 60) return `Hace ${min} min`;
    if (hrs < 24) return `Hace ${hrs} h`;
    if (dias < 30) return `Hace ${dias} ${dias === 1 ? "día" : "días"}`;
    return formatFecha(fecha);
  };

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return usuarios.filter(
      (u) =>
        (u.nombre?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)) &&
        (!filtroSucursal || u.sucursal_id === filtroSucursal) &&
        (!filtroPuesto ||
          (filtroPuesto === "admin" ? u.rol === "admin" : (u.puesto || "vendedor") === filtroPuesto)),
    );
  }, [usuarios, busqueda, filtroPuesto, filtroSucursal]);

  const hayFiltros = busqueda || filtroPuesto || filtroSucursal;
  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroPuesto("");
    setFiltroSucursal("");
  };

  const sinConfirmar = usuarios.filter((u) => !u.confirmed_at).length;
  const resumen = [
    { icono: Users, label: "Usuarios", value: usuarios.length },
    {
      icono: Activity,
      label: "Activos en 7 días",
      value: usuarios.filter((u) => u.last_sign_in_at && ahora - new Date(u.last_sign_in_at).getTime() < 7 * DIA_MS).length,
    },
    {
      icono: ShieldCheck,
      label: "Coordinadores y gerentes",
      value: usuarios.filter((u) => ["coordinador", "gerente"].includes(u.puesto)).length,
    },
    { icono: CircleAlert, label: "Sin confirmar correo", value: sinConfirmar, alerta: sinConfirmar > 0 },
  ];

  if (cargando)
    return (
      <div className="flex justify-center items-center py-20 gap-3 text-gray-400 text-sm">
        <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
        Cargando usuarios...
      </div>
    );

  // Controles que comparten la tabla de escritorio y las tarjetas móviles
  const controlesDe = (u) => {
    const propio = u.id === perfil?.id;
    const ocupado = guardando === u.id;
    return {
      sucursal: (
        <select
          aria-label={`Sucursal de ${u.nombre}`}
          value={u.sucursal_id || ""}
          onChange={(e) => cambiarSucursal(u, e.target.value)}
          disabled={propio || ocupado}
          className={campoSm}
        >
          {!u.sucursal_id && <option value="">Sin sucursal</option>}
          {SUCURSALES.map((s) => (
            <option key={s.id} value={s.id}>
              {SUCURSAL_CORTA[s.id]}
            </option>
          ))}
        </select>
      ),
      puesto: (
        <select
          aria-label={`Puesto de ${u.nombre}`}
          value={u.puesto || "vendedor"}
          onChange={(e) => cambiarPuesto(u, e.target.value)}
          disabled={propio || ocupado}
          className={campoSm}
        >
          {PUESTOS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      ),
      rol: propio ? null : (
        <Boton variante="secundario" tamaño="sm" onClick={() => cambiarRol(u)} disabled={ocupado} className="whitespace-nowrap">
          {ocupado ? "Guardando..." : u.rol === "admin" ? "Quitar admin" : "Hacer admin"}
        </Boton>
      ),
    };
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-primary-800">Usuarios</h2>
        <p className="text-sm text-gray-500 mt-0.5">Sucursal, puesto y permisos de cada persona</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {resumen.map(({ icono: Icono, label, value, alerta }) => (
          <div
            key={label}
            className={`rounded-2xl p-4 border bg-white flex items-center gap-3 ${alerta ? "border-estado-rechazada/30" : "border-linea"}`}
          >
            <Icono size={20} className={alerta ? "text-estado-rechazada" : "text-primary-600"} aria-hidden="true" />
            <div>
              <p className={`text-2xl font-semibold tabular-nums ${alerta ? "text-estado-rechazada" : "text-primary-800"}`}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-linea p-4 grid gap-3 grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] items-end">
        <div className="relative col-span-2 lg:col-span-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar"
            placeholder="Buscar por nombre o correo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`${campo} pl-9`}
          />
        </div>
        <label>
          <span className={etiqueta}>Sucursal</span>
          <select value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value)} className={campo}>
            <option value="">Todas</option>
            {SUCURSALES.map((s) => (
              <option key={s.id} value={s.id}>
                {SUCURSAL_CORTA[s.id]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={etiqueta}>Puesto</span>
          <select value={filtroPuesto} onChange={(e) => setFiltroPuesto(e.target.value)} className={campo}>
            <option value="">Todos</option>
            {PUESTOS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
            <option value="admin">Administradores</option>
          </select>
        </label>
        {hayFiltros && (
          <div className="col-span-full flex justify-end -mb-1">
            <Boton variante="fantasma" tamaño="sm" icono={X} onClick={limpiarFiltros}>
              Quitar filtros
            </Boton>
          </div>
        )}
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-linea py-16 text-center">
          <p className="text-sm text-gray-600">Ningún usuario coincide con los filtros.</p>
        </div>
      ) : (
        <>
          {/* Tarjetas móvil */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {filtrados.map((u) => {
              const c = controlesDe(u);
              return (
                <li key={u.id} className="bg-white rounded-2xl border border-linea p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar u={u} reciente={esReciente(u.last_sign_in_at)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{u.nombre || "Sin nombre"}</p>
                      <p className="text-xs text-gray-500 truncate mb-1">{u.email}</p>
                      <Etiquetas u={u} propio={u.id === perfil?.id} />
                    </div>
                    {c.rol}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label>
                      <span className={etiqueta}>Sucursal</span>
                      {c.sucursal}
                    </label>
                    <label>
                      <span className={etiqueta}>Puesto</span>
                      {c.puesto}
                    </label>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 border-t border-linea pt-2">
                    <span>{tiempoDesde(u.last_sign_in_at)}</span>
                    <span>{cotizacionesPorUsuario[u.id]?.total || 0} cotizaciones</span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Tabla escritorio */}
          <div className="hidden lg:block bg-white rounded-2xl border border-linea overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-linea text-left text-xs text-gray-500">
                  <th className="px-5 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Sucursal</th>
                  <th className="px-4 py-3 font-medium">Puesto</th>
                  <th className="px-4 py-3 font-medium">Cotizaciones</th>
                  <th className="px-4 py-3 font-medium">Último acceso</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Permisos</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {filtrados.map((u) => {
                  const c = controlesDe(u);
                  return (
                    <tr key={u.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar u={u} reciente={esReciente(u.last_sign_in_at)} />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800">{u.nombre || "Sin nombre"}</p>
                            <p className="text-xs text-gray-500 mb-1">{u.email}</p>
                            <Etiquetas u={u} propio={u.id === perfil?.id} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 w-40">{c.sucursal}</td>
                      <td className="px-4 py-3.5 w-44">{c.puesto}</td>
                      <td className="px-4 py-3.5">
                        <Cotizaciones c={cotizacionesPorUsuario[u.id]} />
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-gray-700">{tiempoDesde(u.last_sign_in_at)}</p>
                        <p className="text-xs text-gray-500">Desde {formatFecha(u.created_at)}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right">{c.rol}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
