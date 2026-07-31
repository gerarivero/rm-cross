import { createServerClient } from "@/lib/supabase/server";
import type { EstadoPersona } from "@/lib/supabase/types";
import { getCuotas, getCuotasVencidasGlobal } from "../cuotas/data";

type AlumnoResumenRow = {
  id: string;
  nombre: string | null;
  apellido: string | null;
  dni: string;
  fecha_alta: string;
  estado: EstadoPersona;
};

async function getAlumnosResumen(): Promise<AlumnoResumenRow[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("alumno").select("id, nombre, apellido, dni, fecha_alta, estado");
  if (error) throw new Error(`No se pudieron cargar los alumnos: ${error.message}`);
  return data ?? [];
}

function nombreAlumno(a: { nombre: string | null; apellido: string | null; dni: string }) {
  return a.nombre || a.apellido ? `${a.nombre ?? ""} ${a.apellido ?? ""}`.trim() : `DNI ${a.dni}`;
}

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export type ResumenAlumnos = { total: number; altasEsteMes: number; altasMesPasado: number; diferencial: number };

// Total de alumnos activos + comparación de altas de este mes contra el mes pasado
// (por fecha_alta) — mismo criterio "sin cron" del resto del sistema: se calcula al
// vuelo a partir del listado completo, no hay un contador persistido.
export async function getResumenAlumnos(): Promise<ResumenAlumnos> {
  const alumnos = await getAlumnosResumen();
  const hoy = new Date();
  const esteMes = hoy.toISOString().slice(0, 7);
  const mesPasadoDate = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - 1, 1));
  const mesPasado = mesPasadoDate.toISOString().slice(0, 7);

  const total = alumnos.filter((a) => a.estado === "activo").length;
  const altasEsteMes = alumnos.filter((a) => a.fecha_alta.slice(0, 7) === esteMes).length;
  const altasMesPasado = alumnos.filter((a) => a.fecha_alta.slice(0, 7) === mesPasado).length;

  return { total, altasEsteMes, altasMesPasado, diferencial: altasEsteMes - altasMesPasado };
}

export type ResumenCuotasMes = { saldoDeuda: number; cobradoEsteMes: number };

// Saldo de deuda del mes (cuotas adeudadas + vencidas con vencimiento este mes) y lo
// efectivamente cobrado — reutiliza getCuotas(), ya acotada al mes calendario actual.
export async function getResumenCuotasMes(): Promise<ResumenCuotasMes> {
  const cuotas = await getCuotas();
  let saldoDeuda = 0;
  let cobradoEsteMes = 0;
  for (const c of cuotas) {
    if (c.estado_efectivo === "adeudada" || c.estado_efectivo === "vencida") saldoDeuda += c.total_adeudado;
    if (c.estado_efectivo === "pagada") cobradoEsteMes += c.total_pagado;
  }
  return { saldoDeuda, cobradoEsteMes };
}

export type TipoEvento = "cuota_vencida" | "cuota_adeudada" | "revision_rutina" | "aniversario";

export type EventoDashboard = {
  tipo: TipoEvento;
  fecha: string;
  alumno: { id: string; nombre: string; dni: string };
  descripcion: string;
  href: string;
};

// Asignaciones de rutina activas cuya fecha_fin ya pasó — necesitan revisión del
// profesor. Calculado al vuelo (sin cron), mismo criterio que src/app/alumnos/data.ts.
async function getEventosRevisionRutina(): Promise<EventoDashboard[]> {
  const supabase = createServerClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("rutina_asignacion")
    .select("fecha_fin, alumno:alumno_id(id, nombre, apellido, dni), rutina:rutina_id(nombre)")
    .eq("estado", "activa")
    .not("fecha_fin", "is", null)
    .lte("fecha_fin", hoy);

  if (error) throw new Error(`No se pudieron cargar las rutinas por revisar: ${error.message}`);

  return ((data ?? []) as any[]).map((row) => ({
    tipo: "revision_rutina" as const,
    fecha: row.fecha_fin as string,
    alumno: { id: row.alumno.id, nombre: nombreAlumno(row.alumno), dni: row.alumno.dni },
    descripcion: `La rutina "${row.rutina.nombre}" venció y necesita revisión`,
    href: `/alumnos/${row.alumno.id}`,
  }));
}

// Alumnos cuyo aniversario de alta (fecha_alta) cae este mes, con al menos 1 año
// cumplido — no cuenta el mes/año del alta misma.
function calcularAniversarios(alumnos: AlumnoResumenRow[]): EventoDashboard[] {
  const hoy = new Date();
  const eventos: EventoDashboard[] = [];

  for (const a of alumnos) {
    if (a.estado !== "activo") continue;
    const [y, m, d] = a.fecha_alta.split("-").map(Number);
    if (m - 1 !== hoy.getMonth()) continue;
    const anios = hoy.getFullYear() - y;
    if (anios < 1) continue;

    eventos.push({
      tipo: "aniversario",
      fecha: `${hoy.getFullYear()}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      alumno: { id: a.id, nombre: nombreAlumno(a), dni: a.dni },
      descripcion: `Cumple ${anios} ${anios === 1 ? "año" : "años"} en el gimnasio`,
      href: `/alumnos/${a.id}`,
    });
  }
  return eventos;
}

const PRIORIDAD_TIPO: Record<TipoEvento, number> = {
  cuota_vencida: 0,
  revision_rutina: 1,
  cuota_adeudada: 2,
  aniversario: 3,
};

// Tabla de eventos del Dashboard: cuotas vencidas (cualquier mes), cuotas adeudadas
// del mes, rutinas por revisar y aniversarios de alumnos — ordenados por urgencia y,
// dentro de cada tipo, por fecha.
export async function getEventosDashboard(): Promise<EventoDashboard[]> {
  const [vencidas, cuotasMes, revisiones, alumnos] = await Promise.all([
    getCuotasVencidasGlobal(),
    getCuotas(),
    getEventosRevisionRutina(),
    getAlumnosResumen(),
  ]);

  const eventosVencidas: EventoDashboard[] = vencidas.map((c) => ({
    tipo: "cuota_vencida",
    fecha: c.fecha_vencimiento,
    alumno: { id: c.alumno.id, nombre: nombreAlumno(c.alumno), dni: c.alumno.dni },
    descripcion: `Cuota vencida — ${c.plan.nombre} (${formatoMoneda(c.total_adeudado)})`,
    href: "/cuotas",
  }));

  const eventosAdeudadas: EventoDashboard[] = cuotasMes
    .filter((c) => c.estado_efectivo === "adeudada")
    .map((c) => ({
      tipo: "cuota_adeudada",
      fecha: c.fecha_vencimiento,
      alumno: { id: c.alumno.id, nombre: nombreAlumno(c.alumno), dni: c.alumno.dni },
      descripcion: `Cuota a cobrar — ${c.plan.nombre} (${formatoMoneda(c.total_adeudado)})`,
      href: "/cuotas",
    }));

  const eventosAniversario = calcularAniversarios(alumnos);

  return [...eventosVencidas, ...revisiones, ...eventosAdeudadas, ...eventosAniversario].sort((a, b) => {
    if (PRIORIDAD_TIPO[a.tipo] !== PRIORIDAD_TIPO[b.tipo]) return PRIORIDAD_TIPO[a.tipo] - PRIORIDAD_TIPO[b.tipo];
    return a.fecha.localeCompare(b.fecha);
  });
}
