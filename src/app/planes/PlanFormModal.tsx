"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import type { Disciplina, PlanConPrecio } from "@/lib/supabase/types";
import { actualizarPlan, crearPlan } from "./actions";

export function PlanFormModal({
  mode,
  disciplinas,
  plan,
  onClose,
}: {
  mode: "create" | "edit";
  disciplinas: Disciplina[];
  plan?: PlanConPrecio;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [accesoLibre, setAccesoLibre] = useState(plan?.acceso_libre ?? false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = mode === "edit" && plan ? await actualizarPlan(plan.id, formData) : await crearPlan(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title={mode === "edit" ? "Editar Plan" : "Nuevo Plan"} onClose={onClose}>
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}
      <form action={handleSubmit} className="space-y-md">
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Disciplina</label>
          <select
            name="disciplina_id"
            required
            defaultValue={plan?.disciplina_id}
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
          >
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Nombre del plan</label>
          <input
            name="nombre"
            required
            defaultValue={plan?.nombre}
            placeholder="Ej: Musculación 4x semana"
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
          />
        </div>
        <div className="grid grid-cols-2 gap-md items-start">
          <div>
            <label className="font-label-bold text-label-bold text-on-surface-variant">Frecuencia semanal</label>
            <input
              name="dias_por_semana"
              type="number"
              required={!accesoLibre}
              min={1}
              max={7}
              disabled={accesoLibre}
              defaultValue={plan?.dias_por_semana ?? undefined}
              placeholder="3"
              className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container disabled:bg-surface-container-low"
            />
            <label className="mt-2 flex items-center gap-2 text-caption font-caption text-on-surface-variant">
              <input type="checkbox" name="acceso_libre" checked={accesoLibre} onChange={(e) => setAccesoLibre(e.target.checked)} />
              Acceso libre (todos los días)
            </label>
          </div>
          <div>
            <label className="font-label-bold text-label-bold text-on-surface-variant">Precio</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-sm pointer-events-none">$</span>
              <input
                name="precio"
                type="number"
                min={1}
                step="0.01"
                required
                defaultValue={plan?.precio_vigente ?? undefined}
                placeholder="15000"
                className="w-full border border-border rounded-lg pl-7 pr-3 py-2 outline-none focus:border-primary-container"
              />
            </div>
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
            {isPending ? "Guardando..." : "Guardar Plan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
