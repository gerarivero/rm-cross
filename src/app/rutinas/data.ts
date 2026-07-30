import { createServerClient } from "@/lib/supabase/server";
import type { RutinaConResumen } from "@/lib/supabase/types";

export async function getRutinas(): Promise<RutinaConResumen[]> {
  const supabase = createServerClient();
  const [{ data, error }, { data: asignaciones, error: asignacionesError }] = await Promise.all([
    supabase.from("rutina").select("*").order("nombre"),
    supabase.from("rutina_asignacion").select("rutina_id").eq("estado", "activa"),
  ]);

  if (error) throw new Error(`No se pudieron cargar las rutinas: ${error.message}`);
  if (asignacionesError) throw new Error(`No se pudo contar alumnos por rutina: ${asignacionesError.message}`);

  const alumnosPorRutina = new Map<string, number>();
  for (const { rutina_id } of asignaciones ?? []) {
    alumnosPorRutina.set(rutina_id, (alumnosPorRutina.get(rutina_id) ?? 0) + 1);
  }

  return (data ?? []).map((row) => ({
    ...row,
    alumnos_count: alumnosPorRutina.get(row.id) ?? 0,
  })) as RutinaConResumen[];
}
