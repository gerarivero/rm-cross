"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const POSTGRES_FOREIGN_KEY_VIOLATION = "23503";

type SupabaseClient = ReturnType<typeof createServerClient>;

type DatosProfesorForm = {
  dni: string;
  nombre: string;
  apellido: string;
  email: string | null;
  celular: string | null;
  fecha_nacimiento: string | null;
};

function leerYValidarFormularioProfesor(
  formData: FormData
): { ok: true; datos: DatosProfesorForm } | { ok: false; error: string } {
  const dni = String(formData.get("dni") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();

  if (!dni || !nombre || !apellido) {
    return { ok: false, error: "DNI, nombre y apellido son obligatorios." };
  }

  const email = String(formData.get("email") ?? "").trim() || null;
  const celular = String(formData.get("celular") ?? "").trim() || null;
  const fecha_nacimiento = String(formData.get("fecha_nacimiento") ?? "") || null;

  return { ok: true, datos: { dni, nombre, apellido, email, celular, fecha_nacimiento } };
}

function leerDisciplinaIds(formData: FormData): string[] {
  return formData.getAll("disciplina_ids").map(String).filter(Boolean);
}

async function sincronizarDisciplinasDeProfesor(
  supabase: SupabaseClient,
  profesorId: string,
  disciplinaIds: string[]
): Promise<{ error: string | null }> {
  const { error: deleteError } = await supabase.from("profesor_disciplina").delete().eq("profesor_id", profesorId);
  if (deleteError) return { error: `No se pudieron actualizar las disciplinas del profesor: ${deleteError.message}` };

  if (disciplinaIds.length === 0) return { error: null };

  const { error: insertError } = await supabase
    .from("profesor_disciplina")
    .insert(disciplinaIds.map((disciplina_id) => ({ profesor_id: profesorId, disciplina_id })));

  if (insertError) return { error: `No se pudieron asociar las disciplinas: ${insertError.message}` };
  return { error: null };
}

export async function crearProfesor(formData: FormData): Promise<ActionResult> {
  const supabase = createServerClient();

  const parsed = leerYValidarFormularioProfesor(formData);
  if (!parsed.ok) return parsed;
  const disciplinaIds = leerDisciplinaIds(formData);

  const { data: profesor, error } = await supabase.from("profesor").insert(parsed.datos).select("id").single();

  if (error || !profesor) {
    return { ok: false, error: `No se pudo crear el profesor: ${error?.message ?? "error desconocido"}` };
  }

  const { error: relError } = await sincronizarDisciplinasDeProfesor(supabase, profesor.id, disciplinaIds);
  if (relError) return { ok: false, error: relError };

  revalidatePath("/profesores");
  return { ok: true };
}

export async function actualizarProfesor(profesorId: string, formData: FormData): Promise<ActionResult> {
  const supabase = createServerClient();

  const parsed = leerYValidarFormularioProfesor(formData);
  if (!parsed.ok) return parsed;
  const disciplinaIds = leerDisciplinaIds(formData);

  const { error } = await supabase.from("profesor").update(parsed.datos).eq("id", profesorId);
  if (error) return { ok: false, error: `No se pudo actualizar el profesor: ${error.message}` };

  const { error: relError } = await sincronizarDisciplinasDeProfesor(supabase, profesorId, disciplinaIds);
  if (relError) return { ok: false, error: relError };

  revalidatePath("/profesores");
  revalidatePath(`/profesores/${profesorId}`);
  return { ok: true };
}

export async function desactivarProfesor(profesorId: string): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("profesor").update({ activo: false }).eq("id", profesorId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/profesores");
  revalidatePath(`/profesores/${profesorId}`);
  return { ok: true };
}

export async function reactivarProfesor(profesorId: string): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("profesor").update({ activo: true }).eq("id", profesorId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/profesores");
  revalidatePath(`/profesores/${profesorId}`);
  return { ok: true };
}

export async function eliminarProfesor(profesorId: string): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("profesor").delete().eq("id", profesorId);

  if (error) {
    if (error.code === POSTGRES_FOREIGN_KEY_VIOLATION) {
      return {
        ok: false,
        error: "Este profesor está referenciado en otro registro y no se puede eliminar. Desactivalo en su lugar.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/profesores");
  return { ok: true };
}
