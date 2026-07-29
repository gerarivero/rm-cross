import { createServerClient } from "@/lib/supabase/server";
import type { AlumnoConPlan, Turno } from "@/lib/supabase/types";

export { getPlanes } from "../planes/data";

export async function getTurnos(): Promise<Turno[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("turno").select("*").order("hora_inicio");
  if (error) throw new Error(`No se pudieron cargar los turnos: ${error.message}`);
  return data ?? [];
}

export async function getPromocionesActivas(): Promise<{ id: string; nombre: string; plan_ids: string[] }[]> {
  const supabase = createServerClient();
  const [{ data: promociones, error }, { data: relaciones, error: relError }] = await Promise.all([
    supabase.from("promocion").select("id, nombre").eq("activa", true).order("nombre"),
    supabase.from("promocion_plan").select("promocion_id, plan_id"),
  ]);

  if (error) throw new Error(`No se pudieron cargar las promociones: ${error.message}`);
  if (relError) throw new Error(`No se pudieron cargar los planes de las promociones: ${relError.message}`);

  const planIdsPorPromocion = new Map<string, string[]>();
  for (const rel of relaciones ?? []) {
    const lista = planIdsPorPromocion.get(rel.promocion_id) ?? [];
    lista.push(rel.plan_id);
    planIdsPorPromocion.set(rel.promocion_id, lista);
  }

  return (promociones ?? []).map((p) => ({ ...p, plan_ids: planIdsPorPromocion.get(p.id) ?? [] }));
}

export async function getAlumnos(): Promise<AlumnoConPlan[]> {
  const supabase = createServerClient();

  const [{ data: alumnos, error }, { data: inscripciones, error: inscError }] = await Promise.all([
    supabase
      .from("alumno")
      .select("*, turno:turno_id(id, nombre)")
      .order("fecha_alta", { ascending: false }),
    supabase
      .from("inscripcion")
      .select("alumno_id, precio_acordado, plan:plan_id(id, nombre, plan_precio_historico(precio, vigente_hasta))")
      .eq("estado", "activa"),
  ]);

  if (error) throw new Error(`No se pudieron cargar los alumnos: ${error.message}`);
  if (inscError) throw new Error(`No se pudo cargar el plan de los alumnos: ${inscError.message}`);

  const planPorAlumno = new Map<string, { plan: { id: string; nombre: string } | null; precio: number | null }>();
  for (const insc of (inscripciones ?? []) as any[]) {
    const historico = (insc.plan?.plan_precio_historico ?? []) as { precio: number; vigente_hasta: string | null }[];
    const precioVigente = historico.find((p) => p.vigente_hasta === null)?.precio ?? null;
    planPorAlumno.set(insc.alumno_id, {
      plan: insc.plan ? { id: insc.plan.id, nombre: insc.plan.nombre } : null,
      precio: insc.precio_acordado ?? precioVigente,
    });
  }

  return (alumnos ?? []).map((row: any) => {
    const info = planPorAlumno.get(row.id);
    return {
      ...row,
      turno: row.turno,
      plan: info?.plan ?? null,
      precio: info?.precio ?? null,
    } as AlumnoConPlan;
  });
}
