import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { RutinaAsignacionConAlumno, RutinaDetalle } from "@/lib/supabase/types";

export { getEjercicios } from "../catalogo/data";

export async function getRutinaDetalle(rutinaId: string): Promise<RutinaDetalle> {
  const supabase = createServerClient();

  const { data: rutinaRow, error } = await supabase.from("rutina").select("*").eq("id", rutinaId).maybeSingle();
  if (error) throw new Error(`No se pudo cargar la rutina: ${error.message}`);
  if (!rutinaRow) notFound();

  const { data: semanas, error: semanasError } = await supabase
    .from("rutina_semana")
    .select(
      `id, rutina_id, numero_semana,
       dias:rutina_dia(
         id, semana_id, numero_dia,
         actividades:rutina_actividad(
           id, dia_id, tipo, orden,
           ejercicios:rutina_ejercicio(
             id, actividad_id, ejercicio_id, orden, intensidad, series, repeticiones, duracion_minutos, notas,
             ejercicio:ejercicio_id(id, nombre, musculo:musculo_id(id, nombre))
           )
         )
       )`
    )
    .eq("rutina_id", rutinaId)
    .order("numero_semana");

  if (semanasError) throw new Error(`No se pudo cargar la estructura de la rutina: ${semanasError.message}`);

  const semanasOrdenadas = ((semanas ?? []) as any[]).map((semana) => ({
    ...semana,
    dias: [...(semana.dias ?? [])]
      .sort((a: any, b: any) => a.numero_dia - b.numero_dia)
      .map((dia: any) => ({
        ...dia,
        actividades: [...(dia.actividades ?? [])]
          .sort((a: any, b: any) => a.orden - b.orden)
          .map((actividad: any) => ({
            ...actividad,
            ejercicios: [...(actividad.ejercicios ?? [])].sort((a: any, b: any) => a.orden - b.orden),
          })),
      })),
  }));

  return { ...(rutinaRow as any), semanas: semanasOrdenadas } as RutinaDetalle;
}

export async function getAsignaciones(rutinaId: string): Promise<RutinaAsignacionConAlumno[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("rutina_asignacion")
    .select("*, alumno:alumno_id(id, dni, nombre, apellido)")
    .eq("rutina_id", rutinaId)
    .order("creado_en", { ascending: false });

  if (error) throw new Error(`No se pudieron cargar las asignaciones: ${error.message}`);
  return (data ?? []) as RutinaAsignacionConAlumno[];
}

export async function getAlumnosParaAsignar(): Promise<{ id: string; dni: string; nombre: string | null; apellido: string | null }[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("alumno")
    .select("id, dni, nombre, apellido")
    .eq("estado", "activo")
    .order("apellido");

  if (error) throw new Error(`No se pudieron cargar los alumnos: ${error.message}`);
  return data ?? [];
}
