"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

type SupabaseClient = ReturnType<typeof createServerClient>;

function opcional(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

function opcionalNumero(formData: FormData, campo: string): number | null {
  const valor = opcional(formData, campo);
  if (valor === null) return null;
  const num = Number(valor);
  return Number.isNaN(num) ? null : num;
}

// Todavía no hay login/auth real (createServerClient usa la service role key sin
// sesión de usuario). Hasta que exista, el "profesor que autoriza" un precio
// promocional es el usuario admin sembrado por la migración 0002.
async function buscarAdminAutorizador(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.from("usuario").select("id").eq("es_admin", true).limit(1).maybeSingle();
  return data?.id ?? null;
}

const POSTGRES_FOREIGN_KEY_VIOLATION = "23503";
const POSTGRES_UNIQUE_VIOLATION = "23505";

// Sube una foto al bucket público 'alumnos-fotos' (migración 0003) y devuelve su
// URL pública. Si no se adjuntó archivo (input vacío), no hace nada.
async function subirFotoSiCorresponde(
  supabase: SupabaseClient,
  alumnoId: string,
  formData: FormData,
  campo: "foto_inicial" | "foto_actual"
): Promise<{ url: string | null; error: string | null }> {
  const file = formData.get(campo);
  if (!(file instanceof File) || file.size === 0) return { url: null, error: null };

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const ruta = `${alumnoId}/${campo}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from("alumnos-fotos").upload(ruta, file, {
    upsert: true,
    contentType: file.type || "image/jpeg",
  });

  if (error) return { url: null, error: `No se pudo subir la foto (${campo}): ${error.message}` };

  const { data } = supabase.storage.from("alumnos-fotos").getPublicUrl(ruta);
  return { url: data.publicUrl, error: null };
}

type DatosAlumnoForm = {
  dni: string;
  nombre: string | null;
  apellido: string | null;
  fecha_nacimiento: string | null;
  email: string | null;
  celular: string | null;
  turno_id: string | null;
  altura: number | null;
  peso: number | null;
};

function leerYValidarDatosPersonales(formData: FormData): { ok: true; datos: DatosAlumnoForm } | { ok: false; error: string } {
  const dni = String(formData.get("dni") ?? "").trim();
  if (!dni) return { ok: false, error: "El DNI es obligatorio." };

  return {
    ok: true,
    datos: {
      dni,
      nombre: opcional(formData, "nombre"),
      apellido: opcional(formData, "apellido"),
      fecha_nacimiento: opcional(formData, "fecha_nacimiento"),
      email: opcional(formData, "email"),
      celular: opcional(formData, "celular"),
      turno_id: opcional(formData, "turno_id"),
      altura: opcionalNumero(formData, "altura"),
      peso: opcionalNumero(formData, "peso"),
    },
  };
}

export async function crearAlumno(formData: FormData): Promise<ActionResult> {
  const supabase = createServerClient();

  const parsed = leerYValidarDatosPersonales(formData);
  if (!parsed.ok) return parsed;

  const plan_id = String(formData.get("plan_id") ?? "");
  if (!plan_id) return { ok: false, error: "Elegí un plan para el alumno." };

  const { data: alumno, error: alumnoError } = await supabase.from("alumno").insert(parsed.datos).select("id").single();

  if (alumnoError || !alumno) {
    if (alumnoError?.code === POSTGRES_UNIQUE_VIOLATION) {
      return { ok: false, error: "Ya existe un alumno registrado con ese DNI." };
    }
    return { ok: false, error: `No se pudo crear el alumno: ${alumnoError?.message ?? "error desconocido"}` };
  }

  // Las fotos se suben recién acá porque necesitamos el id del alumno para armar
  // la ruta en el bucket. Si falla la subida, el alumno ya quedó creado (mismo
  // criterio pragmático que usa crearPlan con el precio inicial).
  const fotoInicial = await subirFotoSiCorresponde(supabase, alumno.id, formData, "foto_inicial");
  if (fotoInicial.error) return { ok: false, error: `Alumno creado, pero ${fotoInicial.error}` };

  const fotoActual = await subirFotoSiCorresponde(supabase, alumno.id, formData, "foto_actual");
  if (fotoActual.error) return { ok: false, error: `Alumno creado, pero ${fotoActual.error}` };

  if (fotoInicial.url || fotoActual.url) {
    const { error: fotosError } = await supabase
      .from("alumno")
      .update({
        ...(fotoInicial.url ? { foto_inicial_url: fotoInicial.url } : {}),
        ...(fotoActual.url ? { foto_actual_url: fotoActual.url } : {}),
      })
      .eq("id", alumno.id);
    if (fotosError) return { ok: false, error: `Alumno creado, pero no se pudieron guardar las fotos: ${fotosError.message}` };
  }

  const aplicaPromocion = formData.get("aplicar_promocion") === "on";
  let precio_acordado: number | null = null;
  let promocion_id: string | null = null;
  let autorizado_por: string | null = null;

  if (aplicaPromocion) {
    precio_acordado = opcionalNumero(formData, "precio");
    if (precio_acordado === null || precio_acordado <= 0) {
      return { ok: false, error: "Alumno creado, pero el precio de la promoción no es válido (debe ser mayor a 0)." };
    }
    promocion_id = opcional(formData, "promocion_id");
    autorizado_por = await buscarAdminAutorizador(supabase);
    if (!autorizado_por) {
      return {
        ok: false,
        error: "Alumno creado, pero no se encontró un usuario administrador para autorizar el precio promocional.",
      };
    }
  }

  const { error: inscripcionError } = await supabase.from("inscripcion").insert({
    alumno_id: alumno.id,
    plan_id,
    fecha_inicio: new Date().toISOString().slice(0, 10),
    precio_acordado,
    promocion_id,
    autorizado_por,
  });

  if (inscripcionError) {
    return { ok: false, error: `Alumno creado, pero falló la asignación del plan: ${inscripcionError.message}` };
  }

  revalidatePath("/alumnos");
  revalidatePath("/planes");
  return { ok: true };
}

export async function actualizarAlumno(alumnoId: string, formData: FormData): Promise<ActionResult> {
  const supabase = createServerClient();

  const parsed = leerYValidarDatosPersonales(formData);
  if (!parsed.ok) return parsed;

  const estado = String(formData.get("estado") ?? "activo");

  const fotoInicial = await subirFotoSiCorresponde(supabase, alumnoId, formData, "foto_inicial");
  if (fotoInicial.error) return { ok: false, error: fotoInicial.error };

  const fotoActual = await subirFotoSiCorresponde(supabase, alumnoId, formData, "foto_actual");
  if (fotoActual.error) return { ok: false, error: fotoActual.error };

  const { error } = await supabase
    .from("alumno")
    .update({
      ...parsed.datos,
      estado,
      ...(fotoInicial.url ? { foto_inicial_url: fotoInicial.url } : {}),
      ...(fotoActual.url ? { foto_actual_url: fotoActual.url } : {}),
    })
    .eq("id", alumnoId);

  if (error) {
    if (error.code === POSTGRES_UNIQUE_VIOLATION) {
      return { ok: false, error: "Ya existe un alumno registrado con ese DNI." };
    }
    return { ok: false, error: `No se pudo actualizar el alumno: ${error.message}` };
  }

  revalidatePath("/alumnos");
  revalidatePath(`/alumnos/${alumnoId}`);
  return { ok: true };
}

// El alumno solo se puede eliminar físicamente si no tiene ninguna inscripción
// (inscripcion.alumno_id no tiene ON DELETE CASCADE, así que la base lo impide
// con un error de FK). En la práctica, como el alta siempre crea una inscripción,
// esto casi nunca va a poder completarse — es intencional: preserva el historial
// de planes/cuotas/asistencia de la persona. Para dejar de contarlo como alumno
// activo, usar el estado "De baja" desde Editar.
export async function eliminarAlumno(alumnoId: string): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("alumno").delete().eq("id", alumnoId);

  if (error) {
    if (error.code === POSTGRES_FOREIGN_KEY_VIOLATION) {
      return {
        ok: false,
        error:
          "Este alumno tiene un plan asignado (y va a tener historial de cuotas/asistencia) y no se puede eliminar. " +
          "Si ya no concurre, marcalo como \"De baja\" desde Editar en su lugar.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/alumnos");
  revalidatePath("/planes");
  return { ok: true };
}
