import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { obtenerCotizacion } from "../services/cotizaciones";
import { BASES, TEXTO_INTRO } from "../utils/constantes";
import logo from "../assets/logoPA.png";
import { FileText, Printer, X } from "lucide-react";
import Boton from "../components/ui/Boton";

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
        <FileText size={32} strokeWidth={1.5} className="text-gray-300" aria-hidden="true" />
        <p className="text-gray-600">No encontramos la cotización {folio}, o no tienes acceso a ella.</p>
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
          #documento {
            width: 100% !important;
            min-height: unset !important;
            margin: 0 !important;
            padding: 8mm !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            font-size: 10px !important;
          }
          @page { size: letter portrait; margin: 8mm 10mm; }
        }
        body { background: #F0F4F8; }
      `}</style>

      {/* Barra de acciones */}
      <div className="no-print sticky top-0 z-10 px-4 sm:px-6 h-14 flex items-center justify-between gap-3 bg-white/90 backdrop-blur border-b border-linea">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary-800">Vista previa</p>
          <p className="text-xs text-gray-500 font-mono truncate">{folio}</p>
        </div>
        <div className="flex items-center gap-2">
          <Boton icono={Printer} onClick={() => window.print()}>
            <span className="hidden sm:inline">Imprimir o guardar PDF</span>
            <span className="sm:hidden">Imprimir</span>
          </Boton>
          <Boton variante="secundario" icono={X} onClick={() => window.close()}>
            Cerrar
          </Boton>
        </div>
      </div>

      <div className="py-8">
        <div
          id="documento"
          style={{
            width: "216mm",
            minHeight: "279mm",
            margin: "0 auto",
            background: "#fff",
            padding: "12mm",
            fontFamily: "Arial, sans-serif",
            fontSize: "12px",
            color: "#111",
            boxSizing: "border-box",
            boxShadow:
              "0 8px 32px rgba(27,58,107,0.12), 0 2px 8px rgba(27,58,107,0.08)",
            borderRadius: "4px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1 }}>
            {/* ENCABEZADO */}
            <table
              width="100%"
              style={{ borderCollapse: "collapse", marginBottom: 5 }}
            >
              <tbody>
                <tr>
                  {/* Logo más grande */}
                  <td
                    style={{
                      width: "50%",
                      verticalAlign: "middle",
                      paddingRight: 12,
                    }}
                  >
                    <img
                      src={logo}
                      alt="Puente Ambiental"
                      style={{
                        maxWidth: 220,
                        maxHeight: 80,
                        objectFit: "contain",
                      }}
                    />
                  </td>
                  {/* Info sucursal compacta */}
                  <td
                    style={{
                      textAlign: "right",
                      verticalAlign: "top",
                      fontSize: 9,
                      lineHeight: 1.4,
                    }}
                  >
                    <strong style={{ fontSize: 10 }}>
                      PUENTE AMBIENTAL DEL NOROESTE S.A DE C.V
                    </strong>
                    <br />
                    <strong>{sucursal.tipo}</strong>
                    <br />
                    {sucursal.direccion} {sucursal.cp} {sucursal.ciudad}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Línea divisora */}
            <div
              style={{ borderBottom: "2px solid #1B3A6B", marginBottom: 5 }}
            />

            {/* FOLIO / FECHA / VIGENCIA / FACTURACIÓN */}
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
                    <strong>COTIZACIÓN PRESENTADA:</strong>
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
                  <td width="55%"></td>
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
                    <strong>FACTURACIÓN</strong>
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
                    {cliente.pago?.toUpperCase() || "MENSUAL"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ATENCIÓN — Contacto arriba, Razón Social abajo */}
            <div
              style={{
                borderBottom: "1px solid #ccc",
                paddingBottom: 3,
                marginBottom: 2,
                fontSize: 10.5,
              }}
            >
              <strong>ATENCIÓN A: </strong>
              {cliente.atencion?.toUpperCase()}
            </div>
            <div
              style={{
                borderBottom: "1px solid #ccc",
                paddingBottom: 3,
                marginBottom: 7,
                fontSize: 10.5,
              }}
            >
              <strong>RAZÓN SOCIAL: </strong>
              {cliente.contacto?.toUpperCase()}
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
                        OPCIÓN {i + 1}
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
                          ).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
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
              BASES DE LA COTIZACIÓN
            </div>
            <div style={{ fontSize: 9, lineHeight: 1.6 }}>
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
            </div>
            {/* DATOS BANCARIOS */}
            <div
              style={{
                marginTop: 10,
                border: "1px solid #e5e7eb",
                borderLeft: "3px solid #1B3A6B",
                borderRadius: 4,
                padding: "6px 10px",
                background: "#F8FAFF",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 9,
                  color: "#1B3A6B",
                  marginBottom: 4,
                }}
              >
                DATOS BANCARIOS
              </div>
              <table
                width="100%"
                style={{ borderCollapse: "collapse", fontSize: 8.5 }}
              >
                <tbody>
                  {[
                    ["RAZÓN SOCIAL", "PUENTE AMBIENTAL DEL NOROESTE SA DE CV"],
                    ["RFC", "PAN160504GI0"],
                    ["CORREO", "cobranza@puenteambiental.com.mx"],
                    ["BANCO", "BBVA"],
                    ["CUENTA BANCARIA", "0108825866"],
                    ["CLAVE INTERBANCARIA", "012760001088258664"],
                  ].map(([label, valor]) => (
                    <tr key={label}>
                      <td
                        style={{
                          fontWeight: 700,
                          color: "#374151",
                          paddingRight: 8,
                          paddingBottom: 2,
                          whiteSpace: "nowrap",
                          width: "35%",
                        }}
                      >
                        {label}:
                      </td>
                      <td
                        style={{
                          color: "#111",
                          paddingBottom: 2,
                          fontWeight:
                            label === "CLAVE INTERBANCARIA" ||
                            label === "CUENTA BANCARIA"
                              ? 700
                              : 400,
                        }}
                      >
                        {valor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PIE DE PÁGINA — siempre datos de MATRIZ */}
          <div
            style={{
              borderTop: "2px solid #1B3A6B",
              marginTop: 12,
              paddingTop: 6,
            }}
          >
            <table width="100%" style={{ borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      verticalAlign: "top",
                      fontSize: 8,
                      color: "#6B7280",
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ color: "#1B3A6B", fontSize: 9 }}>
                      PUENTE AMBIENTAL DEL NOROESTE S.A DE C.V
                    </strong>
                    <br />
                    BLVD. JOSE ALBERTO HEALY NORIEGA Y CALLE PASEO PINO REAL,
                    COL. LOS PINOS RESIDENCIAL. C.P 83117 HERMOSILLO, SONORA.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
