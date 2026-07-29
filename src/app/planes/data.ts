import { createServerClient } from "@/lib/supabase/server";
import type { Disciplina, PlanConPrecio } from "@/lib/supabase/types";

export async function getDisciplinas(): Promise<Disciplina[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("disciplina")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  if (error) throw new Error(`No se pudieron cargar las disciplinas: ${error.message}`);
  return data ?? [];
}

export async function getPlanes(): Promise<PlanConPrecio[]> {
  const supabase = createServerClient();
  const [{ data, error }, { data: inscripciones, error: inscripcionesError }] = await Promise.all([
    supabase
      .from("plan")
      .select("*, disciplina:disciplina_id(id, nombre), plan_precio_historico(precio, vigente_hasta)")
      .order("nombre"),
    supabase.from("inscripcion").select("plan_id").eq("estado", "activa"),
  ]);

  if (error) throw new Error(`No se pudieron cargar los planes: ${error.message}`);
  if (inscripcionesError) throw new Error(`No se pudo contar alumnos por plan: ${inscripcionesError.message}`);

  const alumnosPorPlan = new Map<string, number>();
  for (const { plan_id } of inscripciones ?? []) {
    alumnosPorPlan.set(plan_id, (alumnosPorPlan.get(plan_id) ?? 0) + 1);
  }

  return (data ?? []).map((row: any) => {
    const precioVigente = (row.plan_precio_historico as { precio: number; vigente_hasta: string | null }[])
      .find((p) => p.vigente_hasta === null)?.precio ?? null;

    return {
      ...row,
      disciplina: row.disciplina,
      precio_vigente: precioVigente,
      alumnos_count: alumnosPorPlan.get(row.id) ?? 0,
    } as PlanConPrecio;
  });
}
