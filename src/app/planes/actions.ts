"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const POSTGRES_FOREIGN_KEY_VIOLATION = "23503";

type SupabaseClient = ReturnType<typeof createServerClient>;

// Cierra el precio vigente (si existe) y abre uno nuevo desde `hoy`.
// Nota: son dos operaciones secuenciales, no atómicas — para el volumen de
// escrituras de este módulo (altas manuales de precio) el riesgo es bajo,
// pero si en el futuro hace falta atomicidad real conviene moverlo a una
// función de Postgres (rpc) que haga ambos updates en una transacción.
async function rotarPrecioVigente(
  supabase: SupabaseClient,
  planId: string,
  nuevoPrecio: number,
  hoy: string
): Promise<{ error: string | null }> {
  const { error: cierreError } = await supabase
    .from("plan_precio_historico")
    .update({ vigente_hasta: hoy })
    .eq("plan_id", planId)
    .is("vigente_hasta", null);

  if (cierreError) {
    return { error: `No se pudo cerrar el precio anterior: ${cierreError.message}` };
  }

  const { error: altaError } = await supabase
    .from("plan_precio_historico")
    .insert({ plan_id: planId, precio: nuevoPrecio, vigente_desde: hoy });

  if (altaError) {
    return { error: `No se pudo cargar el nuevo precio: ${altaError.message}` };
  }

  return { error: null };
}

type DatosPlanForm = {
  disciplina_id: string;
  nombre: string;
  dias_por_semana: number | null;
  acceso_libre: boolean;
  precio: number;
};

function leerYValidarFormularioPlan(formData: FormData): { ok: true; datos: DatosPlanForm } | { ok: false; error: string } {
  const disciplina_id = String(formData.get("disciplina_id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const accesoLibre = formData.get("acceso_libre") === "on";
  const diasPorSemanaRaw = formData.get("dias_por_semana");
  const precioRaw = formData.get("precio");

  if (!disciplina_id || !nombre) {
    return { ok: false, error: "Disciplina y nombre son obligatorios." };
  }

  const precio = Number(precioRaw);
  if (!precioRaw || Number.isNaN(precio) || precio <= 0) {
    return { ok: false, error: "El precio debe ser un número mayor a 0." };
  }

  const dias_por_semana = accesoLibre ? null : Number(diasPorSemanaRaw);
  if (!accesoLibre && (!diasPorSemanaRaw || dias_por_semana === null || dias_por_semana < 1 || dias_por_semana > 7)) {
    return { ok: false, error: "La frecuencia semanal debe estar entre 1 y 7 días, o marcar acceso libre." };
  }

  return { ok: true, datos: { disciplina_id, nombre, dias_por_semana, acceso_libre: accesoLibre, precio } };
}

export async function crearPlan(formData: FormData): Promise<ActionResult> {
  const supabase = createServerClient();

  const parsed = leerYValidarFormularioPlan(formData);
  if (!parsed.ok) return parsed;
  const { disciplina_id, nombre, dias_por_semana, acceso_libre, precio } = parsed.datos;

  const { data: plan, error: planError } = await supabase
    .from("plan")
    .insert({ disciplina_id, nombre, dias_por_semana, acceso_libre })
    .select("id")
    .single();

  if (planError || !plan) {
    return { ok: false, error: `No se pudo crear el plan: ${planError?.message ?? "error desconocido"}` };
  }

  const { error: precioError } = await supabase.from("plan_precio_historico").insert({
    plan_id: plan.id,
    precio,
    vigente_desde: new Date().toISOString().slice(0, 10),
  });

  if (precioError) {
    return { ok: false, error: `Plan creado pero falló el precio inicial: ${precioError.message}` };
  }

  revalidatePath("/planes");
  return { ok: true };
}

// Edita los datos del plan y, solo si el precio enviado difiere del vigente,
// rota el precio (evita filas de historial redundantes al editar solo el
// nombre o la frecuencia).
export async function actualizarPlan(planId: string, formData: FormData): Promise<ActionResult> {
  const supabase = createServerClient();

  const parsed = leerYValidarFormularioPlan(formData);
  if (!parsed.ok) return parsed;
  const { disciplina_id, nombre, dias_por_semana, acceso_libre, precio } = parsed.datos;

  const { error: updateError } = await supabase
    .from("plan")
    .update({ disciplina_id, nombre, dias_por_semana, acceso_libre })
    .eq("id", planId);

  if (updateError) {
    return { ok: false, error: `No se pudo actualizar el plan: ${updateError.message}` };
  }

  const { data: precioVigenteRow, error: precioVigenteError } = await supabase
    .from("plan_precio_historico")
    .select("precio")
    .eq("plan_id", planId)
    .is("vigente_hasta", null)
    .maybeSingle();

  if (precioVigenteError) {
    return { ok: false, error: `No se pudo leer el precio vigente: ${precioVigenteError.message}` };
  }

  const precioVigente = precioVigenteRow?.precio ?? null;
  if (precioVigente !== precio) {
    const hoy = new Date().toISOString().slice(0, 10);
    const { error } = await rotarPrecioVigente(supabase, planId, precio, hoy);
    if (error) return { ok: false, error };
  }

  revalidatePath("/planes");
  return { ok: true };
}

export async function actualizarPrecioPlan(planId: string, formData: FormData): Promise<ActionResult> {
  const precio = Number(formData.get("precio"));

  if (!precio || Number.isNaN(precio) || precio <= 0) {
    return { ok: false, error: "El precio debe ser un número mayor a 0." };
  }

  const supabase = createServerClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const { error } = await rotarPrecioVigente(supabase, planId, precio, hoy);
  if (error) return { ok: false, error };

  revalidatePath("/planes");
  return { ok: true };
}

export async function desactivarPlan(planId: string): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("plan").update({ activo: false }).eq("id", planId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/planes");
  return { ok: true };
}

export async function reactivarPlan(planId: string): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("plan").update({ activo: true }).eq("id", planId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/planes");
  return { ok: true };
}

// Constraint pedido: "un plan no puede ser eliminado si está asignado a un
// alumno". La garantía dura vive en la base (inscripcion.plan_id references
// plan(id) ON DELETE RESTRICT, ver supabase/migrations/0001_planes.sql).
// Acá solo traducimos el error de Postgres a un mensaje entendible y
// sugerimos la alternativa (desactivar en vez de borrar).
export async function eliminarPlan(planId: string): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("plan").delete().eq("id", planId);

  if (error) {
    if (error.code === POSTGRES_FOREIGN_KEY_VIOLATION) {
      return {
        ok: false,
        error:
          "Este plan tiene alumnos inscriptos (activos o históricos) y no se puede eliminar. " +
          "Si ya no lo ofrecés, desactivalo en su lugar: va a dejar de aparecer para nuevas inscripciones " +
          "pero conserva el historial de cuotas de los alumnos que lo tuvieron.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/planes");
  return { ok: true };
}
