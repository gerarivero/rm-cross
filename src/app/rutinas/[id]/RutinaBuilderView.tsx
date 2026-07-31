"use client";

import { useMemo, useState, useTransition } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useMobileNav } from "@/components/MobileNavProvider";
import type {
  EjercicioConMusculo,
  RutinaActividadConEjercicios,
  RutinaAsignacionConAlumno,
  RutinaDetalle,
  RutinaEjercicioConDetalle,
  TipoActividad,
} from "@/lib/supabase/types";
import { RutinaFormModal } from "../RutinaFormModal";
import { AsignarRutinaModal } from "./AsignarRutinaModal";
import { EjercicioRutinaFormModal } from "./EjercicioRutinaFormModal";
import { agregarActividad, agregarDia, eliminarActividad, eliminarDia, eliminarEjercicioDeRutina } from "./actions";

const TIPO_ACTIVIDAD_LABEL: Record<TipoActividad, string> = {
  calentamiento: "Calentamiento",
  musculacion: "Musculación",
  recuperacion: "Recuperación",
};

const TIPO_ACTIVIDAD_ICON: Record<TipoActividad, string> = {
  calentamiento: "local_fire_department",
  musculacion: "fitness_center",
  recuperacion: "self_improvement",
};

const INTENSIDAD_LABEL: Record<string, string> = { baja: "Baja", media: "Media", alta: "Alta" };
const INTENSIDAD_ESTILO: Record<string, string> = {
  baja: "bg-success/10 text-success",
  media: "bg-warning/10 text-warning",
  alta: "bg-error/10 text-error",
};

const ESTADO_ASIGNACION_ESTILO: Record<string, string> = {
  activa: "bg-success/10 text-success",
  finalizada: "bg-surface-container-high text-on-surface-variant",
};

type ItemAEliminar =
  | { tipo: "dia"; id: string; label: string }
  | { tipo: "actividad"; id: string; label: string }
  | { tipo: "ejercicio"; id: string; label: string };

function formatoFecha(valor: string) {
  return new Date(`${valor}T00:00:00`).toLocaleDateString("es-AR");
}

function nombreAlumno(a: { dni: string; nombre: string | null; apellido: string | null }) {
  return a.nombre || a.apellido ? `${a.nombre ?? ""} ${a.apellido ?? ""}`.trim() : `DNI ${a.dni}`;
}

export function RutinaBuilderView({
  rutina,
  asignaciones,
  alumnosParaAsignar,
  ejercicios,
}: {
  rutina: RutinaDetalle;
  asignaciones: RutinaAsignacionConAlumno[];
  alumnosParaAsignar: { id: string; dni: string; nombre: string | null; apellido: string | null }[];
  ejercicios: EjercicioConMusculo[];
}) {
  const { toggleMobileNav } = useMobileNav();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [semanaIdx, setSemanaIdx] = useState(0);

  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [agregandoEnActividad, setAgregandoEnActividad] = useState<string | null>(null);
  const [editandoEjercicio, setEditandoEjercicio] = useState<RutinaEjercicioConDetalle | null>(null);
  const [itemAEliminar, setItemAEliminar] = useState<ItemAEliminar | null>(null);

  const ejerciciosActivos = useMemo(() => ejercicios.filter((e) => e.activo), [ejercicios]);
  const semana = rutina.semanas[semanaIdx];
  const maxNumeroDia = semana ? Math.max(0, ...semana.dias.map((d) => d.numero_dia)) : 0;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok && result.error) setError(result.error);
    });
  }

  function handleConfirmarEliminar() {
    if (!itemAEliminar) return;
    const item = itemAEliminar;
    run(async () => {
      if (item.tipo === "dia") return eliminarDia(rutina.id, item.id);
      if (item.tipo === "actividad") return eliminarActividad(rutina.id, item.id);
      return eliminarEjercicioDeRutina(rutina.id, item.id);
    });
    setItemAEliminar(null);
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-white border-b border-border shadow-sm flex items-center gap-md px-lg py-md w-full">
        <a href="/rutinas" className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors" title="Volver a Rutinas">
          <span className="material-symbols-outlined">arrow_back</span>
        </a>
        <h2 className="font-headline-md text-headline-md text-primary flex-1">{rutina.nombre}</h2>
        <a
          href={`/rutinas/${rutina.id}/exportar`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-xs px-lg py-2 border border-border text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors font-label-bold text-label-bold"
        >
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          Exportar PDF
        </a>
        <button
          onClick={() => setModalAsignarOpen(true)}
          className="flex items-center gap-xs px-lg py-2 border border-border text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors font-label-bold text-label-bold"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Asignar Rutina
        </button>
        <button
          onClick={() => setModalEditarOpen(true)}
          className="flex items-center gap-xs px-lg py-2 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity font-label-bold text-label-bold"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
          Editar
        </button>
        <button
          onClick={toggleMobileNav}
          className="md:hidden p-2 text-on-surface-variant hover:text-primary-container transition-all duration-200"
          title="Abrir menú"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </header>

      <div className="p-lg space-y-gutter flex-1">
        {error && <div className="bg-error/10 border border-error/30 text-error rounded-xl p-md text-body-sm">{error}</div>}

        {rutina.descripcion && (
          <div className="bg-surface-white border border-border rounded-xl shadow-sm p-lg">
            <p className="text-body-sm text-on-surface-variant">{rutina.descripcion}</p>
          </div>
        )}

        {/* Alumnos asignados */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-lg py-md border-b border-border">
            <h3 className="font-headline-md text-headline-md text-on-background">Alumnos asignados</h3>
          </div>
          {asignaciones.length === 0 ? (
            <p className="px-lg py-lg text-center text-body-sm text-text-muted">Esta rutina todavía no fue asignada a ningún alumno.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary text-on-secondary">
                    <th className="px-lg py-3 font-label-bold text-label-bold">Alumno</th>
                    <th className="px-lg py-3 font-label-bold text-label-bold">Desde</th>
                    <th className="px-lg py-3 font-label-bold text-label-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {asignaciones.map((a, i) => (
                    <tr key={a.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                      <td className="px-lg py-3 text-body-sm text-on-surface">{nombreAlumno(a.alumno)}</td>
                      <td className="px-lg py-3 text-body-sm text-on-surface-variant">{formatoFecha(a.fecha_inicio)}</td>
                      <td className="px-lg py-3">
                        <span className={`px-3 py-1 rounded-full text-caption font-label-bold ${ESTADO_ASIGNACION_ESTILO[a.estado]}`}>
                          {a.estado === "activa" ? "Activa" : "Finalizada"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Semanas */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-lg py-md border-b border-border flex items-center gap-2">
            {rutina.semanas.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setSemanaIdx(idx)}
                className={`px-lg py-2 rounded-lg font-label-bold text-label-bold transition-colors ${
                  idx === semanaIdx ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                Semana {s.numero_semana}
              </button>
            ))}
          </div>

          <div className="p-lg space-y-md">
            {semana?.dias.length === 0 && (
              <p className="text-center text-body-sm text-text-muted py-lg">Esta semana todavía no tiene días cargados.</p>
            )}

            {semana?.dias.map((dia) => (
              <div key={dia.id} className="border border-border rounded-xl overflow-hidden">
                <div className="bg-surface-container-low px-md py-2 flex items-center justify-between">
                  <p className="font-label-bold text-label-bold text-on-surface">Día {dia.numero_dia}</p>
                  {dia.numero_dia === maxNumeroDia && (
                    <button
                      disabled={isPending}
                      onClick={() => setItemAEliminar({ tipo: "dia", id: dia.id, label: `Día ${dia.numero_dia}` })}
                      className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar día"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>

                <div className="p-md space-y-md">
                  {dia.actividades.map((actividad) => (
                    <BloqueActividad
                      key={actividad.id}
                      actividad={actividad}
                      isPending={isPending}
                      onEliminarActividad={() =>
                        setItemAEliminar({ tipo: "actividad", id: actividad.id, label: TIPO_ACTIVIDAD_LABEL[actividad.tipo] })
                      }
                      onAgregarEjercicio={() => setAgregandoEnActividad(actividad.id)}
                      onEditarEjercicio={(ej) => setEditandoEjercicio(ej)}
                      onEliminarEjercicio={(ej) => setItemAEliminar({ tipo: "ejercicio", id: ej.id, label: ej.ejercicio.nombre })}
                    />
                  ))}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {(Object.keys(TIPO_ACTIVIDAD_LABEL) as TipoActividad[]).map((tipo) => (
                      <button
                        key={tipo}
                        disabled={isPending}
                        onClick={() => run(() => agregarActividad(rutina.id, dia.id, tipo))}
                        className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-border rounded-lg text-caption font-label-bold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        {TIPO_ACTIVIDAD_LABEL[tipo]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {semana && semana.dias.length < 7 && (
              <button
                disabled={isPending}
                onClick={() => run(() => agregarDia(rutina.id, semana.id))}
                className="w-full flex items-center justify-center gap-1 px-lg py-3 border border-dashed border-border rounded-xl text-body-sm font-label-bold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Agregar Día
              </button>
            )}
          </div>
        </div>
      </div>

      {modalEditarOpen && <RutinaFormModal mode="edit" rutina={rutina} onClose={() => setModalEditarOpen(false)} />}
      {modalAsignarOpen && (
        <AsignarRutinaModal rutinaId={rutina.id} alumnos={alumnosParaAsignar} onClose={() => setModalAsignarOpen(false)} />
      )}
      {agregandoEnActividad && (
        <EjercicioRutinaFormModal
          mode="create"
          rutinaId={rutina.id}
          actividadId={agregandoEnActividad}
          ejercicios={ejerciciosActivos}
          onClose={() => setAgregandoEnActividad(null)}
        />
      )}
      {editandoEjercicio && (
        <EjercicioRutinaFormModal
          mode="edit"
          rutinaId={rutina.id}
          ejercicios={ejerciciosActivos}
          rutinaEjercicio={editandoEjercicio}
          onClose={() => setEditandoEjercicio(null)}
        />
      )}
      {itemAEliminar && (
        <ConfirmModal
          title="Eliminar"
          message={`¿Eliminar "${itemAEliminar.label}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          pending={isPending}
          onConfirm={handleConfirmarEliminar}
          onCancel={() => setItemAEliminar(null)}
        />
      )}
    </>
  );
}

function BloqueActividad({
  actividad,
  isPending,
  onEliminarActividad,
  onAgregarEjercicio,
  onEditarEjercicio,
  onEliminarEjercicio,
}: {
  actividad: RutinaActividadConEjercicios;
  isPending: boolean;
  onEliminarActividad: () => void;
  onAgregarEjercicio: () => void;
  onEditarEjercicio: (ej: RutinaEjercicioConDetalle) => void;
  onEliminarEjercicio: (ej: RutinaEjercicioConDetalle) => void;
}) {
  return (
    <div className="bg-surface-container-lowest border border-border rounded-lg p-md">
      <div className="flex items-center justify-between mb-2">
        <p className="flex items-center gap-1 font-label-bold text-label-bold text-on-surface">
          <span className="material-symbols-outlined text-[18px] text-primary">{TIPO_ACTIVIDAD_ICON[actividad.tipo]}</span>
          {TIPO_ACTIVIDAD_LABEL[actividad.tipo]}
        </p>
        <button
          disabled={isPending}
          onClick={onEliminarActividad}
          className="p-1 text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
          title="Eliminar actividad"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>

      {actividad.ejercicios.length === 0 ? (
        <p className="text-caption font-caption text-text-muted mb-2">Sin ejercicios todavía.</p>
      ) : (
        <div className="space-y-1 mb-2">
          {actividad.ejercicios.map((ej) => (
            <div key={ej.id} className="flex items-center justify-between bg-surface-white border border-border rounded-lg px-3 py-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-label-bold text-body-sm text-on-surface">{ej.ejercicio.nombre}</span>
                  <span className="bg-info/10 text-info px-2 py-0.5 rounded-full text-caption font-label-bold">{ej.ejercicio.musculo.nombre}</span>
                  {ej.intensidad && (
                    <span className={`px-2 py-0.5 rounded-full text-caption font-label-bold ${INTENSIDAD_ESTILO[ej.intensidad]}`}>
                      {INTENSIDAD_LABEL[ej.intensidad]}
                    </span>
                  )}
                </div>
                <p className="text-caption font-caption text-text-muted mt-1">
                  {[
                    ej.series != null ? `${ej.series} series` : null,
                    ej.repeticiones != null ? `${ej.repeticiones} reps` : null,
                    ej.duracion_minutos != null ? `${ej.duracion_minutos} min` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Sin detalle"}
                  {ej.notas ? ` · ${ej.notas}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={isPending}
                  onClick={() => onEditarEjercicio(ej)}
                  className="p-1.5 text-info hover:bg-info/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Editar"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button
                  disabled={isPending}
                  onClick={() => onEliminarEjercicio(ej)}
                  className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        disabled={isPending}
        onClick={onAgregarEjercicio}
        className="flex items-center gap-1 text-caption font-label-bold text-primary hover:underline disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
        Agregar Ejercicio
      </button>
    </div>
  );
}
