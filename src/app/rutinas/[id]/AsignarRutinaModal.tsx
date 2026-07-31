"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { sumarMeses } from "../../cuotas/estado";
import { asignarRutina } from "./actions";

export function AsignarRutinaModal({
  rutinaId,
  alumnos,
  onClose,
}: {
  rutinaId: string;
  alumnos: { id: string; dni: string; nombre: string | null; apellido: string | null }[];
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hoy = new Date().toISOString().slice(0, 10);
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(sumarMeses(hoy, 1));

  function handleFechaInicioChange(value: string) {
    setFechaInicio(value);
    setFechaFin(sumarMeses(value, 1));
  }

  function handleSubmit(formData: FormData) {
    setError(null);
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
          <label className="font-label-bold text-label-bold text-on-surface-variant">Alumno</label>
          <select
            name="alumno_id"
            required
            defaultValue=""
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
          >
            <option value="" disabled>
              {alumnos.length === 0 ? "No hay alumnos activos" : "Elegí un alumno"}
            </option>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre || a.apellido ? `${a.nombre ?? ""} ${a.apellido ?? ""}`.trim() : `DNI ${a.dni}`} — DNI {a.dni}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className="font-label-bold text-label-bold text-on-surface-variant">Fecha de inicio</label>
            <input
              name="fecha_inicio"
              type="date"
              required
              value={fechaInicio}
              onChange={(e) => handleFechaInicioChange(e.target.value)}
              className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
            />
          </div>
          <div>
            <label className="font-label-bold text-label-bold text-on-surface-variant">Fecha de fin</label>
            <input
              name="fecha_fin"
              type="date"
              required
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
            />
          </div>
        </div>
        <p className="text-caption font-caption text-text-muted">
          Si el alumno ya tiene otra rutina activa (incluida esta misma), se cierra automáticamente al asignar esta.
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
