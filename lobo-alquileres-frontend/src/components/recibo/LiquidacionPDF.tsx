import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer";
import type { CuotaResponse, ContratoResponse, PersonaResponse, InmuebleResponse } from "@/types";
import type { TenantResponse } from "@/api/tenants";

const C = {
  brand:  "#1A4F59",
  dark:   "#1A1A1A",
  mid:    "#555555",
  light:  "#888888",
  border: "#CCCCCC",
  rowBg:  "#F5F5F5",
  green:  "#1A8A3A",
};

const s = StyleSheet.create({
  page: {
    paddingTop: 28, paddingBottom: 28, paddingHorizontal: 40,
    fontFamily: "Helvetica", fontSize: 9, color: C.dark,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    borderBottomWidth: 2, borderBottomColor: C.brand, borderBottomStyle: "solid",
    paddingBottom: 8, marginBottom: 12,
  },
  agenciaNombre: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.brand },
  agenciaInfo:   { fontSize: 7.5, color: C.mid, marginTop: 2, lineHeight: 1.5 },
  headerRight:   { alignItems: "flex-end" },
  docNumero:     { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.brand },
  docFecha:      { fontSize: 8, color: C.mid, marginTop: 2 },
  docMarca:      {
    fontSize: 7, color: "white", backgroundColor: C.brand,
    paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, borderRadius: 2,
  },
  titulo: {
    fontSize: 11, fontFamily: "Helvetica-Bold", textAlign: "center",
    letterSpacing: 1, color: C.dark, marginBottom: 12, textTransform: "uppercase",
  },
  partesRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
  parteBox: {
    flex: 1, borderWidth: 1, borderColor: C.border, borderStyle: "solid",
    padding: "5 7", borderRadius: 2,
  },
  parteLabel:  { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.mid, textTransform: "uppercase", marginBottom: 2 },
  parteNombre: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.dark },
  parteDoc:    { fontSize: 7.5, color: C.mid },
  parrafo: {
    fontSize: 9, lineHeight: 1.65, marginBottom: 10,
    borderWidth: 1, borderColor: C.border, borderStyle: "solid",
    padding: "6 8", backgroundColor: C.rowBg, borderRadius: 2,
  },
  bold:        { fontFamily: "Helvetica-Bold" },
  tipoCambio:  { fontSize: 7.5, color: C.mid, textAlign: "right", marginBottom: 8 },
  tabla:       { marginBottom: 10 },
  tablaHeader: {
    flexDirection: "row", backgroundColor: C.brand,
    paddingVertical: 4, paddingHorizontal: 6,
  },
  thText:   { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "white" },
  tablaRow: {
    flexDirection: "row",
    borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: "solid",
    paddingVertical: 4, paddingHorizontal: 6,
  },
  tablaRowAlt: { backgroundColor: C.rowBg },
  tablaRowNeg: { backgroundColor: "#FFF5F5" },
  tdText:  { fontSize: 8.5, color: C.dark },
  tdMid:   { fontSize: 8.5, color: C.mid },
  colDesc: { flex: 1 },
  colUSD:  { width: "18%", textAlign: "right" },
  colARS:  { width: "22%", textAlign: "right" },
  totalesBox: {
    borderWidth: 1, borderColor: C.border, borderStyle: "solid",
    borderRadius: 2, overflow: "hidden", marginBottom: 14,
  },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 4, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: "solid",
  },
  totalRowFinal: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 6, paddingHorizontal: 8, backgroundColor: C.brand,
  },
  totalLabel:  { fontSize: 8.5, color: C.mid },
  totalValor:  { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.dark },
  totalLabelF: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "white" },
  totalValorF: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "white" },
  firmaRow:   { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  firmaBlock: { alignItems: "center", width: "40%" },
  firmaLinea: {
    borderTopWidth: 1, borderTopColor: C.dark, borderTopStyle: "solid",
    width: "100%", marginBottom: 4,
  },
  firmaLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", textAlign: "center" },
  firmaSub:   { fontSize: 7, color: C.mid, textAlign: "center" },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtUSD(n: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function fmtARS(n: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n);
}

function formatPeriodo(fechaVencimiento: string): string {
  const [y, m] = fechaVencimiento.split("-").map(Number);
  return new Date(y, m - 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface LiquidacionProps {
  cuota:             CuotaResponse;
  contrato:          ContratoResponse;
  dueno:             PersonaResponse;
  inmueble:          InmuebleResponse;
  tenant:            TenantResponse | null;
  tipoCambioBlue:    number;
  comisionPorcentaje: number;
}

// ── PDF ───────────────────────────────────────────────────────────────────────

export function LiquidacionPDF({
  cuota, contrato, dueno, inmueble, tenant, tipoCambioBlue, comisionPorcentaje,
}: LiquidacionProps) {
  const esUSD    = (contrato.monedaContrato ?? "ARS") === "USD";
  const tc       = tipoCambioBlue;
  const periodo  = formatPeriodo(cuota.fechaVencimiento);
  const fecha    = cuota.fechaPago
    ? new Date(cuota.fechaPago).toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit", year:"numeric" })
    : new Date().toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit", year:"numeric" });

  const alquilerUSD = cuota.montoTotal ?? 0;
  const tasaUSD     = cuota.montoTasaMunicipal ?? 0;
  const aguaUSD     = cuota.montoAgua ?? 0;
  const expensasUSD = cuota.montoExpensas ?? 0;
  const luzUSD      = cuota.montoLuz ?? 0;

  function toARS(usd: number): number {
    return esUSD ? usd * tc : usd;
  }

  const alquilerARS   = toARS(alquilerUSD);
  const comisionARS   = alquilerARS * (comisionPorcentaje / 100);
  const netoAlquARS   = alquilerARS - comisionARS;
  const serviciosARS  = toARS(tasaUSD + aguaUSD + expensasUSD + luzUSD);
  const totalNetoARS  = netoAlquARS + serviciosARS;

  const agenciaNombre = tenant?.nombre?.toUpperCase() ?? "INMOBILIARIA";
  const docNum = `LIQ-${contrato.numeroContrato}-C${cuota.numeroCuota.toString().padStart(3, "0")}`;

  return (
    <Document title={docNum} author={tenant?.nombre ?? "Lobo Alquileres"}>
      <Page size="A4" style={s.page}>

        {/* Cabecera */}
        <View style={s.header}>
          <View>
            <Text style={s.agenciaNombre}>{agenciaNombre}</Text>
            {tenant?.domicilio && <Text style={s.agenciaInfo}>{tenant.domicilio}</Text>}
            {(tenant?.telefono || tenant?.website) && (
              <Text style={s.agenciaInfo}>{[tenant.telefono, tenant.website].filter(Boolean).join("  .  ")}</Text>
            )}
            {tenant?.cuit  && <Text style={s.agenciaInfo}>CUIT: {tenant.cuit}</Text>}
            {tenant?.email && <Text style={s.agenciaInfo}>{tenant.email}</Text>}
          </View>
          <View style={s.headerRight}>
            <Text style={s.docNumero}>{docNum}</Text>
            <Text style={s.docFecha}>{fecha}</Text>
            <Text style={s.docMarca}>LIQUIDACION</Text>
          </View>
        </View>

        {/* Título */}
        <Text style={s.titulo}>Liquidacion al Propietario</Text>

        {/* Partes */}
        <View style={s.partesRow}>
          <View style={s.parteBox}>
            <Text style={s.parteLabel}>Propietario</Text>
            <Text style={s.parteNombre}>{dueno.apellido}, {dueno.nombre}</Text>
            <Text style={s.parteDoc}>{dueno.tipoDocumento} {dueno.numeroDocumento}</Text>
            {dueno.cuil && <Text style={s.parteDoc}>CUIL: {dueno.cuil}</Text>}
            {dueno.telefonoPrincipal && <Text style={s.parteDoc}>Tel: {dueno.telefonoPrincipal}</Text>}
            {dueno.email && <Text style={s.parteDoc}>{dueno.email}</Text>}
          </View>
          <View style={s.parteBox}>
            <Text style={s.parteLabel}>Inmueble</Text>
            <Text style={s.parteNombre}>{inmueble.direccionCompleta.toUpperCase()}</Text>
            <Text style={s.parteDoc}>Periodo: {periodo.toUpperCase()}</Text>
          </View>
        </View>

        {/* Tipo de cambio */}
        {esUSD && (
          <Text style={s.tipoCambio}>
            Tipo de cambio dolar blue: {fmtARS(tc)} por USD
          </Text>
        )}

        {/* Párrafo */}
        <Text style={s.parrafo}>
          {"Rendimos cuentas a "}
          <Text style={s.bold}>{dueno.apellido}, {dueno.nombre}</Text>
          {", "}
          <Text style={s.bold}>{dueno.tipoDocumento} {dueno.numeroDocumento}</Text>
          {", sobre el cobro del alquiler correspondiente al periodo "}
          <Text style={s.bold}>{periodo.toUpperCase()}</Text>
          {" del inmueble ubicado en "}
          <Text style={s.bold}>{inmueble.direccionCompleta.toUpperCase()}</Text>
          {". Se detalla a continuacion la liquidacion con honorarios de inmobiliaria del "}
          <Text style={s.bold}>{comisionPorcentaje}%</Text>
          {"."}
        </Text>

        {/* Tabla */}
        <View style={s.tabla}>
          <View style={s.tablaHeader}>
            <Text style={[s.thText, s.colDesc]}>CONCEPTO</Text>
            {esUSD && <Text style={[s.thText, s.colUSD]}>USD</Text>}
            <Text style={[s.thText, s.colARS]}>PESOS</Text>
          </View>

          {/* Alquiler cobrado */}
          <View style={s.tablaRow}>
            <Text style={[s.tdText, s.colDesc]}>Alquiler cobrado</Text>
            {esUSD && <Text style={[s.tdMid, s.colUSD]}>{fmtUSD(alquilerUSD)}</Text>}
            <Text style={[s.tdText, s.colARS]}>{fmtARS(alquilerARS)}</Text>
          </View>

          {/* Comision */}
          <View style={[s.tablaRow, s.tablaRowNeg]}>
            <Text style={[s.tdText, s.colDesc]}>(-) Honorarios inmobiliaria ({comisionPorcentaje}%)</Text>
            {esUSD && <Text style={[s.tdMid, s.colUSD]}></Text>}
            <Text style={[{ fontSize: 8.5, color: "#CC0000" }, s.colARS]}>- {fmtARS(comisionARS)}</Text>
          </View>

          {/* Neto alquiler */}
          <View style={[s.tablaRow, s.tablaRowAlt]}>
            <Text style={[s.tdText, s.colDesc, { fontFamily: "Helvetica-Bold" }]}>Neto alquiler propietario</Text>
            {esUSD && <Text style={[s.tdMid, s.colUSD]}></Text>}
            <Text style={[s.tdText, s.colARS, { fontFamily: "Helvetica-Bold" }]}>{fmtARS(netoAlquARS)}</Text>
          </View>

          {/* Servicios */}
          {tasaUSD > 0 && (
            <View style={s.tablaRow}>
              <Text style={[s.tdText, s.colDesc]}>Tasa Municipal / ABL</Text>
              {esUSD && <Text style={[s.tdMid, s.colUSD]}>{fmtUSD(tasaUSD)}</Text>}
              <Text style={[s.tdText, s.colARS]}>{fmtARS(toARS(tasaUSD))}</Text>
            </View>
          )}
          {aguaUSD > 0 && (
            <View style={[s.tablaRow, s.tablaRowAlt]}>
              <Text style={[s.tdText, s.colDesc]}>Agua (AYSA)</Text>
              {esUSD && <Text style={[s.tdMid, s.colUSD]}>{fmtUSD(aguaUSD)}</Text>}
              <Text style={[s.tdText, s.colARS]}>{fmtARS(toARS(aguaUSD))}</Text>
            </View>
          )}
          {expensasUSD > 0 && (
            <View style={s.tablaRow}>
              <Text style={[s.tdText, s.colDesc]}>Expensas Comunes</Text>
              {esUSD && <Text style={[s.tdMid, s.colUSD]}>{fmtUSD(expensasUSD)}</Text>}
              <Text style={[s.tdText, s.colARS]}>{fmtARS(toARS(expensasUSD))}</Text>
            </View>
          )}
          {luzUSD > 0 && (
            <View style={[s.tablaRow, s.tablaRowAlt]}>
              <Text style={[s.tdText, s.colDesc]}>
                {cuota.nroCuentaLuz ? `Luz / EDENOR (cta. ${cuota.nroCuentaLuz})` : "Luz / EDENOR"}
              </Text>
              {esUSD && <Text style={[s.tdMid, s.colUSD]}>{fmtUSD(luzUSD)}</Text>}
              <Text style={[s.tdText, s.colARS]}>{fmtARS(toARS(luzUSD))}</Text>
            </View>
          )}
        </View>

        {/* Totales */}
        <View style={s.totalesBox}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Neto alquiler</Text>
            <Text style={s.totalValor}>{fmtARS(netoAlquARS)}</Text>
          </View>
          {serviciosARS > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Servicios (sin descuento)</Text>
              <Text style={s.totalValor}>{fmtARS(serviciosARS)}</Text>
            </View>
          )}
          <View style={s.totalRowFinal}>
            <Text style={s.totalLabelF}>TOTAL A TRANSFERIR AL PROPIETARIO</Text>
            <Text style={s.totalValorF}>{fmtARS(totalNetoARS)}</Text>
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

      </Page>
    </Document>
  );
}
