import { useEffect } from "react";
import { X } from "lucide-react";

// Ventana modal: encabezado blanco con título, contenido y pie opcional. Escape cierra.
export default function Modal({ titulo, subtitulo, onCerrar, children, pie, ancho = "max-w-md" }) {
  useEffect(() => {
    if (!onCerrar) return;
    const alPresionar = (e) => e.key === "Escape" && onCerrar();
    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-primary-900/60"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`bg-white rounded-2xl w-full ${ancho} max-h-[90vh] flex flex-col overflow-hidden shadow-large`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 flex items-start justify-between gap-4 border-b border-linea">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-primary-800">{titulo}</h2>
            {subtitulo && <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">{subtitulo}</p>}
          </div>
          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="w-8 h-8 -mr-2 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </header>
        <div className="p-6 overflow-y-auto flex flex-col gap-4">{children}</div>
        {pie && <footer className="px-6 py-4 border-t border-linea flex gap-3">{pie}</footer>}
      </div>
    </div>
  );
}
