"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/supabase/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function crearDisciplina(formData: FormData): Promise<ActionResult> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { ok: false, error: "El nombre de la disciplina es obligatorio." };
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;

  const supabase = createServerClient();
  const { error } = await supabase.from("disciplina").insert({ nombre, descripcion });
  if (error) return { ok: false, error: `No se pudo crear la disciplina: ${error.message}` };

  revalidatePath("/configuracion");
  revalidatePath("/planes");
  return { ok: true };
}

export async function actualizarDisciplina(disciplinaId: string, formData: FormData): Promise<ActionResult> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { ok: false, error: "El nombre de la disciplina es obligatorio." };
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;

  const supabase = createServerClient();
  const { error } = await supabase.from("disciplina").update({ nombre, descripcion }).eq("id", disciplinaId);
  if (error) return { ok: false, error: `No se pudo actualizar la disciplina: ${error.message}` };

  revalidatePath("/configuracion");
  revalidatePath("/planes");
  return { ok: true };
}

export async function alternarActivoDisciplina(disciplinaId: string, activo: boolean): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("disciplina").update({ activo }).eq("id", disciplinaId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/configuracion");
  revalidatePath("/planes");
  return { ok: true };
}

export async function crearTurno(formData: FormData): Promise<ActionResult> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const hora_inicio = String(formData.get("hora_inicio") ?? "");
  const hora_fin = String(formData.get("hora_fin") ?? "");
  if (!nombre || !hora_inicio || !hora_fin) {
    return { ok: false, error: "Nombre, hora de inicio y hora de fin son obligatorios." };
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("turno").insert({ nombre, hora_inicio, hora_fin });
  if (error) return { ok: false, error: `No se pudo crear el turno: ${error.message}` };

  revalidatePath("/configuracion");
  revalidatePath("/alumnos");
  return { ok: true };
}

export async function actualizarTurno(turnoId: string, formData: FormData): Promise<ActionResult> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const hora_inicio = String(formData.get("hora_inicio") ?? "");
  const hora_fin = String(formData.get("hora_fin") ?? "");
  if (!nombre || !hora_inicio || !hora_fin) {
    return { ok: false, error: "Nombre, hora de inicio y hora de fin son obligatorios." };
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("turno").update({ nombre, hora_inicio, hora_fin }).eq("id", turnoId);
  if (error) return { ok: false, error: `No se pudo actualizar el turno: ${error.message}` };

  revalidatePath("/configuracion");
  revalidatePath("/alumnos");
  return { ok: true };
}

export async function alternarActivoTurno(turnoId: string, activo: boolean): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("turno").update({ activo }).eq("id", turnoId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/configuracion");
  revalidatePath("/alumnos");
  return { ok: true };
}

export async function crearAdministrador(formData: FormData): Promise<ActionResult> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const profesor_id = String(formData.get("profesor_id") ?? "").trim() || null;

  if (!nombre || !email) return { ok: false, error: "Nombre y email son obligatorios." };
  if (password.length < 8) return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };

  const supabase = createServerClient();

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !authUser.user) {
    return { ok: false, error: `No se pudo crear el acceso: ${authError?.message ?? "error desconocido"}` };
  }

  const { error: insertError } = await supabase
    .from("usuario")
    .insert({ nombre, email, tipo: "profesor", es_admin: true, activo: true, profesor_id });

  if (insertError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return { ok: false, error: `No se pudo crear el administrador: ${insertError.message}` };
  }

  revalidatePath("/configuracion");
  return { ok: true };
}

export async function actualizarAdministrador(usuarioId: string, formData: FormData): Promise<ActionResult> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { ok: false, error: "El nombre es obligatorio." };
  const profesor_id = String(formData.get("profesor_id") ?? "").trim() || null;

  const supabase = createServerClient();
  const { error } = await supabase.from("usuario").update({ nombre, profesor_id }).eq("id", usuarioId);
  if (error) return { ok: false, error: `No se pudo actualizar el administrador: ${error.message}` };

  revalidatePath("/configuracion");
  return { ok: true };
}

export async function alternarActivoAdministrador(usuarioId: string, activo: boolean): Promise<ActionResult> {
  if (!activo) {
    const usuarioActual = await getUsuarioActual();
    if (usuarioActual?.id === usuarioId) {
      return { ok: false, error: "No podés desactivar tu propio acceso." };
    }
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("usuario").update({ activo }).eq("id", usuarioId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/configuracion");
  return { ok: true };
}
