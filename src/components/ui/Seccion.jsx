// Bloque blanco con título; separado del fondo por una línea, sin sombra
export default function Seccion({ icono: Icono, titulo, descripcion, accion, children, className = "" }) {
  return (
    <section className={`bg-white rounded-2xl border border-linea overflow-hidden ${className}`}>
      <header className="px-4 lg:px-6 py-4 flex items-center justify-between gap-3 border-b border-linea">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icono && <Icono size={18} strokeWidth={2} className="text-primary-600 flex-shrink-0" aria-hidden="true" />}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-primary-800">{titulo}</h3>
            {descripcion && <p className="text-xs text-gray-500 truncate">{descripcion}</p>}
          </div>
        </div>
        {accion}
      </header>
      {children}
    </section>
  );
}
