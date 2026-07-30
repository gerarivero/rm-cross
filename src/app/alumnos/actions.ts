"use server";

import { revalidatePath } from "next/cache";
import { buscarAdminAutorizador } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { crearCuotaInicial } from "../cuotas/actions";

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

// Crea la inscripción (con precio promocional opcional) y su cuota inicial para
// un alumno ya existente. Usado tanto por el alta de alumno (crearAlumno) como
// por la re-inscripción de un alumno que no tiene plan activo (reinscribirAlumno).
async function crearInscripcionConCuota(
  supabase: SupabaseClient,
  alumnoId: string,
  formData: FormData,
  fechaInicio: string
): Promise<{ error: string | null }> {
  const plan_id = String(formData.get("plan_id") ?? "");
  if (!plan_id) return { error: "Elegí un plan para el alumno." };

  const aplicaPromocion = formData.get("aplicar_promocion") === "on";
  let precio_acordado: number | null = null;
  let promocion_id: string | null = null;
  let autorizado_por: string | null = null;

  if (aplicaPromocion) {
    precio_acordado = opcionalNumero(formData, "precio");
    if (precio_acordado === null || precio_acordado <= 0) {
      return { error: "el precio de la promoción no es válido (debe ser mayor a 0)." };
    }
    promocion_id = opcional(formData, "promocion_id");
    autorizado_por = await buscarAdminAutorizador(supabase);
    if (!autorizado_por) {
      return { error: "no se encontró un usuario administrador para autorizar el precio promocional." };
    }
  }

  const { data: inscripcion, error: inscripcionError } = await supabase
    .from("inscripcion")
    .insert({
      alumno_id: alumnoId,
      plan_id,
      fecha_inicio: fechaInicio,
      precio_acordado,
      promocion_id,
      autorizado_por,
    })
    .select("id")
    .single();

  if (inscripcionError || !inscripcion) {
    return { error: `falló la asignación del plan: ${inscripcionError?.message ?? "error desconocido"}` };
  }

  // La cuota se cobra por precio_acordado si se aplicó promoción; si no, por el
  // precio de lista vigente del plan (mismo patrón que ya usa src/app/planes/data.ts).
  let montoCuota = precio_acordado;
  if (montoCuota === null) {
    const { data: precioVigenteRow, error: precioError } = await supabase
      .from("plan_precio_historico")
      .select("precio")
      .eq("plan_id", plan_id)
      .is("vigente_hasta", null)
      .maybeSingle();
    if (precioError) {
      return { error: `no se pudo leer el precio del plan: ${precioError.message}` };
    }
    montoCuota = precioVigenteRow?.precio ?? null;
  }

  if (montoCuota !== null) {
    const { error: cuotaError } = await crearCuotaInicial(supabase, inscripcion.id, montoCuota, fechaInicio);
    if (cuotaError) return { error: cuotaError };
  }

  return { error: null };
}

export async function crearAlumno(formData: FormData): Promise<ActionResult> {
  const supabase = createServerClient();

  const parsed = leerYValidarDatosPersonales(formData);
  if (!parsed.ok) return parsed;

  if (!String(formData.get("plan_id") ?? "")) return { ok: false, error: "Elegí un plan para el alumno." };

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

  const fechaInicio = new Date().toISOString().slice(0, 10);
  const { error: inscripcionError } = await crearInscripcionConCuota(supabase, alumno.id, formData, fechaInicio);
  if (inscripcionError) return { ok: false, error: `Alumno creado, pero ${inscripcionError}` };

  revalidatePath("/alumnos");
  revalidatePath("/planes");
  revalidatePath("/cuotas");
  return { ok: true };
}

// Re-inscribe a un alumno que no tiene una inscripción activa (dado de baja, o
// con la inscripción anterior finalizada) — a una fecha y un plan elegidos, que
// pueden ser distintos a los de la inscripción anterior.
export async function reinscribirAlumno(alumnoId: string, formData: FormData): Promise<ActionResult> {
  const supabase = createServerClient();

  const fechaInicio = opcional(formData, "fecha_inicio") ?? new Date().toISOString().slice(0, 10);

  // Cierre defensivo: normalmente no debería quedar ninguna inscripción activa acá
  // (actualizarAlumno ya cierra la inscripción al dar de baja), pero cubre el caso
  // de reinscribir sin haber pasado por "de baja" primero.
  const { error: cierreError } = await supabase
    .from("inscripcion")
    .update({ estado: "finalizada", fecha_fin: fechaInicio })
    .eq("alumno_id", alumnoId)
    .eq("estado", "activa");
  if (cierreError) return { ok: false, error: `No se pudo cerrar la inscripción anterior: ${cierreError.message}` };

  const { error: alumnoError } = await supabase.from("alumno").update({ estado: "activo" }).eq("id", alumnoId);
  if (alumnoError) return { ok: false, error: `No se pudo reactivar al alumno: ${alumnoError.message}` };

  const { error: inscripcionError } = await crearInscripcionConCuota(supabase, alumnoId, formData, fechaInicio);
  if (inscripcionError) return { ok: false, error: `Alumno reactivado, pero ${inscripcionError}` };

  revalidatePath("/alumnos");
  revalidatePath(`/alumnos/${alumnoId}`);
  revalidatePath("/planes");
  revalidatePath("/cuotas");
  return { ok: true };
}

export async function actualizarAlumno(alumnoId: string, formData: FormData): Promise<ActionResult> {
  const supabase = createServerClient();

  const parsed = leerYValidarDatosPersonales(formData);
  if (!parsed.ok) return parsed;

  const estado = String(formData.get("estado") ?? "activo");

  // Al dar de baja, se cierra la inscripción activa (si hay una) con fecha_fin =
  // hoy, para que el historial de inscripciones registre cuánto duró el período
  // real, en vez de dejarlo abierto hasta que el alumno se reinscriba.
  if (estado === "de_baja") {
    const { error: cierreError } = await supabase
      .from("inscripcion")
      .update({ estado: "finalizada", fecha_fin: new Date().toISOString().slice(0, 10) })
      .eq("alumno_id", alumnoId)
      .eq("estado", "activa");
    if (cierreError) return { ok: false, error: `No se pudo cerrar la inscripción activa: ${cierreError.message}` };
  }

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

// Eliminar un alumno borra en cascada su inscripción, cuotas y pagos
// (migración 0005_eliminar_alumno_en_cascada.sql) — a diferencia de Planes, acá sí
// se permite borrar aunque tenga un plan asignado. El plan en sí nunca se toca,
// solo el vínculo (inscripcion) y los registros que dependen de esa inscripción.
export async function eliminarAlumno(alumnoId: string): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("alumno").delete().eq("id", alumnoId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/alumnos");
  revalidatePath("/planes");
  revalidatePath("/cuotas");
  return { ok: true };
}
