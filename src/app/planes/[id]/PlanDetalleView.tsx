"use client";

import { useState } from "react";
import type { Disciplina, PlanDetalle } from "@/lib/supabase/types";
import { PlanFormModal } from "../PlanFormModal";

function formatoMoneda(valor: number | null) {
  if (valor === null) return "—";
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function formatoFecha(valor: string | null) {
  if (!valor) return "—";
  return new Date(`${valor}T00:00:00`).toLocaleDateString("es-AR");
}

const ESTADO_INSCRIPCION_ESTILO: Record<string, string> = {
  activa: "bg-success/10 text-success",
  pausada: "bg-warning/10 text-warning",
  finalizada: "bg-surface-container-high text-on-surface-variant",
};

export function PlanDetalleView({ plan, disciplinas }: { plan: PlanDetalle; disciplinas: Disciplina[] }) {
  const [modalEditarOpen, setModalEditarOpen] = useState(false);

  return (
    <>
      {/* Top navbar */}
      <header className="sticky top-0 z-40 bg-surface-white border-b border-border shadow-sm flex items-center gap-md px-lg py-md w-full">
        <a
          href="/planes"
          className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
          title="Volver a Planes"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </a>
        <h2 className="font-headline-md text-headline-md text-primary">{plan.nombre}</h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-lg">
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Disciplina</p>
              <p className="font-label-bold text-label-bold text-on-surface mt-1">{plan.disciplina?.nombre ?? "—"}</p>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Frecuencia</p>
              <p className="font-label-bold text-label-bold text-on-surface mt-1">
                {plan.acceso_libre ? "Todos los días" : `${plan.dias_por_semana}x/semana`}
              </p>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Precio vigente</p>
              <p className="font-data-mono text-data-mono text-on-surface mt-1">{formatoMoneda(plan.precio_vigente)}</p>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Estado</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-caption font-label-bold ${
                  plan.activo ? "bg-success/10 text-success" : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {plan.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Alumnos activos</p>
              <p className="font-label-bold text-label-bold text-on-surface mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-primary">group</span>
                {plan.alumnos_count}
              </p>
            </div>
          </div>
        </div>

        {/* Card: Historial de precios */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-lg py-md border-b border-border">
            <h3 className="font-headline-md text-headline-md text-on-background">Historial de precios</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary text-on-secondary">
                  <th className="px-lg py-4 font-label-bold text-label-bold">Precio</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Vigente desde</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Vigente hasta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {plan.historial_precios.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                    <td className="px-lg py-4 font-data-mono text-data-mono">{formatoMoneda(p.precio)}</td>
                    <td className="px-lg py-4 text-body-sm text-on-surface-variant">{formatoFecha(p.vigente_desde)}</td>
                    <td className="px-lg py-4">
                      {p.vigente_hasta === null ? (
                        <span className="bg-success/10 text-success px-3 py-1 rounded-full text-caption font-label-bold">
                          Vigente
                        </span>
                      ) : (
                        <span className="text-body-sm text-on-surface-variant">{formatoFecha(p.vigente_hasta)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card: Últimos alumnos inscriptos */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-lg py-md border-b border-border">
            <h3 className="font-headline-md text-headline-md text-on-background">Últimos alumnos inscriptos</h3>
          </div>
          {plan.ultimas_inscripciones.length === 0 ? (
            <p className="px-lg py-lg text-center text-body-sm text-text-muted">
              Todavía no hay alumnos inscriptos en este plan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary text-on-secondary">
                    <th className="px-lg py-4 font-label-bold text-label-bold">Alumno</th>
                    <th className="px-lg py-4 font-label-bold text-label-bold">Fecha de inicio</th>
                    <th className="px-lg py-4 font-label-bold text-label-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {plan.ultimas_inscripciones.map((insc, i) => (
                    <tr key={insc.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                      <td className="px-lg py-4">
                        <p className="font-label-bold text-on-surface">
                          {insc.alumno.nombre} {insc.alumno.apellido}
                        </p>
                        {insc.alumno.email && <p className="text-caption font-caption text-text-muted">{insc.alumno.email}</p>}
                      </td>
                      <td className="px-lg py-4 text-body-sm text-on-surface-variant">{formatoFecha(insc.fecha_inicio)}</td>
                      <td className="px-lg py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-caption font-label-bold ${
                            ESTADO_INSCRIPCION_ESTILO[insc.estado] ?? "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {insc.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalEditarOpen && (
        <PlanFormModal mode="edit" disciplinas={disciplinas} plan={plan} onClose={() => setModalEditarOpen(false)} />
      )}
    </>
  );
}
