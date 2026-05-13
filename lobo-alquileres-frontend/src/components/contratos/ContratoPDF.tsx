import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer";
import type { ContratoResponse, InmuebleResponse, PersonaResponse } from "@/types";
import { TIPO_AJUSTE_LABELS, PERIODICIDAD_LABELS } from "@/types";

// ── Paleta ────────────────────────────────────────────────────────────────────

const C = {
  brand:    "#1A4F59",
  brandBg:  "#EFF7F8",
  dark:     "#1A1A1A",
  mid:      "#555555",
  light:    "#888888",
  border:   "#CCCCCC",
  rowBg:    "#F8F8F8",
};

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingTop: 48, paddingBottom: 56, paddingHorizontal: 52,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.dark,
    lineHeight: 1.5,
  },

  // Cabecera
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomColor: C.brand,
    borderBottomWidth: 2,
    borderBottomStyle: "solid",
  },
  brandName: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
    letterSpacing: 0.5,
  },
  brandSub: { fontSize: 9, color: C.mid, marginTop: 2 },
  metaRight: { alignItems: "flex-end" },
  metaText:  { fontSize: 9, color: C.mid },

  // Título
  title: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
    textAlign: "center",
    marginBottom: 14,
    letterSpacing: 1,
  },

  // Párrafo introductorio
  intro: { marginBottom: 14, lineHeight: 1.65, fontSize: 10 },

  // Encabezado de sección
  secTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 6,
  },

  // Tabla de datos de partes
  table: {
    borderColor: C.border,
    borderWidth: 1,
    borderStyle: "solid",
    marginBottom: 12,
  },
  tRow: {
    flexDirection: "row",
    borderBottomColor: C.border,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
  },
  tRowLast: { flexDirection: "row" },
  tLabel: {
    width: "36%",
    padding: "6 8",
    backgroundColor: C.rowBg,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.mid,
  },
  tValue: { flex: 1, padding: "6 8", fontSize: 9 },

  // Cuerpo de cláusula
  body: { lineHeight: 1.65, marginBottom: 10 },
  bold: { fontFamily: "Helvetica-Bold" },

  // Cláusulas adicionales (texto largo)
  clauseBox: {
    borderColor: C.border,
    borderWidth: 1,
    borderStyle: "solid",
    padding: "8 10",
    marginBottom: 10,
    backgroundColor: C.rowBg,
    lineHeight: 1.65,
    fontSize: 9.5,
  },

  // Conformidad + firmas
  conformidad: { marginTop: 20, lineHeight: 1.65, marginBottom: 4 },

  sigRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
  },
  sigBlock: { alignItems: "center" },
  sigLine: {
    borderTopColor: C.dark,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    marginBottom: 5,
  },
  sigLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "center" },
  sigName:  { fontSize: 8,  color: C.mid,                 textAlign: "center" },
  sigDoc:   { fontSize: 8,  color: C.light,               textAlign: "center" },

  sigRowCenter: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },

  // Pie de página
  footer: {
    position: "absolute",
    bottom: 24,
    left: 52,
    right: 52,
    borderTopColor: C.border,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: C.light },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const MESES_ES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];

function mesNombre(m: string): string {
  return MESES_ES[parseInt(m, 10) - 1] ?? m;
}

function fmtMonto(n: number, moneda: string): string {
  const fmt = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
  return moneda === "USD" ? `U$D ${fmt}` : `$ ${fmt}`;
}

function duracionMeses(inicio: string, fin: string): number {
  const [yi, mi] = inicio.split("-").map(Number);
  const [yf, mf] = fin.split("-").map(Number);
  return (yf - yi) * 12 + (mf - mi);
}

function docPersona(p: PersonaResponse): string {
  return `${p.tipoDocumento} ${p.numeroDocumento}`;
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function FilaTabla({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={last ? s.tRowLast : s.tRow}>
      <Text style={s.tLabel}>{label}</Text>
      <Text style={s.tValue}>{value}</Text>
    </View>
  );
}

// ── Documento PDF ─────────────────────────────────────────────────────────────

export interface ContratoPDFProps {
  contrato:  ContratoResponse;
  inquilino: PersonaResponse;
  garante:   PersonaResponse | null;
  dueno:     PersonaResponse;
  inmueble:  InmuebleResponse;
}

export function ContratoPDF({
  contrato, inquilino, garante, dueno, inmueble,
}: ContratoPDFProps) {
  const hoy   = new Date();
  const [yi, mi, di] = contrato.fechaInicio.split("-");
  const ciudad = inmueble.ciudad || "Mendoza";
  const meses  = duracionMeses(contrato.fechaInicio, contrato.fechaFin);
  const tieneAjuste = contrato.tipoAjuste !== "NINGUNO";
  const tieneComision =
    contrato.comisionPorcentaje != null && contrato.comisionPorcentaje > 0;

  // Numeración de cláusulas
  let clausulaNum = 1;
  const nro = () => {
    const nums = ["Primera","Segunda","Tercera","Cuarta","Quinta","Sexta","Séptima","Octava","Novena","Décima"];
    return nums[(clausulaNum++) - 1] ?? clausulaNum;
  };

  return (
    <Document title={contrato.numeroContrato} author="Lobo Alquileres">
      <Page size="A4" style={s.page}>

        {/* ── Cabecera ── */}
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>LOBO ALQUILERES</Text>
            <Text style={s.brandSub}>Inmobiliaria y Gestión de Propiedades</Text>
          </View>
          <View style={s.metaRight}>
            <Text style={s.metaText}>{contrato.numeroContrato}</Text>
            <Text style={s.metaText}>
              Emitido: {hoy.toLocaleDateString("es-AR")}
            </Text>
          </View>
        </View>

        {/* ── Título ── */}
        <Text style={s.title}>CONTRATO DE LOCACIÓN</Text>

        {/* ── Intro ── */}
        <Text style={s.intro}>
          En la ciudad de {ciudad}, a los {di} días del mes de {mesNombre(mi)} del año {yi},
          entre los abajo firmantes, se celebra el presente contrato de locación bajo las
          siguientes cláusulas y condiciones:
        </Text>

        {/* ── 1. Partes ── */}
        <Text style={s.secTitle}>{nro()} — Partes intervinientes</Text>
        <View style={s.table}>
          <FilaTabla
            label="LOCADOR/A"
            value={`${dueno.apellido}, ${dueno.nombre}  ·  ${docPersona(dueno)}`}
          />
          <FilaTabla
            label="LOCATARIO/A"
            value={`${inquilino.apellido}, ${inquilino.nombre}  ·  ${docPersona(inquilino)}`}
          />
          {garante && (
            <FilaTabla
              label="FIADOR/A SOLIDARIO/A"
              value={`${garante.apellido}, ${garante.nombre}  ·  ${docPersona(garante)}`}
            />
          )}
          <FilaTabla
            label="MARTILLERO / CORREDOR"
            value={contrato.martilleroNombreCompleto}
            last
          />
        </View>

        {/* ── 2. Objeto ── */}
        <Text style={s.secTitle}>{nro()} — Objeto</Text>
        <Text style={s.body}>
          El LOCADOR da en locación al LOCATARIO el inmueble ubicado en{" "}
          <Text style={s.bold}>{contrato.inmuebleDireccion}</Text>,
          el que el LOCATARIO declara conocer y aceptar en las condiciones
          en que se encuentra.
        </Text>

        {/* ── 3. Plazo ── */}
        <Text style={s.secTitle}>{nro()} — Plazo</Text>
        <Text style={s.body}>
          El plazo de la locación es de{" "}
          <Text style={s.bold}>{meses} ({meses === 12 ? "doce" : meses === 24 ? "veinticuatro" : meses}) meses</Text>,
          comenzando el <Text style={s.bold}>{fmtFecha(contrato.fechaInicio)}</Text> y finalizando
          el <Text style={s.bold}>{fmtFecha(contrato.fechaFin)}</Text>, ambas fechas inclusive.
          Vencido el plazo, el LOCATARIO se obliga a restituir el inmueble libre de ocupantes.
        </Text>

        {/* ── 4. Precio ── */}
        <Text style={s.secTitle}>{nro()} — Precio</Text>
        <Text style={s.body}>
          El precio mensual de la locación es de{" "}
          <Text style={s.bold}>
            {fmtMonto(contrato.montoAlquilerInicial, contrato.monedaContrato)} ({contrato.monedaContrato})
          </Text>{" "}
          para el primer período, pagaderos en forma adelantada antes del día{" "}
          <Text style={s.bold}>{contrato.diaVencimientoCuota}</Text> de cada mes,
          mediante los medios de pago acordados entre las partes.
          El incumplimiento en la fecha de pago devengará intereses punitorios.
        </Text>

        {/* ── 5. Depósito ── */}
        <Text style={s.secTitle}>{nro()} — Depósito de Garantía</Text>
        <Text style={s.body}>
          A la firma del presente contrato, el LOCATARIO entrega en concepto de depósito de
          garantía <Text style={s.bold}>{contrato.depositoMeses} ({contrato.depositoMeses === 1 ? "un" : String(contrato.depositoMeses)}) mes(es)</Text> de alquiler,
          equivalente a{" "}
          <Text style={s.bold}>
            {contrato.depositoMonto != null
              ? fmtMonto(contrato.depositoMonto, contrato.monedaContrato)
              : `${contrato.depositoMeses} cuota(s) iniciales`}
          </Text>.{" "}
          Dicho importe será restituido al LOCATARIO al finalizar el contrato, previa
          verificación del estado del inmueble y cancelación total de las obligaciones.
        </Text>

        {/* ── 6. Ajuste (condicional) ── */}
        {tieneAjuste && (
          <>
            <Text style={s.secTitle}>{nro()} — Ajuste del Precio</Text>
            <Text style={s.body}>
              El precio de la locación se actualizará mediante el índice{" "}
              <Text style={s.bold}>
                {TIPO_AJUSTE_LABELS[contrato.tipoAjuste]}
              </Text>{" "}
              con periodicidad{" "}
              <Text style={s.bold}>
                {PERIODICIDAD_LABELS[contrato.periodicidadAjuste].toLowerCase()}
              </Text>.
              {contrato.tipoAjuste === "FIJO_PORCENTAJE" &&
               contrato.porcentajeAjusteFijo != null && (
                ` El porcentaje de ajuste aplicable es del ${contrato.porcentajeAjusteFijo}% por período.`
              )}
              {" "}Los ajustes se aplicarán de pleno derecho sin necesidad de notificación previa.
            </Text>
          </>
        )}

        {/* ── Comisión (condicional) ── */}
        {tieneComision && (
          <>
            <Text style={s.secTitle}>{nro()} — Comisión Inmobiliaria</Text>
            <Text style={s.body}>
              El LOCATARIO abonará al MARTILLERO, en concepto de comisión inmobiliaria,
              el <Text style={s.bold}>{contrato.comisionPorcentaje}%</Text> del primer mes de
              alquiler, equivalente a{" "}
              <Text style={s.bold}>
                {fmtMonto(
                  (contrato.montoAlquilerInicial * (contrato.comisionPorcentaje ?? 0)) / 100,
                  contrato.monedaContrato,
                )}
              </Text>.
            </Text>
          </>
        )}

        {/* ── Cláusulas adicionales ── */}
        {contrato.clausulasAdicionales && (
          <>
            <Text style={s.secTitle}>{nro()} — Cláusulas Adicionales</Text>
            <Text style={s.clauseBox}>{contrato.clausulasAdicionales}</Text>
          </>
        )}

        {/* ── Observaciones ── */}
        {contrato.observaciones && (
          <>
            <Text style={s.secTitle}>Observaciones Internas</Text>
            <Text style={[s.clauseBox, { color: C.mid }]}>{contrato.observaciones}</Text>
          </>
        )}

        {/* ── Conformidad ── */}
        <Text style={s.secTitle}>Conformidad</Text>
        <Text style={s.conformidad}>
          En prueba de conformidad con todo lo expuesto, las partes firman{" "}
          {garante ? "cuatro (4)" : "tres (3)"} ejemplares de un mismo tenor y a un solo efecto,
          en el lugar y fecha indicados al comienzo del presente instrumento.
        </Text>

        {/* ── Firmas — fila 1 ── */}
        <View style={s.sigRow}>
          <View style={[s.sigBlock, { width: garante ? "30%" : "43%" }]}>
            <View style={[s.sigLine, { width: "100%" }]} />
            <Text style={s.sigLabel}>LOCADOR / A</Text>
            <Text style={s.sigName}>{dueno.apellido}, {dueno.nombre}</Text>
            <Text style={s.sigDoc}>{docPersona(dueno)}</Text>
          </View>

          <View style={[s.sigBlock, { width: garante ? "30%" : "43%" }]}>
            <View style={[s.sigLine, { width: "100%" }]} />
            <Text style={s.sigLabel}>LOCATARIO / A</Text>
            <Text style={s.sigName}>{inquilino.apellido}, {inquilino.nombre}</Text>
            <Text style={s.sigDoc}>{docPersona(inquilino)}</Text>
          </View>

          {garante && (
            <View style={[s.sigBlock, { width: "30%" }]}>
              <View style={[s.sigLine, { width: "100%" }]} />
              <Text style={s.sigLabel}>FIADOR / A</Text>
              <Text style={s.sigName}>{garante.apellido}, {garante.nombre}</Text>
              <Text style={s.sigDoc}>{docPersona(garante)}</Text>
            </View>
          )}
        </View>

        {/* ── Firmas — fila 2 (martillero) ── */}
        <View style={s.sigRowCenter}>
          <View style={[s.sigBlock, { width: "50%" }]}>
            <View style={[s.sigLine, { width: "100%" }]} />
            <Text style={s.sigLabel}>MARTILLERO / CORREDOR INMOBILIARIO</Text>
            <Text style={s.sigName}>{contrato.martilleroNombreCompleto}</Text>
          </View>
        </View>

        {/* ── Pie de página ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            LOBO ALQUILERES  ·  {contrato.numeroContrato}
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>

      </Page>
    </Document>
  );
}
