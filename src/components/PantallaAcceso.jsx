import logo from "../assets/logoPA.png";

// Marco de las pantallas sin sesión: panel de marca a la izquierda y el formulario a la derecha
export default function PantallaAcceso({ titulo, descripcion, children, pie }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <aside className="bg-primary-600 text-white lg:w-5/12 xl:w-1/2 flex flex-col justify-between px-6 py-5 lg:p-12">
        <img src={logo} alt="Puente Ambiental del Noroeste" className="h-9 lg:h-12 w-fit object-contain" />
        <div className="hidden lg:block max-w-md">
          <p className="text-3xl xl:text-4xl font-semibold leading-tight tracking-tight">
            Cotizaciones de recolección y manejo de residuos
          </p>
          <p className="text-white/60 mt-4">Para los equipos de Hermosillo, Guaymas y Ciudad Obregón.</p>
        </div>
        <p className="hidden lg:block text-xs text-white/40">
          © {new Date().getFullYear()} Puente Ambiental del Noroeste S.A. de C.V.
        </p>
      </aside>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          {titulo && (
            <div className="mb-7">
              <h1 className="text-2xl font-semibold tracking-tight text-primary-800">{titulo}</h1>
              {descripcion && <p className="text-sm text-gray-500 mt-1">{descripcion}</p>}
            </div>
          )}
          {children}
          {pie && <div className="mt-8 pt-6 border-t border-linea text-sm text-gray-500 text-center">{pie}</div>}
        </div>
      </main>
    </div>
  );
}

// Mensaje de resultado (cuenta creada, correo enviado, etc.)
export function Resultado({ icono: Icono, tono = "exito", titulo, children, accion }) {
  return (
    <div className="flex flex-col items-start gap-4">
      <span
        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          tono === "exito" ? "bg-estado-aprobada/10 text-estado-aprobada" : "bg-primary-50 text-primary-600"
        }`}
        aria-hidden="true"
      >
        <Icono size={24} strokeWidth={2} />
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary-800">{titulo}</h1>
        <div className="text-sm text-gray-600 mt-2 leading-relaxed">{children}</div>
      </div>
      {accion}
    </div>
  );
}
