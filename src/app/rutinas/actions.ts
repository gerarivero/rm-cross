"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const POSTGRES_FOREIGN_KEY_VIOLATION = "23503";
const NUMERO_SEMANAS = 4;

// Crea la rutina y sus 4 semanas fijas en la misma acción — la estructura de 4
// semanas no es algo que el profesor arme a mano, siempre está presente.
export async function crearRutina(formData: FormData): Promise<ActionResult> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { ok: false, error: "El nombre de la rutina es obligatorio." };
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;

  const supabase = createServerClient();

  const { data: rutina, error } = await supabase.from("rutina").insert({ nombre, descripcion }).select("id").single();
  if (error || !rutina) return { ok: false, error: `No se pudo crear la rutina: ${error?.message ?? "error desconocido"}` };

  const semanas = Array.from({ length: NUMERO_SEMANAS }, (_, i) => ({ rutina_id: rutina.id, numero_semana: i + 1 }));
  const { error: semanasError } = await supabase.from("rutina_semana").insert(semanas);
  if (semanasError) return { ok: false, error: `Rutina creada, pero no se pudieron generar las semanas: ${semanasError.message}` };

  revalidatePath("/rutinas");
  return { ok: true };
}

export async function actualizarRutina(rutinaId: string, formData: FormData): Promise<ActionResult> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { ok: false, error: "El nombre de la rutina es obligatorio." };
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;

  const supabase = createServerClient();
  const { error } = await supabase.from("rutina").update({ nombre, descripcion }).eq("id", rutinaId);
  if (error) return { ok: false, error: `No se pudo actualizar la rutina: ${error.message}` };

  revalidatePath("/rutinas");
  revalidatePath(`/rutinas/${rutinaId}`);
  return { ok: true };
}

export async function alternarActivoRutina(rutinaId: string, activo: boolean): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("rutina").update({ activo }).eq("id", rutinaId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/rutinas");
  revalidatePath(`/rutinas/${rutinaId}`);
  return { ok: true };
}

// Una rutina no se puede eliminar si tiene asignaciones (FK restrict desde
// rutina_asignacion.rutina_id, migración 0007) — mismo criterio que planes.
export async function eliminarRutina(rutinaId: string): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("rutina").delete().eq("id", rutinaId);

  if (error) {
    if (error.code === POSTGRES_FOREIGN_KEY_VIOLATION) {
      return {
        ok: false,
        error:
          "Esta rutina tiene alumnos asignados (activos o históricos) y no se puede eliminar. " +
          "Desactivala en su lugar: va a dejar de estar disponible para nuevas asignaciones pero conserva el historial.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/rutinas");
  return { ok: true };
}
