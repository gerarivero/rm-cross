"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { createSessionClient, getUsuarioActual } from "@/lib/supabase/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function vincularProfesor(formData: FormData): Promise<ActionResult> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { ok: false, error: "No hay sesión activa." };

  const profesor_id = String(formData.get("profesor_id") ?? "").trim() || null;

  const admin = createServerClient();
  const { error } = await admin.from("usuario").update({ profesor_id }).eq("id", usuario.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/cuenta");
  return { ok: true };
}

export async function cambiarContrasena(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  if (password.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== confirmar) {
    return { ok: false, error: "Las contraseñas no coinciden." };
  }

  const supabase = createSessionClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/cuenta");
  return { ok: true };
}
