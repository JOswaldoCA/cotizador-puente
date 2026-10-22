import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useAvisos } from "../../hooks/useAvisos";
import { SUCURSALES } from "../../utils/constantes";

const PUESTOS = [
  { id: "vendedor", label: "Vendedor" },
  { id: "administrativo", label: "Administrativo" },
  { id: "coordinador", label: "Coordinador" },
  { id: "gerente", label: "Gerente" },
];
const etiquetaPuesto = (id) => PUESTOS.find((p) => p.id === (id || "vendedor"))?.label || id;

const sucursalColor = (id) => {
  if (id === "matriz")
    return { bg: "#EEF2FF", border: "#C7D2FE", text: "#3730A3", icon: "🏙️" };
  if (id === "guaymas")
    return { bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46", icon: "⚓" };
  if (id === "obregon")
    return { bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412", icon: "🌵" };
  return { bg: "#F3F4F6", border: "#E5E7EB", text: "#374151", icon: "🏢" };
};

const DIA_MS = 86400000;

const formatFecha = (fecha) =>
  fecha
    ? new Date(fecha).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const selectCls =
  "text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white w-full focus:outline-none focus:ring-2 focus:ring-primary-600/20 disabled:bg-gray-50 disabled:text-gray-500";

const Avatar = ({ u, reciente }) => (
  <div className="relative flex-shrink-0">
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
      style={{ background: "linear-gradient(135deg, #FFE566, #FFD700)", color: "#1B3A6B" }}
    >
      {u.nombre?.charAt(0)?.toUpperCase() || "U"}
    </div>
    {reciente && (
      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white"></div>
    )}
  </div>
);

const Etiquetas = ({ u, propio }) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    {propio && (
      <span className="text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-md border border-primary-100 font-semibold">
        Tú
      </span>
    )}
    {u.rol === "admin" && (
      <span className="text-xs bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-md border border-amber-200 font-semibold">
        ⭐ Admin
      </span>
    )}
    {!u.confirmed_at && (
      <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md border border-red-200 font-semibold">
        Correo sin confirmar
      </span>
    )}
  </div>
);

const Cotizaciones = ({ c }) => {
  if (!c) return <span className="text-xs text-gray-400">Ninguna</span>;
  return (
    <div>
      <p className="text-xs font-bold text-gray-700">{c.total}</p>
      <p className="text-xs text-gray-400">{c.aprobadas} aprobadas</p>
    </div>
  );
};

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
    const s = SUCURSALES.find((x) => x.id === sucursal_id);
    const ok = await confirmar(`¿Asignar a ${u.nombre} a ${s?.tipo}?`, {
      titulo: "Cambiar sucursal",
      textoAceptar: "Cambiar",
    });
    if (ok) actualizar(u, { sucursal_id }, `${u.nombre} ahora pertenece a ${s?.tipo}.`);
  };

  const esReciente = (fecha) => fecha && ahora - new Date(fecha).getTime() < DIA_MS;

  const tiempoDesde = (fecha) => {
    if (!fecha) return "Nunca";
    const diff = ahora - new Date(fecha).getTime();
    const min = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / DIA_MS);
    if (min < 2) return "Ahora mismo";
    if (min < 60) return `Hace ${min} min`;
    if (hrs < 24) return `Hace ${hrs} h`;
    if (dias < 30) return `Hace ${dias} d`;
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

  const resumen = [
    { icon: "👥", label: "Usuarios", value: usuarios.length },
    {
      icon: "🟢",
      label: "Activos 7 días",
      value: usuarios.filter((u) => u.last_sign_in_at && ahora - new Date(u.last_sign_in_at).getTime() < 7 * DIA_MS).length,
    },
    {
      icon: "🧭",
      label: "Coord. y gerentes",
      value: usuarios.filter((u) => ["coordinador", "gerente"].includes(u.puesto)).length,
    },
    {
      icon: "✉️",
      label: "Sin confirmar",
      value: usuarios.filter((u) => !u.confirmed_at).length,
      alerta: true,
    },
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
          value={u.sucursal_id || ""}
          onChange={(e) => cambiarSucursal(u, e.target.value)}
          disabled={propio || ocupado}
          className={selectCls}
        >
          {!u.sucursal_id && <option value="">Sin sucursal</option>}
          {SUCURSALES.map((s) => (
            <option key={s.id} value={s.id}>
              {sucursalColor(s.id).icon} {s.tipo}
            </option>
          ))}
        </select>
      ),
      puesto: (
        <select
          value={u.puesto || "vendedor"}
          onChange={(e) => cambiarPuesto(u, e.target.value)}
          disabled={propio || ocupado}
          className={selectCls}
        >
          {PUESTOS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      ),
      rol: propio ? (
        <span className="text-xs text-gray-400 italic">Tu cuenta</span>
      ) : (
        <button
          onClick={() => cambiarRol(u)}
          disabled={ocupado}
          className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 disabled:opacity-40 whitespace-nowrap"
          style={
            u.rol === "admin"
              ? { borderColor: "#FDE68A", color: "#92400E", background: "#FFFBEB" }
              : { borderColor: "#BFDBFE", color: "#1E40AF", background: "#EFF6FF" }
          }
        >
          {ocupado ? "Guardando..." : u.rol === "admin" ? "Quitar admin" : "Hacer admin"}
        </button>
      ),
    };
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl lg:text-2xl font-bold tracking-tight" style={{ color: "#1B3A6B" }}>
          Gestión de usuarios
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Sucursal, puesto y permisos de cada persona
        </p>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {resumen.map(({ icon, label, value, alerta }) => (
          <div
            key={label}
            className="rounded-2xl p-4 border bg-white flex items-center gap-3"
            style={{
              borderColor: alerta && value > 0 ? "#FECACA" : "rgba(27,58,107,0.08)",
              boxShadow: "0 1px 3px rgba(27,58,107,0.06)",
            }}
          >
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-2xl font-bold" style={{ color: alerta && value > 0 ? "#B91C1C" : "#1B3A6B" }}>
                {value}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div
        className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col lg:flex-row gap-3"
        style={{ boxShadow: "0 1px 3px rgba(27,58,107,0.06)" }}
      >
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-gray-50"
          />
        </div>
        <select
          value={filtroSucursal}
          onChange={(e) => setFiltroSucursal(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        >
          <option value="">Todas las sucursales</option>
          {SUCURSALES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.tipo}
            </option>
          ))}
        </select>
        <select
          value={filtroPuesto}
          onChange={(e) => setFiltroPuesto(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        >
          <option value="">Todos los puestos</option>
          {PUESTOS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          <option value="admin">Administradores</option>
        </select>
        {hayFiltros && (
          <button
            onClick={limpiarFiltros}
            className="text-xs text-gray-500 hover:text-red-500 font-medium px-3 py-2.5 rounded-xl border border-gray-200 hover:border-red-200 hover:bg-red-50 whitespace-nowrap"
          >
            × Limpiar
          </button>
        )}
      </div>

      {filtrados.length === 0 ? (
        <div
          className="bg-white rounded-2xl border border-gray-100 py-16 text-center"
          style={{ boxShadow: "0 1px 3px rgba(27,58,107,0.06)" }}
        >
          <p className="text-4xl mb-3">👤</p>
          <p className="text-sm font-medium text-gray-500">No se encontraron usuarios</p>
        </div>
      ) : (
        <>
          {/* Tarjetas móvil */}
          <div className="flex flex-col gap-3 lg:hidden">
            {filtrados.map((u) => {
              const c = controlesDe(u);
              return (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3"
                  style={{ boxShadow: "0 2px 8px rgba(27,58,107,0.06)" }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar u={u} reciente={esReciente(u.last_sign_in_at)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{u.nombre || "—"}</p>
                      <p className="text-xs text-gray-400 truncate mb-1">{u.email}</p>
                      <Etiquetas u={u} propio={u.id === perfil?.id} />
                    </div>
                    {c.rol}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-gray-400">Sucursal</span>
                      {c.sucursal}
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-gray-400">Puesto</span>
                      {c.puesto}
                    </label>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 border-t border-gray-50 pt-2">
                    <span>Último acceso: <b className="text-gray-700">{tiempoDesde(u.last_sign_in_at)}</b></span>
                    <span>
                      Cotizaciones: <b className="text-gray-700">{cotizacionesPorUsuario[u.id]?.total || 0}</b>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabla desktop */}
          <div
            className="hidden lg:block bg-white rounded-2xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(27,58,107,0.08)" }}
          >
            <div className="px-6 py-3 border-b border-gray-100 text-xs text-gray-400" style={{ background: "linear-gradient(135deg, #F8FAFF, #EEF2FF)" }}>
              {filtrados.length} de {usuarios.length} usuarios
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: "linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)" }}>
                  {["Usuario", "Sucursal", "Puesto", "Cotizaciones", "Último acceso", "Registrado", ""].map((h, i) => (
                    <th
                      key={h || i}
                      className={`px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider ${i === 0 ? "text-amber-300" : "text-blue-200"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map((u) => {
                  const c = controlesDe(u);
                  return (
                    <tr key={u.id} className="hover:bg-primary-50/30 transition-colors duration-150">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar u={u} reciente={esReciente(u.last_sign_in_at)} />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 text-sm">{u.nombre || "—"}</p>
                            <p className="text-xs text-gray-400 mb-1">{u.email}</p>
                            <Etiquetas u={u} propio={u.id === perfil?.id} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 w-44">{c.sucursal}</td>
                      <td className="px-5 py-3.5 w-40">{c.puesto}</td>
                      <td className="px-5 py-3.5">
                        <Cotizaciones c={cotizacionesPorUsuario[u.id]} />
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-semibold text-gray-700">{tiempoDesde(u.last_sign_in_at)}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{formatFecha(u.created_at)}</td>
                      <td className="px-5 py-3.5 text-right">{c.rol}</td>
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
