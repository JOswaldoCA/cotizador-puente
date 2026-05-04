import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logoPA.png'

// ← FUERA del componente
function SidebarContent({ perfil, sucursalLabel, navItem, logout }) {
  return (
    <>
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <img src={logo} alt="Puente Ambiental" className="h-14 w-full object-contain object-left" />
        <div className="flex items-center gap-2 mt-3">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
          <p className="text-blue-300/70 text-xs">Sistema de cotizaciones</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-4 flex-1">
        <p className="text-blue-400/50 text-xs font-semibold uppercase tracking-widest px-4 mb-2">Menú</p>
        {navItem('/', '📊', 'Dashboard')}
        {navItem('/nueva', '📝', 'Nueva cotización')}
        {navItem('/cotizaciones', '📋', 'Historial')}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-primary-600 text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #FFE566, #FFD700)' }}>
            {perfil?.nombre?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-white text-xs font-semibold truncate">{perfil?.nombre || 'Usuario'}</p>
            <p className="text-blue-300/60 text-xs truncate">{sucursalLabel}</p>
          </div>
          {perfil?.rol === 'admin' && (
            <span className="text-xs bg-accent-400/20 text-accent-300 font-semibold px-2 py-0.5 rounded-lg border border-accent-400/30 flex-shrink-0">
              Admin
            </span>
          )}
        </div>
        <button onClick={logout}
          className="w-full text-xs text-blue-300/70 hover:text-white border border-white/10 hover:border-white/30 rounded-xl py-2.5 transition-all duration-200 hover:bg-white/5 flex items-center justify-center gap-2">
          <span>↩</span> Cerrar sesión
        </button>
      </div>
    </>
  )
}

export default function Layout() {
  const { logout, perfil } = useAuth()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const cerrarMenu = () => setMenuAbierto(false)

  const sucursalLabel = {
    matriz:  'Matriz — Hermosillo',
    guaymas: 'Suc. Guaymas',
    obregon: 'Suc. Obregón',
  }[perfil?.sucursal_id] || 'Sin sucursal'

  const sucursalTopbar = {
    matriz:  'SUC. MATRIZ — Hermosillo, Sonora',
    guaymas: 'SUC. GUAYMAS — Guaymas, Sonora',
    obregon: 'SUC. OBREGÓN — Ciudad Obregón, Sonora',
  }[perfil?.sucursal_id] || ''

  const navItem = (to, icon, label) => (
    <NavLink to={to} end={to === '/'}
      onClick={cerrarMenu}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-white/15 text-white shadow-sm border border-white/10'
            : 'text-blue-200/80 hover:bg-white/8 hover:text-white'
        }`
      }>
      <span className="text-base leading-none">{icon}</span>
      {label}
    </NavLink>
  )

  const sidebarStyle = {
    background: 'linear-gradient(180deg, #1B3A6B 0%, #0F2347 60%, #091629 100%)',
    boxShadow: '4px 0 24px rgba(9,22,41,0.15)',
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F0F4F8' }}>

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-64 min-h-screen flex-col flex-shrink-0 fixed left-0 top-0 bottom-0 z-20"
        style={sidebarStyle}>
        <SidebarContent
          perfil={perfil}
          sucursalLabel={sucursalLabel}
          navItem={navItem}
          logout={logout}
        />
      </aside>

      {/* OVERLAY MÓVIL */}
      {menuAbierto && (
        <div className="lg:hidden fixed inset-0 z-30"
          style={{ background: 'rgba(9,22,41,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={cerrarMenu} />
      )}

      {/* SIDEBAR MÓVIL */}
      <aside className={`lg:hidden fixed left-0 top-0 bottom-0 z-40 w-72 flex flex-col transition-transform duration-300 ease-in-out ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={sidebarStyle}>
        <button onClick={cerrarMenu}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10">
          ✕
        </button>
        <SidebarContent
          perfil={perfil}
          sucursalLabel={sucursalLabel}
          navItem={navItem}
          logout={logout}
        />
      </aside>

      {/* CONTENIDO */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden lg:ml-64">

        {/* TOPBAR */}
        <header className="sticky top-0 z-10 px-4 lg:px-8 py-3.5 flex items-center justify-between flex-shrink-0"
          style={{
            background: 'rgba(240,244,248,0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(27,58,107,0.08)',
            boxShadow: '0 1px 3px rgba(27,58,107,0.06)',
          }}>

          <div className="flex items-center gap-3">
            {/* Hamburguesa — solo móvil */}
            <button onClick={() => setMenuAbierto(true)}
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'linear-gradient(135deg, #1B3A6B, #0F2347)' }}>
              <span className="text-white text-lg leading-none">☰</span>
            </button>
            <div>
              <h1 className="text-sm font-bold text-primary-600 tracking-tight">
                Puente Ambiental del Noroeste
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{sucursalTopbar}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-medium text-gray-700">{perfil?.nombre}</p>
              <p className="text-xs text-gray-400">{sucursalLabel}</p>
            </div>
            <button onClick={() => { navigate('/nueva'); cerrarMenu() }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 lg:px-4 py-2.5 rounded-xl text-white transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #1B3A6B, #0F2347)',
                boxShadow: '0 2px 8px rgba(27,58,107,0.3)',
              }}>
              <span className="text-accent-400 font-bold text-sm">+</span>
              <span className="hidden sm:inline">Nueva cotización</span>
              <span className="sm:hidden">Nueva</span>
            </button>
          </div>
        </header>

        {/* PÁGINA */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>

        {/* FOOTER */}
        <footer className="px-4 lg:px-8 py-4 border-t border-gray-200/60 flex items-center justify-between">
          <p className="text-xs text-gray-400 hidden sm:block">
            © {new Date().getFullYear()} Puente Ambiental del Noroeste S.A de C.V
          </p>
          <p className="text-xs text-gray-300">Sistema de Cotizaciones v1.0</p>
        </footer>

      </div>
    </div>
  )
}