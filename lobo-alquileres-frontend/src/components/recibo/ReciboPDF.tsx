import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer";
import type { CuotaResponse, ContratoResponse, PersonaResponse, InmuebleResponse } from "@/types";
import type { TenantResponse } from "@/api/tenants";
import { montoEnPalabras } from "@/lib/numerosEspanol";

// ── Paleta ────────────────────────────────────────────────────────────────────

const C = {
  brand:   "#1A4F59",
  dark:    "#1A1A1A",
  mid:     "#555555",
  light:   "#888888",
  border:  "#CCCCCC",
  rowBg:   "#F5F5F5",
  divider: "#AAAAAA",
};

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingTop: 24, paddingBottom: 24, paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.dark,
  },

  // Mitad de página (original o copia)
  half: {
    flex: 1,
    paddingVertical: 12,
  },

  // Separador punteado entre original y copia
  divider: {
    borderTopWidth: 1,
    borderTopColor: C.divider,
    borderTopStyle: "dashed",
    marginVertical: 4,
  },
  dividerLabel: {
    fontSize: 7,
    color: C.light,
    textAlign: "center",
    marginTop: -6,
    backgroundColor: "white",
    alignSelf: "center",
    paddingHorizontal: 8,
  },

  // Cabecera de la inmobiliaria
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: C.brand,
    borderBottomStyle: "solid",
    paddingBottom: 8,
    marginBottom: 10,
  },
  headerLeft: { flex: 1 },
  agenciaNombre: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
    letterSpacing: 0.5,
  },
  agenciaInfo: { fontSize: 7.5, color: C.mid, marginTop: 2, lineHeight: 1.5 },
  headerRight: { alignItems: "flex-end" },
  reciboNumero: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.brand },
  reciboFecha: { fontSize: 8, color: C.mid, marginTop: 2 },
  reicboMarca: {
    fontSize: 7,
    color: "white",
    backgroundColor: C.brand,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    borderRadius: 2,
  },

  // Título central
  titulo: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    letterSpacing: 1.2,
    color: C.dark,
    marginBottom: 10,
    textTransform: "uppercase",
  },

  // Fila propietario / inquilino
  partesRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  parteBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
    padding: "5 7",
    borderRadius: 2,
  },
  parteLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.mid,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  parteNombre: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.dark },
  parteDoc:    { fontSize: 7.5, color: C.mid },

  // Párrafo del monto en palabras
  parrafo: {
    fontSize: 9,
    lineHeight: 1.65,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
    padding: "6 8",
    backgroundColor: C.rowBg,
    borderRadius: 2,
  },
  bold: { fontFamily: "Helvetica-Bold" },

  // Tabla de desglose
  tabla: {
    marginBottom: 8,
  },
  tablaHeader: {
    flexDirection: "row",
    backgroundColor: C.brand,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tablaHeaderText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "white",
  },
  tablaRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tablaRowAlt: {
    backgroundColor: C.rowBg,
  },
  tablaText: { fontSize: 8.5, color: C.dark },
  tablaTextMid: { fontSize: 8.5, color: C.mid },

  // Columnas de la tabla
  colVence:     { width: "14%" },
  colDesc:      { flex: 1 },
  colMonto:     { width: "18%", textAlign: "right" },
  colPunit:     { width: "18%", textAlign: "right" },
  colTotal:     { width: "18%", textAlign: "right" },

  // Totales
  totalesBox: {
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
  },
  totalRowDestacado: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: C.brand,
  },
  totalLabel: { fontSize: 8.5, color: C.mid },
  totalValor: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.dark },
  totalLabelD: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "white" },
  totalValorD: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "white" },

  // Firma
  firmaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  firmaBlock: { alignItems: "center", width: "40%" },
  firmaLinea: {
    borderTopWidth: 1,
    borderTopColor: C.dark,
    borderTopStyle: "solid",
    width: "100%",
    marginBottom: 4,
  },
  firmaLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", textAlign: "center" },
  firmaSub:   { fontSize: 7, color: C.mid, textAlign: "center" },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMonto(n: number | null | undefined, moneda: string): string {
  if (n == null) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda === "USD" ? "USD" : "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatPeriodo(fechaVencimiento: string): string {
  const [y, m] = fechaVencimiento.split("-").map(Number);
  return new Date(y, m - 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

interface Fila {
  vence: string;
  descripcion: string;
  monto: string;
  punit: string;
  total: string;
}

function TablaFilas({ filas }: { filas: Fila[] }) {
  return (
    <View style={s.tabla}>
      {/* Header */}
      <View style={s.tablaHeader}>
        <Text style={[s.tablaHeaderText, s.colVence]}>VENCE</Text>
        <Text style={[s.tablaHeaderText, s.colDesc]}>DESCRIPCIÓN</Text>
        <Text style={[s.tablaHeaderText, s.colMonto]}>MONTO</Text>
        <Text style={[s.tablaHeaderText, s.colPunit]}>P. UNIT.</Text>
        <Text style={[s.tablaHeaderText, s.colTotal]}>TOTAL</Text>
      </View>
      {/* Filas */}
      {filas.map((f, i) => (
        <View
          key={i}
          style={[s.tablaRow, i % 2 === 1 ? s.tablaRowAlt : {}]}
        >
          <Text style={[s.tablaTextMid, s.colVence]}>{f.vence}</Text>
          <Text style={[s.tablaText, s.colDesc]}>{f.descripcion}</Text>
          <Text style={[s.tablaTextMid, s.colMonto]}>{f.monto}</Text>
          <Text style={[s.tablaTextMid, s.colPunit]}>{f.punit}</Text>
          <Text style={[s.tablaText, s.colTotal]}>{f.total}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Un bloque de recibo (original o copia) ────────────────────────────────────

function BloqueRecibo({
  cuota,
  contrato,
  inquilino,
  dueno,
  inmueble,
  tenant,
  esCopia,
}: ReciboProps & { esCopia: boolean }) {
  const moneda   = contrato.monedaContrato ?? "ARS";
  const periodo  = formatPeriodo(cuota.fechaVencimiento);
  const fechaPago = cuota.fechaPago
    ? new Date(cuota.fechaPago).toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit", year:"numeric" })
    : new Date().toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit", year:"numeric" });

  // Valores del desglose
  const alquiler  = cuota.montoTotal ?? 0;
  const tasa      = cuota.montoTasaMunicipal ?? 0;
  const agua      = cuota.montoAgua ?? 0;
  const expensas  = cuota.montoExpensas ?? 0;
  const luz       = cuota.montoLuz ?? 0;
  const liquidacion = cuota.montoLiquidacion ?? alquiler;
  const montoPagado = cuota.montoPagado ?? liquidacion;
  const saldo       = liquidacion - montoPagado;

  // Cantidad de meses del período (siempre 1 para cuotas mensuales)
  const meses = 1;

  // Filas de la tabla
  const filas: Fila[] = [
    {
      vence:       fmtFecha(cuota.fechaVencimiento),
      descripcion: `ALQUILER ${periodo.toUpperCase()} — ${inmueble.direccionCompleta.toUpperCase()}`,
      monto:       String(meses),
      punit:       fmtMonto(alquiler, moneda),
      total:       fmtMonto(alquiler, moneda),
    },
  ];

  if (tasa > 0) {
    filas.push({
      vence:       "",
      descripcion: "TASA MUNICIPAL / ABL",
      monto:       String(meses),
      punit:       fmtMonto(tasa, moneda),
      total:       fmtMonto(tasa, moneda),
    });
  }
  if (agua > 0) {
    filas.push({
      vence:       "",
      descripcion: "AGUA (AYSA)",
      monto:       String(meses),
      punit:       fmtMonto(agua, moneda),
      total:       fmtMonto(agua, moneda),
    });
  }
  if (expensas > 0) {
    filas.push({
      vence:       "",
      descripcion: "EXPENSAS COMUNES",
      monto:       String(meses),
      punit:       fmtMonto(expensas, moneda),
      total:       fmtMonto(expensas, moneda),
    });
  }
  if (luz > 0) {
    filas.push({
      vence:       "",
      descripcion: cuota.nroCuentaLuz
        ? `LUZ / EDENOR  (cta. ${cuota.nroCuentaLuz})`
        : "LUZ / EDENOR",
      monto:       String(meses),
      punit:       fmtMonto(luz, moneda),
      total:       fmtMonto(luz, moneda),
    });
  }

  // Monto en palabras
  const palabras = montoEnPalabras(montoPagado);
  const monedaTexto = moneda === "USD" ? "DÓLARES" : "PESOS";

  // Nombre de la inmobiliaria para el encabezado
  const agenciaNombre = tenant?.nombre?.toUpperCase() ?? "INMOBILIARIA";

  return (
    <View style={s.half}>

      {/* ── Cabecera ─────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.agenciaNombre}>{agenciaNombre}</Text>
          {tenant?.domicilio && (
            <Text style={s.agenciaInfo}>{tenant.domicilio}</Text>
          )}
          {(tenant?.telefono || tenant?.website) && (
            <Text style={s.agenciaInfo}>
              {[tenant.telefono, tenant.website].filter(Boolean).join("  ·  ")}
            </Text>
          )}
          {tenant?.cuit && (
            <Text style={s.agenciaInfo}>CUIT: {tenant.cuit}</Text>
          )}
          {tenant?.email && (
            <Text style={s.agenciaInfo}>{tenant.email}</Text>
          )}
        </View>
        <View style={s.headerRight}>
          <Text style={s.reciboNumero}>N.° {contrato.numeroContrato}-{cuota.numeroCuota.toString().padStart(3, "0")}</Text>
          <Text style={s.reciboFecha}>{fechaPago}</Text>
          <Text style={s.reicboMarca}>{esCopia ? "ES COPIA" : "ORIGINAL"}</Text>
        </View>
      </View>

      {/* ── Título ───────────────────────────────────────────────── */}
      <Text style={s.titulo}>Recibo por Cuenta de Terceros</Text>

      {/* ── Propietario / Inquilino ───────────────────────────────── */}
      <View style={s.partesRow}>
        <View style={s.parteBox}>
          <Text style={s.parteLabel}>Propietario</Text>
          <Text style={s.parteNombre}>{dueno.apellido}, {dueno.nombre}</Text>
          <Text style={s.parteDoc}>{dueno.tipoDocumento} {dueno.numeroDocumento}</Text>
        </View>
        <View style={s.parteBox}>
          <Text style={s.parteLabel}>Inquilino</Text>
          <Text style={s.parteNombre}>{inquilino.apellido}, {inquilino.nombre}</Text>
          <Text style={s.parteDoc}>{inquilino.tipoDocumento} {inquilino.numeroDocumento}</Text>
        </View>
      </View>

      {/* ── Párrafo en palabras ───────────────────────────────────── */}
      <Text style={s.parrafo}>
        {"Recibimos de "}
        <Text style={s.bold}>{inquilino.apellido}, {inquilino.nombre}</Text>
        {", "}
        <Text style={s.bold}>{inquilino.tipoDocumento} {inquilino.numeroDocumento}</Text>
        {", la suma de "}
        <Text style={s.bold}>{monedaTexto} {palabras}</Text>
        {" ("}
        <Text style={s.bold}>{fmtMonto(montoPagado, moneda)}</Text>
        {"), en concepto de "}
        <Text style={s.bold}>ALQUILER DEL PERÍODO {periodo.toUpperCase()}</Text>
        {" del inmueble ubicado en "}
        <Text style={s.bold}>{inmueble.direccionCompleta.toUpperCase()}</Text>
        {", en carácter de pago por cuenta y orden del propietario "}
        <Text style={s.bold}>{dueno.apellido}, {dueno.nombre}</Text>
        {"."}
      </Text>

      {/* ── Tabla de desglose ─────────────────────────────────────── */}
      <TablaFilas filas={filas} />

      {/* ── Totales ───────────────────────────────────────────────── */}
      <View style={s.totalesBox}>
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Monto a Abonar</Text>
          <Text style={s.totalValor}>{fmtMonto(liquidacion, moneda)}</Text>
        </View>
        <View style={s.totalRowDestacado}>
          <Text style={s.totalLabelD}>TOTAL ABONADO</Text>
          <Text style={s.totalValorD}>{fmtMonto(montoPagado, moneda)}</Text>
        </View>
        <View style={[s.totalRow, { borderBottomWidth: 0 }]}>
          <Text style={s.totalLabel}>Saldo</Text>
          <Text style={[s.totalValor, { color: saldo > 0.01 ? "#CC0000" : "#1A8A3A" }]}>
            {fmtMonto(saldo, moneda)}
          </Text>
        </View>
      </View>

      {/* ── Firma ────────────────────────────────────────────────── */}
      <View style={s.firmaRow}>
        <View style={s.firmaBlock}>
          <View style={s.firmaLinea} />
          <Text style={s.firmaLabel}>{agenciaNombre}</Text>
          {tenant?.cuit && <Text style={s.firmaSub}>CUIT {tenant.cuit}</Text>}
        </View>
      </View>

    </View>
  );
}

// ── Props del documento completo ──────────────────────────────────────────────

export interface ReciboProps {
  cuota:     CuotaResponse;
  contrato:  ContratoResponse;
  inquilino: PersonaResponse;
  dueno:     PersonaResponse;
  inmueble:  InmuebleResponse;
  tenant:    TenantResponse | null;
}

// ── Documento PDF (2 copias en A4) ────────────────────────────────────────────

export function ReciboPDF(props: ReciboProps) {
  const { contrato, cuota } = props;
  const titulo = `Recibo-${contrato.numeroContrato}-C${cuota.numeroCuota}`;

  return (
    <Document title={titulo} author={props.tenant?.nombre ?? "Lobo Alquileres"}>
      <Page size="A4" style={s.page}>

        {/* ORIGINAL (mitad superior) */}
        <BloqueRecibo {...props} esCopia={false} />

        {/* Divisor punteado */}
        <View style={s.divider} />
        <Text style={s.dividerLabel}>✂  CORTAR AQUÍ  ✂</Text>

        {/* COPIA (mitad inferior) */}
        <BloqueRecibo {...props} esCopia={true} />

      </Page>
    </Document>
  );
}
