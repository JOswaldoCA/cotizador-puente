import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BASES } from "../utils/constantes";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, padding: 28, color: "#111" },
  divider: { borderBottom: "1px solid #e5e7eb", marginBottom: 8 },
  fechaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  fechaBox: { flexDirection: "row", border: "1px solid #ccc", fontSize: 9 },
  fechaLabel: {
    padding: "3 8",
    backgroundColor: "#f3f4f6",
    fontFamily: "Helvetica-Bold",
  },
  fechaValor: { padding: "3 8" },
  atencion: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1B3A6B",
    marginBottom: 2,
    borderBottom: "1px solid #ccc",
    paddingBottom: 4,
  },
  contacto: {
    fontSize: 9,
    marginBottom: 8,
    borderBottom: "1px solid #ccc",
    paddingBottom: 4,
  },
  intro: { fontSize: 9, lineHeight: 1.6, marginBottom: 8, color: "#444" },
  cotLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  cotTexto: { fontSize: 9, lineHeight: 1.6, marginBottom: 8, color: "#444" },
  tableHeader: { flexDirection: "row", backgroundColor: "#FFD700" },
  tableHeaderCell: {
    padding: "5 8",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#1B3A6B",
    flex: 1,
    borderRight: "1px solid #ccc",
  },
  opcionTitle: {
    padding: "4 8",
    backgroundColor: "#f0f0f0",
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    borderBottom: "1px solid #ccc",
    borderTop: "1px solid #ccc",
  },
  row: { flexDirection: "row", borderBottom: "1px solid #e5e7eb" },
  cell: {
    padding: "3 8",
    fontSize: 9,
    flex: 1,
    borderRight: "1px solid #e5e7eb",
  },
  basesTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    marginBottom: 4,
  },
  baseItem: { fontSize: 8, color: "#555", marginBottom: 2, lineHeight: 1.4 },
  border: { border: "1px solid #ccc" },
});

const fmt = (n) =>
  `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export function DocumentoPDF({ cot }) {
  const { sucursal, cliente, opciones, fecha } = cot;

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
          {/* Izquierda — Logo */}
          <View style={{ width: "45%" }}>
            <View
              style={{
                backgroundColor: "#FFD700",
                padding: "6 10",
                marginBottom: 4,
                alignSelf: "flex-start",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "Helvetica-Bold",
                  color: "#1B3A6B",
                }}
              >
                PUENTE AMBIENTAL DEL NOROESTE
              </Text>
            </View>
            <Text style={{ fontSize: 7, color: "#555" }}>
              Recolección de residuos sólidos urbanos
            </Text>
          </View>

          {/* Derecha — Datos empresa */}
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
                color: "#333",
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

        {/* FECHA Y VIGENCIA */}
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

        {/* ATENCIÓN */}
        <Text style={styles.atencion}>
          ATENCIÓN A: {cliente?.atencion?.toUpperCase()}
        </Text>
        <Text style={styles.contacto}>{cliente?.contacto?.toUpperCase()}</Text>

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
            <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>
              DESCRIPCIÓN
            </Text>
            <Text style={{ ...styles.tableHeaderCell, textAlign: "right" }}>
              TOTAL
            </Text>
          </View>

          {opciones?.map((op, i) => (
            <View key={i}>
              <Text style={styles.opcionTitle}>OPCION {i + 1}</Text>

              {/* Servicio + Totales */}
              <View style={styles.row}>
                <Text style={{ ...styles.cell, flex: 2 }}>
                  SERVICIO DE RECOLECCION DE BASURA (RSU) ** PRECIOS{" "}
                  {new Date().getFullYear()}
                </Text>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      padding: "2 8",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <Text style={{ fontSize: 8, color: "#555" }}>
                      SUBTOTAL $
                    </Text>
                    <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>
                      {fmt(op.subtotal)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      padding: "2 8",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <Text style={{ fontSize: 8, color: "#555" }}>IVA $</Text>
                    <Text style={{ fontSize: 8 }}>{fmt(op.iva)}</Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      padding: "2 8",
                    }}
                  >
                    <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>
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

              {/* Frecuencia */}
              <View style={styles.row}>
                <Text style={styles.cell}>
                  DIAS DE RECOLECCION: {op.frecuencia?.toUpperCase()}
                </Text>
              </View>

              {/* Capacidad */}
              <View style={styles.row}>
                <Text style={styles.cell}>
                  CAPACIDAD DE CONTENEDOR: {op.capacidad?.toUpperCase()}
                </Text>
              </View>

              {/* Contenedores */}
              <View style={styles.row}>
                <Text style={styles.cell}>
                  CONTENEDORES: {op.contenedores} PZA
                  {Number(op.contenedores) !== 1 ? "S" : ""} A COMODATO
                </Text>
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
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
            }}
          >
            <Text
              style={{
                fontSize: 8,
                fontFamily: "Helvetica-Bold",
                marginBottom: 3,
                color: "#92400e",
              }}
            >
              OBSERVACIONES
            </Text>
            <Text style={{ fontSize: 8, color: "#78350f", lineHeight: 1.5 }}>
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
                color: "#555",
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
      </Page>
    </Document>
  );
}
