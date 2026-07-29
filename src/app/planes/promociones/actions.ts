"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "../actions";

function leerPlanIds(formData: FormData): string[] {
  return formData.getAll("plan_ids").map(String).filter(Boolean);
}

async function sincronizarPlanesDePromocion(
  supabase: ReturnType<typeof createServerClient>,
  promocionId: string,
  planIds: string[]
): Promise<{ error: string | null }> {
  const { error: deleteError } = await supabase.from("promocion_plan").delete().eq("promocion_id", promocionId);
  if (deleteError) return { error: `No se pudieron actualizar los planes de la promoción: ${deleteError.message}` };

  if (planIds.length === 0) return { error: null };

  const { error: insertError } = await supabase
    .from("promocion_plan")
    .insert(planIds.map((plan_id) => ({ promocion_id: promocionId, plan_id })));

  if (insertError) return { error: `No se pudieron asociar los planes: ${insertError.message}` };
  return { error: null };
}

export async function crearPromocion(formData: FormData): Promise<ActionResult> {
  const supabase = createServerClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { ok: false, error: "El nombre de la promoción es obligatorio." };

  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const fecha_inicio = String(formData.get("fecha_inicio") ?? "") || null;
  const fecha_fin = String(formData.get("fecha_fin") ?? "") || null;
  const planIds = leerPlanIds(formData);

  if (planIds.length === 0) {
    return { ok: false, error: "Elegí al menos un plan al que aplique la promoción." };
  }

  const { data: promocion, error } = await supabase
    .from("promocion")
    .insert({ nombre, descripcion, fecha_inicio, fecha_fin })
    .select("id")
    .single();

  if (error || !promocion) {
    return { ok: false, error: `No se pudo crear la promoción: ${error?.message ?? "error desconocido"}` };
  }

  const { error: relError } = await sincronizarPlanesDePromocion(supabase, promocion.id, planIds);
  if (relError) return { ok: false, error: relError };

  revalidatePath("/planes/promociones");
  return { ok: true };
}

export async function actualizarPromocion(promocionId: string, formData: FormData): Promise<ActionResult> {
  const supabase = createServerClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { ok: false, error: "El nombre de la promoción es obligatorio." };

  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const fecha_inicio = String(formData.get("fecha_inicio") ?? "") || null;
  const fecha_fin = String(formData.get("fecha_fin") ?? "") || null;
  const planIds = leerPlanIds(formData);

  if (planIds.length === 0) {
    return { ok: false, error: "Elegí al menos un plan al que aplique la promoción." };
  }

  const { error } = await supabase
    .from("promocion")
    .update({ nombre, descripcion, fecha_inicio, fecha_fin })
    .eq("id", promocionId);

  if (error) return { ok: false, error: `No se pudo actualizar la promoción: ${error.message}` };

  const { error: relError } = await sincronizarPlanesDePromocion(supabase, promocionId, planIds);
  if (relError) return { ok: false, error: relError };

  revalidatePath("/planes/promociones");
  return { ok: true };
}

export async function desactivarPromocion(promocionId: string): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("promocion").update({ activa: false }).eq("id", promocionId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/planes/promociones");
  return { ok: true };
}

export async function reactivarPromocion(promocionId: string): Promise<ActionResult> {
  const supabase = createServerClient();
  const { error } = await supabase.from("promocion").update({ activa: true }).eq("id", promocionId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/planes/promociones");
  return { ok: true };
}
