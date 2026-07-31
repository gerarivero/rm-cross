import { createServerClient } from "@/lib/supabase/server";

export { getRutinaDetalle } from "../data";

// Sin auth real todavía: se muestra en la planilla exportada como "Profesor" el
// usuario admin sembrado (mismo workaround que buscarAdminAutorizador,
// src/lib/supabase/admin.ts) — no hay sesión que identifique quién la generó.
export async function getProfesorExportador(): Promise<{ nombre: string; email: string } | null> {
  const supabase = createServerClient();
  const { data } = await supabase.from("usuario").select("nombre, email").eq("es_admin", true).limit(1).maybeSingle();
  return data ?? null;
}

// Datos del alumno + fecha de inicio de su asignación a esta rutina, para la
// cabecera de la planilla cuando la exportación es personalizada.
export async function getAlumnoParaExportar(
  alumnoId: string,
  rutinaId: string
): Promise<{ nombre: string | null; apellido: string | null; dni: string; fecha_inicio: string } | null> {
  const supabase = createServerClient();

  const [{ data: alumno, error: alumnoError }, { data: asignacion, error: asignacionError }] = await Promise.all([
    supabase.from("alumno").select("nombre, apellido, dni").eq("id", alumnoId).maybeSingle(),
    supabase
      .from("rutina_asignacion")
      .select("fecha_inicio")
      .eq("alumno_id", alumnoId)
      .eq("rutina_id", rutinaId)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (alumnoError) throw new Error(`No se pudo cargar el alumno: ${alumnoError.message}`);
  if (asignacionError) throw new Error(`No se pudo cargar la asignación: ${asignacionError.message}`);
  if (!alumno) return null;

  return { ...alumno, fecha_inicio: asignacion?.fecha_inicio ?? "" };
}
