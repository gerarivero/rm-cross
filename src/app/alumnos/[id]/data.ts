import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { AlumnoDetalle, InscripcionHistorial } from "@/lib/supabase/types";
import { calcularDuracion } from "../duracion";

export { getPlanes } from "../../planes/data";
export { getPromocionesActivas, getTurnos } from "../data";
export { getCuotasDeAlumno } from "../../cuotas/data";

export async function getAlumnoDetalle(alumnoId: string): Promise<AlumnoDetalle> {
  const supabase = createServerClient();

  const { data: alumnoRow, error } = await supabase
    .from("alumno")
    .select("*, turno:turno_id(id, nombre)")
    .eq("id", alumnoId)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el alumno: ${error.message}`);
  if (!alumnoRow) notFound();

  const { data: inscripciones, error: inscError } = await supabase
    .from("inscripcion")
    .select("fecha_inicio, precio_acordado, plan:plan_id(id, nombre, plan_precio_historico(precio, vigente_hasta)), promocion:promocion_id(nombre)")
    .eq("alumno_id", alumnoId)
    .eq("estado", "activa")
    .order("fecha_inicio", { ascending: false })
    .limit(1);

  if (inscError) throw new Error(`No se pudo cargar el plan del alumno: ${inscError.message}`);

  const insc = (inscripciones?.[0] ?? null) as any;
  const historico = (insc?.plan?.plan_precio_historico ?? []) as { precio: number; vigente_hasta: string | null }[];
  const precioVigente = historico.find((p) => p.vigente_hasta === null)?.precio ?? null;

  return {
    ...(alumnoRow as any),
    turno: (alumnoRow as any).turno,
    plan: insc?.plan ? { id: insc.plan.id, nombre: insc.plan.nombre } : null,
    precio: insc ? insc.precio_acordado ?? precioVigente : null,
    fecha_inscripcion: insc?.fecha_inicio ?? null,
    promocion_nombre: insc?.promocion?.nombre ?? null,
  } as AlumnoDetalle;
}

// Historial completo de inscripciones de un alumno (todas, no solo la activa),
// para la card "Historial de Inscripciones" del detalle de Alumno.
export async function getHistorialInscripciones(alumnoId: string): Promise<InscripcionHistorial[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("inscripcion")
    .select("id, fecha_inicio, fecha_fin, estado, plan:plan_id(id, nombre)")
    .eq("alumno_id", alumnoId)
    .order("fecha_inicio", { ascending: false });

  if (error) throw new Error(`No se pudo cargar el historial de inscripciones: ${error.message}`);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    fecha_inicio: row.fecha_inicio,
    fecha_fin: row.fecha_fin,
    estado: row.estado,
    plan: row.plan,
    duracion: calcularDuracion(row.fecha_inicio, row.fecha_fin),
  })) as InscripcionHistorial[];
}
