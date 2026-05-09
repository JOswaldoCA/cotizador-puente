import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const SUCURSALES_LABEL = {
  matriz: "SUC. MATRIZ",
  guaymas: "SUC. GUAYMAS",
  obregon: "SUC. OBREGÓN",
};

const sucursalColor = (id) => {
  if (id === "matriz")
    return { bg: "#EEF2FF", border: "#C7D2FE", text: "#3730A3", icon: "🏙️" };
  if (id === "guaymas")
    return { bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46", icon: "⚓" };
  if (id === "obregon")
    return { bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412", icon: "🌵" };
  return { bg: "#F3F4F6", border: "#E5E7EB", text: "#374151", icon: "🏢" };
};

const AHORA = Date.now();

export default function Usuarios() {
  const { perfil } = useAuth();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [cambiando, setCambiando] = useState(null);

  useEffect(() => {
    if (!perfil) return;
    if (perfil.rol !== "admin") {
      navigate("/");
      return;
    }
    const fetchData = async () => {
      setCargando(true);
      const { data, error } = await supabase
        .from("usuarios_admin")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setUsuarios(data || []);
      setCargando(false);
    };
    fetchData();
  }, [perfil, navigate]);

  const cambiarRol = async (id, rolActual) => {
    const nuevoRol = rolActual === "admin" ? "usuario" : "admin";
    if (!confirm(`¿Cambiar rol a ${nuevoRol}?`)) return;
    setCambiando(id);
    const { error } = await supabase
      .from("perfiles")
      .update({ rol: nuevoRol })
      .eq("id", id);
    if (!error)
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, rol: nuevoRol } : u)),
      );
    setCambiando(null);
  };

  const cambiarPuesto = async (id, nuevoPuesto) => {
    const { error } = await supabase
      .from("perfiles")
      .update({ puesto: nuevoPuesto })
      .eq("id", id);
    if (!error)
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, puesto: nuevoPuesto } : u)),
      );
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tiempoDesde = (fecha) => {
    if (!fecha) return "—";
    const diff = AHORA - new Date(fecha).getTime();
    const min = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    if (min < 2) return "AHORA mismo";
    if (min < 60) return `hace ${min} min`;
    if (hrs < 24) return `hace ${hrs}h`;
    if (dias < 30) return `hace ${dias}d`;
    return formatFecha(fecha);
  };

  const esReciente = (fecha) =>
    fecha && AHORA - new Date(fecha).getTime() < 86400000;

  const filtrados = usuarios.filter(
    (u) =>
      u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const admins = usuarios.filter((u) => u.rol === "admin").length;
  const activos = usuarios.filter(
    (u) =>
      u.last_sign_in_at &&
      AHORA - new Date(u.last_sign_in_at).getTime() < 7 * 86400000,
  ).length;

  if (cargando)
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "#F0F4F8" }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: "linear-gradient(135deg, #1B3A6B, #0F2347)" }}
        >
          👥
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
          Cargando usuarios...
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      {/* Header con breadcrumb */}
      <div className="flex flex-col gap-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 hover:text-primary-600 transition-colors font-medium"
          >
            📊 Dashboard
          </button>
          <span>›</span>
          <span className="text-primary-600 font-semibold">
            Gestión de usuarios
          </span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-xl lg:text-2xl font-bold tracking-tight"
              style={{ color: "#1B3A6B" }}
            >
              Gestión de usuarios
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Administra accesos, roles y permisos del sistema
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-primary-600 hover:text-primary-600 transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0"
          >
            ← Volver
          </button>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        {[
          {
            icon: "👥",
            label: "Total usuarios",
            value: usuarios.length,
            bg: "linear-gradient(135deg, #1B3A6B, #0F2347)",
            textColor: "text-white",
            subColor: "text-blue-300",
            shadow: "0 4px 16px rgba(27,58,107,0.3)",
          },
          {
            icon: "⭐",
            label: "Administradores",
            value: admins,
            bg: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
            border: "#FDE68A",
            textColor: "text-amber-800",
            subColor: "text-amber-600",
            shadow: "0 2px 8px rgba(217,119,6,0.15)",
          },
          {
            icon: "🟢",
            label: "Activos (7 días)",
            value: activos,
            bg: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
            border: "#A7F3D0",
            textColor: "text-emerald-800",
            subColor: "text-emerald-600",
            shadow: "0 2px 8px rgba(16,185,129,0.15)",
          },
        ].map(
          ({ icon, label, value, bg, border, textColor, subColor, shadow }) => (
            <div
              key={label}
              className="rounded-2xl p-4 lg:p-5 border flex flex-col gap-2"
              style={{
                background: bg,
                borderColor: border || "transparent",
                boxShadow: shadow,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{icon}</span>
                <span className={`text-3xl font-bold ${textColor}`}>
                  {value}
                </span>
              </div>
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${subColor}`}
              >
                {label}
              </p>
            </div>
          ),
        )}
      </div>

      {/* Buscador */}
      <div
        className="bg-white rounded-2xl border border-gray-100 p-4"
        style={{ boxShadow: "0 1px 3px rgba(27,58,107,0.06)" }}
      >
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-gray-50 transition-all duration-200"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg font-bold transition-colors"
            >
              ×
            </button>
          )}
        </div>
        {busqueda && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-600 inline-block"></span>
            {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""} para
            <span className="font-semibold text-primary-600">"{busqueda}"</span>
          </p>
        )}
      </div>

      {/* Cards móvil */}
      <div className="flex flex-col gap-3 lg:hidden">
        {filtrados.length === 0 ? (
          <div
            className="bg-white rounded-2xl border border-gray-100 py-16 text-center"
            style={{ boxShadow: "0 1px 3px rgba(27,58,107,0.06)" }}
          >
            <p className="text-4xl mb-3">👤</p>
            <p className="text-sm font-medium text-gray-500">
              No se encontraron usuarios
            </p>
          </div>
        ) : (
          filtrados.map((u) => {
            const sc = sucursalColor(u.sucursal_id);
            const rec = esReciente(u.last_sign_in_at);
            return (
              <div
                key={u.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md"
                style={{ boxShadow: "0 2px 8px rgba(27,58,107,0.06)" }}
              >
                {/* Header */}
                <div
                  className="px-4 py-4 flex items-center gap-3"
                  style={{
                    background:
                      "linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0 relative"
                    style={{
                      background: "linear-gradient(135deg, #FFE566, #FFD700)",
                      color: "#1B3A6B",
                    }}
                  >
                    {u.nombre?.charAt(0)?.toUpperCase() || "U"}
                    {rec && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white truncate">
                        {u.nombre || "—"}
                      </p>
                      {u.id === perfil?.id && (
                        <span className="text-xs bg-white/20 text-white px-1.5 py-0.5 rounded-md font-medium flex-shrink-0">
                          Tú
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-300/70 truncate mt-0.5">
                      {u.email}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${
                      u.rol === "admin"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {u.rol === "admin" ? "⭐ Admin" : "👤 User"}
                  </span>
                </div>

                {/* Body */}
                <div className="px-4 py-3 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Sucursal</p>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-lg border inline-block"
                        style={{
                          background: sc.bg,
                          borderColor: sc.border,
                          color: sc.text,
                        }}
                      >
                        {sc.icon}{" "}
                        {SUCURSALES_LABEL[u.sucursal_id] || u.sucursal_id}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Puesto</p>
                      {u.id !== perfil?.id ? (
                        <select
                          value={u.puesto || "vendedor"}
                          onChange={(e) => cambiarPuesto(u.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white w-full"
                        >
                          <option value="vendedor">Vendedor</option>
                          <option value="administrativo">Administrativo</option>
                          <option value="gerente">Gerente</option>
                        </select>
                      ) : (
                        <p className="text-xs font-medium text-gray-600 capitalize">
                          {u.puesto || "vendedor"}
                        </p>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Último login</p>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${rec ? "bg-green-400" : "bg-gray-300"}`}
                        ></div>
                        <span className="text-xs font-semibold text-gray-700">
                          {tiempoDesde(u.last_sign_in_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">
                      Registrado el
                    </p>
                    <p className="text-xs font-medium text-gray-600">
                      {formatFecha(u.created_at)}
                    </p>
                  </div>

                  {u.id !== perfil?.id ? (
                    <button
                      onClick={() => cambiarRol(u.id, u.rol)}
                      disabled={cambiando === u.id}
                      className="w-full text-xs font-bold py-2.5 rounded-xl border transition-all duration-200 disabled:opacity-40 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                      style={
                        u.rol === "admin"
                          ? {
                              borderColor: "#FDE68A",
                              color: "#92400E",
                              background: "#FFFBEB",
                            }
                          : {
                              borderColor: "#BFDBFE",
                              color: "#1E40AF",
                              background: "#EFF6FF",
                            }
                      }
                    >
                      {cambiando === u.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin"></div>
                          Cambiando...
                        </>
                      ) : u.rol === "admin" ? (
                        "⬇️ Quitar admin"
                      ) : (
                        "⬆️ Hacer admin"
                      )}
                    </button>
                  ) : (
                    <div className="w-full text-xs text-center py-2.5 text-gray-400 bg-gray-50 rounded-xl border border-gray-100 font-medium">
                      ✓ Tu cuenta
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tabla desktop */}
      <div
        className="hidden lg:block bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(27,58,107,0.08)" }}
      >
        <div
          className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #F8FAFF, #EEF2FF)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
              style={{
                background: "linear-gradient(135deg, #1B3A6B, #0F2347)",
              }}
            >
              👥
            </div>
            <div>
              <p className="text-sm font-bold text-primary-600">
                Directorio de usuarios
              </p>
              <p className="text-xs text-gray-400">
                {filtrados.length} de {usuarios.length} usuarios
              </p>
            </div>
          </div>
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="text-xs text-gray-500 hover:text-red-500 font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-all duration-200"
            >
              × Limpiar filtro
            </button>
          )}
        </div>

        <table className="w-full">
          <thead>
            <tr
              style={{
                background: "linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)",
              }}
            >
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-amber-300">
                Usuario
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-200">
                Sucursal
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-200">
                Rol
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-200">
                Puesto
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-200">
                Último acceso
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-200">
                Registrado
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-blue-200">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.map((u, i) => {
              const sc = sucursalColor(u.sucursal_id);
              const rec = esReciente(u.last_sign_in_at);
              return (
                <tr
                  key={u.id}
                  className={`transition-colors duration-150 hover:bg-primary-50/30 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}
                >
                  {/* Usuario */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                          style={{
                            background:
                              "linear-gradient(135deg, #FFE566, #FFD700)",
                            color: "#1B3A6B",
                          }}
                        >
                          {u.nombre?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        {rec && (
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-800 text-sm">
                            {u.nombre || "—"}
                          </p>
                          {u.id === perfil?.id && (
                            <span className="text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-md border border-primary-100 font-semibold">
                              Tú
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Sucursal */}
                  <td className="px-6 py-4">
                    <span
                      className="text-xs font-bold px-2.5 py-1.5 rounded-lg border inline-flex items-center gap-1"
                      style={{
                        background: sc.bg,
                        borderColor: sc.border,
                        color: sc.text,
                      }}
                    >
                      {sc.icon}{" "}
                      {SUCURSALES_LABEL[u.sucursal_id] || u.sucursal_id}
                    </span>
                  </td>

                  {/* Rol */}
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 ${
                        u.rol === "admin"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {u.rol === "admin" ? "⭐ Admin" : "👤 Usuario"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {u.id !== perfil?.id ? (
                      <select
                        value={u.puesto || "vendedor"}
                        onChange={(e) => cambiarPuesto(u.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 transition-all"
                      >
                        <option value="vendedor">Vendedor</option>
                        <option value="administrativo">Administrativo</option>
                        <option value="gerente">Gerente</option>
                      </select>
                    ) : (
                      <span className="text-xs text-gray-500 capitalize">
                        {u.puesto || "vendedor"}
                      </span>
                    )}
                  </td>

                

                  {/* Último acceso */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${rec ? "bg-green-400" : "bg-gray-200"}`}
                        style={
                          rec
                            ? { boxShadow: "0 0 6px rgba(74,222,128,0.6)" }
                            : {}
                        }
                      ></div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">
                          {tiempoDesde(u.last_sign_in_at)}
                        </p>
                        {u.last_sign_in_at && (
                          <p className="text-xs text-gray-400">
                            {formatFecha(u.last_sign_in_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Registrado */}
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-gray-500">
                      {formatFecha(u.created_at)}
                    </p>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 text-right">
                    {u.id !== perfil?.id ? (
                      <button
                        onClick={() => cambiarRol(u.id, u.rol)}
                        disabled={cambiando === u.id}
                        className="text-xs font-bold px-3 py-2 rounded-xl border transition-all duration-200 disabled:opacity-40 hover:scale-105 active:scale-95 inline-flex items-center gap-1.5"
                        style={
                          u.rol === "admin"
                            ? {
                                borderColor: "#FDE68A",
                                color: "#92400E",
                                background: "#FFFBEB",
                              }
                            : {
                                borderColor: "#BFDBFE",
                                color: "#1E40AF",
                                background: "#EFF6FF",
                              }
                        }
                      >
                        {cambiando === u.id ? (
                          <>
                            <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin"></div>
                            Cambiando...
                          </>
                        ) : u.rol === "admin" ? (
                          "⬇️ Quitar admin"
                        ) : (
                          "⬆️ Hacer admin"
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                        ✓ Tu cuenta
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtrados.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">👤</p>
            <p className="text-sm font-semibold text-gray-500 mb-1">
              No se encontraron usuarios
            </p>
            <p className="text-xs text-gray-400">
              Intenta con otro término de búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
