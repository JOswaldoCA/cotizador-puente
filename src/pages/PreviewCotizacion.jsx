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
      <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
        Cargando...
      </div>
    );

  if (!cot)
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Cotización no encontrada.
      </div>
    );

  const { sucursal, cliente, opciones, fecha } = cot;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        body { background: #e5e7eb; }
      `}</style>

      {/* Botón imprimir */}
      <div className="no-print flex justify-center gap-3 py-4">
        <button
          onClick={() => window.print()}
          className="bg-verde-400 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-verde-600 transition-colors"
        >
          Imprimir / Guardar PDF
        </button>
        <button
          onClick={() => window.close()}
          className="border border-gray-300 text-gray-600 text-sm px-5 py-2 rounded-lg hover:bg-gray-100"
        >
          Cerrar
        </button>
      </div>

      {/* Documento */}
      <div
        id="documento"
        style={{
          width: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
          background: "#fff",
          padding: "12mm 14mm",
          fontFamily: "Arial, sans-serif",
          fontSize: "11px",
          color: "#111",
          boxSizing: "border-box",
        }}
      >
        {/* ENCABEZADO */}
        <table
          width="100%"
          style={{ borderCollapse: "collapse", marginBottom: 8 }}
        >
          <tbody>
            <tr>
              {/* Logo */}
              <td
                style={{
                  width: "45%",
                  verticalAlign: "middle",
                  paddingRight: 16,
                }}
              >
                <img
                  src={logo}
                  alt="Puente Ambiental"
                  style={{ maxWidth: 200, maxHeight: 80, objectFit: "contain" }}
                />
              </td>
              {/* Datos empresa */}
              <td
                style={{
                  textAlign: "right",
                  verticalAlign: "top",
                  fontSize: 11,
                  lineHeight: 1.7,
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

        {/* FECHA Y VIGENCIA */}
        <table
          width="100%"
          style={{ borderCollapse: "collapse", marginBottom: 6 }}
        >
          <tbody>
            <tr>
              <td width="55%"></td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "3px 8px",
                  fontSize: 10,
                }}
              >
                <strong>FOLIO:</strong>
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "3px 8px",
                  fontSize: 10,
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
                  padding: "3px 8px",
                  fontSize: 10,
                }}
              >
                <strong>COTIZACION PRESENTADA:</strong>
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "3px 8px",
                  fontSize: 10,
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
                  padding: "3px 8px",
                  fontSize: 10,
                }}
              >
                <strong>VIGENCIA</strong>
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "3px 8px",
                  fontSize: 10,
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
            paddingBottom: 4,
            marginBottom: 4,
          }}
        >
          <strong>ATENCION A: </strong>
          {cliente.atencion?.toUpperCase()}
        </div>
        <div
          style={{
            borderBottom: "1px solid #ccc",
            paddingBottom: 4,
            marginBottom: 10,
          }}
        >
          {cliente.contacto?.toUpperCase()}
        </div>

        {/* TEXTO INTRO */}
        <div style={{ marginBottom: 12, lineHeight: 1.6, fontSize: 10.5 }}>
          {TEXTO_INTRO.split("\n\n").map((p, i) => (
            <p key={i} style={{ margin: "0 0 6px" }}>
              {p}
            </p>
          ))}
        </div>

        {/* COTIZACIÓN */}
        <div style={{ marginBottom: 6, fontWeight: 700, fontSize: 11 }}>
          COTIZACIÓN
        </div>
        <div style={{ marginBottom: 10, lineHeight: 1.6, fontSize: 10.5 }}>
          Con base a la información compartida por usted, ponemos a su
          consideración la siguiente propuesta económica para el servicio de
          recolección, transporte y disposición final de residuos sólidos
          urbanos generados en sus distintas localidades:
        </div>

        {/* TABLA OPCIONES */}
        <table
          width="100%"
          style={{ borderCollapse: "collapse", marginBottom: 12 }}
        >
          <thead>
            <tr style={{ background: "#FFD700" }}>
              <th
                style={{
                  border: "1px solid #999",
                  padding: "5px 8px",
                  textAlign: "left",
                  fontSize: 11,
                }}
              >
                DESCRIPCIÓN
              </th>
              <th
                colSpan={2}
                style={{
                  border: "1px solid #999",
                  padding: "5px 8px",
                  textAlign: "right",
                  fontSize: 11,
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
                {/* Header opción */}
                <tr key={`title-${i}`}>
                  <td
                    colSpan={3}
                    style={{
                      background: "#f0f0f0",
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: 11,
                      border: "1px solid #ccc",
                      padding: "4px 8px",
                    }}
                  >
                    OPCION {i + 1}
                  </td>
                </tr>

                {/* Servicios de la opción */}
                {(op.servicios || []).map((srv, si) => (
                  <tr key={`srv-${i}-${si}`}>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: "3px 8px",
                        fontSize: 10.5,
                      }}
                    >
                      <strong>{srv.nombre?.toUpperCase() || "SERVICIO"}</strong>
                      {" — "}
                      {srv.numContenedores} PZA
                      {Number(srv.numContenedores) !== 1 ? "S" : ""} A COMODATO
                      {" — "}
                      {srv.diasSemana} VISITA
                      {Number(srv.diasSemana) !== 1 ? "S" : ""}/SEMANA
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: "3px 8px",
                        fontSize: 10,
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      SUBTOTAL $
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: "3px 8px",
                        fontSize: 10,
                        textAlign: "right",
                        minWidth: 70,
                      }}
                    >
                      {(
                        srv.precioUnitario * srv.numContenedores +
                        srv.precioDia * srv.diasSemana
                      ).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}

                {/* Totales opción */}
                <tr key={`iva-${i}`}>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "3px 8px",
                      fontSize: 10.5,
                    }}
                  ></td>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "3px 8px",
                      fontSize: 10,
                      textAlign: "right",
                    }}
                  >
                    IVA $
                  </td>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "3px 8px",
                      fontSize: 10,
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
                    style={{
                      border: "1px solid #ccc",
                      padding: "3px 8px",
                      fontSize: 10.5,
                    }}
                  ></td>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "3px 8px",
                      fontSize: 10,
                      textAlign: "right",
                      fontWeight: 700,
                    }}
                  >
                    NETO MENSUAL $
                  </td>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "3px 8px",
                      fontSize: 10,
                      textAlign: "right",
                      fontWeight: 700,
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

        {/* NOTAS ADICIONALES */}
        {cot.cliente?.notas && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 4 }}>
              OBSERVACIONES
            </div>
            <div
              style={{
                fontSize: 10.5,
                lineHeight: 1.6,
                border: "1px solid #ccc",
                borderRadius: 4,
                padding: "6px 10px",
                background: "#fafafa",
              }}
            >
              {cot.cliente.notas}
            </div>
          </div>
        )}

        {/* BASES */}
        <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 4 }}>
          BASES DE LA COTIZACION
        </div>
        <table width="100%" style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td
                style={{
                  verticalAlign: "top",
                  width: "55%",
                  fontSize: 9.5,
                  lineHeight: 1.7,
                  paddingRight: 12,
                }}
              >
                {BASES.map((b, i) => (
                  <div key={i}>• {b}</div>
                ))}
                {/* Bases personalizadas */}
                {(cot.basesExtra || []).map((b, i) => (
                  <div key={`extra-${i}`}>• {b}</div>
                ))}
              </td>
              <td
                style={{
                  verticalAlign: "top",
                  textAlign: "right",
                  fontSize: 10.5,
                  lineHeight: 1.9,
                }}
              >
                <strong>{sucursal.nombre}</strong>
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
      </div>
    </>
  );
}
