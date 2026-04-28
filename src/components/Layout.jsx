import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logoPA.png'

export default function Layout() {
  const { logout, perfil } = useAuth()
  const navigate = useNavigate()

  const navItem = (to, icon, label) => (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
          isActive
            ? 'bg-accent-400 text-primary-600 font-semibold'
            : 'text-blue-200 hover:bg-primary-400 hover:text-white'
        }`
      }
    >
      <span className="text-base">{icon}</span>
      {label}
    </NavLink>
  )

  return (
    <div className="min-h-screen flex bg-gray-100">

      {/* SIDEBAR */}
      <aside className="w-64 min-h-screen bg-primary-600 flex flex-col flex-shrink-0">

        {/* Logo */}
        <div className="px-5 py-6 border-b border-primary-400">
          <img src={logo} alt="Puente Ambiental" className="h-10 object-contain" />
          <p className="text-blue-300 text-xs mt-2">Sistema de cotizaciones</p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-4 flex-1">
          {navItem('/', '📊', 'Dashboard')}
          {navItem('/nueva', '📝', 'Nueva cotización')}
          {navItem('/cotizaciones', '📋', 'Historial')}
        </nav>

        {/* Usuario */}
        <div className="p-4 border-t border-primary-400">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent-400 flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
              {perfil?.nombre?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-medium truncate">{perfil?.nombre || 'Usuario'}</p>
              <p className="text-blue-300 text-xs truncate">
                {perfil?.sucursal_id === 'matriz' ? 'Matriz — Hermosillo' : 'Suc. Guaymas'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-xs text-blue-300 hover:text-white border border-primary-400 hover:border-white rounded-lg py-2 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>

      </aside>

      {/* CONTENIDO */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-primary-600">
              Puente Ambiental del Noroeste
            </h1>
            <p className="text-xs text-gray-400">
              {perfil?.sucursal_id === 'matriz' ? 'SUC. MATRIZ — Hermosillo, Sonora' : 'SUC. GUAYMAS — Guaymas, Sonora'}
            </p>
          </div>
          <button
            onClick={() => navigate('/nueva')}
            className="bg-primary-600 hover:bg-primary-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>+</span> Nueva cotización
          </button>
        </header>

        {/* Página */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>

      </div>
    </div>
  )
}