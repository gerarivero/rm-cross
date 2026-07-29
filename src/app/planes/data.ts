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
  const { data, error } = await supabase
    .from("plan")
    .select(
      "*, disciplina:disciplina_id(id, nombre), plan_precio_historico(precio, vigente_hasta)"
    )
    .order("nombre");

  if (error) throw new Error(`No se pudieron cargar los planes: ${error.message}`);

  return (data ?? []).map((row: any) => {
    const precioVigente = (row.plan_precio_historico as { precio: number; vigente_hasta: string | null }[])
      .find((p) => p.vigente_hasta === null)?.precio ?? null;

    return {
      ...row,
      disciplina: row.disciplina,
      precio_vigente: precioVigente,
    } as PlanConPrecio;
  });
}
