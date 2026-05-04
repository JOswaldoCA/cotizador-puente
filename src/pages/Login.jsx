import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/logoPA.png";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    const { error } = await login(form.email, form.password);
    setCargando(false);
    if (error) setError("Correo o contraseña incorrectos.");
    else navigate("/");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#F0F4F8" }}>
      {/* Panel izquierdo */}
      <div
        className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #1B3A6B 0%, #0F2347 60%, #091629 100%)",
        }}
      >
        {/* Círculos decorativos */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #FFD700, transparent)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-5"
          style={{
            background: "radial-gradient(circle, #3B6DB5, transparent)",
            transform: "translate(-30%, 30%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
          {/* Logo */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/10">
            <img
              src={logo}
              alt="Puente Ambiental"
              className="w-44 object-contain"
            />
          </div>

          <h2 className="text-white text-2xl font-bold text-center mb-3 tracking-tight">
            Sistema de Cotizaciones
          </h2>
          <p className="text-blue-300/80 text-sm text-center leading-relaxed mb-10">
            Gestiona y envía cotizaciones profesionales para el servicio de
            recolección de residuos sólidos urbanos.
          </p>

          {/* Features */}
          <div className="flex flex-col gap-3 w-full">
            {[
              { icon: "⚡", text: "Genera cotizaciones en segundos" },
              { icon: "✉️", text: "Envía por correo al cliente" },
              { icon: "📋", text: "Historial completo de propuestas" },
              { icon: "📊", text: "Seguimiento de estatus en tiempo real" },
            ].map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: "rgba(255,215,0,0.15)" }}
                >
                  {icon}
                </div>
                <p className="text-blue-200/90 text-xs font-medium">{text}</p>
              </div>
            ))}
          </div>

          {/* Footer panel */}
          <p className="text-blue-400/40 text-xs mt-10 text-center">
            © {new Date().getFullYear()} Puente Ambiental del Noroeste S.A de
            C.V
          </p>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <div
              className="rounded-2xl p-4"
              style={{
                background: "linear-gradient(135deg, #1B3A6B, #0F2347)",
              }}
            >
              <img
                src={logo}
                alt="Puente Ambiental"
                className="h-10 object-contain"
              />
            </div>
          </div>

          {/* Card */}
          <div
            className="bg-white rounded-3xl p-8 border border-gray-100"
            style={{
              boxShadow:
                "0 8px 32px rgba(27,58,107,0.1), 0 1px 3px rgba(27,58,107,0.06)",
            }}
          >
            <div className="mb-8">
              <h1
                className="text-2xl font-bold tracking-tight mb-1"
                style={{ color: "#1B3A6B" }}
              >
                Bienvenido 👋
              </h1>
              <p className="text-sm text-gray-400">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="usuario@empresa.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-200 bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-200 bg-gray-50"
                />
              </div>
              <div className="flex justify-end">
                <Link
                  to="/recuperar"
                  className="text-xs font-medium hover:underline"
                  style={{ color: "#1B3A6B" }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="text-red-500 text-base">⚠️</span>
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                style={{
                  background: cargando
                    ? "#6B7280"
                    : "linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)",
                  boxShadow: cargando
                    ? "none"
                    : "0 4px 16px rgba(27,58,107,0.3)",
                }}
              >
                {cargando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Ingresando...
                  </>
                ) : (
                  "Ingresar →"
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                ¿No tienes cuenta?{" "}
                <Link
                  to="/registro"
                  className="font-bold hover:underline"
                  style={{ color: "#1B3A6B" }}
                >
                  Registrarse
                </Link>
              </p>
            </div>
          </div>

          {/* Badge seguridad */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
            <p className="text-xs text-gray-400">
              Conexión segura · Datos encriptados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
