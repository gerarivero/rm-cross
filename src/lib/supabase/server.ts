import { createClient } from "@supabase/supabase-js";

// Cliente de servidor: usa la service role key porque los Server Actions
// corren en el servidor y todavía no hay autenticación/RLS implementada.
// Cuando se sume auth de verdad, esto pasa a usar el cliente con cookies de
// sesión + políticas RLS por rol (profesor/alumno/admin).
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
