import { useState } from "react";
import { Plus, X } from "lucide-react";
import { BASES } from "../utils/constantes";
import Boton from "./ui/Boton";
import { campo } from "./ui/estilos";

export default function BasesEditor({ basesExtra, setBasesExtra }) {
  const [nueva, setNueva] = useState("");

  const agregar = () => {
    const texto = nueva.trim();
    if (!texto) return;
    setBasesExtra((prev) => [...prev, texto]);
    setNueva("");
  };

  const quitar = (i) => setBasesExtra((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs text-gray-500 mb-2">Siempre se incluyen:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1 text-sm text-gray-600 marker:text-gray-300">
          {BASES.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>

      {basesExtra.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Agregadas para esta cotización:</p>
          <ul className="flex flex-col gap-1.5">
            {basesExtra.map((b, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800">
                <span className="flex-1">{b}</span>
                <button
                  type="button"
                  onClick={() => quitar(i)}
                  aria-label={`Quitar "${b}"`}
                  className="w-6 h-6 -my-0.5 rounded-md flex items-center justify-center text-primary-600/60 hover:text-estado-rechazada hover:bg-white flex-shrink-0"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          aria-label="Nueva base"
          placeholder="Agregar una base para esta cotización"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && agregar()}
          className={campo}
        />
        <Boton variante="secundario" icono={Plus} onClick={agregar} disabled={!nueva.trim()} className="flex-shrink-0">
          Agregar
        </Boton>
      </div>
    </div>
  );
}
