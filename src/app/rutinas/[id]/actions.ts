"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import type { TipoActividad } from "@/lib/supabase/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

type SupabaseClient = ReturnType<typeof createServerClient>;

const MAX_DIAS_POR_SEMANA = 7;

function revalidarRutina(rutinaId: string) {
  revalidatePath(`/rutinas/${rutinaId}`);
}

async function siguienteOrden(supabase: SupabaseClient, tabla: string, columnaFiltro: string, valorFiltro: string): Promise<number> {
  const { data } = await supabase
    .from(tabla)
    .select("orden")
    .eq(columnaFiltro, valorFiltro)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.orden ?? -1) + 1;
}

export async function agregarDia(rutinaId: string, semanaId: string): Promise<ActionResult> {
  const supabase = createServerClient();

  // Se usa el máximo numero_dia existente (no la cantidad de filas): si se borró
  // un día del medio, la cantidad de filas ya no coincide con el próximo número
  // libre y contar filas podría chocar con el unique (semana_id, numero_dia).
  const { data: ultimoDia, error: diasError } = await supabase
    .from("rutina_dia")
    .select("numero_dia")
    .eq("semana_id", semanaId)
    .order("numero_dia", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (diasError) return { ok: false, error: diasError.message };

  const numeroDia = (ultimoDia?.numero_dia ?? 0) + 1;
  if (numeroDia > MAX_DIAS_POR_SEMANA) {
    return { ok: false, error: `Una semana no puede tener más de ${MAX_DIAS_POR_SEMANA} días.` };
  }

  const { error } = await supabase.from("rutina_dia").insert({ semana_id: semanaId, numero_dia: numeroDia });
  if (error) return { ok: false, error: `No se pudo agregar el día: ${error.message}` };

  revalidarRutina(rutinaId);
  return { ok: true };
}

export async function eliminarDia(rutinaId: string, diaId: string): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("rutina_dia").delete().eq("id", diaId);
  if (error) return { ok: false, error: error.message };

  revalidarRutina(rutinaId);
  return { ok: true };
}

export async function agregarActividad(rutinaId: string, diaId: string, tipo: TipoActividad): Promise<ActionResult> {
  const supabase = createServerClient();
  const orden = await siguienteOrden(supabase, "rutina_actividad", "dia_id", diaId);

  const { error } = await supabase.from("rutina_actividad").insert({ dia_id: diaId, tipo, orden });
  if (error) return { ok: false, error: `No se pudo agregar la actividad: ${error.message}` };

  revalidarRutina(rutinaId);
  return { ok: true };
}

export async function eliminarActividad(rutinaId: string, actividadId: string): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("rutina_actividad").delete().eq("id", actividadId);
  if (error) return { ok: false, error: error.message };

  revalidarRutina(rutinaId);
  return { ok: true };
}

function leerDatosEjercicioForm(formData: FormData) {
  const ejercicio_id = String(formData.get("ejercicio_id") ?? "");
  const intensidad = String(formData.get("intensidad") ?? "").trim() || null;
  const seriesRaw = String(formData.get("series") ?? "").trim();
  const repeticionesRaw = String(formData.get("repeticiones") ?? "").trim();
  const duracionRaw = String(formData.get("duracion_minutos") ?? "").trim();
  const notas = String(formData.get("notas") ?? "").trim() || null;

  return {
    ejercicio_id,
    intensidad,
    series: seriesRaw ? Number(seriesRaw) : null,
    repeticiones: repeticionesRaw ? Number(repeticionesRaw) : null,
    duracion_minutos: duracionRaw ? Number(duracionRaw) : null,
    notas,
  };
}

export async function agregarEjercicio(rutinaId: string, actividadId: string, formData: FormData): Promise<ActionResult> {
  const datos = leerDatosEjercicioForm(formData);
  if (!datos.ejercicio_id) return { ok: false, error: "Elegí un ejercicio." };

  const supabase = createServerClient();
  const orden = await siguienteOrden(supabase, "rutina_ejercicio", "actividad_id", actividadId);

  const { error } = await supabase.from("rutina_ejercicio").insert({ actividad_id: actividadId, orden, ...datos });
  if (error) return { ok: false, error: `No se pudo agregar el ejercicio: ${error.message}` };

  revalidarRutina(rutinaId);
  return { ok: true };
}

export async function actualizarEjercicioDeRutina(rutinaId: string, rutinaEjercicioId: string, formData: FormData): Promise<ActionResult> {
  const datos = leerDatosEjercicioForm(formData);
  if (!datos.ejercicio_id) return { ok: false, error: "Elegí un ejercicio." };

  const supabase = createServerClient();
  const { error } = await supabase.from("rutina_ejercicio").update(datos).eq("id", rutinaEjercicioId);
  if (error) return { ok: false, error: `No se pudo actualizar el ejercicio: ${error.message}` };

  revalidarRutina(rutinaId);
  return { ok: true };
}

export async function eliminarEjercicioDeRutina(rutinaId: string, rutinaEjercicioId: string): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("rutina_ejercicio").delete().eq("id", rutinaEjercicioId);
  if (error) return { ok: false, error: error.message };

  revalidarRutina(rutinaId);
  return { ok: true };
}

// Asigna la rutina a un alumno. Si el alumno ya tiene otra rutina activa, la
// pasa a "finalizada" antes de crear la nueva asignación (mismo criterio que
// el cierre de inscripción al reinscribir un alumno) — el índice único parcial
// rutina_activa_unica_por_alumno además lo garantiza a nivel de base.
export async function asignarRutina(rutinaId: string, formData: FormData): Promise<ActionResult> {
  const alumno_id = String(formData.get("alumno_id") ?? "");
  if (!alumno_id) return { ok: false, error: "Elegí un alumno." };
  const fecha_inicio = String(formData.get("fecha_inicio") ?? "").trim() || new Date().toISOString().slice(0, 10);
  const fecha_fin = String(formData.get("fecha_fin") ?? "").trim();
  if (!fecha_fin) return { ok: false, error: "Elegí una fecha de fin." };
  if (fecha_fin < fecha_inicio) return { ok: false, error: "La fecha de fin no puede ser anterior a la de inicio." };

  const supabase = createServerClient();

  const { error: cierreError } = await supabase
    .from("rutina_asignacion")
    .update({ estado: "finalizada" })
    .eq("alumno_id", alumno_id)
    .eq("estado", "activa");
  if (cierreError) return { ok: false, error: `No se pudo cerrar la rutina anterior del alumno: ${cierreError.message}` };

  const { error } = await supabase.from("rutina_asignacion").insert({ rutina_id: rutinaId, alumno_id, fecha_inicio, fecha_fin });
  if (error) return { ok: false, error: `No se pudo asignar la rutina: ${error.message}` };

  revalidarRutina(rutinaId);
  revalidatePath(`/alumnos/${alumno_id}`);
  return { ok: true };
}
