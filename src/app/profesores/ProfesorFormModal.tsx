"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import type { Disciplina, ProfesorConDisciplinas } from "@/lib/supabase/types";
import { actualizarProfesor, crearProfesor } from "./actions";

const inputClass = "mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container";
const labelClass = "font-label-bold text-label-bold text-on-surface-variant";

export function ProfesorFormModal({
  mode,
  profesor,
  disciplinas,
  onClose,
}: {
  mode: "create" | "edit";
  profesor?: ProfesorConDisciplinas;
  disciplinas: Disciplina[];
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const disciplinasSeleccionadasIniciales = new Set((profesor?.disciplinas ?? []).map((d) => d.id));

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "edit" && profesor ? await actualizarProfesor(profesor.id, formData) : await crearProfesor(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title={mode === "edit" ? "Editar Profesor" : "Nuevo Profesor"} onClose={onClose} maxWidth="max-w-2xl">
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}
      <form action={handleSubmit} className="space-y-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div>
            <label className={labelClass}>DNI *</label>
            <input name="dni" required defaultValue={profesor?.dni} placeholder="30123456" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nombre *</label>
            <input name="nombre" required defaultValue={profesor?.nombre} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Apellido *</label>
            <input name="apellido" required defaultValue={profesor?.apellido} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Fecha de nacimiento</label>
            <input
              name="fecha_nacimiento"
              type="date"
              defaultValue={profesor?.fecha_nacimiento ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input name="email" type="email" defaultValue={profesor?.email ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Celular</label>
            <input name="celular" defaultValue={profesor?.celular ?? undefined} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Disciplinas que dicta</label>
          <div className="mt-1 border border-border rounded-lg p-md space-y-2 max-h-48 overflow-y-auto">
            {disciplinas.length === 0 && <p className="text-body-sm text-text-muted">No hay disciplinas cargadas todavía.</p>}
            {disciplinas.map((disciplina) => (
              <label key={disciplina.id} className="flex items-center gap-2 text-body-sm text-on-surface">
                <input
                  type="checkbox"
                  name="disciplina_ids"
                  value={disciplina.id}
                  defaultChecked={disciplinasSeleccionadasIniciales.has(disciplina.id)}
                />
                {disciplina.nombre}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-sm">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="px-lg py-2 rounded-lg border border-border text-on-surface-variant font-label-bold text-label-bold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            disabled={isPending}
            type="submit"
            className="bg-primary-container text-on-primary-container px-lg py-2 rounded-lg font-label-bold text-label-bold disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Guardar Profesor"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
