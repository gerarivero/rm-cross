"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createSessionClient } from "@/lib/supabase/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function iniciarSesion(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Ingresá tu email y contraseña." };
  }

  const supabase = createSessionClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    return { ok: false, error: "Email o contraseña incorrectos." };
  }

  const admin = createServerClient();
  const { data: usuario } = await admin.from("usuario").select("tipo, es_admin, activo").eq("email", email).maybeSingle();

  if (!usuario || !usuario.activo || usuario.tipo !== "profesor" || !usuario.es_admin) {
    await supabase.auth.signOut();
    return { ok: false, error: "Tu usuario no tiene acceso a este panel." };
  }

  redirect("/dashboard");
}

export async function cerrarSesion() {
  const supabase = createSessionClient();
  await supabase.auth.signOut();
  redirect("/login");
}
