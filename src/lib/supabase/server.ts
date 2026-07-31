import { createClient } from "@supabase/supabase-js";

// Cliente de servidor: usa la service role key para todas las queries de negocio
// (cuotas, alumnos, etc.), sin RLS todavía. El login/logout/usuario logueado usan
// un cliente aparte con cookies de sesión (ver src/lib/supabase/session.ts) — este
// cliente no cambia por eso, sigue siendo el único que hace queries de negocio.
//
// Nota sobre tipos: no se usa el generic <Database> de createClient() porque
// con un schema escrito a mano (sin Views/Functions) el inferidor de tipos de
// supabase-js rompe el tipado de .insert(). Los tipos de fila (Plan, Disciplina,
// etc.) se aplican "a mano" en data.ts al leer los datos. Cuando el schema
// crezca, generar los tipos reales con `supabase gen types` resuelve esto de raíz.
export function createServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan las variables de entorno SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. " +
        "Copiá .env.example a .env.local y completá los valores de tu proyecto Supabase."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
