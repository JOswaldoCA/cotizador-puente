import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { supabase } from "./services/supabase";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NuevaCotizacion from "./pages/NuevaCotizacion";
import Cotizaciones from "./pages/Cotizaciones";
import PreviewCotizacion from "./pages/PreviewCotizacion";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import EditarCotizacion from "./pages/EditarCotizacion";
import RecuperarPassword from "./pages/RecuperarPassword";
import NuevaPassword from "./pages/NuevaPassword";
import Confirmado from "./pages/Confirmado";
import Usuarios from './pages/Admin/Usuarios'
import Bitacora from './pages/Admin/Bitacora'

function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Cargando...
    </div>
  );
  return usuario ? children : <Navigate to="/login" replace />;
}

export default function App() {
  useEffect(() => {
  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    // Solo actuar en SIGNED_IN, no en INITIAL_SESSION
    if (event === 'SIGNED_IN' && session?.user) {
      const confirmedAt = session.user.email_confirmed_at
      if (confirmedAt) {
        const segundos = (Date.now() - new Date(confirmedAt).getTime()) / 1000
        // Verificar que sea confirmación nueva Y que venga del flujo de confirmación
        // usando el hash de la URL como indicador
        const hash = window.location.hash
        const isConfirmationFlow = hash.includes('access_token') || hash.includes('type=signup')
        if (segundos < 30 && isConfirmationFlow) {
          supabase.auth.signOut().then(() => {
            window.location.href = '/login?confirmado=true'
          })
        }
      }
    }
  })
  return () => listener.subscription.unsubscribe()
}, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login"          element={<Login />} />
        <Route path="/recuperar"      element={<RecuperarPassword />} />
        <Route path="/nueva-password" element={<NuevaPassword />} />
        <Route path="/registro"       element={<Registro />} />
        <Route path="/confirmado"     element={<Confirmado />} />

        {/* Rutas protegidas con Layout */}
        <Route path="/" element={<RutaProtegida><Layout /></RutaProtegida>}>
          <Route index element={<Dashboard />} />
          <Route path="nueva" element={<NuevaCotizacion />} />
          <Route path="cotizaciones" element={<Cotizaciones />} />
          <Route path="cotizaciones/:folio/editar" element={<EditarCotizacion />} />
          <Route path="admin/usuarios" element={<Usuarios />} />
          <Route path="admin/bitacora" element={<Bitacora />} />
        </Route>

        {/* Preview sin Layout */}
        <Route path="/preview/:folio" element={<RutaProtegida><PreviewCotizacion /></RutaProtegida>} />
      </Routes>
    </BrowserRouter>
  );
}