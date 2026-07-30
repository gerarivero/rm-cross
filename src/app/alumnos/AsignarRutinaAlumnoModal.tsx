"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { asignarRutina } from "../rutinas/[id]/actions";

export function AsignarRutinaAlumnoModal({
  alumnoId,
  rutinas,
  onClose,
}: {
  alumnoId: string;
  rutinas: { id: string; nombre: string }[];
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hoy = new Date().toISOString().slice(0, 10);

  function handleSubmit(formData: FormData) {
    setError(null);
    const rutinaId = String(formData.get("rutina_id") ?? "");
    if (!rutinaId) {
      setError("Elegí una rutina.");
      return;
    }
    formData.set("alumno_id", alumnoId);
    startTransition(async () => {
      const result = await asignarRutina(rutinaId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title="Asignar Rutina" onClose={onClose} maxWidth="max-w-md">
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}
      <form action={handleSubmit} className="space-y-md">
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Rutina</label>
          <select
            name="rutina_id"
            required
            defaultValue=""
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
          >
            <option value="" disabled>
              {rutinas.length === 0 ? "No hay rutinas activas" : "Elegí una rutina"}
            </option>
            {rutinas.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Fecha de inicio</label>
          <input
            name="fecha_inicio"
            type="date"
            required
            defaultValue={hoy}
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
          />
        </div>
        <p className="text-caption font-caption text-text-muted">
          Si el alumno ya tiene otra rutina activa, se cierra automáticamente al asignar esta.
        </p>
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
            {isPending ? "Guardando..." : "Asignar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
