import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  BellOff,
  FilePlus2,
  Files,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  ScrollText,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNotificaciones } from "../hooks/useNotificaciones";
import logo from "../assets/logoPA.png";

const SUCURSAL_LABEL = {
  matriz: "Matriz, Hermosillo",
  guaymas: "Sucursal Guaymas",
  obregon: "Sucursal Obregón",
};

function tiempoDesde(fecha, ahora) {
  if (!fecha) return "";
  const diff = ahora - new Date(fecha).getTime();
  const min = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);
  if (min < 2) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  if (hrs < 24) return `Hace ${hrs} h`;
  return `Hace ${dias} d`;
}

const Avatar = ({ nombre, className = "w-9 h-9" }) => (
  <div
    className={`${className} rounded-xl bg-accent-400 text-primary-800 flex items-center justify-center text-sm font-semibold flex-shrink-0`}
    aria-hidden="true"
  >
    {nombre?.charAt(0)?.toUpperCase() || "U"}
  </div>
);

function ItemMenu({ to, icono: Icono, children, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
          isActive ? "bg-white text-primary-800" : "text-white/70 hover:text-white hover:bg-white/10"
        }`
      }
    >
      <Icono size={18} strokeWidth={2} aria-hidden="true" />
      {children}
    </NavLink>
  );
}

function SidebarContent({ perfil, logout, cerrarMenu }) {
  return (
    <>
      <div className="px-5 pt-6 pb-5">
        <img src={logo} alt="Puente Ambiental" className="h-12 w-full object-contain object-left" />
        <p className="text-white/50 text-xs mt-3">Sistema de cotizaciones</p>
      </div>

      <nav className="flex flex-col gap-1 px-3 flex-1" aria-label="Principal">
        <ItemMenu to="/" icono={LayoutDashboard} onClick={cerrarMenu}>Dashboard</ItemMenu>
        <ItemMenu to="/nueva" icono={FilePlus2} onClick={cerrarMenu}>Nueva cotización</ItemMenu>
        <ItemMenu to="/cotizaciones" icono={Files} onClick={cerrarMenu}>Cotizaciones</ItemMenu>

        {perfil?.rol === "admin" && (
          <>
            <p className="text-white/40 text-xs font-medium px-3 mt-5 mb-1">Administración</p>
            <ItemMenu to="/admin/usuarios" icono={Users} onClick={cerrarMenu}>Usuarios</ItemMenu>
            <ItemMenu to="/admin/bitacora" icono={ScrollText} onClick={cerrarMenu}>Bitácora</ItemMenu>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-white/10 flex flex-col gap-3">
        <NavLink
          to="/perfil"
          onClick={cerrarMenu}
          className="flex items-center gap-3 rounded-xl p-1.5 -m-1.5 hover:bg-white/10 transition-colors"
        >
          <Avatar nombre={perfil?.nombre} />
          <div className="overflow-hidden flex-1">
            <p className="text-white text-sm font-medium truncate">{perfil?.nombre || "Usuario"}</p>
            <p className="text-white/50 text-xs truncate">
              {SUCURSAL_LABEL[perfil?.sucursal_id] || "Sin sucursal"}
              {perfil?.rol === "admin" && ", admin"}
            </p>
          </div>
        </NavLink>
        <button
          type="button"
          onClick={logout}
          className="w-full text-xs text-white/60 hover:text-white rounded-xl py-2 transition-colors hover:bg-white/10 flex items-center justify-center gap-2"
        >
          <LogOut size={14} aria-hidden="true" /> Cerrar sesión
        </button>
      </div>
    </>
  );
}

function Notificaciones() {
  const navigate = useNavigate();
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones();
  const [abierta, setAbierta] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());

  const alternar = () => {
    setAhora(Date.now());
    setAbierta((a) => !a);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={alternar}
        aria-label={noLeidas ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
        aria-expanded={abierta}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
      >
        <Bell size={18} strokeWidth={2} aria-hidden="true" />
        {noLeidas > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-estado-rechazada text-white text-[10px] font-semibold flex items-center justify-center">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierta && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierta(false)} />
          <div className="absolute right-0 top-11 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-linea overflow-hidden z-50 shadow-large">
            <div className="px-4 py-3 flex items-center justify-between border-b border-linea">
              <p className="text-sm font-semibold text-primary-800">
                Notificaciones
                {noLeidas > 0 && <span className="ml-2 text-xs font-medium text-gray-500">{noLeidas} sin leer</span>}
              </p>
              {noLeidas > 0 && (
                <button
                  type="button"
                  onClick={marcarTodasLeidas}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                >
                  Marcar como leídas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notificaciones.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
                  <BellOff size={24} strokeWidth={1.5} aria-hidden="true" />
                  <p className="text-xs">No tienes notificaciones.</p>
                </div>
              ) : (
                notificaciones.map((n) => (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => {
                      marcarLeida(n.id);
                      setAbierta(false);
                      navigate("/cotizaciones");
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-linea last:border-0 hover:bg-primary-50/60 transition-colors flex gap-3 ${!n.leida ? "bg-primary-50/40" : ""}`}
                  >
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.leida ? "bg-primary-600" : "bg-transparent"}`}
                      aria-hidden="true"
                    />
                    <span className="flex-1 min-w-0">
                      <span className={`block text-xs font-semibold truncate ${!n.leida ? "text-primary-800" : "text-gray-700"}`}>
                        {n.titulo}
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.mensaje}</span>
                      <span className="block text-xs text-gray-400 mt-1">{tiempoDesde(n.created_at, ahora)}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Layout() {
  const { logout, perfil } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <div className="min-h-screen flex bg-[#F0F4F8]">
      {/* Menú lateral escritorio */}
      <aside className="hidden lg:flex w-64 min-h-screen flex-col flex-shrink-0 fixed left-0 top-0 bottom-0 z-20 bg-primary-600">
        <SidebarContent perfil={perfil} logout={logout} cerrarMenu={cerrarMenu} />
      </aside>

      {/* Menú lateral móvil */}
      {menuAbierto && (
        <div className="lg:hidden fixed inset-0 z-30 bg-primary-900/60" onClick={cerrarMenu} />
      )}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-40 w-72 flex flex-col bg-primary-600 transition-transform duration-300 ease-out motion-reduce:transition-none ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!menuAbierto}
      >
        <button
          type="button"
          onClick={cerrarMenu}
          aria-label="Cerrar menú"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 z-10"
        >
          <X size={18} aria-hidden="true" />
        </button>
        <SidebarContent perfil={perfil} logout={logout} cerrarMenu={cerrarMenu} />
      </aside>

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 lg:ml-64">
        <header className="sticky top-0 z-10 px-4 lg:px-8 h-16 flex items-center justify-between gap-3 bg-white/90 backdrop-blur border-b border-linea">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-50"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary-800 truncate">Puente Ambiental del Noroeste</p>
              <p className="text-xs text-gray-500 truncate hidden sm:block">
                {SUCURSAL_LABEL[perfil?.sucursal_id] || ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Notificaciones />
            <button
              type="button"
              onClick={() => {
                navigate("/nueva");
                cerrarMenu();
              }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl text-white bg-primary-600 hover:bg-primary-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              <Plus size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Nueva cotización</span>
              <span className="sm:hidden">Nueva</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>

        <footer className="px-4 lg:px-8 py-4 border-t border-linea">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Puente Ambiental del Noroeste S.A. de C.V.
          </p>
        </footer>
      </div>
    </div>
  );
}
