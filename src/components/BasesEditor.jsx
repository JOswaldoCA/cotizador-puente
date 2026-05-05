import { useState } from "react";
import { BASES } from "../utils/constantes";

export default function BasesEditor({ basesExtra, setBasesExtra }) {
  const [nueva, setNueva] = useState("");

  const agregar = () => {
    const texto = nueva.trim();
    if (!texto) return;
    setBasesExtra((prev) => [...prev, texto]);
    setNueva("");
  };

  const quitar = (i) =>
    setBasesExtra((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-4">
      {/* Bases default */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          Bases por defecto (no editables)
        </p>
        <div className="flex flex-col gap-1.5">
          {BASES.map((b, i) => (
            <div
              key={i}
              className="flex items-start gap-3 text-xs text-gray-500 rounded-xl px-3 py-2.5 border border-gray-100"
              style={{ background: "#F8FAFF" }}
            >
              <span className="text-gray-300 mt-0.5 flex-shrink-0 font-bold">
                •
              </span>
              <span className="leading-relaxed">{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bases personalizadas */}
      {basesExtra.length > 0 && (
        <div>
          <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">
            Bases personalizadas
          </p>
          <div className="flex flex-col gap-1.5">
            {basesExtra.map((b, i) => (
              <div
                key={i}
                className="flex items-start gap-3 text-xs rounded-xl px-3 py-2.5 border border-primary-100 group"
                style={{
                  background: "linear-gradient(135deg, #EEF2FF, #DBEAFE)",
                }}
              >
                <span className="text-primary-400 mt-0.5 flex-shrink-0 font-bold">
                  •
                </span>
                <span className="flex-1 text-primary-700 leading-relaxed font-medium">
                  {b}
                </span>
                <button
                  type="button"
                  onClick={() => quitar(i)}
                  className="text-red-300 hover:text-red-500 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 text-base leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agregar nueva */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Escribe una base personalizada y presiona Enter..."
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && agregar()}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-white transition-all duration-200"
        />
        <button
          type="button"
          onClick={agregar}
          className="text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg, #1B3A6B, #0F2347)" }}
        >
          + Agregar
        </button>
      </div>

      {basesExtra.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {basesExtra.length} base{basesExtra.length !== 1 ? "s" : ""}{" "}
          personalizada{basesExtra.length !== 1 ? "s" : ""} agregada
          {basesExtra.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
