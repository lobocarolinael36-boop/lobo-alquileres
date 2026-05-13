/**
 * Convierte un número (entero) a su representación en palabras en español.
 * Soporta hasta 999.999.999 (suficiente para montos de alquiler en ARS).
 * Ej: 648000 → "SEISCIENTOS CUARENTA Y OCHO MIL"
 */

const UNIDADES = [
  "", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
  "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE",
  "DIECIOCHO", "DIECINUEVE",
];

const DECENAS = [
  "", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA",
  "SESENTA", "SETENTA", "OCHENTA", "NOVENTA",
];

const CENTENAS = [
  "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
  "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
];

function tresDigitos(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "CIEN";

  const c = Math.floor(n / 100);
  const resto = n % 100;

  const parteC = CENTENAS[c] ?? "";

  let parteResto = "";
  if (resto === 0) {
    parteResto = "";
  } else if (resto < 20) {
    parteResto = UNIDADES[resto];
  } else {
    const d = Math.floor(resto / 10);
    const u = resto % 10;
    parteResto = u === 0 ? DECENAS[d] : `${DECENAS[d]} Y ${UNIDADES[u]}`;
  }

  if (parteC && parteResto) return `${parteC} ${parteResto}`;
  return parteC || parteResto;
}

export function numeroEnPalabras(n: number): string {
  const entero = Math.floor(Math.abs(n));

  if (entero === 0) return "CERO";
  if (entero === 1) return "UN";        // "UN PESO" en contexto de moneda

  const millones  = Math.floor(entero / 1_000_000);
  const miles     = Math.floor((entero % 1_000_000) / 1_000);
  const centenas  = entero % 1_000;

  const partes: string[] = [];

  if (millones === 1) {
    partes.push("UN MILLÓN");
  } else if (millones > 1) {
    partes.push(`${tresDigitos(millones)} MILLONES`);
  }

  if (miles === 1) {
    partes.push("MIL");
  } else if (miles > 1) {
    partes.push(`${tresDigitos(miles)} MIL`);
  }

  if (centenas > 0) {
    partes.push(tresDigitos(centenas));
  }

  return partes.join(" ");
}

/**
 * Formatea un monto como se escribe en un recibo argentino.
 * Ej: 648000.50 → "SEISCIENTOS CUARENTA Y OCHO MIL CON 50/100"
 */
export function montoEnPalabras(monto: number): string {
  const entero  = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);

  const palabras = numeroEnPalabras(entero);

  if (centavos === 0) {
    return palabras;
  }
  return `${palabras} CON ${String(centavos).padStart(2, "0")}/100`;
}
