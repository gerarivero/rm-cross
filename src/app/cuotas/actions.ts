"use server";

import { revalidatePath } from "next/cache";
import { buscarAdminAutorizador } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { Cuota } from "@/lib/supabase/types";
import { calcularEstadoCuota, sumarMeses } from "./estado";

export type ActionResult = { ok: true } | { ok: false; error: string };

type SupabaseClient = ReturnType<typeof createServerClient>;

const POSTGRES_UNIQUE_VIOLATION = "23505";

// Se llama desde crearAlumno/reinscribirAlumno (src/app/alumnos/actions.ts) para la
// cuota inicial de una inscripción, y desde crearProximaCuota (más abajo) para las
// siguientes. Ciclo por aniversario, sin prorrateo, se paga por adelantado (no se
// paga a mes vencido): la cuota se debe abonar ANTES de empezar a entrenar, por eso
// `fecha_vencimiento` es el mismo día de inicio del período, no el día que termina.
// Los `dias_gracia` de la configuración corren desde ahí — ej. alta el 29/jul con 10
// días de gracia => fecha límite de pago sin recargo el 8/ago. `periodo_hasta` (fin
// de la cobertura, = fecha_inicio + 1 mes) queda como el `periodo_desde` de la cuota
// siguiente. Idempotente: si ya existe una cuota para ese (inscripcion_id,
// periodo_desde) no es un error, es un no-op — permite llamarla más de una vez sin
// duplicar cuotas.
export async function crearCuotaInicial(
  supabase: SupabaseClient,
  inscripcionId: string,
  montoBase: number,
  fechaInicioISO: string
): Promise<{ error: string | null }> {
  const periodoHasta = sumarMeses(fechaInicioISO, 1);

  const { error } = await supabase.from("cuota").insert({
    inscripcion_id: inscripcionId,
    periodo_desde: fechaInicioISO,
    periodo_hasta: periodoHasta,
    fecha_vencimiento: fechaInicioISO,
    monto_base: montoBase,
  });

  if (error) {
    if (error.code === POSTGRES_UNIQUE_VIOLATION) return { error: null };
    return { error: `No se pudo generar la cuota: ${error.message}` };
  }
  return { error: null };
}

// Actualiza el monto_base de la(s) cuota(s) todavía no pagadas de una o varias
// inscripciones — se llama tanto al cambiar el precio de lista de un plan
// (src/app/planes/actions.ts, puede afectar a varias inscripciones a la vez) como al
// editar el precio/promoción de la inscripción de un alumno puntual
// (src/app/alumnos/actions.ts). Nunca toca una cuota ya 'pagada' — el histórico de lo
// cobrado no se reescribe.
export async function actualizarCuotasAdeudadasDeInscripciones(
  supabase: SupabaseClient,
  inscripcionIds: string[],
  nuevoMonto: number
): Promise<{ error: string | null }> {
  if (inscripcionIds.length === 0) return { error: null };

  const { error } = await supabase
    .from("cuota")
    .update({ monto_base: nuevoMonto })
    .eq("estado", "adeudada")
    .in("inscripcion_id", inscripcionIds);

  if (error) return { error: `no se pudieron actualizar las cuotas adeudadas: ${error.message}` };
  return { error: null };
}

// Se llama desde registrarPago cuando una cuota queda 100% pagada: genera la cuota
// del período siguiente automáticamente (sin cron ni botón manual — ver
// docs/modelo_datos.md sección 3). Si la inscripción ya no está activa (el alumno fue
// dado de baja), no genera nada.
async function crearProximaCuota(supabase: SupabaseClient, cuotaPagada: Cuota): Promise<{ error: string | null }> {
  const { data: inscripcion, error: inscError } = await supabase
    .from("inscripcion")
    .select("id, estado, plan_id, precio_acordado")
    .eq("id", cuotaPagada.inscripcion_id)
    .maybeSingle();

  if (inscError) return { error: `no se pudo leer la inscripción: ${inscError.message}` };
  if (!inscripcion || inscripcion.estado !== "activa") return { error: null };

  // El precio acordado (promocional) sigue aplicando período tras período; si no
  // hay uno, se usa el precio de lista vigente AL MOMENTO de generar la cuota
  // siguiente (no el que tenía la cuota anterior), para reflejar aumentos de precio.
  let montoCuota: number | null = inscripcion.precio_acordado;
  if (montoCuota === null) {
    const { data: precioVigenteRow, error: precioError } = await supabase
      .from("plan_precio_historico")
      .select("precio")
      .eq("plan_id", inscripcion.plan_id)
      .is("vigente_hasta", null)
      .maybeSingle();
    if (precioError) return { error: `no se pudo leer el precio del plan: ${precioError.message}` };
    montoCuota = precioVigenteRow?.precio ?? null;
  }

  if (montoCuota === null) {
    return { error: "el plan ya no tiene un precio vigente, no se pudo generar la cuota del próximo período." };
  }

  const { error } = await crearCuotaInicial(supabase, inscripcion.id, montoCuota, cuotaPagada.periodo_hasta);
  if (error) return { error: `no se pudo generar la cuota del próximo período: ${error}` };
  return { error: null };
}

export async function registrarPago(cuotaId: string, formData: FormData): Promise<ActionResult> {
  const supabase = createServerClient();

  const { data: cuota, error: cuotaError } = await supabase
    .from("cuota")
    .select("*, pago(monto, fecha_pago)")
    .eq("id", cuotaId)
    .maybeSingle();
  if (cuotaError) return { ok: false, error: cuotaError.message };
  if (!cuota) return { ok: false, error: "No se encontró la cuota." };
  if (cuota.estado === "pagada") return { ok: false, error: "Esta cuota ya está totalmente pagada." };

  const { data: config, error: configError } = await supabase.from("configuracion_pagos").select("*").limit(1).maybeSingle();
  if (configError) return { ok: false, error: configError.message };
  if (!config) return { ok: false, error: "No se encontró la configuración de vencimientos y recargos." };

  const pagosExistentes = (cuota as any).pago as { monto: number; fecha_pago: string }[];
  const hoy = new Date().toISOString().slice(0, 10);
  const estadoActual = calcularEstadoCuota(cuota, pagosExistentes, config, hoy);

  const montoRaw = formData.get("monto");
  const monto = montoRaw ? Number(montoRaw) : estadoActual.totalAdeudado;
  if (!monto || Number.isNaN(monto) || monto <= 0) {
    return { ok: false, error: "El monto a pagar debe ser un número mayor a 0." };
  }

  const medio = String(formData.get("medio") ?? "efectivo");
  const referencia = String(formData.get("referencia") ?? "").trim() || null;
  const registrado_por = await buscarAdminAutorizador(supabase);
  const fecha_pago = new Date().toISOString();

  const { error: pagoError } = await supabase.from("pago").insert({
    cuota_id: cuotaId,
    monto,
    fecha_pago,
    medio,
    referencia,
    registrado_por,
  });

  if (pagoError) return { ok: false, error: `No se pudo registrar el pago: ${pagoError.message}` };

  const estadoDespues = calcularEstadoCuota(cuota, [...pagosExistentes, { monto, fecha_pago }], config, hoy);

  if (estadoDespues.estado === "pagada") {
    const { error: rpcError } = await supabase.rpc("asignar_numero_comprobante", { p_cuota_id: cuotaId });
    if (rpcError) return { ok: false, error: `Pago registrado, pero no se pudo cerrar la cuota: ${rpcError.message}` };

    const { error: proximaError } = await crearProximaCuota(supabase, cuota as Cuota);
    if (proximaError) return { ok: false, error: `Pago registrado, pero ${proximaError}` };
  }

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
