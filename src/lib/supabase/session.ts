import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServerClient as createServiceRoleClient } from "./server";

// Cliente de sesión (anon key + cookies), distinto del cliente service-role de
// server.ts que se usa para todas las queries de negocio. Este solo se usa para
// hablar con Supabase Auth (login/logout/usuario autenticado).
export function createSessionClient() {
  const cookieStore = cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component (no puede escribir cookies) — el
          // middleware ya se encarga de refrescar la sesión en ese caso.
        }
      },
    },
  });
}

export type UsuarioActual = {
  id: string;
  nombre: string;
  email: string;
  tipo: "profesor" | "alumno";
  es_admin: boolean;
  profesor_id: string | null;
};

// Usuario logueado (Supabase Auth) + su fila en `usuario` (perfil de aplicación),
// vinculados por email. `usuario` no tiene RLS todavía, así que esa parte se
// resuelve con el cliente service-role ya existente.
export async function getUsuarioActual(): Promise<UsuarioActual | null> {
  const supabase = createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("usuario")
    .select("id, nombre, email, tipo, es_admin, profesor_id")
    .eq("email", user.email)
    .maybeSingle();

  return data as UsuarioActual | null;
}
