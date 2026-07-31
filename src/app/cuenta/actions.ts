"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

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
