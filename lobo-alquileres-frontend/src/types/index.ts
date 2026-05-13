// =============================================================================
// ENUMS — valores idénticos a los enums Java del backend
// =============================================================================

export type TipoInmueble =
  | "DEPARTAMENTO"
  | "CASA"
  | "LOCAL_COMERCIAL"
  | "OFICINA"
  | "COCHERA"
  | "TERRENO"
  | "GALPON"
  | "BODEGA";

export type EstadoInmueble =
  | "DISPONIBLE"
  | "ALQUILADO"
  | "RESERVADO"
  | "EN_REPARACION"
  | "INACTIVO";

export type Moneda = "ARS" | "USD";

export type TipoDocumentoIdentidad = "DNI" | "CUIL" | "CUIT" | "PASAPORTE" | "LE";

export type RolPersona = "DUENO" | "INQUILINO" | "GARANTE" | "MARTILLERO";

export type TipoAjuste = "IPC" | "ICL" | "FIJO_PORCENTAJE" | "NINGUNO";

export type PeriodicidadAjuste =
  | "MENSUAL"
  | "TRIMESTRAL"
  | "CUATRIMESTRAL"
  | "SEMESTRAL"
  | "ANUAL";

export type EstadoContrato = "ACTIVO" | "RESCINDIDO" | "VENCIDO" | "PENDIENTE";

export type EstadoCuota = "PENDIENTE" | "PAGADA" | "VENCIDA" | "PAGADA_PARCIAL";

export type MetodoPago = "EFECTIVO" | "TRANSFERENCIA" | "CHEQUE" | "DEPOSITO_BANCARIO";

// =============================================================================
// INMUEBLES
// =============================================================================

/** Mapeado de InmuebleResponse.java */
export interface InmuebleResponse {
  id: string;
  duenoId: string;
  duenoNombreCompleto: string;
  tipo: TipoInmueble;
  estado: EstadoInmueble;
  calle: string;
  numeroPuerta: string | null;
  piso: string | null;
  departamentoUnidad: string | null;
  ciudad: string;
  provincia: string;
  codigoPostal: string | null;
  direccionCompleta: string;  // campo calculado por el backend
  superficieCubierta: number | null;
  superficieTotal: number | null;
  ambientes: number | null;
  dormitorios: number | null;
  banos: number | null;
  antiguedadAnios: number | null;
  tieneCochera: boolean;
  tieneBaulera: boolean;
  tieneAmenities: boolean;
  valorTasacion: number | null;
  monedaTasacion: Moneda | null;
  nroPartida: string | null;
  porcentajeGasto: number | null;
  municipioNombre: string | null;
  municipioUrlConsulta: string | null;
  descripcion: string | null;
  observaciones: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Mapeado de InmuebleRequest.java */
export interface InmuebleRequest {
  duenoId: string;
  tipo: TipoInmueble;
  calle: string;
  numeroPuerta?: string;
  piso?: string;
  departamentoUnidad?: string;
  ciudad: string;
  provincia: string;
  codigoPostal?: string;
  superficieCubierta?: number;
  superficieTotal?: number;
  ambientes?: number;
  dormitorios?: number;
  banos?: number;
  antiguedadAnios?: number;
  tieneCochera: boolean;
  tieneBaulera: boolean;
  tieneAmenities: boolean;
  valorTasacion?: number;
  monedaTasacion?: Moneda;
  nroPartida?: string;
  porcentajeGasto?: number;
  descripcion?: string;
  observaciones?: string;
}

// =============================================================================
// PERSONAS
// =============================================================================

/** Mapeado de PersonaResponse.java */
export interface PersonaResponse {
  id: string;
  tipoDocumento: TipoDocumentoIdentidad;
  numeroDocumento: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;  // "apellido, nombre" — calculado por el backend
  email: string | null;
  telefonoPrincipal: string | null;
  telefonoAlternativo: string | null;
  calle: string | null;
  numeroPuerta: string | null;
  piso: string | null;
  departamentoUnidad: string | null;
  ciudad: string | null;
  provincia: string | null;
  codigoPostal: string | null;
  fechaNacimiento: string | null;  // LocalDate → "YYYY-MM-DD"
  observaciones: string | null;
  activo: boolean;
  roles: RolPersona[];
  createdAt: string;
  updatedAt: string;
}

/** Mapeado de PersonaRequest.java */
export interface PersonaRequest {
  tipoDocumento: TipoDocumentoIdentidad;
  numeroDocumento: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefonoPrincipal?: string;
  telefonoAlternativo?: string;
  calle?: string;
  numeroPuerta?: string;
  piso?: string;
  departamentoUnidad?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  fechaNacimiento?: string;
  observaciones?: string;
  roles: RolPersona[];
}

// =============================================================================
// CONTRATOS
// =============================================================================

/** Mapeado de ContratoRequest.java */
export interface ContratoRequest {
  inmuebleId: string;
  inquilinoId: string;
  garanteId?: string;
  martilleroId: string;           // requerido en backend
  fechaInicio: string;            // "YYYY-MM-DD"
  fechaFin: string;               // "YYYY-MM-DD"
  montoAlquilerInicial: number;   // nombre real del campo en el backend
  monedaContrato: Moneda;         // nombre real del campo en el backend
  tipoAjuste: TipoAjuste;
  periodicidadAjuste: PeriodicidadAjuste;
  porcentajeAjusteFijo?: number;  // solo cuando tipoAjuste === "FIJO_PORCENTAJE"
  comisionPorcentaje: number;     // requerido en backend (0–100)
  depositoMeses: number;          // cantidad de meses de depósito (1–6)
  diaVencimientoCuota: number;    // 1–28
  clausulasAdicionales?: string;
  observaciones?: string;
}

export interface ContratoResponse {
  id: string;
  numeroContrato: string;
  inmuebleId: string;
  inmuebleDireccion: string;        // nombre correcto (backend usa getDireccionCompleta)
  inquilinoId: string;
  inquilinoNombreCompleto: string;
  garanteId: string | null;         // corregido: era "garandeId" (typo)
  garanteNombreCompleto: string | null;
  martilleroId: string;
  martilleroNombreCompleto: string;
  fechaInicio: string;
  fechaFin: string;
  montoAlquilerInicial: number;     // nombre real del campo en el backend
  monedaContrato: Moneda;           // nombre real del campo en el backend
  tipoAjuste: TipoAjuste;
  periodicidadAjuste: PeriodicidadAjuste;
  porcentajeAjusteFijo: number | null;
  proximoAjusteFecha: string | null;
  comisionPorcentaje: number | null;
  depositoMeses: number;            // cantidad de meses de depósito
  depositoMonto: number | null;     // monto calculado por el backend
  depositoDevuelto: boolean;
  diaVencimientoCuota: number;
  estado: EstadoContrato;
  totalCuotas: number;
  cuotasPagadas: number;
  cuotasPendientes: number;
  cuotasVencidas: number;
  clausulasAdicionales: string | null;
  observaciones: string | null;
  cuotas: CuotaResponse[];          // incluidas en cada respuesta
  createdAt: string;
}

// =============================================================================
// CUOTAS
// =============================================================================

/** Mapeado de GastoCuotaRequest.java */
export interface GastoCuotaRequest {
  montoTasaMunicipal?: number;
  montoAgua?: number;
  montoExpensas?: number;
  montoLuz?: number;
  nroCuentaLuz?: string;
}

/** Mapeado de PagoRequest.java */
export interface PagoRequest {
  fechaPago: string;               // "YYYY-MM-DD"
  metodoPago: MetodoPago;
  montoPagado: number;
  numeroComprobante?: string;      // número de transferencia, cheque, recibo, etc.
  observaciones?: string;
}

/** Mapeado de CuotaResponse.java */
export interface CuotaResponse {
  id: string;
  contratoId: string;
  numeroContrato: string;
  monedaContrato: Moneda;          // moneda del contrato padre
  numeroCuota: number;
  fechaVencimiento: string;        // LocalDate → "YYYY-MM-DD"
  fechaPago: string | null;        // OffsetDateTime → ISO 8601
  montoBase: number;
  montoAjuste: number;
  montoTotal: number;
  montoPagado: number | null;
  estado: EstadoCuota;
  metodoPago: MetodoPago | null;
  numeroComprobante: string | null;
  indiceAplicadoTipo: string | null;
  indiceAplicadoPct: number | null;
  comisionMonto: number | null;
  comisionPagada: boolean;
  montoTasaMunicipal: number | null;
  montoAgua: number | null;
  montoExpensas: number | null;
  montoLuz: number | null;
  nroCuentaLuz: string | null;
  montoLiquidacion: number | null;
  observaciones: string | null;
}

// =============================================================================
// ETIQUETAS LEGIBLES PARA LA UI
// =============================================================================

export const TIPO_INMUEBLE_LABELS: Record<TipoInmueble, string> = {
  DEPARTAMENTO: "Departamento",
  CASA: "Casa",
  LOCAL_COMERCIAL: "Local comercial",
  OFICINA: "Oficina",
  COCHERA: "Cochera",
  TERRENO: "Terreno",
  GALPON: "Galpón",
  BODEGA: "Bodega",
};

export const ESTADO_INMUEBLE_LABELS: Record<EstadoInmueble, string> = {
  DISPONIBLE: "Disponible",
  ALQUILADO: "Alquilado",
  RESERVADO: "Reservado",
  EN_REPARACION: "En reparación",
  INACTIVO: "Inactivo",
};

export const ROL_PERSONA_LABELS: Record<RolPersona, string> = {
  DUENO: "Dueño",
  INQUILINO: "Inquilino",
  GARANTE: "Garante",
  MARTILLERO: "Martillero",
};

export const TIPO_DOC_LABELS: Record<TipoDocumentoIdentidad, string> = {
  DNI: "DNI",
  CUIL: "CUIL",
  CUIT: "CUIT",
  PASAPORTE: "Pasaporte",
  LE: "L.E.",
};

export const TIPO_AJUSTE_LABELS: Record<TipoAjuste, string> = {
  IPC: "IPC (Índice de Precios al Consumidor)",
  ICL: "ICL (Índice de Contratos de Locación)",
  FIJO_PORCENTAJE: "Porcentaje fijo",
  NINGUNO: "Sin ajuste",
};

export const PERIODICIDAD_LABELS: Record<PeriodicidadAjuste, string> = {
  MENSUAL: "Mensual",
  TRIMESTRAL: "Trimestral",
  CUATRIMESTRAL: "Cuatrimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
};

export const ESTADO_CONTRATO_LABELS: Record<EstadoContrato, string> = {
  ACTIVO:      "Activo",
  RESCINDIDO:  "Rescindido",
  VENCIDO:     "Vencido",
  PENDIENTE:   "Pendiente",
};

export const ESTADO_CUOTA_LABELS: Record<EstadoCuota, string> = {
  PENDIENTE:      "Pendiente",
  PAGADA:         "Pagada",
  VENCIDA:        "Vencida",
  PAGADA_PARCIAL: "Pago parcial",
};

export const METODO_PAGO_LABELS: Record<MetodoPago, string> = {
  EFECTIVO:          "Efectivo",
  TRANSFERENCIA:     "Transferencia",
  CHEQUE:            "Cheque",
  DEPOSITO_BANCARIO: "Depósito bancario",
};
