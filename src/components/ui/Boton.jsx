// Botón base de la app. variante: primario (acción principal), secundario, fantasma
const VARIANTES = {
  primario: "bg-primary-600 text-white hover:bg-primary-800",
  secundario: "bg-white text-primary-600 border border-linea hover:border-primary-600/40 hover:bg-primary-50/60",
  fantasma: "text-primary-600 hover:bg-primary-50",
};

const TAMAÑOS = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
};

export default function Boton({
  variante = "primario",
  tamaño = "md",
  icono: Icono,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center font-semibold rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 ${VARIANTES[variante]} ${TAMAÑOS[tamaño]} ${className}`}
      {...props}
    >
      {Icono && <Icono size={tamaño === "sm" ? 14 : 16} strokeWidth={2} aria-hidden="true" />}
      {children}
    </button>
  );
}
