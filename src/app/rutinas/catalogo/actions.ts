"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const POSTGRES_FOREIGN_KEY_VIOLATION = "23503";

export async function crearMusculo(formData: FormData): Promise<ActionResult> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { ok: false, error: "El nombre del músculo es obligatorio." };
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;

  const supabase = createServerClient();
  const { error } = await supabase.from("musculo").insert({ nombre, descripcion });
  if (error) return { ok: false, error: `No se pudo crear el músculo: ${error.message}` };

  revalidatePath("/rutinas/catalogo");
  return { ok: true };
}

export async function actualizarMusculo(musculoId: string, formData: FormData): Promise<ActionResult> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { ok: false, error: "El nombre del músculo es obligatorio." };
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;

  const supabase = createServerClient();
  const { error } = await supabase.from("musculo").update({ nombre, descripcion }).eq("id", musculoId);
  if (error) return { ok: false, error: `No se pudo actualizar el músculo: ${error.message}` };

  revalidatePath("/rutinas/catalogo");
  return { ok: true };
}

export async function alternarActivoMusculo(musculoId: string, activo: boolean): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("musculo").update({ activo }).eq("id", musculoId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/rutinas/catalogo");
  return { ok: true };
}

export async function crearEjercicio(formData: FormData): Promise<ActionResult> {
  const musculo_id = String(formData.get("musculo_id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!musculo_id || !nombre) return { ok: false, error: "Músculo y nombre son obligatorios." };
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;

  const supabase = createServerClient();
  const { error } = await supabase.from("ejercicio").insert({ musculo_id, nombre, descripcion });
  if (error) return { ok: false, error: `No se pudo crear el ejercicio: ${error.message}` };

  revalidatePath("/rutinas/catalogo");
  return { ok: true };
}

export async function actualizarEjercicio(ejercicioId: string, formData: FormData): Promise<ActionResult> {
  const musculo_id = String(formData.get("musculo_id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!musculo_id || !nombre) return { ok: false, error: "Músculo y nombre son obligatorios." };
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;

  const supabase = createServerClient();
  const { error } = await supabase.from("ejercicio").update({ musculo_id, nombre, descripcion }).eq("id", ejercicioId);
  if (error) return { ok: false, error: `No se pudo actualizar el ejercicio: ${error.message}` };

  revalidatePath("/rutinas/catalogo");
  return { ok: true };
}

export async function alternarActivoEjercicio(ejercicioId: string, activo: boolean): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("ejercicio").update({ activo }).eq("id", ejercicioId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/rutinas/catalogo");
  return { ok: true };
}

// Un ejercicio no se puede eliminar si está usado en alguna rutina (FK restrict
// desde rutina_ejercicio.ejercicio_id, migración 0007) — mismo criterio que
// "un plan no se puede eliminar si está asignado a un alumno".
export async function eliminarEjercicio(ejercicioId: string): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("ejercicio").delete().eq("id", ejercicioId);

  if (error) {
    if (error.code === POSTGRES_FOREIGN_KEY_VIOLATION) {
      return {
        ok: false,
        error:
          "Este ejercicio está usado en una o más rutinas y no se puede eliminar. " +
          "Desactivalo en su lugar: va a dejar de aparecer para nuevas rutinas pero conserva las que ya lo usan.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/rutinas/catalogo");
  return { ok: true };
}
