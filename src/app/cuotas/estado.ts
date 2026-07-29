import type { ConfiguracionPagos, Cuota } from "@/lib/supabase/types";

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

export type ResultadoEstadoCuota = { estado: "pagada" | "adeudada" | "vencida"; recargo: number };

// Sin cron todavía: el estado "vencida" y el recargo se calculan al vuelo,
// comparando contra `fechaReferenciaISO` (normalmente "hoy"). Si la cuota ya
// está pagada en la base, se respeta eso tal cual quedó registrado —no se
// recalcula nada retroactivamente.
export function calcularEstadoYRecargo(
  cuota: Pick<Cuota, "estado" | "fecha_vencimiento" | "monto_base" | "recargo_aplicado">,
  configuracion: Pick<ConfiguracionPagos, "dias_gracia" | "tipo_recargo" | "valor_recargo">,
  fechaReferenciaISO: string
): ResultadoEstadoCuota {
  if (cuota.estado === "pagada") {
    return { estado: "pagada", recargo: cuota.recargo_aplicado };
  }

  const finDeGracia = sumarDias(cuota.fecha_vencimiento, configuracion.dias_gracia);
  const estaVencida = fechaReferenciaISO > finDeGracia;

  if (!estaVencida) {
    return { estado: "adeudada", recargo: 0 };
  }

  const recargo =
    configuracion.tipo_recargo === "porcentaje"
      ? Math.round(cuota.monto_base * (configuracion.valor_recargo / 100) * 100) / 100
      : configuracion.valor_recargo;

  return { estado: "vencida", recargo };
}
