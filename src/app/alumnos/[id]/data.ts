import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { AlumnoDetalle } from "@/lib/supabase/types";

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

  const { data: inscripcion, error: inscError } = await supabase
    .from("inscripcion")
    .select("fecha_inicio, precio_acordado, plan:plan_id(id, nombre, plan_precio_historico(precio, vigente_hasta)), promocion:promocion_id(nombre)")
    .eq("alumno_id", alumnoId)
    .eq("estado", "activa")
    .maybeSingle();

  if (inscError) throw new Error(`No se pudo cargar el plan del alumno: ${inscError.message}`);

  const insc = inscripcion as any;
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
