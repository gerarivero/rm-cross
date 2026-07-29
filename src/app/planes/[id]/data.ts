import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { InscripcionConAlumno, PlanDetalle, PlanPrecioHistorico } from "@/lib/supabase/types";

export { getDisciplinas } from "../data";

export async function getPlanDetalle(planId: string): Promise<PlanDetalle> {
  const supabase = createServerClient();

  const { data: planRow, error: planError } = await supabase
    .from("plan")
    .select("*, disciplina:disciplina_id(id, nombre), plan_precio_historico(id, precio, vigente_desde, vigente_hasta)")
    .eq("id", planId)
    .maybeSingle();

  if (planError) throw new Error(`No se pudo cargar el plan: ${planError.message}`);
  if (!planRow) notFound();

  const historial = (planRow.plan_precio_historico as PlanPrecioHistorico[])
    .slice()
    .sort((a, b) => b.vigente_desde.localeCompare(a.vigente_desde));
  const precioVigente = historial.find((p) => p.vigente_hasta === null)?.precio ?? null;

  const [{ count: alumnosActivos, error: countError }, { data: inscripciones, error: inscripcionesError }] =
    await Promise.all([
      supabase
        .from("inscripcion")
        .select("id", { count: "exact", head: true })
        .eq("plan_id", planId)
        .eq("estado", "activa"),
      supabase
        .from("inscripcion")
        .select("*, alumno:alumno_id(id, nombre, apellido, email)")
        .eq("plan_id", planId)
        .order("fecha_inicio", { ascending: false })
        .limit(10),
    ]);

  if (countError) throw new Error(`No se pudo contar alumnos: ${countError.message}`);
  if (inscripcionesError) throw new Error(`No se pudieron cargar las inscripciones: ${inscripcionesError.message}`);

  return {
    ...(planRow as any),
    disciplina: (planRow as any).disciplina,
    precio_vigente: precioVigente,
    alumnos_count: alumnosActivos ?? 0,
    historial_precios: historial,
    ultimas_inscripciones: (inscripciones ?? []) as unknown as InscripcionConAlumno[],
  };
}
