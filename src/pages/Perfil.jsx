import { useState, useEffect } from "react";
import { CircleCheck, KeyRound, UserRound } from "lucide-react";
import { supabase } from "../services/supabase";
import { useAuth } from "../hooks/useAuth";
import { SUCURSAL_CORTA } from "../utils/constantes";
import Boton from "../components/ui/Boton";
import Seccion from "../components/ui/Seccion";
import { campo, etiqueta } from "../components/ui/estilos";

const PUESTO = { vendedor: "Vendedor", administrativo: "Administrativo", coordinador: "Coordinador", gerente: "Gerente" };

const Mensaje = ({ error, exito }) =>
  error ? (
    <p className="text-sm text-estado-rechazada" role="alert">{error}</p>
  ) : exito ? (
    <p className="text-sm text-estado-aprobada flex items-center gap-1.5" role="status">
      <CircleCheck size={16} aria-hidden="true" /> {exito}
    </p>
  ) : null;

export default function Perfil() {
  const { perfil, recargarPerfil } = useAuth();

  const [nombre, setNombre] = useState(perfil?.nombre || "");
  const [emailUsuario, setEmailUsuario] = useState("");
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
    supabase.auth.getUser().then(({ data }) => setEmailUsuario(data.user?.email || ""));
  }, []);

  const guardarNombre = async () => {
    if (!nombre.trim()) return setErrorNombre("Escribe tu nombre.");
    setErrorNombre("");
    setGuardandoNombre(true);
    const { error } = await supabase.from("perfiles").update({ nombre: nombre.trim() }).eq("id", perfil.id);
    setGuardandoNombre(false);
    if (error) return setErrorNombre("No se pudo guardar el nombre. Intenta de nuevo.");
    await recargarPerfil();
    setExitoNombre(true);
    setTimeout(() => setExitoNombre(false), 3000);
  };

  const guardarPassword = async () => {
    setErrorPassword("");
    if (passwordNuevo.length < 8) return setErrorPassword("La nueva contraseña debe tener al menos 8 caracteres.");
    if (passwordNuevo !== passwordConf) return setErrorPassword("La confirmación no coincide con la nueva contraseña.");
    setGuardandoPassword(true);

    // Verificar contraseña actual
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error: errorLogin } = await supabase.auth.signInWithPassword({ email: user.email, password: passwordActual });
    if (errorLogin) {
      setGuardandoPassword(false);
      return setErrorPassword("La contraseña actual no es correcta.");
    }

    const { error } = await supabase.auth.updateUser({ password: passwordNuevo });
    setGuardandoPassword(false);
    if (error) return setErrorPassword("No se pudo cambiar la contraseña. Intenta de nuevo.");
    setExitoPassword(true);
    setPasswordActual("");
    setPasswordNuevo("");
    setPasswordConf("");
    setTimeout(() => setExitoPassword(false), 3000);
  };

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      {/* Encabezado */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-accent-400 text-primary-800 flex items-center justify-center text-xl font-semibold flex-shrink-0">
          {perfil?.nombre?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight text-primary-800 truncate">{perfil?.nombre || "Mi perfil"}</h2>
          <p className="text-sm text-gray-500 truncate">{emailUsuario}</p>
        </div>
      </div>

      {/* Cuenta */}
      <section className="bg-white rounded-2xl border border-linea">
        <dl className="grid grid-cols-2 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-linea">
          {[
            ["Sucursal", SUCURSAL_CORTA[perfil?.sucursal_id] || "Sin sucursal"],
            ["Puesto", PUESTO[perfil?.puesto] || "Vendedor"],
            ["Permisos", perfil?.rol === "admin" ? "Administrador" : "Usuario"],
          ].map(([dt, dd]) => (
            <div key={dt} className="px-5 py-4">
              <dt className="text-xs text-gray-500">{dt}</dt>
              <dd className="text-sm font-medium text-gray-800 mt-0.5">{dd}</dd>
            </div>
          ))}
        </dl>
        <p className="px-5 py-3 border-t border-linea text-xs text-gray-500">
          La sucursal, el puesto y los permisos los asigna un administrador.
        </p>
      </section>

      {/* Nombre */}
      <Seccion icono={UserRound} titulo="Nombre">
        <div className="p-5 flex flex-col gap-3">
          <div>
            <label htmlFor="nombre" className={etiqueta}>
              Nombre completo, como aparece en la bitácora y las notificaciones
            </label>
            <input id="nombre" type="text" className={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <Mensaje error={errorNombre} exito={exitoNombre && "Nombre guardado."} />
          <div>
            <Boton onClick={guardarNombre} disabled={guardandoNombre || nombre.trim() === perfil?.nombre}>
              {guardandoNombre ? "Guardando..." : "Guardar nombre"}
            </Boton>
          </div>
        </div>
      </Seccion>

      {/* Contraseña */}
      <Seccion icono={KeyRound} titulo="Contraseña">
        <div className="p-5 flex flex-col gap-3">
          <div>
            <label htmlFor="pass-actual" className={etiqueta}>Contraseña actual</label>
            <input
              id="pass-actual"
              type="password"
              autoComplete="current-password"
              className={campo}
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pass-nueva" className={etiqueta}>Nueva contraseña</label>
              <input
                id="pass-nueva"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                className={campo}
                value={passwordNuevo}
                onChange={(e) => setPasswordNuevo(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="pass-conf" className={etiqueta}>Confirmar nueva contraseña</label>
              <input
                id="pass-conf"
                type="password"
                autoComplete="new-password"
                className={campo}
                value={passwordConf}
                onChange={(e) => setPasswordConf(e.target.value)}
              />
            </div>
          </div>
          <Mensaje error={errorPassword} exito={exitoPassword && "Contraseña cambiada."} />
          <div>
            <Boton onClick={guardarPassword} disabled={guardandoPassword || !passwordActual || !passwordNuevo}>
              {guardandoPassword ? "Cambiando..." : "Cambiar contraseña"}
            </Boton>
          </div>
        </div>
      </Seccion>
    </div>
  );
}
