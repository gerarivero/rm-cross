import { createServerClient } from "@/lib/supabase/server";
import type { ConfiguracionPagos, CuotaConDetalle } from "@/lib/supabase/types";
import { calcularEstadoYRecargo } from "./estado";

export async function getConfiguracionPagos(): Promise<ConfiguracionPagos> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("configuracion_pagos").select("*").limit(1).maybeSingle();
  if (error) throw new Error(`No se pudo cargar la configuración de pagos: ${error.message}`);
  if (!data) throw new Error("No hay configuración de pagos cargada.");
  return data;
}

export async function getCuotas(): Promise<CuotaConDetalle[]> {
  const supabase = createServerClient();

  const [{ data: cuotas, error }, config] = await Promise.all([
    supabase
      .from("cuota")
      .select("*, inscripcion:inscripcion_id(alumno:alumno_id(id, dni, nombre, apellido), plan:plan_id(id, nombre))")
      .order("fecha_vencimiento", { ascending: false }),
    getConfiguracionPagos(),
  ]);

  if (error) throw new Error(`No se pudieron cargar las cuotas: ${error.message}`);

  const hoy = new Date().toISOString().slice(0, 10);

  return (cuotas ?? []).map((row: any) => {
    const { estado, recargo } = calcularEstadoYRecargo(row, config, hoy);
    return {
      id: row.id,
      inscripcion_id: row.inscripcion_id,
      periodo_desde: row.periodo_desde,
      periodo_hasta: row.periodo_hasta,
      fecha_vencimiento: row.fecha_vencimiento,
      monto_base: row.monto_base,
      recargo_aplicado: row.recargo_aplicado,
      estado: row.estado,
      creado_en: row.creado_en,
      alumno: row.inscripcion.alumno,
      plan: row.inscripcion.plan,
      estado_efectivo: estado,
      recargo_efectivo: recargo,
    } as CuotaConDetalle;
  });
}
