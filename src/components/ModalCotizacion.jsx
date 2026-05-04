import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generarPDFBase64 } from "../utils/generarPDF";
import { obtenerCotizacion } from "../services/cotizaciones";

export default function ModalCotizacion({ folio, emailCliente }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(emailCliente || "");
  const [destinatarios, setDestinatarios] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [progreso, setProgreso] = useState("");

  const exportarPDF = () => window.open(`/preview/${folio}`, "_blank");

  const enviarCorreo = async () => {
    if (!email) return setError("Escribe un correo electrónico.");
    const dest = email
      .split(";")
      .map((e) => e.trim())
      .filter(Boolean);
    if (dest.length === 0) return setError("Correo inválido.");
    setDestinatarios(dest);
    setError("");
    setEnviando(true);
    try {
      setProgreso("Obteniendo cotización...");
      const cot = await obtenerCotizacion(folio);
      if (!cot) throw new Error("Cotización no encontrada");
      setProgreso("Generando PDF...");
      const pdfBase64 = await generarPDFBase64(cot);
      setProgreso("Enviando correo...");
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enviar-cotizacion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ folio, email: dest, pdfBase64 }),
        },
      );
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }
      setEnviado(true);
    } catch (e) {
      setError("No se pudo enviar: " + e.message);
    }
    setProgreso("");
    setEnviando(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: "rgba(9,22,41,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm flex flex-col overflow-hidden"
        style={{ boxShadow: "0 25px 50px rgba(9,22,41,0.25)" }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)",
          }}
        >
          <div>
            <h2 className="text-base font-bold text-white">
              Cotización guardada
            </h2>
            <p className="text-xs text-blue-300 font-mono mt-0.5">{folio}</p>
          </div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-primary-600 text-lg font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #FFE566, #FFD700)" }}
          >
            ✓
          </div>
        </div>

        <div className="p-6 flex flex-col gap-3">
          {/* Ver PDF */}
          <button
            onClick={exportarPDF}
            className="flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all text-left w-full border-2 border-gray-100 hover:border-primary-600 group"
            style={{ background: "linear-gradient(135deg, #F8FAFF, #EEF2FF)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all flex-shrink-0 group-hover:scale-110"
              style={{
                background: "linear-gradient(135deg, #1B3A6B, #0F2347)",
              }}
            >
              📄
            </div>
            <div>
              <p className="text-sm font-bold text-primary-600">
                Ver e imprimir PDF
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Abre la vista previa para imprimir o guardar
              </p>
            </div>
          </button>

          {/* Enviar correo */}
          <div
            className="border-2 border-gray-100 rounded-2xl px-4 py-4 flex flex-col gap-3"
            style={{ background: "linear-gradient(135deg, #F8FAFF, #F0F4FF)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "rgba(27,58,107,0.08)" }}
              >
                ✉️
              </div>
              <div>
                <p className="text-sm font-bold text-primary-600">
                  Enviar por correo
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Se adjunta el PDF de la cotización
                </p>
              </div>
            </div>

            {enviado ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
                <p className="text-sm font-bold text-emerald-700 mb-0.5">
                  ✅ ¡Correo enviado!
                </p>
                <p className="text-xs text-emerald-600">
                  {destinatarios.join(", ")}
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="correo1@mail.com; correo2@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-white transition-all duration-200"
                  />
                  <button
                    onClick={enviarCorreo}
                    disabled={enviando}
                    className="text-white text-xs font-bold px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
                    style={{
                      background: "linear-gradient(135deg, #1B3A6B, #0F2347)",
                    }}
                  >
                    {enviando ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "📤"
                    )}
                    {enviando ? "" : "Enviar"}
                  </button>
                </div>
                {progreso && (
                  <div className="bg-primary-50 border border-primary-100 rounded-xl px-3 py-2 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin flex-shrink-0" />
                    <p className="text-xs text-primary-600 font-medium">
                      {progreso}
                    </p>
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2">
                    <span className="text-red-500 text-sm">⚠️</span>
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Botones acción */}
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => navigate("/cotizaciones")}
              className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Ver historial
            </button>
            <button
              onClick={() => {
                window.location.href = "/nueva";
              }}
              className="flex-1 text-white text-sm font-bold py-3 rounded-xl transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #1B3A6B 0%, #0F2347 100%)",
                boxShadow: "0 2px 8px rgba(27,58,107,0.3)",
              }}
            >
              Nueva cotización
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
