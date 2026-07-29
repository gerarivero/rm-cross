"use server";

import { revalidatePath } from "next/cache";
import { buscarAdminAutorizador } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { calcularEstadoYRecargo, sumarMeses } from "./estado";

export type ActionResult = { ok: true } | { ok: false; error: string };

type SupabaseClient = ReturnType<typeof createServerClient>;

// Se llama desde crearAlumno (src/app/alumnos/actions.ts) justo después de crear la
// inscripción. Ciclo por aniversario, sin prorrateo: la cuota 1 cubre 1 mes exacto
// desde la fecha de inicio, por el monto completo.
export async function crearCuotaInicial(
  supabase: SupabaseClient,
  inscripcionId: string,
  montoBase: number,
  fechaInicioISO: string
): Promise<{ error: string | null }> {
  const fechaVencimiento = sumarMeses(fechaInicioISO, 1);

  const { error } = await supabase.from("cuota").insert({
    inscripcion_id: inscripcionId,
    periodo_desde: fechaInicioISO,
    periodo_hasta: fechaVencimiento,
    fecha_vencimiento: fechaVencimiento,
    monto_base: montoBase,
  });

  if (error) return { error: `No se pudo generar la cuota inicial: ${error.message}` };
  return { error: null };
}

export async function registrarPago(cuotaId: string, formData: FormData): Promise<ActionResult> {
  const supabase = createServerClient();

  const { data: cuota, error: cuotaError } = await supabase.from("cuota").select("*").eq("id", cuotaId).maybeSingle();
  if (cuotaError) return { ok: false, error: cuotaError.message };
  if (!cuota) return { ok: false, error: "No se encontró la cuota." };
  if (cuota.estado === "pagada") return { ok: false, error: "Esta cuota ya está pagada." };

  const { data: config, error: configError } = await supabase.from("configuracion_pagos").select("*").limit(1).maybeSingle();
  if (configError) return { ok: false, error: configError.message };
  if (!config) return { ok: false, error: "No se encontró la configuración de vencimientos y recargos." };

  const hoy = new Date().toISOString().slice(0, 10);
  const { recargo } = calcularEstadoYRecargo(cuota, config, hoy);

  const montoRaw = formData.get("monto");
  const monto = montoRaw ? Number(montoRaw) : cuota.monto_base + recargo;
  if (!monto || Number.isNaN(monto) || monto <= 0) {
    return { ok: false, error: "El monto a pagar debe ser un número mayor a 0." };
  }

  const medio = String(formData.get("medio") ?? "efectivo");
  const referencia = String(formData.get("referencia") ?? "").trim() || null;
  const registrado_por = await buscarAdminAutorizador(supabase);

  const { error: pagoError } = await supabase.from("pago").insert({
    cuota_id: cuotaId,
    monto,
    medio,
    referencia,
    registrado_por,
  });

  if (pagoError) return { ok: false, error: `No se pudo registrar el pago: ${pagoError.message}` };

  const { error: updateError } = await supabase
    .from("cuota")
    .update({ estado: "pagada", recargo_aplicado: recargo })
    .eq("id", cuotaId);

  if (updateError) return { ok: false, error: `Pago registrado, pero no se pudo actualizar la cuota: ${updateError.message}` };

  revalidatePath("/cuotas");
  return { ok: true };
}

export async function actualizarConfiguracionPagos(formData: FormData): Promise<ActionResult> {
  const supabase = createServerClient();

  const dias_gracia = Number(formData.get("dias_gracia"));
  const tipo_recargo = String(formData.get("tipo_recargo") ?? "");
  const valor_recargo = Number(formData.get("valor_recargo"));

  if (!Number.isFinite(dias_gracia) || dias_gracia < 0) {
    return { ok: false, error: "Los días de gracia deben ser un número mayor o igual a 0." };
  }
  if (tipo_recargo !== "porcentaje" && tipo_recargo !== "monto_fijo") {
    return { ok: false, error: "Tipo de recargo inválido." };
  }
  if (!Number.isFinite(valor_recargo) || valor_recargo < 0) {
    return { ok: false, error: "El valor del recargo debe ser un número mayor o igual a 0." };
  }

  const { data: config, error: configError } = await supabase.from("configuracion_pagos").select("id").limit(1).maybeSingle();
  if (configError) return { ok: false, error: configError.message };
  if (!config) return { ok: false, error: "No se encontró la configuración a actualizar." };

  const { error } = await supabase
    .from("configuracion_pagos")
    .update({ dias_gracia, tipo_recargo, valor_recargo, actualizado_en: new Date().toISOString() })
    .eq("id", config.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/cuotas");
  return { ok: true };
}
