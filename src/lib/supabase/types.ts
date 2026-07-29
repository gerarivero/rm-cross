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

export type Alumno = {
  id: string;
  nombre: string;
  apellido: string;
  email: string | null;
  estado: "activo" | "inactivo" | "de_baja" | "suspendido";
};

export type Inscripcion = {
  id: string;
  alumno_id: string;
  plan_id: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: "activa" | "pausada" | "finalizada";
};

export type InscripcionConAlumno = Inscripcion & {
  alumno: Pick<Alumno, "id" | "nombre" | "apellido" | "email">;
};

// Vista compuesta de la página de detalle: plan + historial completo de precios
// + últimas inscripciones (con el alumno embebido).
export type PlanDetalle = PlanConPrecio & {
  historial_precios: PlanPrecioHistorico[];
  ultimas_inscripciones: InscripcionConAlumno[];
};
