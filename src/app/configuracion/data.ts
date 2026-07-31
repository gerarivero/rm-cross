import { createServerClient } from "@/lib/supabase/server";
import type { Disciplina, Turno, UsuarioAdmin } from "@/lib/supabase/types";

export { getConfiguracionPagos } from "../cuotas/data";

export async function getAdministradores(): Promise<UsuarioAdmin[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("usuario")
    .select("id, nombre, email, activo, creado_en, auth_user_id")
    .eq("es_admin", true)
    .order("nombre");

  if (error) throw new Error(`No se pudieron cargar los administradores: ${error.message}`);
  return (data ?? []) as UsuarioAdmin[];
}

// A diferencia de getDisciplinas (Planes, filtra activo = true), acá la pantalla
// de administración necesita ver también las inactivas.
export async function getTodasLasDisciplinas(): Promise<Disciplina[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("disciplina").select("*").order("nombre");
  if (error) throw new Error(`No se pudieron cargar las disciplinas: ${error.message}`);
  return data ?? [];
}

// A diferencia de getTurnos (Alumnos, filtra activo = true), acá la pantalla de
// administración necesita ver también los inactivos.
export async function getTodosLosTurnos(): Promise<Turno[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("turno").select("*").order("hora_inicio");
  if (error) throw new Error(`No se pudieron cargar los turnos: ${error.message}`);
  return data ?? [];
}
