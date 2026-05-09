import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../hooks/useAuth";

const inputCls =
  "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-200 bg-gray-50";
const labelCls =
  "text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block";

const SUCURSALES_LABEL = {
  matriz: "SUC. MATRIZ — Hermosillo",
  guaymas: "SUC. GUAYMAS — Guaymas",
  obregon: "SUC. OBREGÓN — Ciudad Obregón",
};

export default function Perfil() {
  const { perfil } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState(perfil?.nombre || "");
  const [emailUsuario, setEmailUsuario] = useState(""); // ← aquí dentro
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [passwordConf, setPasswordConf] = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [exitoNombre, setExitoNombre] = useState(false);
  const [exitoPassword, setExitoPassword] = useState(false);
  const [errorNombre, setErrorNombre] = useState("");
  const [errorPassword, setErrorPassword] = useState("");

  useEffect(() => {
    // ← aquí dentro
    supabase.auth.getUser().then(({ data }) => {
      setEmailUsuario(data.user?.email || "");
    });
  }, []);

  const guardarNombre = async () => {
    if (!nombre.trim())
      return setErrorNombre("El nombre no puede estar vacío.");
    setErrorNombre("");
    setGuardandoNombre(true);
    const { error } = await supabase
      .from("perfiles")
      .update({ nombre: nombre.trim() })
      .eq("id", perfil.id);
    setGuardandoNombre(false);
    if (error) return setErrorNombre("No se pudo actualizar el nombre.");
    setExitoNombre(true);
    setTimeout(() => setExitoNombre(false), 3000);
  };

  const guardarPassword = async () => {
    setErrorPassword("");
    if (passwordNuevo.length < 8)
      return setErrorPassword(
        "La contraseña debe tener al menos 8 caracteres.",
      );
    if (passwordNuevo !== passwordConf)
      return setErrorPassword("Las contraseñas no coinciden.");
    setGuardandoPassword(true);

    // Verificar contraseña actual
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error: errorLogin } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordActual,
    });
    if (errorLogin) {
      setGuardandoPassword(false);
      return setErrorPassword("La contraseña actual es incorrecta.");
    }

    // Actualizar contraseña
    const { error } = await supabase.auth.updateUser({
      password: passwordNuevo,
    });
    setGuardandoPassword(false);
    if (error) return setErrorPassword("No se pudo actualizar la contraseña.");
    setExitoPassword(true);
    setPasswordActual("");
    setPasswordNuevo("");
    setPasswordConf("");
    setTimeout(() => setExitoPassword(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <button
            onClick={() => navigate("/")}
            className="hover:text-primary-600 transition-colors font-medium"
          >
            📊 Dashboard
          </button>
          <span>›</span>
          <span className="text-primary-600 font-semibold">Mi perfil</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-xl lg:text-2xl font-bold tracking-tight"
              style={{ color: "#1B3A6B" }}
            >
              Mi perfil
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Administra tu información personal
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

      {/* Card info */}
      <div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(27,58,107,0.08)" }}
      >
        <div
          className="px-6 py-5 flex items-center gap-4"
          style={{
            background: "linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #FFE566, #FFD700)",
              color: "#1B3A6B",
            }}
          >
            {perfil?.nombre?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-lg font-bold text-white">
              {perfil?.nombre || "—"}
            </p>
            <p className="text-xs text-blue-300 mt-0.5">
              {perfil?.email || ""}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-white/10 text-blue-200 px-2.5 py-1 rounded-lg border border-white/10 font-medium">
                {SUCURSALES_LABEL[perfil?.sucursal_id] || perfil?.sucursal_id}
              </span>
              {perfil?.rol === "admin" && (
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-lg"
                  style={{
                    background: "rgba(255,215,0,0.2)",
                    color: "#FFD700",
                    border: "1px solid rgba(255,215,0,0.3)",
                  }}
                >
                  ⭐ Admin
                </span>
              )}
              {perfil?.puesto && (
                <span className="text-xs bg-white/10 text-blue-200 px-2.5 py-1 rounded-lg border border-white/10 font-medium capitalize">
                  {perfil.puesto}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cambiar nombre */}
      <div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(27,58,107,0.06)" }}
      >
        <div
          className="px-6 py-4 border-b border-gray-100 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #F8FAFF, #EEF2FF)" }}
        >
          <span className="text-lg">✏️</span>
          <h3 className="text-sm font-bold text-primary-600">Cambiar nombre</h3>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className={labelCls}>Nombre completo</label>
            <input
              type="text"
              className={inputCls}
              placeholder="Tu nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          {errorNombre && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <p className="text-xs text-red-600 font-medium">{errorNombre}</p>
            </div>
          )}

          {exitoNombre && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <span>✅</span>
              <p className="text-xs text-emerald-700 font-medium">
                ¡Nombre actualizado correctamente!
              </p>
            </div>
          )}

          <button
            onClick={guardarNombre}
            disabled={guardandoNombre}
            className="w-full text-white font-bold text-sm py-3 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            style={{
              background: guardandoNombre
                ? "#6B7280"
                : "linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)",
              boxShadow: guardandoNombre
                ? "none"
                : "0 4px 16px rgba(27,58,107,0.3)",
            }}
          >
            {guardandoNombre ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Guardando...
              </>
            ) : (
              "💾 Guardar nombre"
            )}
          </button>
        </div>
      </div>

      {/* Cambiar contraseña */}
      <div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(27,58,107,0.06)" }}
      >
        <div
          className="px-6 py-4 border-b border-gray-100 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #F8FAFF, #EEF2FF)" }}
        >
          <span className="text-lg">🔐</span>
          <h3 className="text-sm font-bold text-primary-600">
            Cambiar contraseña
          </h3>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className={labelCls}>Contraseña actual</label>
            <input
              type="password"
              className={inputCls}
              placeholder="Tu contraseña actual"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Nueva contraseña</label>
            <input
              type="password"
              className={inputCls}
              placeholder="Mínimo 8 caracteres"
              value={passwordNuevo}
              onChange={(e) => setPasswordNuevo(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Confirmar nueva contraseña</label>
            <input
              type="password"
              className={inputCls}
              placeholder="Repite la nueva contraseña"
              value={passwordConf}
              onChange={(e) => setPasswordConf(e.target.value)}
            />
          </div>

          {errorPassword && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <p className="text-xs text-red-600 font-medium">
                {errorPassword}
              </p>
            </div>
          )}

          {exitoPassword && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <span>✅</span>
              <p className="text-xs text-emerald-700 font-medium">
                ¡Contraseña actualizada correctamente!
              </p>
            </div>
          )}

          <button
            onClick={guardarPassword}
            disabled={guardandoPassword}
            className="w-full text-white font-bold text-sm py-3 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            style={{
              background: guardandoPassword
                ? "#6B7280"
                : "linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)",
              boxShadow: guardandoPassword
                ? "none"
                : "0 4px 16px rgba(27,58,107,0.3)",
            }}
          >
            {guardandoPassword ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Guardando...
              </>
            ) : (
              "🔐 Cambiar contraseña"
            )}
          </button>
        </div>
      </div>

      {/* Info no editable */}
      <div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(27,58,107,0.06)" }}
      >
        <div
          className="px-6 py-4 border-b border-gray-100 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #F8FAFF, #EEF2FF)" }}
        >
          <span className="text-lg">ℹ️</span>
          <h3 className="text-sm font-bold text-primary-600">
            Información de cuenta
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            {
              label: "Correo electrónico",
              value: emailUsuario || "—",
              icon: "✉️",
            },
            {
              label: "Sucursal",
              value: SUCURSALES_LABEL[perfil?.sucursal_id] || "—",
              icon: "🏢",
            },
            {
              label: "Rol",
              value: perfil?.rol === "admin" ? "Administrador" : "Usuario",
              icon: "👤",
            },
            {
              label: "Puesto",
              value: perfil?.puesto || "Vendedor",
              icon: "💼",
              capitalize: true,
            },
          ].map(({ label, value, icon, capitalize }) => (
            <div
              key={label}
              className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100"
            >
              <p className="text-xs text-gray-400 mb-1">
                {icon} {label}
              </p>
              <p
                className={`text-sm font-semibold text-gray-700 ${capitalize ? "capitalize" : ""}`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-400 text-center">
            Para cambiar tu sucursal o rol contacta al administrador del
            sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
