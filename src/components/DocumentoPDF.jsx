import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { BASES } from "../utils/constantes";
import { logoBase64 } from "../assets/logoBase64";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 24,
    color: "#111",
    backgroundColor: "#ffffff",
  },

  // Encabezado
  divider: { borderBottom: "2px solid #1B3A6B", marginBottom: 10 },
  dividerLight: { borderBottom: "1px solid #e5e7eb", marginBottom: 8 },

  // Folio / fecha
  fechaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 3,
  },
  fechaBox: { flexDirection: "row", border: "1px solid #d1d5db", fontSize: 9 },
  fechaLabel: {
    padding: "2 6",
    backgroundColor: "#EEF2FF",
    fontFamily: "Helvetica-Bold",
    color: "#1B3A6B",
  },
  fechaValor: { padding: "2 6", backgroundColor: "#ffffff" },

  // Atención
  atencion: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1B3A6B",
    marginBottom: 2,
    borderBottom: "1px solid #d1d5db",
    paddingBottom: 4,
  },
  contacto: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 10,
    borderBottom: "1px solid #d1d5db",
    paddingBottom: 4,
  },

  // Texto
  intro: { fontSize: 8, lineHeight: 1.5, marginBottom: 6, color: "#4B5563" },
  cotLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    color: "#1B3A6B",
  },
  cotTexto: { fontSize: 8, lineHeight: 1.5, marginBottom: 6, color: "#4B5563" },

  // Tabla
  border: { border: "1px solid #d1d5db" },
  tableHeader: { flexDirection: "row", backgroundColor: "#FFD700" },
  tableHeaderCell: {
    padding: "4 6",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#1B3A6B",
    flex: 1,
    borderRight: "1px solid #B8860B",
  },
  opcionTitle: {
    padding: "5 8",
    backgroundColor: "#1B3A6B",
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#FFD700",
    letterSpacing: 1,
  },
  srvRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#fafafa",
  },
  cell: {
    padding: "3 6",
    fontSize: 8,
    flex: 1,
    borderRight: "1px solid #e5e7eb",
    color: "#374151",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "2 6",
    borderBottom: "1px solid #e5e7eb",
  },
  netoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "2 6",
    backgroundColor: "#EEF2FF",
  },

  // Bases
  basesTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    marginBottom: 3,
    color: "#1B3A6B",
  },
  baseItem: { fontSize: 8, color: "#555", marginBottom: 2, lineHeight: 1.4 },
  baseItemExtra: {
    fontSize: 7.5,
    color: "#1B3A6B",
    marginBottom: 2,
    lineHeight: 1.4,
    fontFamily: "Helvetica-Bold",
  },

  // Footer
  footer: {
    borderTop: "2px solid #1B3A6B",
    marginTop: 14,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: { fontSize: 7, color: "#9CA3AF", textAlign: "center" },
});

const fmt = (n) =>
  `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export function DocumentoPDF({ cot }) {
  const { sucursal, cliente, opciones, fecha, folio } = cot;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* ENCABEZADO */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
            alignItems: "flex-start",
          }}
        >
          <View style={{ width: "45%" }}>
            <Image
              src={logoBase64}
              style={{ width: 160, height: 60, objectFit: "contain" }}
            />
          </View>
          <View style={{ width: "50%", alignItems: "flex-end" }}>
            <Text
              style={{
                fontSize: 8,
                fontFamily: "Helvetica-Bold",
                color: "#1B3A6B",
                textAlign: "right",
              }}
            >
              Puente Ambiental del Noroeste S.A de C.V,
            </Text>
            <Text
              style={{
                fontSize: 8,
                color: "#4B5563",
                textAlign: "right",
                lineHeight: 1.6,
              }}
            >
              {sucursal?.tipo}.{"\n"}
              {sucursal?.direccion}
              {"\n"}
              {sucursal?.cp}
              {"\n"}
              {sucursal?.ciudad}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* FOLIO / FECHA / VIGENCIA / FORMA DE PAGO */}
        <View style={styles.fechaRow}>
          <View style={styles.fechaBox}>
            <Text style={styles.fechaLabel}>FOLIO:</Text>
            <Text
              style={{
                ...styles.fechaValor,
                fontFamily: "Helvetica-Bold",
                color: "#1B3A6B",
              }}
            >
              {folio}
            </Text>
          </View>
        </View>
        <View style={styles.fechaRow}>
          <View style={styles.fechaBox}>
            <Text style={styles.fechaLabel}>COTIZACIÓN PRESENTADA:</Text>
            <Text style={styles.fechaValor}>{fecha}</Text>
          </View>
        </View>
        <View style={styles.fechaRow}>
          <View style={styles.fechaBox}>
            <Text style={styles.fechaLabel}>VIGENCIA</Text>
            <Text style={styles.fechaValor}>{cliente?.vigencia}</Text>
          </View>
        </View>
        <View style={{ ...styles.fechaRow, marginBottom: 10 }}>
          <View style={styles.fechaBox}>
            <Text style={styles.fechaLabel}>FORMA DE PAGO</Text>
            <Text
              style={{
                ...styles.fechaValor,
                fontFamily: "Helvetica-Bold",
                color: "#1B3A6B",
              }}
            >
              {cliente?.pago?.toUpperCase() || "MENSUAL"}
            </Text>
          </View>
        </View>

        {/* ATENCIÓN */}
        <Text style={styles.atencion}>
          ATENCIÓN A: {cliente?.contacto?.toUpperCase()}
        </Text>
        <Text style={styles.contacto}>{cliente?.atencion?.toUpperCase()}</Text>

        {/* INTRO */}
        <Text style={styles.intro}>
          Por este medio, nos permitimos presentarle los servicios de Puente
          Ambiental del Noroeste SA de CV, una empresa 100% sonorense, enfocada
          en buscar y lograr la satisfacción de nuestros clientes.{"\n\n"}
          Ofrecemos el servicio de recolección y transporte de residuos sólidos
          urbanos, residuos de manejo especial y residuos no peligrosos con la
          visión de posicionarnos como la empresa número uno en servicio,
          puntualidad y calidad.
        </Text>

        {/* COTIZACIÓN */}
        <Text style={styles.cotLabel}>COTIZACIÓN</Text>
        <Text style={styles.cotTexto}>
          Con base a la información compartida por usted, ponemos a su
          consideración la siguiente propuesta económica para el servicio de
          recolección, transporte y disposición final de residuos sólidos
          urbanos generados en sus distintas localidades:
        </Text>

        {/* TABLA OPCIONES */}
        <View style={styles.border}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>SERVICIO</Text>
            <Text style={{ ...styles.tableHeaderCell, textAlign: "center" }}>
              CONTENEDORES
            </Text>
            <Text style={{ ...styles.tableHeaderCell, textAlign: "center" }}>
              VISITAS/SEM
            </Text>
            <Text
              style={{
                ...styles.tableHeaderCell,
                textAlign: "right",
                borderRight: "none",
              }}
            >
              TOTAL
            </Text>
          </View>

          {opciones?.map((op, i) => (
            <View key={i}>
              <Text style={styles.opcionTitle}>OPCION {i + 1}</Text>

              {(op.servicios || []).map((srv, si) => {
                const lineTotal =
                  srv.precioUnitario * srv.numContenedores +
                  srv.precioDia * srv.diasSemana;
                return (
                  <View key={si} style={styles.srvRow}>
                    <Text style={{ ...styles.cell, flex: 2 }}>
                      {srv.nombre?.toUpperCase() || "—"}
                    </Text>
                    <Text style={{ ...styles.cell, textAlign: "center" }}>
                      {srv.numContenedores} PZA
                    </Text>
                    <Text style={{ ...styles.cell, textAlign: "center" }}>
                      {srv.diasSemana} VIS/SEM
                    </Text>
                    <Text
                      style={{
                        ...styles.cell,
                        textAlign: "right",
                        borderRight: "none",
                      }}
                    >
                      {fmt(lineTotal)}
                    </Text>
                  </View>
                );
              })}

              {/* Totales */}
              <View
                style={{
                  flexDirection: "row",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <View style={{ flex: 2 }} />
                <View style={{ flex: 2 }}>
                  <View style={styles.totalRow}>
                    <Text style={{ fontSize: 8, color: "#6B7280" }}>
                      SUBTOTAL $
                    </Text>
                    <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>
                      {fmt(op.subtotal)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={{ fontSize: 8, color: "#6B7280" }}>IVA $</Text>
                    <Text style={{ fontSize: 8 }}>{fmt(op.iva)}</Text>
                  </View>
                  <View style={styles.netoRow}>
                    <Text
                      style={{
                        fontSize: 8,
                        fontFamily: "Helvetica-Bold",
                        color: "#1B3A6B",
                      }}
                    >
                      NETO MENSUAL $
                    </Text>
                    <Text
                      style={{
                        fontSize: 8,
                        fontFamily: "Helvetica-Bold",
                        color: "#1B3A6B",
                      }}
                    >
                      {fmt(op.total)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* NOTAS */}
        {cliente?.notas && (
          <View
            style={{
              marginTop: 8,
              padding: 8,
              backgroundColor: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderLeft: "3px solid #1B3A6B",
            }}
          >
            <Text
              style={{
                fontSize: 8,
                fontFamily: "Helvetica-Bold",
                marginBottom: 3,
                color: "#92400E",
              }}
            >
              OBSERVACIONES
            </Text>
            <Text style={{ fontSize: 8, color: "#78350F", lineHeight: 1.5 }}>
              {cliente.notas}
            </Text>
          </View>
        )}

        {/* BASES */}
        <Text style={styles.basesTitle}>BASES DE LA COTIZACION</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ flex: 1.5 }}>
            {BASES.map((b, i) => (
              <Text key={i} style={styles.baseItem}>
                • {b}
              </Text>
            ))}
            {(cot.basesExtra || []).map((b, i) => (
              <Text key={`extra-${i}`} style={styles.baseItemExtra}>
                • {b}
              </Text>
            ))}
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text
              style={{
                fontSize: 9,
                fontFamily: "Helvetica-Bold",
                color: "#1B3A6B",
                textAlign: "right",
              }}
            >
              {sucursal?.nombre}
            </Text>
            <Text
              style={{
                fontSize: 8,
                color: "#4B5563",
                textAlign: "right",
                lineHeight: 1.6,
              }}
            >
              {sucursal?.direccion}
              {"\n"}
              {sucursal?.ciudad}
              {"\n"}
              {sucursal?.cp}
              {"\n"}
              {sucursal?.tipo}
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Puente Ambiental del Noroeste S.A de C.V · {sucursal?.ciudad} ·{" "}
            {sucursal?.cp}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
