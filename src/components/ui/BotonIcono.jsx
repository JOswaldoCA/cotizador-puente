import Tooltip from "../Tooltip";

// Botón cuadrado solo con ícono; la etiqueta se muestra como tooltip y la leen los lectores de pantalla
export default function BotonIcono({ icono: Icono, etiqueta, onClick, peligro = false, disabled }) {
  return (
    <Tooltip text={etiqueta}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={etiqueta}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
          peligro
            ? "text-gray-400 hover:text-estado-rechazada hover:bg-estado-rechazada/10"
            : "text-gray-500 hover:text-primary-600 hover:bg-primary-50"
        }`}
      >
        <Icono size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
