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

// Fila del historial de inscripciones de un alumno (card "Historial de
// Inscripciones" del detalle de Alumno) — cada período con su plan y duración.
export type InscripcionHistorial = Pick<Inscripcion, "id" | "fecha_inicio" | "fecha_fin" | "estado"> & {
  plan: Pick<Plan, "id" | "nombre">;
  duracion: string;
};

// Vista de lista que usa la tabla de Alumnos: alumno + su inscripción activa
// (plan + precio) + turno + rutina activa asignada (si tiene).
export type AlumnoConPlan = Alumno & {
  turno: Pick<Turno, "id" | "nombre"> | null;
  plan: Pick<Plan, "id" | "nombre"> | null;
  precio: number | null;
  fecha_inscripcion: string | null;
  rutina: Pick<Rutina, "id" | "nombre"> | null;
};

// Vista compuesta de la página de detalle: plan + historial completo de precios
// + últimas inscripciones (con el alumno embebido).
export type PlanDetalle = PlanConPrecio & {
  historial_precios: PlanPrecioHistorico[];
  ultimas_inscripciones: InscripcionConAlumno[];
};

// Vista de la página de detalle de alumno: mismos datos que AlumnoConPlan +
// el nombre de la promoción aplicada (si la inscripción tiene una). precio_acordado y
// promocion_id (crudos, sin resolver contra el precio de lista) son para precargar el
// modal de edición de precio — `precio` ya viene resuelto para mostrar.
export type AlumnoDetalle = AlumnoConPlan & {
  promocion_nombre: string | null;
  precio_acordado: number | null;
  promocion_id: string | null;
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
  numero_comprobante: number | null;
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
// estado/recargo/saldo ya resueltos "al vuelo" (ver src/app/cuotas/estado.ts).
export type CuotaConDetalle = Cuota & {
  alumno: Pick<Alumno, "id" | "dni" | "nombre" | "apellido">;
  plan: Pick<Plan, "id" | "nombre">;
  pagos: Pago[];
  estado_efectivo: EstadoCuota;
  recargo_efectivo: number;
  total_pagado: number;
  saldo_capital: number;
  total_adeudado: number;
};

// Vista que usa el detalle de Alumno: mismo cálculo de estado/recargo/saldo, sin
// repetir los datos del alumno (ya se conocen en esa pantalla).
export type CuotaDeAlumno = Cuota & {
  plan: Pick<Plan, "id" | "nombre">;
  pagos: Pago[];
  estado_efectivo: EstadoCuota;
  recargo_efectivo: number;
  total_pagado: number;
  saldo_capital: number;
  total_adeudado: number;
};

// =========================================================
// Rutinas
// =========================================================

export type Musculo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
};

export type Ejercicio = {
  id: string;
  musculo_id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  creado_en: string;
};

// Vista que usa el catálogo y el selector del builder: ejercicio + su músculo.
export type EjercicioConMusculo = Ejercicio & {
  musculo: Pick<Musculo, "id" | "nombre">;
};

export type TipoActividad = "calentamiento" | "musculacion" | "recuperacion";
export type TipoIntensidad = "baja" | "media" | "alta";

export type Rutina = {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  creado_en: string;
};

// Vista de lista: rutina + cantidad de alumnos con esa rutina asignada activa
// (mismo patrón que PlanConPrecio.alumnos_count).
export type RutinaConResumen = Rutina & {
  alumnos_count: number;
};

export type RutinaSemana = {
  id: string;
  rutina_id: string;
  numero_semana: number;
};

export type RutinaDia = {
  id: string;
  semana_id: string;
  numero_dia: number;
};

export type RutinaActividad = {
  id: string;
  dia_id: string;
  tipo: TipoActividad;
  orden: number;
};

export type RutinaEjercicio = {
  id: string;
  actividad_id: string;
  ejercicio_id: string;
  orden: number;
  intensidad: TipoIntensidad | null;
  series: number | null;
  repeticiones: number | null;
  duracion_minutos: number | null;
  notas: string | null;
};

// Estructura completa anidada que arma el builder de una rutina (4 semanas ->
// días -> actividades -> ejercicios, con el ejercicio+músculo embebidos).
export type RutinaEjercicioConDetalle = RutinaEjercicio & {
  ejercicio: Pick<Ejercicio, "id" | "nombre"> & { musculo: Pick<Musculo, "id" | "nombre"> };
};

export type RutinaActividadConEjercicios = RutinaActividad & {
  ejercicios: RutinaEjercicioConDetalle[];
};

export type RutinaDiaConActividades = RutinaDia & {
  actividades: RutinaActividadConEjercicios[];
};

export type RutinaSemanaConDias = RutinaSemana & {
  dias: RutinaDiaConActividades[];
};

export type RutinaDetalle = Rutina & {
  semanas: RutinaSemanaConDias[];
};

export type EstadoAsignacion = "activa" | "finalizada";

export type RutinaAsignacion = {
  id: string;
  rutina_id: string;
  alumno_id: string;
  fecha_inicio: string;
  estado: EstadoAsignacion;
  creado_en: string;
};

// Vista que usa el detalle de Rutina para listar a quién está/estuvo asignada.
export type RutinaAsignacionConAlumno = RutinaAsignacion & {
  alumno: Pick<Alumno, "id" | "dni" | "nombre" | "apellido">;
};

// Vista que usa el detalle de Alumno: la rutina activa asignada (si tiene).
export type RutinaAsignadaDeAlumno = {
  asignacion_id: string;
  fecha_inicio: string;
  rutina: Pick<Rutina, "id" | "nombre">;
};
