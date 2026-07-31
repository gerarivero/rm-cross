import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { ProfesorConDisciplinas } from "@/lib/supabase/types";

export { getDisciplinas } from "../data";

export async function getProfesorDetalle(profesorId: string): Promise<ProfesorConDisciplinas> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profesor")
    .select("*, profesor_disciplina(disciplina:disciplina_id(id, nombre))")
    .eq("id", profesorId)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el profesor: ${error.message}`);
  if (!data) notFound();

  const row = data as any;
  return {
    ...row,
    disciplinas: (row.profesor_disciplina as { disciplina: { id: string; nombre: string } }[]).map((pd) => pd.disciplina),
  } as ProfesorConDisciplinas;
}
