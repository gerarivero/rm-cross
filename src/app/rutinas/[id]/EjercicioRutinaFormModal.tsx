"use client";

import { useMemo, useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import type { EjercicioConMusculo, RutinaEjercicioConDetalle } from "@/lib/supabase/types";
import { actualizarEjercicioDeRutina, agregarEjercicio } from "./actions";

const inputClass = "mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container";
const labelClass = "font-label-bold text-label-bold text-on-surface-variant";

export function EjercicioRutinaFormModal({
  mode,
  rutinaId,
  actividadId,
  ejercicios,
  rutinaEjercicio,
  onClose,
}: {
  mode: "create" | "edit";
  rutinaId: string;
  actividadId?: string;
  ejercicios: EjercicioConMusculo[];
  rutinaEjercicio?: RutinaEjercicioConDetalle;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [musculoId, setMusculoId] = useState(rutinaEjercicio?.ejercicio.musculo.id ?? "");

  const musculos = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const e of ejercicios) mapa.set(e.musculo.id, e.musculo.nombre);
    return Array.from(mapa, ([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [ejercicios]);

  const ejerciciosDelMusculo = useMemo(() => ejercicios.filter((e) => e.musculo_id === musculoId), [ejercicios, musculoId]);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "edit" && rutinaEjercicio
          ? await actualizarEjercicioDeRutina(rutinaId, rutinaEjercicio.id, formData)
          : await agregarEjercicio(rutinaId, actividadId!, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title={mode === "edit" ? "Editar Ejercicio" : "Agregar Ejercicio"} onClose={onClose} maxWidth="max-w-lg">
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}
      <form action={handleSubmit} className="space-y-md">
        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className={labelClass}>Músculo</label>
            <select value={musculoId} onChange={(e) => setMusculoId(e.target.value)} className={inputClass}>
              <option value="" disabled>
                Elegí un músculo
              </option>
              {musculos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Ejercicio</label>
            <select name="ejercicio_id" required defaultValue={rutinaEjercicio?.ejercicio_id ?? ""} className={inputClass}>
              <option value="" disabled>
                {musculoId ? "Elegí un ejercicio" : "Elegí un músculo primero"}
              </option>
              {ejerciciosDelMusculo.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-md">
          <div>
            <label className={labelClass}>Intensidad</label>
            <select name="intensidad" defaultValue={rutinaEjercicio?.intensidad ?? ""} className={inputClass}>
              <option value="">Sin definir</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Series</label>
            <input name="series" type="number" min={0} defaultValue={rutinaEjercicio?.series ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Repeticiones</label>
            <input
              name="repeticiones"
              type="number"
              min={0}
              defaultValue={rutinaEjercicio?.repeticiones ?? undefined}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Duración (minutos)</label>
          <input
            name="duracion_minutos"
            type="number"
            min={0}
            defaultValue={rutinaEjercicio?.duracion_minutos ?? undefined}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Notas</label>
          <textarea
            name="notas"
            defaultValue={rutinaEjercicio?.notas ?? undefined}
            placeholder="Opcional"
            rows={2}
            className={`${inputClass} resize-none`}
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
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
