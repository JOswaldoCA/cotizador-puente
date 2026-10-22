import { ChevronLeft, ChevronRight } from "lucide-react";
import Boton from "./Boton";

// Anterior / números (hasta 5) / Siguiente. No se muestra con una sola página.
export default function Paginacion({ pagina, totalPaginas, onCambiar }) {
  if (totalPaginas <= 1) return null;
  const primera = Math.min(Math.max(1, pagina - 2), Math.max(1, totalPaginas - 4));
  const paginas = Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => primera + i);

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Paginación">
      <Boton variante="fantasma" tamaño="sm" icono={ChevronLeft} onClick={() => onCambiar(pagina - 1)} disabled={pagina === 1}>
        Anterior
      </Boton>
      {paginas.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onCambiar(p)}
          aria-current={p === pagina ? "page" : undefined}
          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
            p === pagina ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-primary-50"
          }`}
        >
          {p}
        </button>
      ))}
      <Boton variante="fantasma" tamaño="sm" onClick={() => onCambiar(pagina + 1)} disabled={pagina === totalPaginas}>
        Siguiente
        <ChevronRight size={14} aria-hidden="true" />
      </Boton>
    </nav>
  );
}
