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

function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Cargando...
      </div>
    );
  return usuario ? children : <Navigate to="/login" replace />;
}

export default function App() {
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const confirmedAt = session.user.email_confirmed_at;
          if (confirmedAt) {
            const segundos =
              (Date.now() - new Date(confirmedAt).getTime()) / 1000;
            // Si se confirmó hace menos de 10 segundos es confirmación nueva
            if (segundos < 10) {
              supabase.auth.signOut().then(() => {
                window.location.href = "/login?confirmado=true";
              });
            }
          }
        }
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar" element={<RecuperarPassword />} />
        <Route path="/nueva-password" element={<NuevaPassword />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/confirmado" element={<Confirmado />} />
        <Route
          path="/"
          element={
            <RutaProtegida>
              <Layout />
            </RutaProtegida>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="nueva" element={<NuevaCotizacion />} />
          <Route path="cotizaciones" element={<Cotizaciones />} />
          <Route
            path="cotizaciones/:folio/editar"
            element={<EditarCotizacion />}
          />
        </Route>
        <Route
          path="/preview/:folio"
          element={
            <RutaProtegida>
              <PreviewCotizacion />
            </RutaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
