"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import type { Rutina } from "@/lib/supabase/types";
import { actualizarRutina, crearRutina } from "./actions";

export function RutinaFormModal({ mode, rutina, onClose }: { mode: "create" | "edit"; rutina?: Rutina; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = mode === "edit" && rutina ? await actualizarRutina(rutina.id, formData) : await crearRutina(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title={mode === "edit" ? "Editar Rutina" : "Nueva Rutina"} onClose={onClose} maxWidth="max-w-md">
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}
      <form action={handleSubmit} className="space-y-md">
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Nombre</label>
          <input
            name="nombre"
            required
            defaultValue={rutina?.nombre}
            placeholder="Ej: Hipertrofia Nivel 1"
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
          />
        </div>
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Descripción</label>
          <textarea
            name="descripcion"
            defaultValue={rutina?.descripcion ?? undefined}
            placeholder="Opcional"
            rows={3}
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container resize-none"
          />
        </div>
        {mode === "create" && (
          <p className="text-caption font-caption text-text-muted">
            Se crea con sus 4 semanas vacías — el detalle de la rutina te deja armar los días, actividades y ejercicios de cada una.
          </p>
        )}
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
            {isPending ? "Guardando..." : "Guardar Rutina"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
