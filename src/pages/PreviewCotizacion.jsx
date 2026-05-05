import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { obtenerCotizacion } from "../services/cotizaciones";
import { BASES, TEXTO_INTRO } from "../utils/constantes";
import logo from "../assets/logoPA.png";

export default function PreviewCotizacion() {
  const { folio } = useParams();
  const [cot, setCot] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerCotizacion(folio)
      .then(setCot)
      .finally(() => setCargando(false));
  }, [folio]);

  if (cargando)
    return (
      <div
        className="flex items-center justify-center h-screen gap-3 text-gray-400 text-sm"
        style={{ background: "#F0F4F8" }}
      >
        <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
        Cargando documento...
      </div>
    );

  if (!cot)
    return (
      <div
        className="flex flex-col items-center justify-center h-screen gap-3"
        style={{ background: "#F0F4F8" }}
      >
        <p className="text-4xl">📄</p>
        <p className="text-gray-500 font-medium">Cotización no encontrada</p>
      </div>
    );

  const { sucursal, cliente, opciones, fecha } = cot;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .py-8 { padding: 0 !important; }

          /* Forzar una sola página */
          #documento {
            width: 100% !important;
            min-height: unset !important;
            margin: 0 !important;
            padding: 6mm !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            font-size: 9px !important;
          }

          @page {
            size: letter portrait;
            margin: 6mm 8mm;
          }
        }
        body { background: #F0F4F8; }
      `}</style>

      {/* Barra de acciones */}
      <div
        className="no-print sticky top-0 z-10 px-6 py-3 flex items-center justify-between"
        style={{
          background: "rgba(240,244,248,0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(27,58,107,0.08)",
          boxShadow: "0 1px 3px rgba(27,58,107,0.06)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: "linear-gradient(135deg, #1B3A6B, #0F2347)" }}
          >
            📄
          </div>
          <div>
            <p className="text-xs font-bold text-primary-600">Vista previa</p>
            <p className="text-xs text-gray-400 font-mono">{folio}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #1B3A6B, #0F2347)",
              boxShadow: "0 2px 8px rgba(27,58,107,0.3)",
            }}
          >
            🖨️ Imprimir / Guardar PDF
          </button>
          <button
            onClick={() => window.close()}
            className="text-sm font-medium px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors bg-white"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Sombra del documento */}
      <div className="py-8">
        {/* Documento */}
        <div
          id="documento"
          style={{
            width: "216mm",
            minHeight: "279mm",
            margin: "0 auto",
            background: "#fff",
            padding: "8mm",
            fontFamily: "Arial, sans-serif",
            fontSize: "11px",
            color: "#111",
            boxSizing: "border-box",
            boxShadow:
              "0 8px 32px rgba(27,58,107,0.12), 0 2px 8px rgba(27,58,107,0.08)",
            borderRadius: "4px",
          }}
        >
          {/* ENCABEZADO */}
          <table
            width="100%"
            style={{ borderCollapse: "collapse", marginBottom: 5 }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    width: "45%",
                    verticalAlign: "middle",
                    paddingRight: 12,
                  }}
                >
                  <img
                    src={logo}
                    alt="Puente Ambiental"
                    style={{
                      maxWidth: 170,
                      maxHeight: 60,
                      objectFit: "contain",
                    }}
                  />
                </td>
                <td
                  style={{
                    textAlign: "right",
                    verticalAlign: "top",
                    fontSize: 10,
                    lineHeight: 1.5,
                  }}
                >
                  <strong>{sucursal.nombre},</strong>
                  <br />
                  {sucursal.tipo}.<br />
                  {sucursal.direccion}
                  <br />
                  {sucursal.cp}
                  <br />
                  {sucursal.ciudad}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Línea divisora */}
          <div style={{ borderBottom: "2px solid #1B3A6B", marginBottom: 5 }} />

          {/* FOLIO / FECHA / VIGENCIA */}
          <table
            width="100%"
            style={{ borderCollapse: "collapse", marginBottom: 4 }}
          >
            <tbody>
              <tr>
                <td width="55%"></td>
                <td
                  style={{
                    border: "1px solid #ccc",
                    padding: "2px 6px",
                    fontSize: 9,
                    background: "#f8f8f8",
                  }}
                >
                  <strong>FOLIO:</strong>
                </td>
                <td
                  style={{
                    border: "1px solid #ccc",
                    padding: "2px 6px",
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#1B3A6B",
                  }}
                >
                  {folio}
                </td>
              </tr>
              <tr>
                <td width="55%"></td>
                <td
                  style={{
                    border: "1px solid #ccc",
                    padding: "2px 6px",
                    fontSize: 9,
                    background: "#f8f8f8",
                  }}
                >
                  <strong>COTIZACION PRESENTADA:</strong>
                </td>
                <td
                  style={{
                    border: "1px solid #ccc",
                    padding: "2px 6px",
                    fontSize: 9,
                  }}
                >
                  {fecha}
                </td>
              </tr>
              <tr>
                <td></td>
                <td
                  style={{
                    border: "1px solid #ccc",
                    padding: "2px 6px",
                    fontSize: 9,
                    background: "#f8f8f8",
                  }}
                >
                  <strong>VIGENCIA</strong>
                </td>
                <td
                  style={{
                    border: "1px solid #ccc",
                    padding: "2px 6px",
                    fontSize: 9,
                  }}
                >
                  {cliente.vigencia}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ATENCIÓN */}
          <div
            style={{
              borderBottom: "1px solid #ccc",
              paddingBottom: 3,
              marginBottom: 3,
              fontSize: 10.5,
            }}
          >
            <strong>ATENCION A: </strong>
            {cliente.contacto?.toUpperCase()}
          </div>
          <div
            style={{
              borderBottom: "1px solid #ccc",
              paddingBottom: 3,
              marginBottom: 7,
              fontSize: 10.5,
            }}
          >
            {cliente.atencion?.toUpperCase()}
          </div>

          {/* TEXTO INTRO */}
          <div style={{ marginBottom: 8, lineHeight: 1.45, fontSize: 9.5 }}>
            {TEXTO_INTRO.split("\n\n").map((p, i) => (
              <p key={i} style={{ margin: "0 0 4px" }}>
                {p}
              </p>
            ))}
          </div>

          {/* COTIZACIÓN */}
          <div
            style={{
              marginBottom: 4,
              fontWeight: 700,
              fontSize: 10,
              color: "#1B3A6B",
            }}
          >
            COTIZACIÓN
          </div>
          <div style={{ marginBottom: 7, lineHeight: 1.45, fontSize: 9.5 }}>
            Con base a la información compartida por usted, ponemos a su
            consideración la siguiente propuesta económica para el servicio de
            recolección, transporte y disposición final de residuos sólidos
            urbanos generados en sus distintas localidades:
          </div>

          {/* TABLA OPCIONES */}
          <table
            width="100%"
            style={{ borderCollapse: "collapse", marginBottom: 8 }}
          >
            <thead>
              <tr style={{ background: "#FFD700" }}>
                <th
                  style={{
                    border: "1px solid #999",
                    padding: "3px 6px",
                    textAlign: "left",
                    fontSize: 10,
                  }}
                >
                  DESCRIPCIÓN
                </th>
                <th
                  colSpan={2}
                  style={{
                    border: "1px solid #999",
                    padding: "3px 6px",
                    textAlign: "right",
                    fontSize: 10,
                    width: "35%",
                  }}
                >
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {opciones.map((op, i) => (
                <>
                  <tr key={`title-${i}`}>
                    <td
                      colSpan={3}
                      style={{
                        background: "#1B3A6B",
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: 10,
                        border: "1px solid #1B3A6B",
                        padding: "3px 6px",
                        color: "#FFD700",
                        letterSpacing: "1px",
                      }}
                    >
                      OPCION {i + 1}
                    </td>
                  </tr>
                  {(op.servicios || []).map((srv, si) => (
                    <tr key={`srv-${i}-${si}`}>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "3px 6px",
                          fontSize: 9.5,
                        }}
                      >
                        <strong>
                          {srv.nombre?.toUpperCase() || "SERVICIO"}
                        </strong>
                        {" — "}
                        {srv.numContenedores} PZA
                        {Number(srv.numContenedores) !== 1 ? "S" : ""} A
                        COMODATO
                        {" — "}
                        {srv.diasSemana} VISITA
                        {Number(srv.diasSemana) !== 1 ? "S" : ""}/SEMANA
                      </td>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "3px 6px",
                          fontSize: 9,
                          textAlign: "right",
                          whiteSpace: "nowrap",
                          background: "#fafafa",
                        }}
                      >
                        SUBTOTAL $
                      </td>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "3px 6px",
                          fontSize: 9,
                          textAlign: "right",
                          minWidth: 65,
                        }}
                      >
                        {(
                          srv.precioUnitario * srv.numContenedores +
                          srv.precioDia * srv.diasSemana
                        ).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  <tr key={`iva-${i}`}>
                    <td
                      style={{ border: "1px solid #ccc", padding: "3px 6px" }}
                    ></td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: "3px 6px",
                        fontSize: 9,
                        textAlign: "right",
                        background: "#fafafa",
                      }}
                    >
                      IVA $
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: "3px 6px",
                        fontSize: 9,
                        textAlign: "right",
                      }}
                    >
                      {(op.iva || 0).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                  <tr key={`total-${i}`}>
                    <td
                      style={{ border: "1px solid #ccc", padding: "3px 6px" }}
                    ></td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: "3px 6px",
                        fontSize: 9,
                        textAlign: "right",
                        fontWeight: 700,
                        background: "#EEF2FF",
                        color: "#1B3A6B",
                      }}
                    >
                      NETO MENSUAL $
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: "3px 6px",
                        fontSize: 9,
                        textAlign: "right",
                        fontWeight: 700,
                        background: "#EEF2FF",
                        color: "#1B3A6B",
                      }}
                    >
                      {(op.total || 0).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>

          {/* NOTAS */}
          {cot.cliente?.notas && (
            <div style={{ marginBottom: 7 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 10,
                  marginBottom: 3,
                  color: "#1B3A6B",
                }}
              >
                OBSERVACIONES
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  lineHeight: 1.5,
                  border: "1px solid #e5e7eb",
                  borderLeft: "3px solid #1B3A6B",
                  borderRadius: 4,
                  padding: "4px 8px",
                  background: "#fafafa",
                }}
              >
                {cot.cliente.notas}
              </div>
            </div>
          )}

          {/* BASES */}
          <div
            style={{
              fontWeight: 700,
              fontSize: 10,
              marginBottom: 3,
              color: "#1B3A6B",
            }}
          >
            BASES DE LA COTIZACION
          </div>
          <table width="100%" style={{ borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td
                  style={{
                    verticalAlign: "top",
                    width: "55%",
                    fontSize: 8.5,
                    lineHeight: 1.6,
                    paddingRight: 12,
                  }}
                >
                  {BASES.map((b, i) => (
                    <div key={i}>• {b}</div>
                  ))}
                  {(cot.basesExtra || []).map((b, i) => (
                    <div
                      key={`extra-${i}`}
                      style={{ color: "#1B3A6B", fontWeight: 600 }}
                    >
                      • {b}
                    </div>
                  ))}
                </td>
                <td
                  style={{
                    verticalAlign: "top",
                    textAlign: "right",
                    fontSize: 9.5,
                    lineHeight: 1.7,
                  }}
                >
                  <strong style={{ color: "#1B3A6B" }}>
                    {sucursal.nombre}
                  </strong>
                  <br />
                  {sucursal.direccion},<br />
                  {sucursal.ciudad}
                  <br />
                  {sucursal.cp}
                  <br />
                  <strong>{sucursal.tipo}</strong>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Pie de página */}
          <div
            style={{
              borderTop: "2px solid #1B3A6B",
              marginTop: 300,
              paddingTop: 5,
              textAlign: "center",
              fontSize: 8,
              color: "#6B7280",
            }}
          >
            Puente Ambiental del Noroeste S.A de C.V · {sucursal.ciudad} ·{" "}
            {sucursal.cp}
          </div>
        </div>
      </div>
    </>
  );
}
