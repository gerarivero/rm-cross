"use client";

import { useState } from "react";
import { useMobileNav } from "@/components/MobileNavProvider";
import type { AlumnoDetalle, CuotaDeAlumno, InscripcionHistorial, PlanConPrecio, RutinaAsignadaDeAlumno, Turno } from "@/lib/supabase/types";
import { AlumnoFormModal } from "../AlumnoFormModal";
import { AsignarRutinaAlumnoModal } from "../AsignarRutinaAlumnoModal";
import { EditarPrecioModal } from "../EditarPrecioModal";
import { ReinscribirModal } from "../ReinscribirModal";

const ESTADO_ESTILO: Record<string, string> = {
  activo: "bg-success/10 text-success",
  inactivo: "bg-surface-container-high text-on-surface-variant",
  suspendido: "bg-warning/10 text-warning",
  de_baja: "bg-error/10 text-error",
};

const ESTADO_LABEL: Record<string, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  suspendido: "Suspendido",
  de_baja: "De baja",
};

const ESTADO_CUOTA_ESTILO: Record<string, string> = {
  pagada: "bg-success/10 text-success",
  adeudada: "bg-warning/10 text-warning",
  vencida: "bg-error/10 text-error",
};

const ESTADO_CUOTA_LABEL: Record<string, string> = {
  pagada: "Pagada",
  adeudada: "Adeudada",
  vencida: "Vencida",
};

function formatoMoneda(valor: number | null) {
  if (valor === null) return "—";
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function formatoFecha(valor: string | null) {
  if (!valor) return "—";
  return new Date(`${valor}T00:00:00`).toLocaleDateString("es-AR");
}

export function AlumnoDetalleView({
  alumno,
  planes,
  turnos,
  promociones,
  cuotas,
  historialInscripciones,
  rutinaAsignada,
  rutinasDisponibles,
}: {
  alumno: AlumnoDetalle;
  planes: PlanConPrecio[];
  turnos: Turno[];
  promociones: { id: string; nombre: string; plan_ids: string[] }[];
  cuotas: CuotaDeAlumno[];
  historialInscripciones: InscripcionHistorial[];
  rutinaAsignada: RutinaAsignadaDeAlumno | null;
  rutinasDisponibles: { id: string; nombre: string }[];
}) {
  const { toggleMobileNav } = useMobileNav();
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalReinscribirOpen, setModalReinscribirOpen] = useState(false);
  const [modalAsignarRutinaOpen, setModalAsignarRutinaOpen] = useState(false);
  const [modalEditarPrecioOpen, setModalEditarPrecioOpen] = useState(false);
  const nombreCompleto = alumno.nombre || alumno.apellido ? `${alumno.nombre ?? ""} ${alumno.apellido ?? ""}`.trim() : `DNI ${alumno.dni}`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-white border-b border-border shadow-sm flex items-center justify-between gap-md px-lg py-md w-full">
        <div className="flex items-center gap-md">
          <a href="/alumnos" className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors" title="Volver a Alumnos">
            <span className="material-symbols-outlined">arrow_back</span>
          </a>
          <h2 className="font-headline-md text-headline-md text-primary">{nombreCompleto}</h2>
        </div>
        <button
          onClick={toggleMobileNav}
          className="md:hidden p-2 text-on-surface-variant hover:text-primary-container transition-all duration-200"
          title="Abrir menú"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </header>

      <div className="p-lg space-y-gutter flex-1">
        {/* Card: Información general */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm p-lg">
          <div className="flex items-center justify-between mb-md">
            <h3 className="font-headline-md text-headline-md text-on-background">Información general</h3>
            <button
              onClick={() => setModalEditarOpen(true)}
              className="flex items-center gap-xs px-lg py-2 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity font-label-bold text-label-bold"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Editar
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">DNI</p>
              <p className="font-data-mono text-data-mono text-on-surface mt-1">{alumno.dni}</p>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Estado</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-caption font-label-bold ${ESTADO_ESTILO[alumno.estado]}`}>
                {ESTADO_LABEL[alumno.estado]}
              </span>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Fecha de nacimiento</p>
              <p className="font-label-bold text-label-bold text-on-surface mt-1">{formatoFecha(alumno.fecha_nacimiento)}</p>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Turno</p>
              <p className="font-label-bold text-label-bold text-on-surface mt-1">{alumno.turno?.nombre ?? "—"}</p>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Email</p>
              <p className="text-body-sm text-on-surface mt-1">{alumno.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Celular</p>
              <p className="text-body-sm text-on-surface mt-1">{alumno.celular ?? "—"}</p>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Altura</p>
              <p className="font-data-mono text-data-mono text-on-surface mt-1">{alumno.altura != null ? `${alumno.altura} cm` : "—"}</p>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Peso</p>
              <p className="font-data-mono text-data-mono text-on-surface mt-1">{alumno.peso != null ? `${alumno.peso} kg` : "—"}</p>
            </div>
          </div>
        </div>

        {/* Card: Plan asignado */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm p-lg">
          <div className="flex items-center justify-between mb-md">
            <h3 className="font-headline-md text-headline-md text-on-background">Plan asignado</h3>
            {alumno.plan && (
              <button
                onClick={() => setModalEditarPrecioOpen(true)}
                className="flex items-center gap-xs px-lg py-2 border border-border text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors font-label-bold text-label-bold"
              >
                <span className="material-symbols-outlined text-[18px]">sell</span>
                Editar Precio
              </button>
            )}
          </div>
          {alumno.plan ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
              <div>
                <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Plan</p>
                <p className="font-label-bold text-label-bold text-on-surface mt-1">{alumno.plan.nombre}</p>
              </div>
              <div>
                <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Precio</p>
                <p className="font-data-mono text-data-mono text-on-surface mt-1">{formatoMoneda(alumno.precio)}</p>
              </div>
              {alumno.promocion_nombre && (
                <div>
                  <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Promoción aplicada</p>
                  <span className="inline-flex items-center gap-1 mt-1 bg-warning/10 text-warning px-3 py-1 rounded-full text-caption font-label-bold">
                    <span className="material-symbols-outlined text-[14px]">sell</span>
                    {alumno.promocion_nombre}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-body-sm text-text-muted">Este alumno no tiene un plan activo.</p>
              <button
                onClick={() => setModalReinscribirOpen(true)}
                className="flex items-center gap-xs px-lg py-2 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity font-label-bold text-label-bold"
              >
                <span className="material-symbols-outlined text-[18px]">redo</span>
                Reinscribir
              </button>
            </div>
          )}
        </div>

        {/* Card: Historial de Inscripciones */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-lg py-md border-b border-border">
            <h3 className="font-headline-md text-headline-md text-on-background">Historial de Inscripciones</h3>
          </div>
          {historialInscripciones.length === 0 ? (
            <p className="px-lg py-lg text-center text-body-sm text-text-muted">Este alumno todavía no tiene inscripciones registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary text-on-secondary">
                    <th className="px-lg py-4 font-label-bold text-label-bold">Plan</th>
                    <th className="px-lg py-4 font-label-bold text-label-bold">Desde</th>
                    <th className="px-lg py-4 font-label-bold text-label-bold">Hasta</th>
                    <th className="px-lg py-4 font-label-bold text-label-bold">Duración</th>
                    <th className="px-lg py-4 font-label-bold text-label-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {historialInscripciones.map((insc, i) => (
                    <tr key={insc.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                      <td className="px-lg py-4 text-body-sm text-on-surface">{insc.plan.nombre}</td>
                      <td className="px-lg py-4 text-body-sm text-on-surface-variant">{formatoFecha(insc.fecha_inicio)}</td>
                      <td className="px-lg py-4 text-body-sm text-on-surface-variant">{insc.fecha_fin ? formatoFecha(insc.fecha_fin) : "—"}</td>
                      <td className="px-lg py-4 text-body-sm text-on-surface">
                        {insc.duracion}
                        {!insc.fecha_fin && <span className="text-text-muted"> (en curso)</span>}
                      </td>
                      <td className="px-lg py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-caption font-label-bold ${
                            insc.estado === "activa" ? "bg-success/10 text-success" : "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {insc.estado === "activa" ? "Activa" : insc.estado === "pausada" ? "Pausada" : "Finalizada"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Card: Rutina asignada */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm p-lg">
          <h3 className="font-headline-md text-headline-md text-on-background mb-md">Rutina asignada</h3>
          {rutinaAsignada?.requiere_revision && (
            <div className="flex items-center gap-2 bg-warning/10 text-warning rounded-lg px-md py-2 mb-md text-body-sm font-label-bold">
              <span className="material-symbols-outlined text-[20px]">warning</span>
              Esta rutina venció el {formatoFecha(rutinaAsignada.fecha_fin)} — revisala y asignale una nueva o extendé la fecha.
            </div>
          )}
          {rutinaAsignada ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label-bold text-label-bold text-on-surface">{rutinaAsignada.rutina.nombre}</p>
                <p className="text-caption font-caption text-text-muted">
                  Desde {formatoFecha(rutinaAsignada.fecha_inicio)}
                  {rutinaAsignada.fecha_fin && ` — Hasta ${formatoFecha(rutinaAsignada.fecha_fin)}`}
                </p>
              </div>
              <div className="flex items-center gap-sm">
                <a
                  href={`/rutinas/${rutinaAsignada.rutina.id}`}
                  className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
                  title="Ver rutina"
                >
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                </a>
                <a
                  href={`/rutinas/${rutinaAsignada.rutina.id}/exportar?alumno=${alumno.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-xs px-lg py-2 border border-border text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors font-label-bold text-label-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                  Exportar PDF
                </a>
                <button
                  onClick={() => setModalAsignarRutinaOpen(true)}
                  className="flex items-center gap-xs px-lg py-2 border border-border text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors font-label-bold text-label-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                  Cambiar Rutina
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-body-sm text-text-muted">Este alumno no tiene una rutina asignada.</p>
              <button
                onClick={() => setModalAsignarRutinaOpen(true)}
                className="flex items-center gap-xs px-lg py-2 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity font-label-bold text-label-bold"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Asignar Rutina
              </button>
            </div>
          )}
        </div>

        {/* Card: Registro de Cuotas */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-lg py-md border-b border-border flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-background">Registro de Cuotas</h3>
            <a href="/cuotas" className="text-caption font-caption text-primary hover:underline">
              Ver todas las cuotas
            </a>
          </div>
          {cuotas.length === 0 ? (
            <p className="px-lg py-lg text-center text-body-sm text-text-muted">Este alumno todavía no tiene cuotas generadas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary text-on-secondary">
                    <th className="px-lg py-4 font-label-bold text-label-bold">Plan</th>
                    <th className="px-lg py-4 font-label-bold text-label-bold">Período</th>
                    <th className="px-lg py-4 font-label-bold text-label-bold">Vencimiento</th>
                    <th className="px-lg py-4 font-label-bold text-label-bold">Monto</th>
                    <th className="px-lg py-4 font-label-bold text-label-bold">Recargo</th>
                    <th className="px-lg py-4 font-label-bold text-label-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cuotas.map((cuota, i) => (
                    <tr key={cuota.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                      <td className="px-lg py-4 text-body-sm text-on-surface">{cuota.plan.nombre}</td>
                      <td className="px-lg py-4 text-body-sm text-on-surface-variant">
                        {formatoFecha(cuota.periodo_desde)} — {formatoFecha(cuota.periodo_hasta)}
                      </td>
                      <td className="px-lg py-4 text-body-sm font-label-bold text-on-surface">{formatoFecha(cuota.fecha_vencimiento)}</td>
                      <td className="px-lg py-4 font-data-mono text-data-mono">{formatoMoneda(cuota.monto_base)}</td>
                      <td className="px-lg py-4 font-data-mono text-data-mono text-error">
                        {cuota.recargo_efectivo > 0 ? `+${formatoMoneda(cuota.recargo_efectivo)}` : "—"}
                      </td>
                      <td className="px-lg py-4">
                        <span className={`px-3 py-1 rounded-full text-caption font-label-bold ${ESTADO_CUOTA_ESTILO[cuota.estado_efectivo]}`}>
                          {ESTADO_CUOTA_LABEL[cuota.estado_efectivo]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Card: Fotos de progreso */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm p-lg">
          <h3 className="font-headline-md text-headline-md text-on-background mb-md">Fotos de progreso</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider mb-2">Inicial</p>
              {alumno.foto_inicial_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={alumno.foto_inicial_url} alt="Foto inicial" className="w-full max-w-xs rounded-xl border border-border object-cover aspect-square" />
              ) : (
                <div className="w-full max-w-xs aspect-square rounded-xl border border-dashed border-border flex items-center justify-center text-text-muted text-body-sm">
                  Sin foto
                </div>
              )}
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider mb-2">Actual</p>
              {alumno.foto_actual_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={alumno.foto_actual_url} alt="Foto actual" className="w-full max-w-xs rounded-xl border border-border object-cover aspect-square" />
              ) : (
                <div className="w-full max-w-xs aspect-square rounded-xl border border-dashed border-border flex items-center justify-center text-text-muted text-body-sm">
                  Sin foto
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalEditarOpen && (
        <AlumnoFormModal
          mode="edit"
          alumno={alumno}
          planes={planes}
          turnos={turnos}
          promociones={promociones}
          onClose={() => setModalEditarOpen(false)}
        />
      )}
      {modalReinscribirOpen && (
        <ReinscribirModal alumno={alumno} planes={planes} promociones={promociones} onClose={() => setModalReinscribirOpen(false)} />
      )}
      {modalAsignarRutinaOpen && (
        <AsignarRutinaAlumnoModal alumnoId={alumno.id} rutinas={rutinasDisponibles} onClose={() => setModalAsignarRutinaOpen(false)} />
      )}
      {modalEditarPrecioOpen && (
        <EditarPrecioModal alumno={alumno} promociones={promociones} onClose={() => setModalEditarPrecioOpen(false)} />
      )}
    </>
  );
}
