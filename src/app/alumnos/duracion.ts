// Duración humana entre dos fechas ISO ("YYYY-MM-DD"). Si `fechaFinISO` es null,
// calcula contra hoy (período todavía en curso).
export function calcularDuracion(fechaInicioISO: string, fechaFinISO: string | null): string {
  const fin = fechaFinISO ?? new Date().toISOString().slice(0, 10);
  const [y1, m1, d1] = fechaInicioISO.split("-").map(Number);
  const [y2, m2, d2] = fin.split("-").map(Number);

  let meses = (y2 - y1) * 12 + (m2 - m1);
  let dias = d2 - d1;

  if (dias < 0) {
    meses -= 1;
    const diasMesAnterior = new Date(Date.UTC(y2, m2 - 1, 0)).getUTCDate();
    dias += diasMesAnterior;
  }

  if (meses <= 0 && dias <= 0) return "Menos de 1 día";

  const partes: string[] = [];
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? "mes" : "meses"}`);
  if (dias > 0) partes.push(`${dias} ${dias === 1 ? "día" : "días"}`);
  return partes.join(" y ");
}
