import { createServerClient } from "@/lib/supabase/server";
import type { PromocionConPlanes } from "@/lib/supabase/types";

export { getPlanes } from "../data";

export async function getPromociones(): Promise<PromocionConPlanes[]> {
  const supabase = createServerClient();
  const [{ data: promociones, error }, { data: relaciones, error: relError }] = await Promise.all([
    supabase.from("promocion").select("*").order("nombre"),
    supabase.from("promocion_plan").select("promocion_id, plan:plan_id(id, nombre)"),
  ]);

  if (error) throw new Error(`No se pudieron cargar las promociones: ${error.message}`);
  if (relError) throw new Error(`No se pudieron cargar los planes de las promociones: ${relError.message}`);

  const planesPorPromocion = new Map<string, { id: string; nombre: string }[]>();
  for (const rel of (relaciones ?? []) as any[]) {
    const lista = planesPorPromocion.get(rel.promocion_id) ?? [];
    lista.push(rel.plan);
    planesPorPromocion.set(rel.promocion_id, lista);
  }

  return (promociones ?? []).map((p: any) => ({
    ...p,
    planes: planesPorPromocion.get(p.id) ?? [],
  }));
}
