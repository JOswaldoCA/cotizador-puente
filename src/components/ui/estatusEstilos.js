import { CircleCheck, CircleX, Hourglass } from "lucide-react";

// Colores de estatus compartidos por etiquetas y barras
export const ESTATUS = {
  Aprobada: { icono: CircleCheck, texto: "text-estado-aprobada", fondo: "bg-estado-aprobada/10", barra: "bg-estado-aprobada" },
  Rechazada: { icono: CircleX, texto: "text-estado-rechazada", fondo: "bg-estado-rechazada/10", barra: "bg-estado-rechazada" },
  // En las barras va en gris: es trabajo pendiente, no una alerta
  "En revisión": { icono: Hourglass, texto: "text-estado-revision", fondo: "bg-estado-revision/10", barra: "bg-slate-300" },
};
