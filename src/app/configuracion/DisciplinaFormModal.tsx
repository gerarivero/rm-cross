"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import type { Disciplina } from "@/lib/supabase/types";
import { actualizarDisciplina, crearDisciplina } from "./actions";

export function DisciplinaFormModal({
  mode,
  disciplina,
  onClose,
}: {
  mode: "create" | "edit";
  disciplina?: Disciplina;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "edit" && disciplina ? await actualizarDisciplina(disciplina.id, formData) : await crearDisciplina(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title={mode === "edit" ? "Editar Disciplina" : "Nueva Disciplina"} onClose={onClose} maxWidth="max-w-md">
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}
      <form action={handleSubmit} className="space-y-md">
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Nombre</label>
          <input
            name="nombre"
            required
            defaultValue={disciplina?.nombre}
            placeholder="Ej: Pilates"
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
          />
        </div>
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Descripción</label>
          <textarea
            name="descripcion"
            defaultValue={disciplina?.descripcion ?? undefined}
            placeholder="Opcional"
            rows={2}
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container resize-none"
          />
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
            {isPending ? "Guardando..." : "Guardar Disciplina"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
