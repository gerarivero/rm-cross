"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import type { Turno } from "@/lib/supabase/types";
import { actualizarTurno, crearTurno } from "./actions";

export function TurnoFormModal({ mode, turno, onClose }: { mode: "create" | "edit"; turno?: Turno; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = mode === "edit" && turno ? await actualizarTurno(turno.id, formData) : await crearTurno(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title={mode === "edit" ? "Editar Turno" : "Nuevo Turno"} onClose={onClose} maxWidth="max-w-md">
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}
      <form action={handleSubmit} className="space-y-md">
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Nombre</label>
          <input
            name="nombre"
            required
            defaultValue={turno?.nombre}
            placeholder="Ej: Mañana"
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
          />
        </div>
        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className="font-label-bold text-label-bold text-on-surface-variant">Hora de inicio</label>
            <input
              name="hora_inicio"
              type="time"
              required
              defaultValue={turno?.hora_inicio}
              className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
            />
          </div>
          <div>
            <label className="font-label-bold text-label-bold text-on-surface-variant">Hora de fin</label>
            <input
              name="hora_fin"
              type="time"
              required
              defaultValue={turno?.hora_fin}
              className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
            />
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
            {isPending ? "Guardando..." : "Guardar Turno"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
