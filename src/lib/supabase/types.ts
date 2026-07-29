// Tipos mínimos escritos a mano para el módulo de Planes.
// Cuando el schema crezca, reemplazar por los tipos generados con:
//   npx supabase gen types typescript --local > src/lib/supabase/types.ts

export type Disciplina = {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
};

export type Plan = {
  id: string;
  disciplina_id: string;
  nombre: string;
  dias_por_semana: number | null;
  acceso_libre: boolean;
  descripcion: string | null;
  activo: boolean;
  creado_en: string;
};

export type PlanPrecioHistorico = {
  id: string;
  plan_id: string;
  precio: number;
  vigente_desde: string;
  vigente_hasta: string | null;
};

// Vista compuesta que usa la UI: plan + disciplina + precio vigente
export type PlanConPrecio = Plan & {
  disciplina: Pick<Disciplina, "id" | "nombre">;
  precio_vigente: number | null;
  alumnos_count: number;
};

export type EstadoPersona = "activo" | "inactivo" | "de_baja" | "suspendido";

export type Alumno = {
  id: string;
  dni: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  celular: string | null;
  fecha_nacimiento: string | null;
  turno_id: string | null;
  altura: number | null;
  peso: number | null;
  foto_inicial_url: string | null;
  foto_actual_url: string | null;
  estado: EstadoPersona;
  fecha_alta: string;
};

export type Turno = {
  id: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
};

export type Promocion = {
  id: string;
  nombre: string;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activa: boolean;
};

// Promoción + los planes a los que aplica (tabla promocion_plan)
export type PromocionConPlanes = Promocion & {
  planes: Pick<Plan, "id" | "nombre">[];
};

export type Inscripcion = {
  id: string;
  alumno_id: string;
  plan_id: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: "activa" | "pausada" | "finalizada";
  precio_acordado: number | null;
  promocion_id: string | null;
};

export type InscripcionConAlumno = Inscripcion & {
  alumno: Pick<Alumno, "id" | "nombre" | "apellido" | "email">;
};

// Vista de lista que usa la tabla de Alumnos: alumno + su inscripción activa
// (plan + precio) + turno.
export type AlumnoConPlan = Alumno & {
  turno: Pick<Turno, "id" | "nombre"> | null;
  plan: Pick<Plan, "id" | "nombre"> | null;
  precio: number | null;
  fecha_inscripcion: string | null;
};

// Vista compuesta de la página de detalle: plan + historial completo de precios
// + últimas inscripciones (con el alumno embebido).
export type PlanDetalle = PlanConPrecio & {
  historial_precios: PlanPrecioHistorico[];
  ultimas_inscripciones: InscripcionConAlumno[];
};

// Vista de la página de detalle de alumno: mismos datos que AlumnoConPlan +
// el nombre de la promoción aplicada (si la inscripción tiene una).
export type AlumnoDetalle = AlumnoConPlan & {
  promocion_nombre: string | null;
};

export type EstadoCuota = "adeudada" | "pagada" | "vencida" | "anulada";

export type Cuota = {
  id: string;
  inscripcion_id: string;
  periodo_desde: string;
  periodo_hasta: string;
  fecha_vencimiento: string;
  monto_base: number;
  recargo_aplicado: number;
  estado: EstadoCuota;
  creado_en: string;
};

export type ConfiguracionPagos = {
  id: string;
  dias_gracia: number;
  tipo_recargo: "porcentaje" | "monto_fijo";
  valor_recargo: number;
};

export type MedioPago = "efectivo" | "transferencia" | "mercadopago" | "tarjeta";

export type Pago = {
  id: string;
  cuota_id: string;
  monto: number;
  fecha_pago: string;
  medio: MedioPago;
  referencia: string | null;
};

// Vista de lista que usa la pantalla de Cuotas: cuota + alumno + plan, con el
// estado/recargo ya resueltos "al vuelo" (ver src/app/cuotas/estado.ts).
export type CuotaConDetalle = Cuota & {
  alumno: Pick<Alumno, "id" | "dni" | "nombre" | "apellido">;
  plan: Pick<Plan, "id" | "nombre">;
  estado_efectivo: EstadoCuota;
  recargo_efectivo: number;
};

// Vista que usa el detalle de Alumno: mismo cálculo de estado/recargo, sin repetir
// los datos del alumno (ya se conocen en esa pantalla).
export type CuotaDeAlumno = Cuota & {
  plan: Pick<Plan, "id" | "nombre">;
  estado_efectivo: EstadoCuota;
  recargo_efectivo: number;
};
