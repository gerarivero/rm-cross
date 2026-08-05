#!/usr/bin/env node
// Bootstrap del primer usuario administrador.
//
// Por qué existe: crear un administrador desde la UI (Configuración >
// Administradores) requiere estar logueado como administrador — y recién
// instalado el sistema no hay ninguno con credenciales reales (la migración
// 0002 siembra una fila `usuario` de placeholder, sin auth_user_id, que no
// puede loguearse). Este script rompe ese círculo hablando directo con
// Supabase con la service role key, igual que hace la Server Action
// `crearAdministrador` (src/app/configuracion/actions.ts), y de paso limpia
// el placeholder si todavía existe.
//
// Uso:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/crear-primer-admin.mjs --nombre "Nombre Apellido" --email vos@dominio.com --password "unaClaveSegura123"
//
// (las mismas SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY que .env.local o
// .env.production — nunca se piden por otro lado ni se commitea nada acá).

import { createClient } from "@supabase/supabase-js";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      out[arg.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

async function main() {
  const { nombre, email, password } = parseArgs(process.argv.slice(2));
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const faltantes = [];
  if (!url) faltantes.push("SUPABASE_URL");
  if (!serviceRoleKey) faltantes.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!nombre) faltantes.push("--nombre");
  if (!email) faltantes.push("--email");
  if (!password) faltantes.push("--password");
  if (password && password.length < 8) {
    console.error("La contraseña debe tener al menos 8 caracteres.");
    process.exit(1);
  }
  if (faltantes.length > 0) {
    console.error(`Falta: ${faltantes.join(", ")}`);
    console.error(
      'Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/crear-primer-admin.mjs --nombre "..." --email ... --password "..."'
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  const { data: existente } = await supabase.from("usuario").select("id").eq("email", email).maybeSingle();
  if (existente) {
    console.error(`Ya existe un usuario con el email ${email}. Si querés un admin nuevo, usá otro email.`);
    process.exit(1);
  }

  console.log("Creando el acceso en Supabase Auth...");
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !authUser.user) {
    console.error(`No se pudo crear el acceso: ${authError?.message ?? "error desconocido"}`);
    process.exit(1);
  }

  console.log("Creando el perfil de administrador...");
  const { error: insertError } = await supabase
    .from("usuario")
    .insert({ nombre, email, tipo: "profesor", es_admin: true, activo: true, auth_user_id: authUser.user.id });
  if (insertError) {
    console.error(`No se pudo crear el perfil: ${insertError.message}`);
    await supabase.auth.admin.deleteUser(authUser.user.id);
    process.exit(1);
  }

  // Placeholder sembrado por la migración 0002 (sin auth_user_id: nunca pudo
  // loguearse). Con un admin real ya creado, dejarlo solo genera confusión
  // en la lista de Administradores.
  const { data: placeholder } = await supabase
    .from("usuario")
    .select("id")
    .eq("email", "admin@centrorm.local")
    .is("auth_user_id", null)
    .maybeSingle();
  if (placeholder) {
    await supabase.from("usuario").delete().eq("id", placeholder.id);
    console.log("Se eliminó el usuario placeholder admin@centrorm.local (sembrado por la migración 0002).");
  }

  console.log(`Listo. Administrador creado: ${email}. Ya podés loguearte en /login con esa contraseña.`);
}

main();
