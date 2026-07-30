"use client";

import { useMemo, useState, useTransition } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { EjercicioConMusculo, Musculo } from "@/lib/supabase/types";
import { EjercicioFormModal } from "./EjercicioFormModal";
import { MusculoFormModal } from "./MusculoFormModal";
import { alternarActivoEjercicio, alternarActivoMusculo, eliminarEjercicio } from "./actions";

export function CatalogoView({ musculos, ejercicios }: { musculos: Musculo[]; ejercicios: EjercicioConMusculo[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [filtroMusculoId, setFiltroMusculoId] = useState("");

  const [modalMusculoOpen, setModalMusculoOpen] = useState(false);
  const [musculoEditando, setMusculoEditando] = useState<Musculo | null>(null);

  const [modalEjercicioOpen, setModalEjercicioOpen] = useState(false);
  const [ejercicioEditando, setEjercicioEditando] = useState<EjercicioConMusculo | null>(null);
  const [ejercicioEliminando, setEjercicioEliminando] = useState<EjercicioConMusculo | null>(null);

  const ejerciciosFiltrados = useMemo(() => {
    if (!filtroMusculoId) return ejercicios;
    return ejercicios.filter((e) => e.musculo_id === filtroMusculoId);
  }, [ejercicios, filtroMusculoId]);

  function handleToggleMusculo(musculo: Musculo) {
    setError(null);
    startTransition(async () => {
      const result = await alternarActivoMusculo(musculo.id, !musculo.activo);
      if (!result.ok) setError(result.error);
    });
  }

  function handleToggleEjercicio(ejercicio: EjercicioConMusculo) {
    setError(null);
    startTransition(async () => {
      const result = await alternarActivoEjercicio(ejercicio.id, !ejercicio.activo);
      if (!result.ok) setError(result.error);
    });
  }

  function handleConfirmarEliminarEjercicio() {
    if (!ejercicioEliminando) return;
    setError(null);
    startTransition(async () => {
      const result = await eliminarEjercicio(ejercicioEliminando.id);
      if (!result.ok) setError(result.error);
      setEjercicioEliminando(null);
    });
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-white border-b border-border shadow-sm flex items-center gap-md px-lg py-md w-full">
        <a href="/rutinas" className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors" title="Volver a Rutinas">
          <span className="material-symbols-outlined">arrow_back</span>
        </a>
        <h2 className="font-headline-md text-headline-md text-primary">Músculos y Ejercicios</h2>
      </header>

      <div className="p-lg space-y-gutter flex-1">
        {error && <div className="bg-error/10 border border-error/30 text-error rounded-xl p-md text-body-sm">{error}</div>}

        {/* Músculos */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-lg py-md border-b border-border flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-background">Músculos</h3>
            <button
              onClick={() => setModalMusculoOpen(true)}
              className="flex items-center gap-xs px-lg py-2 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity font-label-bold text-label-bold"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nuevo Músculo
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary text-on-secondary">
                  <th className="px-lg py-4 font-label-bold text-label-bold">Nombre</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Descripción</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Estado</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {musculos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-lg py-lg text-center text-body-sm text-text-muted">
                      Todavía no hay músculos cargados.
                    </td>
                  </tr>
                )}
                {musculos.map((m, i) => (
                  <tr key={m.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                    <td className="px-lg py-4 font-label-bold text-on-surface">{m.nombre}</td>
                    <td className="px-lg py-4 text-body-sm text-on-surface-variant">{m.descripcion ?? "—"}</td>
                    <td className="px-lg py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-caption font-label-bold ${
                          m.activo ? "bg-success/10 text-success" : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {m.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-lg py-4 text-right">
                      <div className="flex items-center justify-end gap-sm">
                        <button
                          disabled={isPending}
                          onClick={() => setMusculoEditando(m)}
                          className="p-2 text-info hover:bg-info/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => handleToggleMusculo(m)}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            m.activo ? "text-success hover:bg-success/10" : "text-on-surface-variant hover:bg-surface-container"
                          }`}
                          title={m.activo ? "Desactivar" : "Reactivar"}
                        >
                          <span className="material-symbols-outlined text-[20px]">{m.activo ? "toggle_on" : "toggle_off"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ejercicios */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-lg py-md border-b border-border flex items-center justify-between gap-md flex-wrap">
            <h3 className="font-headline-md text-headline-md text-on-background">Ejercicios</h3>
            <div className="flex items-center gap-sm">
              <select
                value={filtroMusculoId}
                onChange={(e) => setFiltroMusculoId(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-body-sm outline-none focus:border-primary-container"
              >
                <option value="">Todos los músculos</option>
                {musculos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setModalEjercicioOpen(true)}
                className="flex items-center gap-xs px-lg py-2 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity font-label-bold text-label-bold"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Nuevo Ejercicio
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary text-on-secondary">
                  <th className="px-lg py-4 font-label-bold text-label-bold">Nombre</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Músculo</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Descripción</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Estado</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ejerciciosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-lg py-lg text-center text-body-sm text-text-muted">
                      {ejercicios.length === 0 ? "Todavía no hay ejercicios cargados." : "Ningún ejercicio coincide con el filtro."}
                    </td>
                  </tr>
                )}
                {ejerciciosFiltrados.map((e, i) => (
                  <tr key={e.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                    <td className="px-lg py-4 font-label-bold text-on-surface">{e.nombre}</td>
                    <td className="px-lg py-4">
                      <span className="bg-info/10 text-info px-2 py-1 rounded-full text-caption font-label-bold">{e.musculo.nombre}</span>
                    </td>
                    <td className="px-lg py-4 text-body-sm text-on-surface-variant">{e.descripcion ?? "—"}</td>
                    <td className="px-lg py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-caption font-label-bold ${
                          e.activo ? "bg-success/10 text-success" : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {e.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-lg py-4 text-right">
                      <div className="flex items-center justify-end gap-sm">
                        <button
                          disabled={isPending}
                          onClick={() => setEjercicioEditando(e)}
                          className="p-2 text-info hover:bg-info/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => handleToggleEjercicio(e)}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            e.activo ? "text-success hover:bg-success/10" : "text-on-surface-variant hover:bg-surface-container"
                          }`}
                          title={e.activo ? "Desactivar" : "Reactivar"}
                        >
                          <span className="material-symbols-outlined text-[20px]">{e.activo ? "toggle_on" : "toggle_off"}</span>
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => setEjercicioEliminando(e)}
                          className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalMusculoOpen && <MusculoFormModal mode="create" onClose={() => setModalMusculoOpen(false)} />}
      {musculoEditando && <MusculoFormModal mode="edit" musculo={musculoEditando} onClose={() => setMusculoEditando(null)} />}
      {modalEjercicioOpen && (
        <EjercicioFormModal
          mode="create"
          musculos={musculos}
          musculoIdInicial={filtroMusculoId || undefined}
          onClose={() => setModalEjercicioOpen(false)}
        />
      )}
      {ejercicioEditando && (
        <EjercicioFormModal mode="edit" musculos={musculos} ejercicio={ejercicioEditando} onClose={() => setEjercicioEditando(null)} />
      )}
      {ejercicioEliminando && (
        <ConfirmModal
          title="Eliminar ejercicio"
          message={`¿Eliminar el ejercicio "${ejercicioEliminando.nombre}"? Si está usado en alguna rutina, el sistema va a impedirlo y sugerir desactivarlo en su lugar.`}
          confirmLabel="Eliminar"
          danger
          pending={isPending}
          onConfirm={handleConfirmarEliminarEjercicio}
          onCancel={() => setEjercicioEliminando(null)}
        />
      )}
    </>
  );
}
