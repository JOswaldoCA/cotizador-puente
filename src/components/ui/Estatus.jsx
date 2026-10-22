import { ESTATUS } from "./estatusEstilos";

const estilo = (estatus) => ESTATUS[estatus] || ESTATUS["En revisión"];

export function EtiquetaEstatus({ estatus }) {
  const e = estilo(estatus);
  const Icono = e.icono;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${e.fondo} ${e.texto}`}>
      <Icono size={13} strokeWidth={2.25} aria-hidden="true" />
      {estatus || "En revisión"}
    </span>
  );
}

// Barra segmentada: aprobadas, rechazadas, en revisión. r = { total, aprobadas, rechazadas, revision }
export function BarraEstatus({ r, alto = "h-2", fondo = "bg-gray-100" }) {
  const pct = (n) => (r.total ? `${(n / r.total) * 100}%` : "0%");
  return (
    <div
      className={`${alto} ${fondo} rounded-full flex overflow-hidden`}
      role="img"
      aria-label={`${r.aprobadas} aprobadas, ${r.rechazadas} rechazadas, ${r.revision} en revisión`}
    >
      <div className={ESTATUS.Aprobada.barra} style={{ width: pct(r.aprobadas) }} />
      <div className={ESTATUS.Rechazada.barra} style={{ width: pct(r.rechazadas) }} />
      <div className={ESTATUS["En revisión"].barra} style={{ width: pct(r.revision) }} />
    </div>
  );
}
