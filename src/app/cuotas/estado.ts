import type { ConfiguracionPagos, Cuota, Pago } from "@/lib/supabase/types";

// Suma `n` meses a una fecha ISO ("YYYY-MM-DD"), respetando fin de mes
// (ej. 31/ene + 1 mes -> 28 o 29/feb, no 3/mar).
export function sumarMeses(fechaISO: string, n: number): string {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const primerDiaMesDestino = new Date(Date.UTC(y, m - 1 + n, 1));
  const ultimoDiaMesDestino = new Date(
    Date.UTC(primerDiaMesDestino.getUTCFullYear(), primerDiaMesDestino.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const dia = Math.min(d, ultimoDiaMesDestino);
  const resultado = new Date(Date.UTC(primerDiaMesDestino.getUTCFullYear(), primerDiaMesDestino.getUTCMonth(), dia));
  return resultado.toISOString().slice(0, 10);
}

function sumarDias(fechaISO: string, dias: number): string {
  const [y, m, d] = fechaISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
}

function calcularRecargo(base: number, configuracion: Pick<ConfiguracionPagos, "tipo_recargo" | "valor_recargo">): number {
  if (base <= 0) return 0;
  return configuracion.tipo_recargo === "porcentaje"
    ? Math.round(base * (configuracion.valor_recargo / 100) * 100) / 100
    : configuracion.valor_recargo;
}

export type ResultadoEstadoCuota = {
  estado: "pagada" | "adeudada" | "vencida";
  totalPagado: number;
  saldoCapital: number; // monto_base - totalPagado, nunca negativo
  recargo: number; // 0 si no está vencida
  totalAdeudado: number; // saldoCapital + recargo, lo que falta pagar hoy
};

// Sin cron todavía: el estado "vencida", el recargo y el saldo se calculan al
// vuelo a partir de la lista de pagos, comparando contra `fechaReferenciaISO`
// (normalmente "hoy"). Si la cuota ya quedó marcada como pagada en la base,
// se respeta eso tal cual (no se recalcula retroactivamente).
//
// El recargo se calcula sobre el saldo que quedaba pendiente AL MOMENTO DEL
// VENCIMIENTO (fecha_vencimiento + dias_gracia): los pagos hechos antes de esa
// fecha reducen la base sobre la que se calcula el interés; los pagos hechos
// después solo descuentan del total a pagar, pero no vuelven a recalcular el
// interés ya generado (si no, el interés "desaparecería" con solo pagar el
// capital y dejar el recargo sin pagar).
export function calcularEstadoCuota(
  cuota: Pick<Cuota, "estado" | "fecha_vencimiento" | "monto_base" | "recargo_aplicado">,
  pagos: Pick<Pago, "monto" | "fecha_pago">[],
  configuracion: Pick<ConfiguracionPagos, "dias_gracia" | "tipo_recargo" | "valor_recargo">,
  fechaReferenciaISO: string
): ResultadoEstadoCuota {
  const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);

  if (cuota.estado === "pagada") {
    return { estado: "pagada", totalPagado, saldoCapital: 0, recargo: cuota.recargo_aplicado, totalAdeudado: 0 };
  }

  const saldoCapital = Math.max(cuota.monto_base - totalPagado, 0);

  if (saldoCapital <= 0) {
    return { estado: "pagada", totalPagado, saldoCapital: 0, recargo: 0, totalAdeudado: 0 };
  }

  const finDeGracia = sumarDias(cuota.fecha_vencimiento, configuracion.dias_gracia);
  const estaVencida = fechaReferenciaISO > finDeGracia;

  if (!estaVencida) {
    return { estado: "adeudada", totalPagado, saldoCapital, recargo: 0, totalAdeudado: saldoCapital };
  }

  const pagadoAntesDeVencer = pagos
    .filter((p) => p.fecha_pago.slice(0, 10) <= finDeGracia)
    .reduce((acc, p) => acc + p.monto, 0);
  const saldoAlVencer = Math.max(cuota.monto_base - pagadoAntesDeVencer, 0);
  const recargo = calcularRecargo(saldoAlVencer, configuracion);

  return { estado: "vencida", totalPagado, saldoCapital, recargo, totalAdeudado: saldoCapital + recargo };
}
