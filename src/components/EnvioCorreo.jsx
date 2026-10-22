import { useState } from "react";
import { CircleCheck, Send } from "lucide-react";
import { enviarCotizacionPorCorreo } from "../services/cotizaciones";
import Boton from "./ui/Boton";
import { campo, etiqueta } from "./ui/estilos";

const separar = (texto) =>
  texto
    .split(/[;,]/)
    .map((e) => e.trim())
    .filter(Boolean);

// Campo de destinatarios y botón de envío; lo usan el modal de cotización guardada y el historial
export default function EnvioCorreo({ folio, emailInicial = "" }) {
  const [email, setEmail] = useState(emailInicial);
  const [enviando, setEnviando] = useState(false);
  const [enviadoA, setEnviadoA] = useState(null);
  const [error, setError] = useState("");

  const enviar = async () => {
    const destinatarios = separar(email);
    if (destinatarios.length === 0) return setError("Escribe al menos un correo.");
    setError("");
    setEnviando(true);
    try {
      await enviarCotizacionPorCorreo(folio, destinatarios);
      setEnviadoA(destinatarios);
    } catch (e) {
      setError("No se pudo enviar: " + e.message);
    }
    setEnviando(false);
  };

  if (enviadoA)
    return (
      <div className="rounded-xl bg-estado-aprobada/10 px-4 py-3 flex items-start gap-3">
        <CircleCheck size={18} className="text-estado-aprobada flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-estado-aprobada">Cotización enviada</p>
          <p className="text-xs text-gray-600 break-words">{enviadoA.join(", ")}</p>
        </div>
      </div>
    );

  return (
    <div>
      <label htmlFor={`correo-${folio}`} className={etiqueta}>
        Correo del cliente
      </label>
      <div className="flex gap-2">
        <input
          id={`correo-${folio}`}
          type="text"
          inputMode="email"
          placeholder="compras@cliente.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !enviando && enviar()}
          className={campo}
        />
        <Boton icono={Send} onClick={enviar} disabled={enviando} className="flex-shrink-0">
          {enviando ? "Enviando..." : "Enviar"}
        </Boton>
      </div>
      <p className="text-xs text-gray-500 mt-1.5">
        Para varios destinatarios sepáralos con punto y coma. Se adjunta el PDF.
      </p>
      {error && <p className="text-xs text-estado-rechazada mt-2" role="alert">{error}</p>}
    </div>
  );
}
