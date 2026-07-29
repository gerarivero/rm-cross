import type { createServerClient } from "./server";

// Todavía no hay login/auth real (createServerClient usa la service role key sin
// sesión de usuario). Hasta que exista, el "profesor que autoriza" un precio
// promocional o registra un pago es el usuario admin sembrado por la migración 0002.
export async function buscarAdminAutorizador(supabase: ReturnType<typeof createServerClient>): Promise<string | null> {
  const { data } = await supabase.from("usuario").select("id").eq("es_admin", true).limit(1).maybeSingle();
  return data?.id ?? null;
}
