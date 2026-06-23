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
  half: { flex: 1, paddingVertical: 12 },
  divider: {
    borderTopWidth: 1, borderTopColor: C.divider, borderTopStyle: "dashed", marginVertical: 4,
  },
  dividerLabel: {
    fontSize: 7, color: C.light, textAlign: "center", marginTop: -6,
    backgroundColor: "white", alignSelf: "center", paddingHorizontal: 8,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    borderBottomWidth: 2, borderBottomColor: C.brand, borderBottomStyle: "solid",
    paddingBottom: 8, marginBottom: 10,
  },
  headerLeft: { flex: 1 },
  agenciaNombre: {
    fontSize: 14, fontFamily: "Helvetica-Bold", color: C.brand, letterSpacing: 0.5,
  },
  agenciaInfo: { fontSize: 7.5, color: C.mid, marginTop: 2, lineHeight: 1.5 },
  headerRight: { alignItems: "flex-end" },
  reciboNumero: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.brand },
  reciboFecha: { fontSize: 8, color: C.mid, marginTop: 2 },
  reicboMarca: {
    fontSize: 7, color: "white", backgroundColor: C.brand,
    paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, borderRadius: 2,
  },
  titulo: {
    fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "center",
    letterSpacing: 1.2, color: C.dark, marginBottom: 10, textTransform: "uppercase",
  },
  partesRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  parteBox: {
    flex: 1, borderWidth: 1, borderColor: C.border, borderStyle: "solid",
    padding: "5 7", borderRadius: 2,
  },
  parteLabel: {
    fontSize: 7, fontFamily: "Helvetica-Bold", color: C.mid,
    textTransform: "uppercase", marginBottom: 2,
  },
  parteNombre:  { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.dark },
  parteDoc:     { fontSize: 7.5, color: C.mid },
  parrafo: {
    fontSize: 9, lineHeight: 1.65, marginBottom: 8,
    borderWidth: 1, borderColor: C.border, borderStyle: "solid",
    padding: "6 8", backgroundColor: C.rowBg, borderRadius: 2,
  },
  tipoCambioBox: {
    fontSize: 7.5, color: C.mid, textAlign: "right", marginBottom: 8,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  tabla: { marginBottom: 8 },
  tablaHeader: {
    flexDirection: "row", backgroundColor: C.brand, paddingVertical: 4, paddingHorizontal: 6,
  },
  tablaHeaderText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "white" },
  tablaRow: {
    flexDirection: "row",
    borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: "solid",
    paddingVertical: 4, paddingHorizontal: 6,
  },
  tablaRowAlt:    { backgroundColor: C.rowBg },
  tablaText:      { fontSize: 8.5, color: C.dark },
  tablaTextMid:   { fontSize: 8.5, color: C.mid },
  colVence:       { width: "13%" },
  colDesc:        { flex: 1 },
  colUSD:         { width: "16%", textAlign: "right" },
  colPesos:       { width: "18%", textAlign: "right" },
  totalesBox: {
    borderWidth: 1, borderColor: C.border, borderStyle: "solid",
    borderRadius: 2, overflow: "hidden", marginBottom: 10,
  },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 4, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: "solid",
  },
  totalRowDestacado: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 5, paddingHorizontal: 8, backgroundColor: C.brand,
  },
  totalLabel:  { fontSize: 8.5, color: C.mid },
  totalValor:  { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.dark },
  totalLabelD: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "white" },
  totalValorD: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "white" },
  firmaRow:    { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  firmaBlock:  { alignItems: "center", width: "40%" },
  firmaLinea:  {
    borderTopWidth: 1, borderTopColor: C.dark, borderTopStyle: "solid",
    width: "100%", marginBottom: 4,
  },
  firmaLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", textAlign: "center" },
  firmaSub:   { fontSize: 7, color: C.mid, textAlign: "center" },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtUSD(n: number | null | undefined): string {
  if (n == null) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "USD", minimumFractionDigits: 2,
  }).format(n);
}

function fmtARS(n: number | null | undefined): string {
  if (n == null) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", minimumFractionDigits: 2,
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

// ── Tabla ─────────────────────────────────────────────────────────────────────

interface Fila {
  vence: string;
  descripcion: string;
  usd: string;
  pesos: string;
}

function TablaFilas({ filas, esUSD }: { filas: Fila[]; esUSD: boolean }) {
  return (
    <View style={s.tabla}>
      <View style={s.tablaHeader}>
        <Text style={[s.tablaHeaderText, s.colVence]}>VENCE</Text>
        <Text style={[s.tablaHeaderText, s.colDesc]}>DESCRIPCION</Text>
        {esUSD && <Text style={[s.tablaHeaderText, s.colUSD]}>USD</Text>}
        <Text style={[s.tablaHeaderText, s.colPesos]}>{esUSD ? "PESOS" : "MONTO"}</Text>
      </View>
      {filas.map((f, i) => (
        <View key={i} style={[s.tablaRow, i % 2 === 1 ? s.tablaRowAlt : {}]}>
          <Text style={[s.tablaTextMid, s.colVence]}>{f.vence}</Text>
          <Text style={[s.tablaText, s.colDesc]}>{f.descripcion}</Text>
          {esUSD && <Text style={[s.tablaTextMid, s.colUSD]}>{f.usd}</Text>}
          <Text style={[s.tablaText, s.colPesos]}>{f.pesos}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Bloque de recibo (original o copia) ───────────────────────────────────────

function BloqueRecibo({
  cuota, contrato, inquilino, dueno, inmueble, tenant, tipoCambioBlue, esCopia,
}: ReciboProps & { esCopia: boolean }) {
  const esUSD    = (contrato.monedaContrato ?? "ARS") === "USD";
  const periodo  = formatPeriodo(cuota.fechaVencimiento);
  const fechaPago = cuota.fechaPago
    ? new Date(cuota.fechaPago).toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit", year:"numeric" })
    : new Date().toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit", year:"numeric" });

  const alquiler   = cuota.montoTotal ?? 0;
  const tasa       = cuota.montoTasaMunicipal ?? 0;
  const agua       = cuota.montoAgua ?? 0;
  const expensas   = cuota.montoExpensas ?? 0;
  const luz        = cuota.montoLuz ?? 0;
  const liquidacion  = cuota.montoLiquidacion ?? alquiler;
  const montoPagado  = cuota.montoPagado ?? liquidacion;
  const saldo        = liquidacion - montoPagado;

  const tc = tipoCambioBlue ?? 1;

  function toPesos(usd: number): number {
    return esUSD ? usd * tc : usd;
  }

  const filas: Fila[] = [
    {
      vence:       fmtFecha(cuota.fechaVencimiento),
      descripcion: `ALQUILER ${periodo.toUpperCase()} - ${inmueble.direccionCompleta.toUpperCase()}`,
      usd:   esUSD ? fmtUSD(alquiler) : "-",
      pesos: fmtARS(toPesos(alquiler)),
    },
  ];

  if (tasa > 0) filas.push({ vence: "", descripcion: "TASA MUNICIPAL / ABL",
    usd: esUSD ? fmtUSD(tasa) : "-", pesos: fmtARS(toPesos(tasa)) });
  if (agua > 0) filas.push({ vence: "", descripcion: "AGUA (AYSA)",
    usd: esUSD ? fmtUSD(agua) : "-", pesos: fmtARS(toPesos(agua)) });
  if (expensas > 0) filas.push({ vence: "", descripcion: "EXPENSAS COMUNES",
    usd: esUSD ? fmtUSD(expensas) : "-", pesos: fmtARS(toPesos(expensas)) });
  if (luz > 0) filas.push({
    vence: "", descripcion: cuota.nroCuentaLuz ? `LUZ / EDENOR (cta. ${cuota.nroCuentaLuz})` : "LUZ / EDENOR",
    usd: esUSD ? fmtUSD(luz) : "-", pesos: fmtARS(toPesos(luz)),
  });

  const palabras      = montoEnPalabras(montoPagado);
  const monedaTexto   = esUSD ? "DOLARES" : "PESOS";
  const agenciaNombre = tenant?.nombre?.toUpperCase() ?? "INMOBILIARIA";
  const montoPagadoPesos = toPesos(montoPagado);

  return (
    <View style={s.half}>

      {/* Cabecera */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.agenciaNombre}>{agenciaNombre}</Text>
          {tenant?.domicilio && <Text style={s.agenciaInfo}>{tenant.domicilio}</Text>}
          {(tenant?.telefono || tenant?.website) && (
            <Text style={s.agenciaInfo}>{[tenant.telefono, tenant.website].filter(Boolean).join("  .  ")}</Text>
          )}
          {tenant?.cuit   && <Text style={s.agenciaInfo}>CUIT: {tenant.cuit}</Text>}
          {tenant?.email  && <Text style={s.agenciaInfo}>{tenant.email}</Text>}
        </View>
        <View style={s.headerRight}>
          <Text style={s.reciboNumero}>N. {contrato.numeroContrato}-{cuota.numeroCuota.toString().padStart(3, "0")}</Text>
          <Text style={s.reciboFecha}>{fechaPago}</Text>
          <Text style={s.reicboMarca}>{esCopia ? "ES COPIA" : "ORIGINAL"}</Text>
        </View>
      </View>

      {/* Título */}
      <Text style={s.titulo}>Recibo por Cuenta de Terceros</Text>

      {/* Propietario / Inquilino */}
      <View style={s.partesRow}>
        <View style={s.parteBox}>
          <Text style={s.parteLabel}>Propietario</Text>
          <Text style={s.parteNombre}>{dueno.apellido}, {dueno.nombre}</Text>
          <Text style={s.parteDoc}>{dueno.tipoDocumento} {dueno.numeroDocumento}</Text>
          {dueno.cuil && <Text style={s.parteDoc}>CUIL: {dueno.cuil}</Text>}
        </View>
        <View style={s.parteBox}>
          <Text style={s.parteLabel}>Inquilino</Text>
          <Text style={s.parteNombre}>{inquilino.apellido}, {inquilino.nombre}</Text>
          <Text style={s.parteDoc}>{inquilino.tipoDocumento} {inquilino.numeroDocumento}</Text>
          {inquilino.cuil && <Text style={s.parteDoc}>CUIL: {inquilino.cuil}</Text>}
          {inquilino.telefonoPrincipal && <Text style={s.parteDoc}>Tel: {inquilino.telefonoPrincipal}</Text>}
          {inquilino.email && <Text style={s.parteDoc}>{inquilino.email}</Text>}
        </View>
      </View>

      {/* Tipo de cambio */}
      {esUSD && tipoCambioBlue && (
        <Text style={s.tipoCambioBox}>
          Tipo de cambio dolar blue: {fmtARS(tipoCambioBlue)} por USD
        </Text>
      )}

      {/* Párrafo en palabras */}
      <Text style={s.parrafo}>
        {"Recibimos de "}
        <Text style={s.bold}>{inquilino.apellido}, {inquilino.nombre}</Text>
        {", "}
        <Text style={s.bold}>{inquilino.tipoDocumento} {inquilino.numeroDocumento}</Text>
        {inquilino.cuil ? <Text>{", CUIL "}<Text style={s.bold}>{inquilino.cuil}</Text></Text> : ""}
        {inquilino.telefonoPrincipal ? <Text>{", Tel. "}<Text style={s.bold}>{inquilino.telefonoPrincipal}</Text></Text> : ""}
        {inquilino.email ? <Text>{", "}<Text style={s.bold}>{inquilino.email}</Text></Text> : ""}
        {", la suma de "}
        <Text style={s.bold}>{monedaTexto} {palabras}</Text>
        {" ("}
        <Text style={s.bold}>{esUSD ? fmtUSD(montoPagado) : fmtARS(montoPagado)}</Text>
        {")"}
        {esUSD && tipoCambioBlue
          ? <Text>{" equivalentes a "}<Text style={s.bold}>{fmtARS(montoPagadoPesos)}</Text>{" al tipo de cambio blue del dia"}</Text>
          : ""}
        {", en concepto de "}
        <Text style={s.bold}>ALQUILER DEL PERIODO {periodo.toUpperCase()}</Text>
        {" del inmueble ubicado en "}
        <Text style={s.bold}>{inmueble.direccionCompleta.toUpperCase()}</Text>
        {", en caracter de pago por cuenta y orden del propietario "}
        <Text style={s.bold}>{dueno.apellido}, {dueno.nombre}</Text>
        {"."}
      </Text>

      {/* Tabla */}
      <TablaFilas filas={filas} esUSD={esUSD} />

      {/* Totales */}
      <View style={s.totalesBox}>
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Monto a Abonar</Text>
          <Text style={s.totalValor}>
            {esUSD ? `${fmtUSD(liquidacion)}  =  ${fmtARS(toPesos(liquidacion))}` : fmtARS(liquidacion)}
          </Text>
        </View>
        <View style={s.totalRowDestacado}>
          <Text style={s.totalLabelD}>TOTAL ABONADO</Text>
          <Text style={s.totalValorD}>
            {esUSD ? `${fmtUSD(montoPagado)}  =  ${fmtARS(montoPagadoPesos)}` : fmtARS(montoPagado)}
          </Text>
        </View>
        <View style={[s.totalRow, { borderBottomWidth: 0 }]}>
          <Text style={s.totalLabel}>Saldo</Text>
          <Text style={[s.totalValor, { color: saldo > 0.01 ? "#CC0000" : "#1A8A3A" }]}>
            {esUSD ? `${fmtUSD(saldo)}  =  ${fmtARS(toPesos(saldo))}` : fmtARS(saldo)}
          </Text>
        </View>
      </View>

      {/* Firma */}
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

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ReciboProps {
  cuota:           CuotaResponse;
  contrato:        ContratoResponse;
  inquilino:       PersonaResponse;
  dueno:           PersonaResponse;
  inmueble:        InmuebleResponse;
  tenant:          TenantResponse | null;
  tipoCambioBlue?: number;
}

// ── Documento PDF ─────────────────────────────────────────────────────────────

export function ReciboPDF(props: ReciboProps) {
  const { contrato, cuota } = props;
  const titulo = `Recibo-${contrato.numeroContrato}-C${cuota.numeroCuota}`;

  return (
    <Document title={titulo} author={props.tenant?.nombre ?? "Lobo Alquileres"}>
      <Page size="A4" style={s.page}>
        <BloqueRecibo {...props} esCopia={false} />
        <View style={s.divider} />
        <Text style={s.dividerLabel}>- - - - CORTAR AQUI - - - -</Text>
        <BloqueRecibo {...props} esCopia={true} />
      </Page>
    </Document>
  );
}
