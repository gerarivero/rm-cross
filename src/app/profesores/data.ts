import { createServerClient } from "@/lib/supabase/server";
import type { ProfesorConDisciplinas } from "@/lib/supabase/types";

export { getDisciplinas } from "../planes/data";

export async function getProfesores(): Promise<ProfesorConDisciplinas[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profesor")
    .select("*, profesor_disciplina(disciplina:disciplina_id(id, nombre))")
    .order("apellido")
    .order("nombre");

  if (error) throw new Error(`No se pudieron cargar los profesores: ${error.message}`);

  return (data ?? []).map((row: any) => ({
    ...row,
    disciplinas: (row.profesor_disciplina as { disciplina: { id: string; nombre: string } }[]).map((pd) => pd.disciplina),
  })) as ProfesorConDisciplinas[];
}
