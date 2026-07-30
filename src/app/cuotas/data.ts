import { createServerClient } from "@/lib/supabase/server";
import type { ConfiguracionPagos, CuotaConDetalle, CuotaDeAlumno, Pago } from "@/lib/supabase/types";
import { calcularEstadoCuota } from "./estado";

export async function getConfiguracionPagos(): Promise<ConfiguracionPagos> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("configuracion_pagos").select("*").limit(1).maybeSingle();
  if (error) throw new Error(`No se pudo cargar la configuración de pagos: ${error.message}`);
  if (!data) throw new Error("No hay configuración de pagos cargada.");
  return data;
}

function ordenarPagos(pagos: Pago[]): Pago[] {
  return [...pagos].sort((a, b) => a.fecha_pago.localeCompare(b.fecha_pago));
}

export async function getCuotas(): Promise<CuotaConDetalle[]> {
  const supabase = createServerClient();

  const [{ data: cuotas, error }, config] = await Promise.all([
    supabase
      .from("cuota")
      .select(
        "*, inscripcion:inscripcion_id(alumno:alumno_id(id, dni, nombre, apellido), plan:plan_id(id, nombre)), pago(id, cuota_id, monto, fecha_pago, medio, referencia)"
      )
      .order("fecha_vencimiento", { ascending: false }),
    getConfiguracionPagos(),
  ]);

  if (error) throw new Error(`No se pudieron cargar las cuotas: ${error.message}`);

  const hoy = new Date().toISOString().slice(0, 10);

  return (cuotas ?? []).map((row: any) => {
    const pagos = ordenarPagos(row.pago ?? []);
    const resultado = calcularEstadoCuota(row, pagos, config, hoy);
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
      numero_comprobante: row.numero_comprobante,
      alumno: row.inscripcion.alumno,
      plan: row.inscripcion.plan,
      pagos,
      estado_efectivo: resultado.estado,
      recargo_efectivo: resultado.recargo,
      total_pagado: resultado.totalPagado,
      saldo_capital: resultado.saldoCapital,
      total_adeudado: resultado.totalAdeudado,
    } as CuotaConDetalle;
  });
}

// Historial de cuotas de un alumno puntual (todas sus inscripciones, no solo la
// activa), para la card "Registro de Cuotas" del detalle de Alumno.
export async function getCuotasDeAlumno(alumnoId: string): Promise<CuotaDeAlumno[]> {
  const supabase = createServerClient();

  const [{ data: inscripciones, error: inscError }, config] = await Promise.all([
    supabase.from("inscripcion").select("id, plan:plan_id(id, nombre)").eq("alumno_id", alumnoId),
    getConfiguracionPagos(),
  ]);

  if (inscError) throw new Error(`No se pudieron cargar las inscripciones del alumno: ${inscError.message}`);
  if (!inscripciones || inscripciones.length === 0) return [];

  const planPorInscripcion = new Map(inscripciones.map((i: any) => [i.id, i.plan]));
  const inscripcionIds = inscripciones.map((i) => i.id);

  const { data: cuotas, error } = await supabase
    .from("cuota")
    .select("*, pago(id, cuota_id, monto, fecha_pago, medio, referencia)")
    .in("inscripcion_id", inscripcionIds)
    .order("fecha_vencimiento", { ascending: false });

  if (error) throw new Error(`No se pudieron cargar las cuotas del alumno: ${error.message}`);

  const hoy = new Date().toISOString().slice(0, 10);

  return (cuotas ?? []).map((row: any) => {
    const pagos = ordenarPagos(row.pago ?? []);
    const resultado = calcularEstadoCuota(row, pagos, config, hoy);
    const { pago, ...cuota } = row;
    return {
      ...cuota,
      plan: planPorInscripcion.get(row.inscripcion_id) ?? { id: "", nombre: "—" },
      pagos,
      estado_efectivo: resultado.estado,
      recargo_efectivo: resultado.recargo,
      total_pagado: resultado.totalPagado,
      saldo_capital: resultado.saldoCapital,
      total_adeudado: resultado.totalAdeudado,
    } as CuotaDeAlumno;
  });
}

// Cuota puntual con sus pagos, para el comprobante imprimible.
export async function getComprobanteCuota(cuotaId: string) {
  const supabase = createServerClient();

  const { data: row, error } = await supabase
    .from("cuota")
    .select(
      "*, inscripcion:inscripcion_id(alumno:alumno_id(id, dni, nombre, apellido), plan:plan_id(id, nombre)), pago(id, cuota_id, monto, fecha_pago, medio, referencia)"
    )
    .eq("id", cuotaId)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar la cuota: ${error.message}`);
  if (!row) return null;

  return {
    id: row.id,
    numero_comprobante: row.numero_comprobante as number | null,
    periodo_desde: row.periodo_desde as string,
    periodo_hasta: row.periodo_hasta as string,
    monto_base: row.monto_base as number,
    recargo_aplicado: row.recargo_aplicado as number,
    alumno: (row as any).inscripcion.alumno,
    plan: (row as any).inscripcion.plan,
    pagos: ordenarPagos((row as any).pago ?? []),
  };
}
