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
};

// Vista compuesta de la página de detalle: plan + historial completo de precios
// + últimas inscripciones (con el alumno embebido).
export type PlanDetalle = PlanConPrecio & {
  historial_precios: PlanPrecioHistorico[];
  ultimas_inscripciones: InscripcionConAlumno[];
};
