import { createServerClient } from "@/lib/supabase/server";
import type { EjercicioConMusculo, Musculo } from "@/lib/supabase/types";

export async function getMusculos(): Promise<Musculo[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("musculo").select("*").order("nombre");
  if (error) throw new Error(`No se pudieron cargar los músculos: ${error.message}`);
  return data ?? [];
}

export async function getEjercicios(): Promise<EjercicioConMusculo[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ejercicio")
    .select("*, musculo:musculo_id(id, nombre)")
    .order("nombre");
  if (error) throw new Error(`No se pudieron cargar los ejercicios: ${error.message}`);
  return (data ?? []) as EjercicioConMusculo[];
}
